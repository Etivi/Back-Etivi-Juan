import { createZodDto } from "nestjs-zod"
import { z } from "nestjs-zod/z"
import { LoginUserOkSchema } from "src/users/lib/_getUserData"

const validateUserSchema = z.object({
  access_token: z.string(),
  user: LoginUserOkSchema,
})

// class is required for using DTO as a type
export class LoginUserResponseDto extends createZodDto(validateUserSchema) {}
