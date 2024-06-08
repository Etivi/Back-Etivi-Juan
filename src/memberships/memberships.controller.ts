import { Controller, Get, Res } from "@nestjs/common"
import { ApiBearerAuth } from "@nestjs/swagger"
import { Response } from "express"
import { GetCurrentUserID } from "src/common/decorators/get-current-user-id.decorator"
import { GetCurrentUser } from "src/common/decorators/get-current-user.decorator"
import { Private } from "src/common/decorators/private.decorator"
import { MembershipsService } from './memberships.service';

@ApiBearerAuth("authorization")
@Controller("memberships")
export class MembershipsController {
  constructor(private membershipService:MembershipsService){}
  @Get()
  @Private()
  async getAll (@GetCurrentUser("sub") userId: string) {
    return ""
  }
  @Get("/me")
   @Private()
  async getUserMembership(@GetCurrentUserID() userId: string, @Res() res:Response) {
    const data = await this.membershipService.getUserMembershipByID(userId)
    return res.status(200).send(data)
  }
}
