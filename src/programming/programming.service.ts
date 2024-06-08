import { Injectable } from "@nestjs/common"
import { PrismaService } from "nestjs-prisma"
import { FileInterface, ProgramDTO } from "./dto/program-message-dto"
import { Prisma, ProgramedItems, ProgrammedType, User } from "@prisma/client"
import { Cron, SchedulerRegistry } from "@nestjs/schedule"
import { CronJob } from "cron"
import { ProgrammingGateway } from "./programming.gateway"

import { parseDateFromString } from "utils/parseDateFromString"
import parseDateFromObjectOrArray from "utils/parseDateFromObjectOrArray"

@Injectable()
export class ProgrammingService {
  constructor(
    private readonly prisma: PrismaService,
    private schedulerRegister: SchedulerRegistry,
    private readonly programmingGateway: ProgrammingGateway,
  ) { }
  async set(
    id: string,
    { files, programType, sendDate, name, to, repeat, from }: ProgramDTO,
  ) {
    try {
      const order = await this.prisma.programedItems.count()
      const createdItem = await this.prisma.programedItems.create({
        data: {
          user: {
            connect: {
              id: id,
            },
          },
          status: "PENDING",
          order: order + 1,
          sendDate: programType === "FUNNEL" ? undefined : sendDate,
          files: JSON.stringify(files),
          programType: programType,
          name: name ? name : undefined,
          to: to,
          from: from,
          repeat: programType === "FUNNEL" ? undefined : repeat,
        },
      })
      const user = (await this.prisma.user.findUnique({
        where: { id: id },
        select: {
          email: true,
          password: false,
          id: false,
          variables: false,
        },
      })) as User
      if (createdItem.programType === "FUNNEL") {
        return { message: "Funnel programado con éxito", success: true }
      }
      this.createCronjob(
        `${user.email}:${createdItem.id}`,
        createdItem,
        user.email,
      )
      return { message: "Mensaje programado con éxito", success: true }
    } catch (e) {
      console.log(e?.message)
      return { message: "Mensaje programado con éxito", success: true }
    }
  }
  createCronjob(name: string, item: ProgramedItems, email: string) {
    try {
      const repeat = item.repeat
      const cronExpression = this.getCronExpressionByRepeatType(
        repeat,
        item.sendDate as Date,
      )
      if (cronExpression) {
        console.log(cronExpression)
        const job = new CronJob(
          cronExpression,
          () => {
            console.log("sending - message", `${email}:${item.from}`)
            console.log(JSON.stringify({item}))
            this.sendToLastSocket(
              `${email}:${item.from}`,
              "message-ready-to-send",
              item,
            )
          },
          async () => {
            await this.prisma.programedItems.update({
              where: {
                id: item.id,
              },
              data: {
                status: "FAILED",
              },
            })
          },
          true,
        )
        this.schedulerRegister.addCronJob(name, job)
      }

    } catch (e) {
      console.log(e?.message)
    }
  }

  getCronExpressionByRepeatType(repeat: string | null, date: Date) {
    let cronExpression
    switch (repeat) {
      case "NOREPEAT":
      case null:
      case undefined:
        cronExpression = date
        break
      case "EVERYHOUR":
        cronExpression = "0 * * * *"
        break
      case "DAILY":
        cronExpression = `${date.getMinutes()} ${date.getHours()} * * *`
        break
      case "WEEKLY":
        cronExpression = `${date.getMinutes()} ${date.getHours()} * * ${date.getDay()}`
        break
      case "MONTHLY":
        cronExpression = `${date.getMinutes()} ${date.getHours()} ${date.getDate()} * *`
        break
      case "YEARLY":
        cronExpression = `${date.getMinutes()} ${date.getHours()} ${date.getDate()} ${date.getMonth() + 1
          } *`
      case "EVERYMINUTE":
        cronExpression = "* * * * *"
        break
      default:
        throw new Error("Invalid repeat type")
    }
    return cronExpression
  }
  async get(id: string, messageId: string) {
    const message = await this.prisma.programedItems.findUnique({
      where: {
        id: messageId,
      },
    })
    if (!message) {
      return { message: "No se ha podido encontrar el mensaje", success: false }
    }
    return {
      message: "Mensaje encontrado con éxito",
      success: true,
      programMessage: message,
    }
  }
  async getAll(
    userId: string,
    programType?: "FUNNEL" | "MESSAGE" | "STATUS" | "ALL",
  ) {
    const listOfMessages = await this.prisma.programedItems.findMany({
      where: {
        user_id: userId,
        programType:
          programType === "ALL"
            ? undefined
            : programType === "FUNNEL"
              ? { equals: "FUNNEL" }
              : { not: "FUNNEL" },
      },
      orderBy: {
        order: "asc",
      },
    })

    if (!listOfMessages) {
      return {
        message: "No se ha podido encontrar los mensajes",
        success: false,
        programMessage: null,
      }
    }
    return {
      message: "Mensajes obtenidos con éxito",
      success: true,
      programMessage: listOfMessages,
    }
  }
  async delete(userEmail: string, messageId: string) {
    try {
      this.schedulerRegister.deleteCronJob(`${userEmail}:${messageId}`)
    } catch (e) { }
    const message = await this.prisma.programedItems.delete({
      where: {
        id: messageId,
      },
    })
    if (!message)
      return { message: "Error al eliminar mensaje", success: false }
    return { message: "Mensaje eliminado con éxito", success: true }
  }
  async deleteBulk(email: string, messageIds: string[]) {
    for (const messageId of messageIds) {
      try {
        this.schedulerRegister.deleteCronJob(`${email}:${messageId}`)
      } catch (e) { }
    }
    const message = await this.prisma.programedItems.deleteMany({
      where: {
        id: {
          in: messageIds,
        },
      },
    })
    if (!message)
      return { message: "Error al eliminar los mensajes", success: false }
    return { message: "Mensajes eliminados con éxito", success: true }
  }

  async start(userId: string, messageId: string, to?: string) {
    try {
      const message = await this.prisma.programedItems.findFirst({
        where: {
          id: messageId,
          user_id: userId,
        },
      })
      const user = await this.prisma.user.findUnique({
        where: {
          id: userId,
        },
        select: {
          email: true,
        },
      })
      if (!user)
        return { message: "No existe un usuario con este id", success: false }
      if (!message)
        return {
          message: "No se ha podido encontrar el mensaje",
          success: false,
        }
      if (message.programType === "FUNNEL") {
        this.createNestedCronJob(
          `${user.email}:${message.id}`,
          message,
          user.email,
          to as string,
        )
      }
    } catch (err) {
      console.log(err)
      return { message: "Algo ha salido mal", success: false }
    }
  }

  async patch(userId: string, funnelId: string, body: ProgramDTO) {
    try {
      await this.prisma.programedItems.update({
        where: {
          id: funnelId,
        },
        data: {
          ...body,
          files: JSON.stringify(body.files),
        },
      })
      return { message: "Funnel actualizado con éxito", success: true }
    } catch (error) {
      console.log(error)
      return { message: "Error al eliminar mensaje", success: false }
    }
  }

  createNestedCronJob(
    name: string,
    item: ProgramedItems,
    email: string,
    to: string,
  ) {
    try {
      const files = JSON.parse(item.files as string)

      if (!files) return

      let currentIndex = 0
      const sendNextMessage = () => {
        const instantDate = new Date()
        instantDate.setSeconds(instantDate.getSeconds() + 1)
        const currentDate = files[0].delay
          ? parseDateFromObjectOrArray(files[0].delay)
          : instantDate

        if (currentIndex < files.length) {
          const file = files[currentIndex] as unknown as FileInterface

          if (!file) return
          const job = new CronJob(
            currentDate,
            async () => {
              const res = await this.sendToLastSocket(
                `${email}:${item.from}`,
                "message-ready-to-send",
                {
                  file,
                  programType: "FUNNEL",
                  to: to,
                },
              )
              if (!res) return
              currentIndex++
              this.schedulerRegister.deleteCronJob(`${name}-${file.id}`)
              sendNextMessage()
            },
            async () => {
              await this.prisma.programedItems.update({
                where: {
                  id: item.id,
                },
                data: {
                  status: "FAILED",
                },
              })
            },
            true,
          )
          this.schedulerRegister.addCronJob(`${name}-${file.id}`, job)
        }
      }
      sendNextMessage()
      return
    } catch (error) {
      console.log(error?.message)
    }
  }
  async sendToLastSocket(room: string, type: string, data: any) {
    try {
      console.log(room)
      const socketList = await this.programmingGateway.server
        .in(room)
        .fetchSockets()
      const lastEnteredSocket = (socketList || []).reverse()[0]
      if (!lastEnteredSocket) return

      return lastEnteredSocket.emit(type, {
        data,
      })
    } catch (error) {
      console.log(error)
    }
  }

  async changeOrder(userId: string, arrOfItemsToUpdate: any[]) {
    try {
      console.log(arrOfItemsToUpdate)
      const promise = arrOfItemsToUpdate.map((item) =>
        this.prisma.programedItems.update({
          where: { id: item.id },
          data: { order: item.order },
        }),
      )
      await Promise.all(promise)
      return { success: true, message: "Haz cambiado los ordenes éxitosamente" }
    } catch (err) {
      console.log(err)
    }
  }
}
