import { createZodDto } from "nestjs-zod"
import { z } from "nestjs-zod/z"

const LoginGoogleSchema = z.object({
  google_code: z.string({
    required_error: "El Google Token es requerido",
  }),
})

// class is required for using DTO as a type
export class LoginGoogleDto extends createZodDto(LoginGoogleSchema) {}
