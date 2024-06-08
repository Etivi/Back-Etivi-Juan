import { createZodDto } from "nestjs-zod"
import { z } from "nestjs-zod/z"

export const GoogleResumable = z.object({
  name: z.string({
    required_error: "El nombre del archivo es necesario",
  }),
  type: z.string({
    required_error: "El tipo del archivo es necesario",
  }),
  size: z.string({
    required_error: "El peso del archivo es necesario",
  }),
})

// class is required for using DTO as a type
export class GoogleResumableDto extends createZodDto(GoogleResumable) {}
