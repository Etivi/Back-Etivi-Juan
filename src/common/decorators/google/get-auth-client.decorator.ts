import { createParamDecorator, ExecutionContext } from "@nestjs/common"
import { OAuth2Client } from "google-auth-library"
import { PrismaService } from "nestjs-prisma"
import { GoogleService } from "src/google/google.service"
import { GoogleAuthWithTokenInfo } from "src/google/types/google-auth.type"
import { UsersService } from "../../../users/users.service"
import { MembershipsService } from "src/memberships/memberships.service"
import { AuthService } from "src/auth/auth.service"
import { JwtService } from "@nestjs/jwt"

export const GetGoogleAuthClient = createParamDecorator(
  async (
    data: undefined | { includeTokenInfo: boolean },
    ctx: ExecutionContext,
  ): Promise<OAuth2Client | GoogleAuthWithTokenInfo | null> => {
    const request = ctx.switchToHttp().getRequest()
    const prismaService = new PrismaService()
    const jwtService = new JwtService()
    const membershipService = new MembershipsService()
    const userService = new UsersService(prismaService,membershipService)
    const authService = new AuthService(prismaService,userService, jwtService,membershipService)
    const googleService = new GoogleService(prismaService, authService,userService )


    const authClient = await googleService.getGoogleAuthFromDB(
      request?.user?.sub,
    )
    if (!authClient) return null
    if (data?.includeTokenInfo) return authClient
    return authClient.authClient
  },
)
