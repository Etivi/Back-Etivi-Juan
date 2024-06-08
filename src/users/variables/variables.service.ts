import { Injectable } from "@nestjs/common"
import { PrismaClient, Prisma } from "@prisma/client"
import { PrismaService } from "nestjs-prisma"
import { string } from "nestjs-zod/z"

@Injectable()
export default class VariablesService {
  constructor(private readonly prisma: PrismaService) {}
  async createVariable(token: string, value: string, userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    })
    if (!user) return
    const existingVariables: Prisma.JsonObject =
      user.variables as Prisma.JsonObject
    const alreadyExists = Object.keys(existingVariables).find(
      (existingName) => existingName === token,
    )
    if (alreadyExists) {
      return {
        message: "No se pueden crear variables con el mismo nombre",
        success: false,
        variables: null,
      }
    }
    const createdVariables = await this.prisma.user.update({
      where: { id: userId },
      data: { variables: { ...existingVariables, [token]: value } },
      select: {
        id: true,
        variables: true,
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
      variables: createdVariables.variables,
    }
  }

  async getVariables(userId: string) {
    return await this.prisma.user.findUnique({
      where: { id: userId },
      select: { variables: true, id: true },
    })
  }

  async deleteVariable(userId: string, variableNameToDelete: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    })
    if (!user) return
    const existingVariables: Prisma.JsonObject =
      user.variables as Prisma.JsonObject
    const variableExist = Object.keys(existingVariables).find(
      (existingName) => existingName === variableNameToDelete,
    )
    if (!variableExist)
      return {
        message: "La variable que quieres eliminar no existe",
        success: false,
        variables: null,
      }
    delete existingVariables[variableNameToDelete]
    const variableSuccessfulyDeleted = await this.prisma.user.update({
      where: { id: userId },
      data: {
        variables: {
          ...existingVariables,
        },
      },
      select: {
        variables: true,
      },
    })
    return {
      message: "Variable eliminada exitosamente",
      success: true,
      variable: variableSuccessfulyDeleted,
    }
  }
  async updateVariable(userId: string, varsToUpdate: { [x: string]: string }) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    })
    if (!user)
      return {
        success: false,
        message: "No se ha podido actualizar las variables",
        variables: null,
      }
    const existingVariables: Prisma.JsonObject =
      user.variables as Prisma.JsonObject
    const updatedVariables = await this.prisma.user.update({
      where: { id: userId },
      data: { variables: { ...existingVariables, ...varsToUpdate } },
      select: {
        id: true,
        variables: true,
      },
    })
    if (!updatedVariables)
      return {
        success: false,
        message: "No se ha podido actualizar las variables",
        variables: null,
      }
    return {
      success: true,
      message: "Las variables se actualizaron correctamente",
      variables: updatedVariables,
    }
  }

  async createContactVariable(
    token: string,
    value: string,
    cellphoneNumber: string,
    userId: string,
  ) {
    const user = await this.prisma.user.findUnique({
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
    const alreadyExists = Object.keys(existingVariables).find(
      (existingName) => existingName === token,
    )
    if (alreadyExists)
      return {
        message: "No se puede crear una variable con el mismo nombre",
        success: false,
        variables: null,
      }
    const parsedToken =
      arrayOfDefaultNames.includes(token) ||
      arrayOfDefaultNamesInSpanish.includes(token.toLowerCase())
        ? `$contact_${token}-1$`
        : `$contact_${token}$`
    const existingOtherVariables = user.contactVariables as Prisma.JsonObject
    const createdVariables = await this.prisma.user.update({
      where: { id: userId },
      data: {
        contactVariables: {
          ...existingOtherVariables,
          [formattedNumber]: {
            ...existingVariables,
            [parsedToken]: value,
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
    const createdContactVariablesByCellphoneNumber = (
      createdVariables.contactVariables as Prisma.JsonObject
    )[cellphoneNumber]
    return {
      message: "Variable creada éxitosamente",
      success: true,
      variables: createdContactVariablesByCellphoneNumber,
    }
  }

  async getContactVariable(userId: string, cellphoneNumber: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, contactVariables: true },
    })
    if (!user) {
      return {
        message: "No se pudieron obtener las variables",
        success: false,
        variables: {},
      }
    }
    if (!user.contactVariables) {
      return { message: "Obtenidas con éxito", success: true, variables: {} }
    }
    const contactVariablesByCellphoneNumber =
      user.contactVariables[cellphoneNumber]

    return {
      message: "Variables obtenidas con éxito",
      success: true,
      variables: contactVariablesByCellphoneNumber,
    }
  }
  async getAllContactVariables(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, contactVariables: true },
    })
    if (!user) {
      return {
        message: "No se pudieron obtener las variables",
        success: false,
        contactVariables: {},
      }
    }
    if (!user.contactVariables) {
      return {
        message: "Obtenidas con éxito",
        success: true,
        contactVariables: {},
      }
    }

    return {
      message: "Variables obtenidas con éxito",
      success: true,
      contactVariables: user.contactVariables,
    }
  }
  async deleteContactVariable(
    userId: string,
    cellphoneNumber: string,
    token: string,
  ) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, contactVariables: true },
    })
    if (!user) {
      return {
        message: "No se ha encontrado la variable que se quiere eliminar",
        success: false,
      }
    }
    if (!user.contactVariables) {
      return {
        message: "No tienes variables para borrar",
        success: false,
        variables: {},
      }
    }
    console.log(user)
    const contactVariables = user.contactVariables[cellphoneNumber]
    if (!contactVariables) {
      return {
        message: "El contacto no tiene variables",
        success: false,
        variables: {},
      }
    }
    const variableExist = Object.keys(contactVariables).find(
      (existingName) => existingName === token,
    )
    if (!variableExist)
      return {
        message: "La variable que quieres eliminar no existe",
        success: false,
        variables: contactVariables,
      }
    delete contactVariables[token]

    console.log(contactVariables)
    const existingOtherVariables = user.contactVariables as Prisma.JsonObject

    console.log(existingOtherVariables)

    const variableSuccessfullyDeleted = await this.prisma.user.update({
      where: { id: userId },
      data: {
        contactVariables: {
          ...existingOtherVariables,
          [cellphoneNumber]: {
            ...contactVariables,
          },
        },
      },
      select: {
        contactVariables: true,
      },
    })
    if (!variableSuccessfullyDeleted)
      return {
        message: "No se ha podido obtener la variable despues de eliminarla",
        success: true,
        variables: {},
      }
    const variables = (
      variableSuccessfullyDeleted.contactVariables as Prisma.JsonObject
    )[cellphoneNumber]
    return {
      message: "Variable eliminada exitosamente",
      success: true,
      variables: variables,
    }
  }
  async updateContactVariables(
    variables: { [x: string]: string },
    cellphoneNumber: string,
    userId: string,
  ) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    })
    if (!user) return
    console.log(variables)
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
    const updatedVariables = await this.prisma.user.update({
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
    console.log(updatedVariables)
    if (!updatedVariables)
      return {
        message: "No se ha podido crear la variable",
        success: false,
        variables: null,
      }
    return {
      message: "Variables actualizadas éxitosamente",
      success: true,
      variables: updatedVariables.contactVariables,
    }
  }
  async createMultipleContactVariable(
    variables: { [x: string]: string },
    cellphoneNumber: string,
    userId: string,
  ) {
    const user = await this.prisma.user.findUnique({
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
    const createdVariables = await this.prisma.user.update({
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

const arrayOfDefaultNames = [
  "name",
  "lastName",
  "phone",
  "email",
  "groups",
  "organization",
  "address",
  "city",
  "country",
  "birthday",
  "web",
]
const arrayOfDefaultNamesInSpanish = [
  "nombre",
  "apellido",
  "teléfono",
  "correo",
  "grupos",
  "organization",
  "dirección",
  "país",
  "ciudad",
  "cumpleaños",
  "sitio web",
]
