import { createParamDecorator, ExecutionContext } from "@nestjs/common"
import { OAuth2Client } from "google-auth-library"
import { PrismaService } from "nestjs-prisma"
import { GoogleService } from "src/google/google.service"
import { UsersService } from '../../../users/users.service';
import { MembershipsService } from "src/memberships/memberships.service";
import { JwtService } from "@nestjs/jwt";
import { AuthService } from "src/auth/auth.service";

export const GetGoogleAuthClientToken = createParamDecorator(
  async (data: undefined, ctx: ExecutionContext): Promise<string | null> => {
    const request = ctx.switchToHttp().getRequest()
    const prismaService = new PrismaService()
    const jwtService = new JwtService()
    const membershipService = new MembershipsService()
    const userService = new UsersService(prismaService,membershipService)
    const authService = new AuthService(prismaService,userService, jwtService, membershipService)
    const googleService = new GoogleService(prismaService, authService, userService)

    const authClient = await googleService.getGoogleAuthFromDB(
      request?.user?.sub,
    )
    if (!authClient) return null
    return authClient.authClient.credentials.access_token!
  },
)
