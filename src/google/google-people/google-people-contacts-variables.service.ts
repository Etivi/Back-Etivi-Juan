import { Injectable } from "@nestjs/common"
import { PrismaService } from "nestjs-prisma"
import { GooglePeopleService, formatPersonData } from "./google-people.service"
import { Prisma } from "@prisma/client"

@Injectable()
export class GooglePeopleContactsVariablesService {
  constructor(
    private readonly prismaService: PrismaService,
    private readonly googlePeopleService: GooglePeopleService,
  ) {}

  public async getContactVariables(
    token: string,
    cellphoneNumber: string,
    userId: string,
  ) {
    const formattedCellphoneNumber = cellphoneNumber.replace(/[+\s-]/g, "")
    const user = await this.prismaService.user.findUnique({
      where: { id: userId },
      select: { contactVariables: true },
    })
    const people = await GooglePeopleService.getPeopleClient(token)
    const response = await people.people.searchContacts({
      readMask:
        "phoneNumbers,names,emailAddresses,organizations,urls,locations,birthdays,addresses,photos,memberships",
      query: formattedCellphoneNumber,
    })
    if (!user) return { success: false, contactVariables: {} }
    if (!response.data.results) return { success: false, contactVariables: {} }
    const results = response.data.results[0]
    if (!results.person) return { success: false, contactVariables: {} }
    const formattedData = formatPersonData({ person: results.person })
    if (!formattedData) return { success: false, contactVariables: {} }
    const { photo, ...rest } = formattedData
    const newContactVariables = await this.createMultipleContactVariable(
      rest as any,
      formattedCellphoneNumber,
      userId,
    )
    console.log(newContactVariables)
    if (!newContactVariables) return { success: false, contactVariables: {} }
    console.log(
      (newContactVariables.variables as any)[formattedCellphoneNumber],
    )
    return {
      success: true,
      contactVariables: (newContactVariables.variables as any)[
        formattedCellphoneNumber
      ],
    }
  }

  async createMultipleContactVariable(
    variables: { [x: string]: string },
    cellphoneNumber: string,
    userId: string,
  ) {
    const user = await this.prismaService.user.findUnique({
      where: { id: userId },
    })
    if (!user) return
    let formattedNumber = cellphoneNumber
    if (cellphoneNumber.includes("+") || cellphoneNumber.includes(" ")) {
      formattedNumber = cellphoneNumber.replace("+", "").replace(/\s+/g, "")
    }
    let existingVariables: Prisma.JsonObject = (
      user.contactVariables as Prisma.JsonObject
    )[cellphoneNumber] as Prisma.JsonObject
    if (!existingVariables) {
      existingVariables = {}
    }
    for (const key in variables) {
      if (
        existingVariables.hasOwnProperty(`$contact_${key}$`) ||
        variables[key] !== existingVariables[`$contact_${key}$`]
      ) {
        existingVariables[`$contact_${key}$`] = variables[key]
      }
    }
    const existingOtherVariables = user.contactVariables as Prisma.JsonObject
    const createdVariables = await this.prismaService.user.update({
      where: { id: userId },
      data: {
        contactVariables: {
          ...existingOtherVariables,
          [formattedNumber]: {
            ...existingVariables,
          },
        },
      },
      select: {
        id: true,
        contactVariables: true,
      },
    })
    if (!createdVariables)
      return {
        message: "No se ha podido crear la variable",
        success: false,
        variables: null,
      }
    return {
      message: "Variable creada éxitosamente",
      success: true,
      variables: createdVariables.contactVariables,
    }
  }
}
