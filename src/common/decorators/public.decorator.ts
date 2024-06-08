import { SetMetadata } from "@nestjs/common"

enum Role {
  Admin = "admin",
}

export const Public = () =>
  SetMetadata("role", {
    roleLevel: 0,
    isPrivate: false,
  })
