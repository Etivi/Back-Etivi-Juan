import { createZodDto } from "nestjs-zod"
import { z } from "nestjs-zod/z"
const DeleteVariableSchema = z.object({
  token: z.string({
    required_error: "El token de la variable es requerido",
  }),
})

const DeleteContactVariableSchema = z.object({
  token: z.string({
    required_error: "El token de la variable es requerido",
  }),
})

export class DeleteVariableDto extends createZodDto(DeleteVariableSchema) {}
export class DeleteContactVariableDto extends createZodDto(
  DeleteContactVariableSchema,
) {}
