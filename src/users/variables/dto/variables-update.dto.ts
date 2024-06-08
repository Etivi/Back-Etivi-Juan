import { createZodDto } from "nestjs-zod"
import { z } from "nestjs-zod/z"

const UpdateVariableSchema = z.object({
  variables: z.record(z.string())
    .refine((obj) => {
      const keys = Object.keys(obj);
      return !keys.some((key) => key.startsWith("$"));
    }, "El token de la variable no puede empezar con $"),
});

export class UpdateVariableDto extends createZodDto(UpdateVariableSchema) {}
