import { createZodDto } from "nestjs-zod"
import { z } from "nestjs-zod/z"

const RegisterUserSchema = z.object({
  name: z
    .string({
      required_error: "El nombre es requerido",
    })
    .min(3, {
      message: "El nombre debe contener al menos 3 carácteres",
    }),
  lastname: z
    .string({
      required_error: "El apellido es requerido",
    })
    .min(3, {
      message: "El apellido debe contener al menos 3 carácteres",
    }),
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
  active: z
    .boolean({
      required_error: "El estado es requerido",
    })
    .default(false),
  role: z.number({
    required_error: "El rol es requerido",
  }),
  manager: z.object({
    wordpress_username: z.string(),
    email: z.string().email(),
    isAdmin: z.boolean(),
    company: z.string(),
    whatsapp_number: z.string(),
    membership: z.string(),
  }),
})

// class is required for using DTO as a type
export class RegisterUserDto extends createZodDto(RegisterUserSchema) {}
