import { Injectable } from "@nestjs/common"
import * as excel from "exceljs"

@Injectable()
export class ExporterService {
  async prepareDataToExport(data) {
    const keyMap = {
      id: "teléfono",
      name: "Nombre",
      shortName: "Nombre corto",
      pushName: "Nombre predeterminado",
    }
    const workbook = new excel.Workbook()
    const worksheet = workbook.addWorksheet("Lista de Contactos")
    worksheet.columns = Object.keys(data[0]).map((key) => ({
      header: keyMap[key] || null,
      key,
    }))
    worksheet.addRows(data)
    return workbook.xlsx
  }
}
