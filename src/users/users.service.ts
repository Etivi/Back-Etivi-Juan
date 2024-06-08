import { Injectable } from "@nestjs/common"
import { PrismaService } from "nestjs-prisma"
import _getUserData from "./lib/_getUserData"
import * as bcrypt from "bcrypt"
import { MembershipsService } from "../memberships/memberships.service"
import { LoginUserOkSchema } from "src/users/lib/_getUserData"
import { z } from "nestjs-zod/z"
import { Prisma } from "@prisma/client"

@Injectable()
export class UsersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly membershipService: MembershipsService,
  ) {}

  async getUserByID(
    id: string,
    include?: Prisma.UserFindUniqueArgsBase["include"],
  ) {
    try {
      return await this.prisma.user.findUnique({ where: { id }, include })
    } catch (e) {
      return null
    }
  }
  async createUser(
    user: z.infer<typeof LoginUserOkSchema>["userData"],
    pass: string,
  ) {
    try {
      const encryptedPass = await UsersService._encryptPass(pass)
      const userData = await this.prisma.user.create({
        data: {
          id: `${user.databaseId}`,
          email: user.email,
          password: encryptedPass,
          variables: {},
          contactVariables: {},
        },
      })
      return userData
    } catch (e) {
      return null
    }
  }
  async updateUser(userID: string, data: any) {
    try {
      return await this.prisma.user.update({
        where: {
          id: userID,
        },
        data,
      })
    } catch (e) {
      return null
    }
  }
  static async _encryptPass(password: string) {
    const encryptedPass = await bcrypt.hash(password, 10)

    return encryptedPass
  }
  async _comparePass(pass: string, originalPassword: string) {
    const isMatch = await bcrypt.compare(pass, originalPassword)
    return isMatch
  }
  async getUserDataWP(id: string) {
    try {
      const membershipPromise = this.membershipService.getUserMembershipByID(id)
      const userDataPromise = _getUserData(id)
      
      const [membership, userData] = await Promise.all([
        membershipPromise,
        userDataPromise,
      ])
      if (!userData) return null
      return { membership: membership || [], userData }
    } catch (e) {
      console.log({e})
      return null
    }
  }
  async getUserConnections(id: string) {
    try {
      const user = await this.prisma.user.findUnique({
        where: {
          id,
        },
        include: {
          connections: true,
        },
      })
      return user?.connections || null
    } catch (e) {
      return null
    }
  }
}
