import { createZodDto } from "nestjs-zod"
import { z } from "nestjs-zod/z"

export const ProgramSchema = z.object({
  files: z
    .object({
      id: z
        .string({
          required_error: "El id del archivo debe ser una cadena de caracteres",
        })
        .optional(),
      type: z.enum(["video", "image", "text", "audio", "poll", "file"]),
      content: z.string().optional(),
      font: z.union([z.literal(0), z.literal(1), z.literal(2)]).optional(),
      backgroundColor: z.string().optional(),
      options: z.string().array().optional(),
      delay: z
        .object(
          {
            minutes: z.number().max(60).default(0),
            seconds: z.number().max(60).default(10),
          },
          { required_error: " El delay es requerido" },
        )
        .optional(),
    })
    .array(),
  sendDate: z.any(),
  name: z.string().optional(),
  programType: z.enum(["MESSAGE", "STATUS", "FUNNEL"]),
  repeat: z
    .enum([
      "NOREPEAT",
      "EVERYHOUR",
      "DAILY",
      "WEEKLY",
      "MONTHLY",
      "YEARLY",
      "EVERYMINUTE",
    ])
    .optional(),
  to: z.string(),
  from: z.string(),
})

export interface FileInterface {
  id?: string
  type: "video" | "image" | "text" | "audio"
  options?: string[]
  name?: string
  content: string
  font?: 0 | 1 | 2
  backgroundColor?: string
  intervalBetween?: Date[]
}
export class ProgramDTO extends createZodDto(ProgramSchema) {}
