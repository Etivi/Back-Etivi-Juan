import { createZodDto } from "nestjs-zod"
import { z } from "nestjs-zod/z"

const WpSchema = z.object({
  wp: z
    .string({
      required_error: "El WP es requerido",
    })
})

// class is required for using DTO as a type
export class GetWpDTO extends createZodDto(WpSchema) {}
