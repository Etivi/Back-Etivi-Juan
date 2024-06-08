import { SetMetadata, UseGuards } from "@nestjs/common"
import { JwtAuthGuard } from "src/auth/guards/jwt-auth.guard"

export enum GooglePermission {
  GoogleDrive = "https://www.googleapis.com/auth/drive",
  GooglePeople = "https://www.googleapis.com/auth/contacts",
}

export type GooglePermissionMetadata = GooglePermission[]
export const GooglePermissions = (data: GooglePermissionMetadata): MethodDecorator &
  ClassDecorator => {
  return (
    target: object,
    key?: string | symbol,
    descriptor?: PropertyDescriptor,
  ): void => {
    // handler's context
    if (descriptor) {
      SetMetadata("google_permissions", data)(
        target,
        key as string,
        descriptor,
      )
    } else if (key) {
      SetMetadata("google_permissions", data)(target as Function)
    } else {
      SetMetadata("google_permissions", data)(target as Function)
    }
  }
}
