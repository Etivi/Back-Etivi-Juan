import { createZodDto } from "nestjs-zod"
import { z } from "nestjs-zod/z"

export const GoogleConnectSchema = z.object({
  google_token: z.string({
    required_error: "El authorization token es requerido",
  }),
})

// class is required for using DTO as a type
export class GoogleConnectDto extends createZodDto(GoogleConnectSchema) {}
