import { createZodDto } from "nestjs-zod"
import { z } from "nestjs-zod/z"

const excludeDollarSign = (val: string) => !val.startsWith("$")
const CreateVariableSchema = z.object({
  token: z
    .string({
      required_error: "El token de la variable es requerido",
    })
    .refine(
      excludeDollarSign,
      "El token de la variable no puede empezar con $",
    ),
  value: z.string({
    required_error: "El valor de la variable es requerido",
  }),
})
const CreateContactVariableSchema = z.object({
  token: z
    .string({
      required_error: "El token de la variable es requerido",
    })
    .refine(
      excludeDollarSign,
      "El token de la variable no puede empezar con $",
    ),
  value: z.string({
    required_error: "El valor de la variable es requerido",
  }),
  cellphoneNumber: z.string({
    required_error: "El numero de telefono es requerido",
  }),
})

export class CreateVariableDto extends createZodDto(CreateVariableSchema) {}
export class CreateContactVariableDto extends createZodDto(
  CreateContactVariableSchema,
) {}
