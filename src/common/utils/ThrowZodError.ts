import { BadRequestException } from "@nestjs/common"
import { z } from "nestjs-zod/z"

interface ThrowErrorZod {
  statusCode?: number
  message?: string
  errors?: ZodError[]
}

export default function throwZodError ({
  statusCode,
  message,
  errors,
}: ThrowErrorZod) {
  const error = {
    statusCode: statusCode || 400,
    errors: errors || "Bad Request",
    message: message || "Your custom error message",
  }

  throw new BadRequestException(error)
}
export function validateOrThrow<T> (schema: z.ZodType<T>, object: unknown) {
  try {
    schema.parse(object)
  } catch (e) {
    throwZodError({
      errors: e.errors.map((error: ZodError) => ({
        ...error,
        path: error.path.map(path => path.toString()),
      })),
    })
  }
}

interface ZodError {
  code: string
  expected: string
  received: string
  path: string[]
  message: string
}
