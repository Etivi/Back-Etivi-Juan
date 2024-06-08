import { Module } from "@nestjs/common"
import { CacheSystemService } from "./cache-system.service"
import { PrismaService } from "nestjs-prisma"

@Module({
  providers: [CacheSystemService, PrismaService],
})
export class CacheSystemModule {}
