import { Module } from "@nestjs/common"
import { PrismaService } from "nestjs-prisma"
import VariablesController from "./variables.controller"
import VariablesService from "./variables.service"
@Module({
  providers: [VariablesService, PrismaService],
  controllers: [VariablesController],
  exports: [VariablesService],
})
export class VariablesModule {}
