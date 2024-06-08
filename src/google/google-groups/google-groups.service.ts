import { Injectable } from "@nestjs/common"
import { people_v1 } from "googleapis"
import { CreateContactDto } from "../google-people/dto"
import { GooglePeopleService } from "../google-people/google-people.service"

@Injectable()
export class GoogleGroupsService {

  async getAllGroups (token: string) {
        try {
          const people = await GooglePeopleService.getPeopleClient(token)
            const allGroups = await people.contactGroups.list()
            const userGroups = allGroups.data.contactGroups?.filter((group) => group.groupType === "USER_CONTACT_GROUP")
            return userGroups || []
        } catch (e) {
            return []
        }
  }
  async getGroupsByContact (
    people: people_v1.People,
    contactResourceId: string,
  ) {
    try {
      const response = await people.people.get({
        resourceName: contactResourceId,
        personFields: "memberships",
      })
      return (
        response.data.memberships?.filter(
          membership =>
            membership.contactGroupMembership?.contactGroupId !== "myContacts",
        ) || []
      )
    } catch (e) {
      console.log(e)
      return []
    }
  }

  async getGroupByTag (people: people_v1.People, tag: string) {
    const res = await people.contactGroups.list()
    const group = res?.data?.contactGroups?.find(group => group.name === tag)
    return group
  }

  async addContactToGroup (
    people: people_v1.People,
    contactResourceId: string,
    groupResourceId: string,
  ) {
    return await people.contactGroups.members.modify({
      resourceName: groupResourceId,
      requestBody: {
        resourceNamesToAdd: [contactResourceId],
      },
    })
  }

  async removeContactFromGroup (
    people: people_v1.People,
    contactResourceId: string,
    groupResourceId: string,
  ) {
    return await people.contactGroups.members.modify({
      resourceName: groupResourceId,
      requestBody: {
        resourceNamesToRemove: [contactResourceId],
      },
    })
  }

  async createGroup (people: people_v1.People, name: string) {
    return await people.contactGroups.create({
      requestBody: {
        contactGroup: {
          name,
        },
      },
    })
  }

  async setContactGroups (
    people: people_v1.People,
    data: CreateContactDto,
    contactResourceId: string,
  ) {
    try {
      const memberships = await this.getGroupsByContact(
        people,
        contactResourceId,
      )
      const existingMemberships = (memberships || []).filter(
        membership =>
          membership.contactGroupMembership?.contactGroupId !== "myContacts",
      )
      for (const newGroupId of data?.groups?.filter(
        group => !group.__isNew__,
      ) || []) {
        await this.addContactToGroup(people, contactResourceId, newGroupId.value)
      }
      // Remove contact from existing groups
      for (const membership of existingMemberships) {
        if (
          data.groups?.find(
            group =>
              group.value.replace('contactGroups/','') === membership.contactGroupMembership?.contactGroupId,
          )
        )
          continue
        const groupResourceName =
          membership.contactGroupMembership?.contactGroupResourceName
        if (!groupResourceName) continue
        await this.removeContactFromGroup(
          people,
          contactResourceId,
          groupResourceName,
        )
      }

      const newGroups = data?.groups?.filter(group => group.__isNew__)
      if (newGroups?.length) {
        const newGroupIds = await Promise.all(
          newGroups.map(async group => {
            const res = await this.createGroup(people, group.value)
            if (!res.data.resourceName)
              throw new Error("Error al Crear el Grupo")
            setTimeout(() => {
              console.log({ res: res.data })
              if (!res.data.resourceName) return
              this.addContactToGroup(
                people,
                contactResourceId,
                res.data.resourceName,
              )
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
}
