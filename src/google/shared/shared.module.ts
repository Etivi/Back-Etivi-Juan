import { Module } from "@nestjs/common"
import { GooglePeopleService } from "../google-people/google-people.service"
import { GoogleDriveService } from "../google-drive/google-drive.service"
import { GoogleGroupsService } from "../google-groups/google-groups.service"
import { UsersService } from "src/users/users.service"
import { PrismaService } from "nestjs-prisma"
import { MembershipsService } from "src/memberships/memberships.service"
import { AuthService } from "src/auth/auth.service"
import { JwtModule } from "@nestjs/jwt"
import VariablesService from "src/users/variables/variables.service"

@Module({
  imports: [JwtModule],
  providers: [
    GooglePeopleService,
    GoogleDriveService,
    GoogleGroupsService,
    UsersService,
    PrismaService,
    MembershipsService,
    VariablesService,
    AuthService,
  ],
  exports: [GooglePeopleService, GoogleDriveService, GoogleGroupsService],
})
export class SharedModule {}
