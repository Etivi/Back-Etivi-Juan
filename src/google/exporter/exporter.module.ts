import { Module } from "@nestjs/common"
import { ExporterController } from "./exporter.controller"
import { ExporterService } from "./exporter.service"

@Module({
  controllers: [ExporterController],
  providers: [ExporterService],
  imports: [],
})
export class ExporterModule {}
