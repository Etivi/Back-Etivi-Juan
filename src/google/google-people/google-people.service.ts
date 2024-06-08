import { Injectable, UnauthorizedException } from "@nestjs/common"
import { GoogleService } from "../google.service"
import { google, people_v1 } from "googleapis"
import { CreateContactDto } from "../google-people/dto/contact-create.dto"
import { MembershipsService } from "src/memberships/memberships.service"
import { UsersService } from "src/users/users.service"
import { PrismaService } from "nestjs-prisma"
import { FormatContactData } from "../types/google-contact.type"
import { GoogleGroupsService } from "../google-groups/google-groups.service"
import VariablesService from "src/users/variables/variables.service"
import { Prisma } from "@prisma/client"
@Injectable()
export class GooglePeopleService {
  constructor(
    private readonly usersService: UsersService,
    private readonly prismaService: PrismaService,
    private readonly variablesService: VariablesService,
    private readonly googleGroupService: GoogleGroupsService,
    private readonly membershipsService: MembershipsService,
  ) {}
  public static async getPeopleClient(token: string) {
    const authClient = await GoogleService.getGoogleAuth(token)
    return google.people({
      version: "v1",
      auth: authClient,
    })
  }
  async getContacts(token: string) {
    const people = await GooglePeopleService.getPeopleClient(token)
    try {
      const dataa = await this.fetchContacts([], token)
      const contacts = dataa?.map((person) => formatPersonData({ person }))

      const allGroups = await people.contactGroups.list()
      const userGroups = allGroups.data.contactGroups?.filter(
        (group) => group.groupType === "USER_CONTACT_GROUP",
      )
      const contactsWithGroups = contacts?.map((contact) => ({
        ...contact,
        groups: contact?.groups?.map((group) => ({
          ...group,
          contactGroupMembership: {
            ...group.contactGroupMembership,
            contactGroupResourceName: userGroups?.find(
              (userGroup) =>
                userGroup.resourceName ===
                group.contactGroupMembership?.contactGroupResourceName,
            )?.formattedName,
          },
        })),
      }))
      return contactsWithGroups
    } catch (e) {
      throw new UnauthorizedException({
        statusCode: 401,
        message: "Unauthorized",
        errors: e.errors,
      })
    }
  }
  async fetchContacts(
    list: people_v1.Schema$Person[],
    token: string,
    _nextPage?: string,
  ) {
    const people = await GooglePeopleService.getPeopleClient(token)

    try {
      const res = await people.people.connections.list({
        resourceName: "people/me",
        pageSize: 1000,
        pageToken: _nextPage,
        personFields:
          "phoneNumbers,names,emailAddresses,organizations,urls,locations,birthdays,addresses,photos,memberships",
      })
      const contacts = res.data.connections || []
      if (contacts.length >= 1000) {
        const nextPage = res.data.nextPageToken
        if (nextPage)
          return this.fetchContacts([...list, ...contacts], token, nextPage)
      }
      return [...list, ...contacts]
    } catch (e) {
      console.log("pagination contact search", e)
      return []
    }
  }

  async getContact(
    token: string,
    contactNumber: string,
    shouldFormat: boolean | undefined = true,
    userId?: string,
  ) {
    const people = await GooglePeopleService.getPeopleClient(token)
    try {
      const res = await people.people.searchContacts({
        readMask:
          "phoneNumbers,names,emailAddresses,organizations,urls,locations,birthdays,addresses,photos,memberships",
        query: contactNumber.replace(/[+\s-]/g, ""),
      })
      console.log({ res })
      if (!res.data.results) return { success: false, contact: {} }
      const results = res.data.results[0]
      if (!results.person) return { success: false, contact: {} }
      let contactVariables: Prisma.JsonObject | Prisma.JsonValue = {}
      if (userId) {
        const formattedCellphoneNumber = contactNumber.replace(/[+\s-]/g, "")
        const user = await this.prismaService.user.findUnique({
          where: { id: userId },
          select: { contactVariables: true },
        })
        if (!user) return
        contactVariables = (user.contactVariables as any)[
          formattedCellphoneNumber
        ]
        if (!contactVariables) {
          const formattedData = formatPersonData(results)
          console.log(formattedData)
          if (!formattedData) return
          const { photo, ...formattedWithoutPhoto } = formattedData
          const newContactVariables =
            await this.variablesService.createMultipleContactVariable(
              { ...formattedWithoutPhoto } as any,
              formattedCellphoneNumber,
              userId,
            )
          console.log(newContactVariables)
          if (newContactVariables) {
            contactVariables = newContactVariables.variables
          }
        }
      }
      const userGroups = await this.googleGroupService.getAllGroups(token)

      const contactData = shouldFormat
        ? formatPersonData(results)
        : results.person
      const variables = shouldFormat
        ? formatDataForVariables(contactData)
        : undefined

      return {
        contact: { ...contactData },
        allGroups: userGroups || [],
        success: true,
        variables: { ...variables },
      }
    } catch (e) {
      console.log(e)
      throw new UnauthorizedException({
        statusCode: 401,
        message: "Unauthorized",
        errors: e.errors,
      })
    }
  }
  async deleteContact(token: string, contactNumber: string, userId?: string) {
    const people = await GooglePeopleService.getPeopleClient(token)
    try {
      const res = await people.people.searchContacts({
        readMask:
          "phoneNumbers,names,emailAddresses,organizations,urls,locations,birthdays,addresses,photos",
        query: contactNumber.replace(/[+,\s]/g, ""),
      })
      console.log({ res: res.data.results })
      if (!res.data.results) throw new Error("Contacto no encontrado")
      const results = res.data.results[0]
      if (!res.data.results) throw new Error("Contacto no encontrado")
      const resourceNames = res.data.results
        .map((result) => result.person?.resourceName)
        .filter((resourceName) => resourceName) as string[]
      await people.people.batchDeleteContacts({
        requestBody: {
          resourceNames,
        },
      })
      return results
    } catch (e) {
      console.log(e)
      throw new UnauthorizedException({
        statusCode: 401,
        message: "Contacto no encontrado",
        errors: e.errors,
      })
    }
  }

  async updateContact(token: string, data: CreateContactDto, userId: string) {
    const people = await GooglePeopleService.getPeopleClient(token)
    try {
      const oldContact: any = await this.getContact(
        token,
        data.phone,
        false,
        undefined,
      )
      if (!oldContact) throw new Error("El Contacto no existe")
      console.log(oldContact)
      const newContact = formatFields(data)
      const updatedKeys = Object.keys(newContact)
      console.log(oldContact.contact.resourceName)
      const contactCreation = await people.people.updateContact({
        resourceName: oldContact?.contact?.resourceName,
        updatePersonFields: updatedKeys.join(","),
        requestBody: {
          ...newContact,
          etag: oldContact.contact.etag,
        },
      })
      if (data.photo) {
        if (!data.photo.includes("http")) {
          await people.people.updateContactPhoto({
            resourceName: oldContact?.contact?.resourceName,
            requestBody: {
              photoBytes: data.photo.split("base64,")[1],
            },
          })
        }
      }
      const { photo, groups, ...rest } = data
      await this.variablesService.createMultipleContactVariable(
        rest,
        rest.phone,
        userId,
      )
      this.googleGroupService.setContactGroups(
        people,
        data,
        oldContact?.contact?.resourceName!,
      )
      return contactCreation
    } catch (e) {
      console.log({ e })
      throw new UnauthorizedException({
        statusCode: 403,
        message: "Error al Actualizar el Contacto",
        errors: e.errors,
      })
    }
  }
  async setContactGroups(
    people: people_v1.People,
    data: CreateContactDto,
    contactResourceId: string,
  ) {
    try {
      const response = await people.people.get({
        resourceName: contactResourceId,
        personFields: "memberships",
      })
      const existingMemberships = (response.data.memberships || []).filter(
        (membership) =>
          membership.contactGroupMembership?.contactGroupId !== "myContacts",
      )
      // Remove contact from existing groups
      for (const membership of existingMemberships) {
        if (
          data.groups?.find(
            (group) =>
              group.value === membership.contactGroupMembership?.contactGroupId,
          )
        )
          continue
        const contactResourceName =
          membership.contactGroupMembership?.contactGroupResourceName
        if (!contactResourceName) continue
        await people.contactGroups.members.modify({
          resourceName: contactResourceName,
          requestBody: {
            resourceNamesToRemove: [contactResourceId],
          },
        })
      }

      // Add contact to new groups
      for (const newGroupId of data?.groups?.filter(
        (group) => !group.__isNew__,
      ) || []) {
        await people.contactGroups.members.modify({
          resourceName: newGroupId.value,
          requestBody: {
            resourceNamesToAdd: [contactResourceId],
          },
        })
      }
      const newGroups = data?.groups?.filter((group) => group.__isNew__)
      if (newGroups?.length) {
        const newGroupIds = await Promise.all(
          newGroups.map(async (group) => {
            const res = await people.contactGroups.create({
              requestBody: {
                contactGroup: {
                  name: group.value,
                },
              },
            })
            if (!res.data.resourceName)
              throw new Error("Error al Crear el Grupo")
            setTimeout(() => {
              console.log({ res: res.data })
              if (!res.data.resourceName) return
              people.contactGroups.members.modify({
                resourceName: res.data.resourceName,
                requestBody: {
                  resourceNamesToAdd: [contactResourceId],
                },
              })
            }, 5000)

            return res.data.resourceName
          }),
        )
        console.log({ newGroupIds })
      }
    } catch (e) {
      console.log({ e: JSON.stringify(e.response.data, null, 2) })
    }
  }
  async createContact(token: string, data: CreateContactDto, userId: string) {
    const people = await GooglePeopleService.getPeopleClient(token)
    /* if (data.tag) {
      const group = await this.findOrCreateTagByName(people, data.tag)
      if (group.resourceName) data.tag = group.resourceName
    } */
    let photo
    if (!data.photo) {
      photo = null
    } else {
      photo = data.photo
    }
    const newContact = formatFields(data)
    try {
      const contactCreation = await people.people.createContact({
        requestBody: newContact,
      })
      if (data.photo) {
        if (!data.photo.includes("http")) {
          await people.people.updateContactPhoto({
            resourceName: contactCreation.data.resourceName as any,
            requestBody: {
              photoBytes: photo.split("base64,")[1],
            },
          })
        }
      }
      const { photo: photoExtracted, groups: groupExtracted, ...rest } = data
      console.log(rest)
      await this.variablesService.createMultipleContactVariable(
        rest,
        data.phone,
        userId,
      )
      await this.googleGroupService.setContactGroups(
        people,
        data,
        contactCreation.data.resourceName!,
      )
      return contactCreation
    } catch (e) {
      console.log(e)
      throw new UnauthorizedException({
        statusCode: 401,
        message: "Unauthorized",
        errors: e.errors,
      })
    }
  }
  async handleContactCreation(
    token: string,
    data: CreateContactDto,
    userID: string,
  ) {
    try {
      // check user's membership restrictions
      const { features, memberships } =
        await this.membershipsService.getFeatures(userID)
      if (!features?.guardar_contactos)
        throw new Error("Tu membresía no te permite guardar contactos")
      const user = await this.usersService.getUserByID(userID)
      if (!user) throw new Error("Tu membresía no te permite guardar contactos")

      if (features.guardar_contactos === true || user.savedContacts < features.guardar_contactos) {
        const res = await this.createContact(token, data, userID)
        await this.usersService.updateUser(userID, {
          savedContacts: user.savedContacts + 1,
        })
        return res
      }

      if (memberships && memberships[0]) {
        if (features.guardar_contactos > 5) {
          const last_payment_date = new Date(memberships[0]?.date_created)
          // check if last payment date is more than 30 days ago
          if (
            new Date().getTime() - last_payment_date.getTime() >
            340 * 24 * 3600 * 1000
          ) {
            const res = await this.createContact(token, data, userID)
            await this.usersService.updateUser(userID, { savedContacts: 1 })
            return res
          } else {
            throw new Error("Has alcanzado el límite de contactos guardados")
          }
        } else {
          throw new Error("Has alcanzado el límite de contactos guardados")
        }
      }
    } catch (e) {
      throw new UnauthorizedException({
        statusCode: 401,
        message: e.message || "Alcanzaste el límite de contactos guardados",
        errors: e.errors,
      })
    }
  }
}

function formatFields(data: CreateContactDto) {
  const newContact: people_v1.Schema$Person = {
    names: [
      {
        givenName: data.name,
        familyName: data.lastName,
      },
    ],
    phoneNumbers: [
      {
        value: data.phone,
        type: "mobile",
      },
    ],
  }
  const optionalFields = formatOptionalFields(data)
  return { ...newContact, ...optionalFields }
}

function formatOptionalFields(data: CreateContactDto) {
  const birthday = data.birthday ? new Date(data.birthday) : null
  console.log({ data })
  const optionalFields: people_v1.Schema$Person = {
    emailAddresses: data.email
      ? [
          {
            value: data.email,
          },
        ]
      : undefined,
    organizations: data.organization
      ? [
          {
            name: data.organization,
          },
        ]
      : undefined,
    addresses:
      data.city || data.country || data.address
        ? [
            {
              city: data.city,
              country: data.country,
              streetAddress: data.address,
            },
          ]
        : undefined,
    urls: data.web
      ? [
          {
            value: data.web,
          },
        ]
      : undefined,
    birthdays: birthday
      ? [
          {
            date: {
              day: birthday.getDate(),
              month: birthday.getMonth() + 1,
              year: birthday.getFullYear(),
            },
          },
        ]
      : undefined,
  }
  return optionalFields
}
export const formatPersonData = ({
  person,
}: people_v1.Schema$SearchResult): FormatContactData | undefined => {
  const contactData: FormatContactData = {}
  if (!person) return
  if (person.names?.length) {
    const { givenName, familyName } = person.names[0]
    contactData.name = givenName
    contactData.lastName = familyName
  }

  if (person.phoneNumbers?.length) {
    contactData.phone = person.phoneNumbers[0].value
  }

  if (person.emailAddresses?.length) {
    contactData.email = person.emailAddresses[0].value
  }

  if (person.organizations?.length) {
    contactData.organization = person.organizations[0].name
  }

  if (person.urls?.length) {
    contactData.web = person.urls[0].value
  }
  if (person.birthdays?.length) {
    const birthday = person.birthdays[0].date
    if (birthday) {
      contactData.birthday = `${birthday.month}/${birthday.day}/${birthday.year}`
    }
  }
  if (person.addresses?.length) {
    contactData.city = person.addresses[0].city
    contactData.address = person.addresses[0].streetAddress
    contactData.country = person.addresses[0].country
  }
  if (person.photos?.length) {
    contactData.photo = person.photos[0].url
  }
  if (person.memberships?.length) {
    contactData.groups = person.memberships.filter(
      (res) =>
        res.contactGroupMembership?.contactGroupResourceName !==
        "contactGroups/myContacts",
    )
  }
  return contactData
}

const formatDataForVariables = (data: any) => {
  const newObj = {}
  for (const key in data) {
    newObj[`$contact_${key}$`] = data[key]
  }
  return newObj
}
