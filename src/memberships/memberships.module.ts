import { Module } from "@nestjs/common"
import { MembershipsController } from "./memberships.controller"
import { MembershipsService } from "./memberships.service"
import { AuthService } from "src/auth/auth.service"
import { JwtService } from "@nestjs/jwt"

@Module({
  imports: [],
  controllers: [MembershipsController],
  providers: [MembershipsService],
  exports:[MembershipsService]
})
export class MembershipsModule {}
