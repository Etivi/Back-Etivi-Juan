import { CacheModule, Module } from "@nestjs/common"
import { APP_PIPE } from "@nestjs/core"
import { PrismaModule } from "nestjs-prisma"
import { ZodValidationPipe } from "nestjs-zod"
import { AppService } from "./app.service"
import { ConfigModule } from "@nestjs/config"
import { AuthModule } from "./auth/auth.module"
import { GoogleModule } from "./google/google.module"
import { ExporterModule } from "./google/exporter/exporter.module"
import { UsersModule } from "./users/users.module"
import { MembershipsModule } from "./memberships/memberships.module"
import { HttpModule } from "@nestjs/axios"
import { CommonModule } from "./common/common.module"
import * as redisStore from "cache-manager-redis-store"
import { CacheSystemModule } from "./cache-system/cache-system.module"
import { VariablesModule } from "./users/variables/variables.module"
import { ProgrammingModule } from "./programming/programming.module"

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ".env",
    }),
    CacheModule.register({
      isGlobal: true,
      ttl: 60,
      store: redisStore,
      host: process.env.REDIS_HOST!,
      port: process.env.REDIS_PORT!,
    }),
    CacheSystemModule,
    HttpModule,
    PrismaModule.forRoot(),
    AuthModule,
    VariablesModule,
    GoogleModule,
    ExporterModule,
    UsersModule,
    MembershipsModule,
    CommonModule,
    VariablesModule,
    ProgrammingModule,
  ],
  controllers: [],
  providers: [
    AppService,
    {
      provide: APP_PIPE,
      useClass: ZodValidationPipe,
    },
  ],
})
export class AppModule {}
