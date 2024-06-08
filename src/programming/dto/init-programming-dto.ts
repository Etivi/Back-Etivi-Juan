import { createZodDto } from "nestjs-zod"
import { z } from "zod"

export const initProgrammingSchema = z.object({
  id: z.string({
    required_error: "El id del mensaje para programar  es requerido",
  }),
  to: z.string(),
  from: z.string(),
})
export class InitProgrammingDTO extends createZodDto(initProgrammingSchema) {}
