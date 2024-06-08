import { Module } from "@nestjs/common"
import { AuthController } from "./auth.controller"
import { AuthService } from "./auth.service"
import { MembershipsService } from "../memberships/memberships.service"
import { MembershipsModule } from "../memberships/memberships.module"
import { PrismaService } from "nestjs-prisma"
import { UsersService } from "src/users/users.service"
import { CacheSystemService } from "../cache-system/cache-system.service"
import { JwtModule } from "@nestjs/jwt"
import { JwtStrategy } from "./strategies/at.strategy"
import { GoogleService } from "src/google/google.service"
import { UsersModule } from "src/users/users.module"

@Module({
  controllers: [AuthController],
  providers: [
    AuthService,
    PrismaService,
    MembershipsService,
    UsersService,
    CacheSystemService,
    JwtStrategy,
    GoogleService,
  ],
  imports: [
    MembershipsModule,
    UsersModule,
    JwtModule.register({
      secret: process.env.JWT_SECRET!,
      signOptions: { expiresIn: "5h" },
    }),
  ],
})
export class AuthModule {}
