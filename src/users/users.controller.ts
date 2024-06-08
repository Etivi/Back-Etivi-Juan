import { Controller, Headers, Get, Post, Body } from "@nestjs/common"
import { UsersService } from "./users.service"
import { Private, Role } from "src/common/decorators/private.decorator"
import { GetCurrentUserID } from "src/common/decorators/get-current-user-id.decorator"
import { Public } from "src/common/decorators/public.decorator"
import { ApiProperty } from "@nestjs/swagger"
import { GetWpDTO } from "./dto/wp.dto"

@Private()
@Controller("users")
export class UsersController {
  constructor(private readonly usersService: UsersService) { }
  @Get("/me")
  async getMe(@GetCurrentUserID() id: string) {

    return await this.usersService.getUserByID(id)
  }
  @Get("/me/wp")
  async getMeWP(@GetCurrentUserID() id: string) {
    const res = await this.usersService.getUserDataWP(id)

    return res
  }
  @Get("/me/token")
  async checkToken() {
    return true
  }
  @Post("/wp")
  async getMeWP2(@Body() { wp }: GetWpDTO) {
    const res = await this.usersService.getUserDataWP(wp)

    return res
  }
  @Get("/me/connections")
  async getMeConnections(@GetCurrentUserID() id: string) {
    const res = await this.usersService.getUserConnections(id)

    return res
  }
}
