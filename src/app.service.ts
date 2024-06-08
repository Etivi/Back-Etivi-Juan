import { Injectable } from "@nestjs/common"
import { PrismaService } from "nestjs-prisma"

@Injectable()
export class AppService {
  constructor(private prisma: PrismaService) {}
  async getHello(): Promise<string> {
    /*     const res = await this.prisma.user.findFirst()
     */
    return "Hello World!"
  }
}
