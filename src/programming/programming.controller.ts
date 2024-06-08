import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Put,
  Query,
} from "@nestjs/common"
import { Private } from "src/common/decorators/private.decorator"
import { ProgrammingService } from "./programming.service"
import { GetCurrentUserID } from "src/common/decorators/get-current-user-id.decorator"
import { ProgramDTO } from "./dto/program-message-dto"
import { ApiTags } from "@nestjs/swagger"
import { InitProgrammingDTO } from "./dto/init-programming-dto"
import { GetCurrentUser } from "src/common/decorators/get-current-user.decorator"

@Private()
@Controller("programming")
@ApiTags("programming")
export class ProgrammingController {
  constructor(private readonly programmingService: ProgrammingService) {}
  @Post("/")
  async programMessage(@GetCurrentUserID() id, @Body() body: ProgramDTO) {
    return this.programmingService.set(id, body)
  }
  @Post("/funnel")
  async initProgramming(
    @GetCurrentUserID() id,
    @Body() body: InitProgrammingDTO,
  ) {
    this.programmingService.start(id, body.id, body.to)
  }
  @Patch("/funnel/:id")
  async modifyExistingFunnel(
    @GetCurrentUserID() id,
    @Body() body: ProgramDTO,
    @Param("id") funnelId: string,
  ) {
    console.log("controller")
    return this.programmingService.patch(id, funnelId, body)
  }

  @Put("/funnel")
  async modifyExistingOrder(
    @GetCurrentUserID() id,
    @Body() body: { arrOfChangedOrders: { order: number; id: string }[] },
  ) {
    return this.programmingService.changeOrder(id, body.arrOfChangedOrders)
  }
  @Get("/funnel")
  async getAllProgramFunnelMessage(@GetCurrentUserID() id) {
    return this.programmingService.getAll(id, "FUNNEL")
  }
  @Get("/:messageId")
  async getProgramMessage(
    @GetCurrentUserID() id,
    @Param("messageId") messageId: string,
  ) {
    console.log("Hola")
    if (
      messageId === "FUNNEL" ||
      messageId === "MESSAGE" ||
      messageId === "STATUS"
    ) {
      return this.programmingService.getAll(id, messageId)
    }
    return this.programmingService.get(id, messageId)
  }
  @Get("/")
  async getAllProgrammedMessages(@GetCurrentUserID() id) {
    return this.programmingService.getAll(id, "ALL")
  }
  @Delete("/")
  async deleteProgramMessageBulk(
    @GetCurrentUser("email") email,
    @Query("ids") ids: string | string[],
  ) {
    if (!ids)
      throw new BadRequestException(
        "Debes enviar los ids de los mensajes a eliminar",
      )
    if (typeof ids === "string") ids = ids.split(",")

    return this.programmingService.deleteBulk(email, ids)
  }
  @Delete("/:messageId")
  async deleteProgramMessage(
    @GetCurrentUser("email") email,
    @Param("messageId") messageId: string,
  ) {
    return this.programmingService.delete(email, messageId)
  }
}
