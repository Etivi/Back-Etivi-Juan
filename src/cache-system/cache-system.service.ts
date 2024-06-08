import { Inject, Injectable, CACHE_MANAGER } from "@nestjs/common"
import { Cache, CachingConfig } from "cache-manager"
import { Json } from "nestjs-zod/z"
import { Prisma, PrismaClient, User } from "@prisma/client"
import { PrismaService } from "nestjs-prisma"
@Injectable()
export class CacheSystemService {
  constructor (
    @Inject(CACHE_MANAGER) private readonly cacheManager: Cache,
    private readonly prisma: PrismaService,
  ) {}

  async get (key: string) {
    return this.cacheManager.get(key)
  }
  // rome-ignore lint/suspicious/noExplicitAny: <explanation>
  async set (key: string, value: any, options?: CachingConfig) {
    return this.cacheManager.set(key, value, options)
  }
  // refetchs collection and resets cache value
  async refetchCollection<T> (
    model: Uncapitalize<Prisma.ModelName>,
    storeKey: string,
    options?: CachingConfig,
  ) {
    try {
      const data = (await this.prisma[
        model as keyof typeof PrismaClient
      ].findMany({})) as T[]

      await this.set(storeKey, data, options)
      return data
    } catch (error) {
      return null
    }
  }
}
