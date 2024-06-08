import { ZodType, z } from "nestjs-zod/z";

export type ZodInfer<T extends ZodType> = z.infer<T>