import { createZodDto } from "nestjs-zod"
import { z } from "nestjs-zod/z"

const LoginUserSchema = z.object({
  email: z
    .string({
      required_error: "El email es requerido",
    })
    .email({
      message: "El email debe ser válido",
    }),
  password: z
    .string({
      required_error: "La contraseña es requerida",
    })
    .min(8, {
      message: "La contraseña debe contener al menos 8 carácteres",
    }),
})

// class is required for using DTO as a type
export class LoginUserDto extends createZodDto(LoginUserSchema) {}
