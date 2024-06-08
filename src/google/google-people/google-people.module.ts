import { Module } from "@nestjs/common"
import { GooglePeopleController } from "./google-people.controller"
import { GooglePeopleService } from "./google-people.service"
import { GoogleService } from "../google.service"
import { PrismaService } from "nestjs-prisma"
import { UsersService } from "src/users/users.service"
import { MembershipsService } from "../../memberships/memberships.service"
import { AuthService } from "src/auth/auth.service"
import { JwtService } from "@nestjs/jwt"
import { SharedModule } from "../shared/shared.module"
import VariablesService from "src/users/variables/variables.service"
import { GooglePeopleContactsVariablesService } from "./google-people-contacts-variables.service"

@Module({
  controllers: [GooglePeopleController],
  providers: [
    GooglePeopleService,
    GoogleService,
    PrismaService,
    UsersService,
    MembershipsService,
    AuthService,
    JwtService,
    VariablesService,
    GooglePeopleContactsVariablesService,
  ],
  imports: [SharedModule],
})
export class GooglePeopleModule {}
