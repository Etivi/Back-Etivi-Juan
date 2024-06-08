import { Module } from "@nestjs/common"
import { UsersController } from "./users.controller"
import { UsersService } from "./users.service"
import { PrismaService } from "nestjs-prisma"
import { MembershipsService } from "src/memberships/memberships.service"
import { VariablesModule } from "./variables/variables.module"
import VariablesService from "./variables/variables.service"

@Module({
  controllers: [UsersController],
  providers: [
    UsersService,
    PrismaService,
    MembershipsService,
    VariablesService,
  ],
  exports: [UsersService],
})
export class UsersModule {}
