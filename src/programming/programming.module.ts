import { Module } from "@nestjs/common"
import { ProgrammingController } from "./programming.controller"
import { ProgrammingService } from "./programming.service"
import { ProgrammingGateway } from "./programming.gateway"
import { PrismaService } from "nestjs-prisma"
import { ScheduleModule } from "@nestjs/schedule"
import { CacheSystemService } from "src/cache-system/cache-system.service"

@Module({
  imports: [ScheduleModule.forRoot()],
  controllers: [ProgrammingController],
  providers: [
    ProgrammingService,
    ProgrammingGateway,
    PrismaService,
    CacheSystemService,
  ],
})
export class ProgrammingModule {}
