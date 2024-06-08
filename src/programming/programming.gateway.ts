import { Logger } from "@nestjs/common"
import {
  OnGatewayConnection,
  OnGatewayDisconnect,
  OnGatewayInit,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from "@nestjs/websockets"
import { PrismaClient } from "@prisma/client"
import { JwtPayload, decode } from "jsonwebtoken"
import { PrismaService } from "nestjs-prisma"
import { Server, Socket } from "socket.io"
import { CacheSystemService } from "src/cache-system/cache-system.service"

@WebSocketGateway({
  cors: {
    origin: "*",
  },
})
export class ProgrammingGateway
  implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect
{
  constructor(
    public readonly cacheStorage: CacheSystemService,
    private readonly prisma: PrismaService,
  ) {}
  @WebSocketServer() server: Server
  afterInit(server: any) {
    Logger.log("Initializing web socket gateway")
  }
  async handleConnection(client: Socket, ...args: any[]) {
    Logger.log("Client connected " + client.id, "Socket")
    const phone = client?.handshake?.headers["phone"]

    const data = this.getTokenDataByClient(client)
    if (!data) return
    console.log({ data })
    if(phone) return client.join(`${data.email}:${phone}`)
    client.join(`${data.email}`)
  }
  async handleDisconnect(client: any) {
    Logger.log("Client Disconnected " + client.id, "Socket")
  }

  @SubscribeMessage("add-cellphoneNumber-to-room")
  async handleAddCellphoneNumberToRoom(
    client: Socket,
    payload: { cellphoneNumber: string },
  ) {
    const { email } = await this.getTokenDataByClient(client)
    let currentRoom: string | undefined
    client.rooms.forEach((value, roomId) => {
      if (roomId !== client.id) {
        currentRoom = roomId
      }
    })
    if (currentRoom) {
      // Create the new room name by appending the cellphoneNumber
      const newRoomName = `${currentRoom.split(':')[0]}:${payload.cellphoneNumber}`
      // Leave the current room
      client.leave(currentRoom)

      // Join the new room with the updated name
      client.join(newRoomName)

      Logger.log(
        `Socket ${client.id} moved from room ${currentRoom} to ${newRoomName}`,
      )
    } else {
      Logger.log(`Socket ${client.id} is not in any room.`)
    }
  }
  @SubscribeMessage("message-sended")
  async handleMessageSended(
    client: Socket,
    payload: { id: string; status: "COMPLETED"; from: string },
  ) {
    await this.prisma.programedItems.update({
      where: {
        id: payload.id,
      },
      data: {
        status: "COMPLETED",
      },
    })
    const data = this.getTokenDataByClient(client)
    const socketList = await this.server
      .in(`${data.email}:${payload.from}`)
      .fetchSockets()
    const lastEnteredSocket = (socketList || []).reverse()[0]
    if (!lastEnteredSocket) return
    return lastEnteredSocket.emit("refetch-messages", {
      data,
    })
  }
  getClientByID(userID: string) {
    return this.server.sockets.sockets.get(userID)
  }
  getTokenDataByClient(client: Socket) {
    const token = client.handshake.auth.token
    return decode(token) as JwtPayload
  }
}
