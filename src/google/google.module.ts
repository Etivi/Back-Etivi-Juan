import { Module } from "@nestjs/common"
import { GoogleService } from "./google.service"
import { GoogleController } from "./google.controller"
import { PrismaService } from "nestjs-prisma"
import { MembershipsService } from "src/memberships/memberships.service"
import { AuthService } from "src/auth/auth.service"
import { AuthModule } from "src/auth/auth.module"
import { UsersService } from "src/users/users.service"
import { JwtService } from "@nestjs/jwt"
import { SharedModule } from "./shared/shared.module"
import { GooglePeopleModule } from "./google-people/google-people.module"
import { GoogleDriveModule } from "./google-drive/google-drive.module"
import { GoogleGroupsModule } from "./google-groups/google-groups.module"

@Module({
  providers: [GoogleService, PrismaService,AuthService,UsersService,JwtService,MembershipsService],
  controllers: [GoogleController],
  imports: [
    SharedModule,
    GooglePeopleModule,
    GoogleDriveModule,
    GoogleGroupsModule,
    AuthModule,
  ]})
export class GoogleModule {}
