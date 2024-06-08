import { Injectable, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { Reflector } from "@nestjs/core"
import { AuthGuard } from "@nestjs/passport"
import { PrismaClient, Session } from "@prisma/client"
import { IRoleMetadata } from "src/common/decorators/private.decorator"
import { JWTPayload } from "../strategies/at.strategy"
import { JwtService } from "@nestjs/jwt"
import { GooglePermissionMetadata } from "src/common/decorators/google/google-permissions.decorator"
import { GoogleService } from "src/google/google.service"
import { PrismaService } from "nestjs-prisma"
import { MembershipsService } from "src/memberships/memberships.service"
import { UsersService } from "src/users/users.service"
import { AuthService } from "../auth.service"
@Injectable()
export class JwtAuthGuard extends AuthGuard("jwt") {
  constructor (private readonly reflector: Reflector) {
    super()
  }
  async canActivate (context: ExecutionContext) {
    const { role, googlePermissions } = this.getRoleMetadata(context)
    if (!role?.isPrivate) return true
    const authorization = context
      .switchToHttp()
      .getRequest()
      .headers?.authorization?.split("Bearer ")[1]
    if (!authorization) return false
    const session = await this.findSession(authorization)
    if (!session) return false
    if (!googlePermissions) return super.canActivate(context) as any
    const hasPermission = await this.verifyGooglePermissions(session, googlePermissions)
    if (!hasPermission) throw new UnauthorizedException("Debes rehacer la conexión con Google")
    return super.canActivate(context) as any
  }

  async findSession (token: string) {
    const prisma = new PrismaClient()
    try {
      const jwt = new JwtService()
      const payload: JWTPayload | null = jwt.decode(token) as JWTPayload | null
      if (!payload) return null
      return await prisma.session.findFirst({
        where: {
          user_id: payload.sub,
          token,
        },
      })
    } catch (e) {
      return null
    } finally {
      await prisma.$disconnect()
    }
  }
  async verifyGooglePermissions(session: Session, googlePermissions: GooglePermissionMetadata) {
    try {
      
      const prismaService = new PrismaService()
      const jwtService = new JwtService()
      const membershipService = new MembershipsService()
      const userService = new UsersService(prismaService,membershipService)
      const authService = new AuthService(prismaService,userService, jwtService,membershipService)
      const googleService = new GoogleService(prismaService, authService,userService )
      
      const res = await googleService.getGoogleAuthFromDB(session.user_id)
      if (!res || !res.authClient?.credentials?.access_token) return false
      const scopes = (await res.authClient.getTokenInfo(res.authClient.credentials.access_token)).scopes
      if (!scopes) return false
      const hasPermission = googlePermissions.every((permission) => scopes.includes(permission))
      return hasPermission
    } catch (e) {
      return false
    }
  }
  getRoleMetadata (context: ExecutionContext): {
    role: IRoleMetadata
    googlePermissions?: GooglePermissionMetadata
  } {
    const role = this.reflector.getAllAndOverride<IRoleMetadata>("role", [
      context.getHandler(),
      context.getClass(),
    ])
    const googlePermissions = this.reflector.getAllAndOverride<
      GooglePermissionMetadata | undefined
    >("google_permissions", [context.getHandler(), context.getClass()])

    return { role, googlePermissions }
  }
}
