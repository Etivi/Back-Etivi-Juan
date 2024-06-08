import { Body, Controller, Post, Res, HttpStatus } from "@nestjs/common"
import { ExporterService } from "./exporter.service"

@Controller("exporter")
export class ExporterController {
  constructor(private readonly exporterService: ExporterService) {}
  @Post("/contacts")
  async exportContacts(@Body("") body, @Res() res) {
    const xlsx = await this.exporterService.prepareDataToExport(body.contacts)
    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    )
    const fileName = `${body.fileName}-${new Date()
      .toLocaleDateString("es-AR", {
        day: "2-digit",
        month: "2-digit",
        year: "2-digit",
      })
      .replace(/\//g, "-")}.xlsx`
    res.attachment(fileName)
    try {
      await xlsx.write(res)
      res.end()
    } catch (error) {
      console.error(error)
      res.status(HttpStatus.INTERNAL_SERVER_ERROR).send("Server error")
    }
  }
}
