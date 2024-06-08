import { SetMetadata, UseGuards } from "@nestjs/common"
import { JwtAuthGuard } from "src/auth/guards/jwt-auth.guard"

export enum Role {
  Admin = "admin",
}
interface IRole {
  roleLevel: Role
  isPrivate: boolean
}
export type IRoleMetadata = IRole | undefined
export const Private = (/* roleLevel: Role */): MethodDecorator &
  ClassDecorator => {
  return (
    target: object,
    key?: string | symbol,
    descriptor?: PropertyDescriptor,
  ): void => {
    // handler's context
    if (descriptor) {
      UseGuards(JwtAuthGuard)(target, key as string, descriptor)
      SetMetadata("role", { roleLevel: 1, isPrivate: true })(
        target,
        key as string,
        descriptor,
      )
    } else if (key) {
      UseGuards(JwtAuthGuard)(target as Function)
      SetMetadata("role", { roleLevel: 1, isPrivate: true })(target as Function)
    } else {
      UseGuards(JwtAuthGuard)(target as Function)
      SetMetadata("role", { roleLevel: 1, isPrivate: true })(target as Function)
    }
  }
}
