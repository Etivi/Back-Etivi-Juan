import { createZodDto } from "nestjs-zod"
import { z } from "nestjs-zod/z"

export const CreateContactSchema = z.object({
  name: z.string({
    required_error: "El nombre del contacto es requerido",
  }),
  lastName: z
    .string({
      required_error: "El apellido del contacto es requerido",
    })
    .optional(),
  phone: z.string({
    required_error: "El teléfono del contacto es requerido",
  }),
  email: z
    .string({
      required_error: "El email del contacto es requerido",
    })
    .optional(),
  birthday: z
    .string({
      required_error: "El cumpleaños debe ser una fecha",
    })
    .optional(),
  organization: z
    .string({
      required_error: "La organización debe ser un texto",
    })
    .optional(),
  address: z.string({
    required_error: "La organización debe ser un texto",
  }).optional(),
  city: z
    .string({
      required_error: "La ciudad debe ser un texto",
    })
    .optional(),
  country: z
    .string({
      required_error: "El país debe ser un texto",
    })
    .optional(),
  web: z
    .string({
      required_error: "La página web debe ser un texto",
    })
    .optional(),
  groups: z
    .object({
      value:z.string(),
      label: z.string(),
      __isNew__: z.boolean().optional(),
    }).array()
    .optional(),
  photo: z.string().optional(),
})

// class is required for using DTO as a type
export class CreateContactDto extends createZodDto(CreateContactSchema) {}
