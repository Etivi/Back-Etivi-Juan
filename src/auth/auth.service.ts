import { Injectable, UnauthorizedException } from "@nestjs/common"
import { PrismaService } from "nestjs-prisma"
import { _getUserData, _getUserID, _loginUserWP } from "../users/lib"
import { UsersService } from "src/users/users.service"
import { JwtService } from "@nestjs/jwt"
import { LoginUserResponseDto } from "./dto/auth-login-response.dto"
import { z } from "nestjs-zod/z"
import { LoginUserOkSchema } from "../users/lib/_getUserData"
import AuthServiceInterface from "./interfaces/auth-service.interface"
import { Session, User } from "@prisma/client"
import { MembershipsService } from '../memberships/memberships.service';

export type ValidateUser = LoginUserResponseDto
type LoginUserWP = z.infer<typeof LoginUserOkSchema>

@Injectable()
export class AuthService extends AuthServiceInterface {
  constructor (
    private readonly prisma: PrismaService,
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
    private readonly membershipsService:MembershipsService
  ) {
    super()
  }

  async validateUser(
    email: string,
    pass: string,
  ): Promise<ValidateUser | null> {
    // get user & membership from wp
    const user = await this._loginUser(email, pass)
     
     
    if (!user) throw new UnauthorizedException("Credenciales Inválidas")
     
    // check if user already exists in db
    const foundUser = await this.usersService.getUserByID(user.userData.databaseId)
     
    
    if (!foundUser) await this.usersService.createUser(user.userData, pass)
     
     
    const access_token = await this.generateToken(`${user.userData.databaseId}`)
     
    if (!access_token) return null
     

    return { access_token, user }
  }

  async generateToken (id: string) {
    try {
      const user = await this.prisma.user.findUnique({
        where: {
          id,
        },
        include: {
          sessions: true,
        },
      })
      if (!user) return null
      
      const payload = { sub: id, email:user.email, savedContacts: user.savedContacts };
      const token = this.jwtService.sign(payload)
       
      // update token from user in db
      const session = await this.createSession({
        userID: id,
        token,
      })
      if(!session) return null
      return token
    } catch (e) {
      return null
    }
  }
  async createSession ({ userID, token }) {
    try {
       
      return await this.prisma.$transaction(async prismaClient => {
        const user = await prismaClient.user.findUnique({
          where: {
            id: userID,
          },
          include: {
            sessions: true,
          },
        })
        if (!user) return null
        let sessionLimit = await this.getSessionLimit(userID)
        const sessions = await this.prisma.session.findMany({
          where: {
            user_id: userID,
          },
        })
        
        // handle session limit exceeded (plan might have expired)
        if (sessions.length >= sessionLimit) {
          if (sessionLimit !== 1)  {
            sessionLimit--
          } else {
            sessionLimit = -(sessions.length)
          }
          const overSessions = sessions.slice(0, -sessionLimit)
           
          await this.prisma.session.deleteMany({
            where: {
              id: {
                in: overSessions.map(s => s.id),
              },
            },
          })
        }
        return await this.prisma.session.create({
          data: {
            token,
            user: {
              connect: {
                id: userID,
              },
            },
          },
        })
      }, {
        timeout:60000
      })
    } catch (e) {

      return null
    }
  }
  async getSessionLimit(userID: string) {
    const { features } = await this.membershipsService.getFeatures(userID)
     
    return features.sesiones_whatsapp || 1
  }
  async validateToken (token: string) {
    try {
      const session = await this.prisma.session.findFirst({
        where: {
          token: token,
        },
        include: {
          user: true,
        },
      })

      const userWithToken = session?.user

      if (!userWithToken) return null
      return userWithToken
    } catch (e) {
      return null
    }
  }
  private async _loginUser (
    email: string,
    password: string,
  ): Promise<LoginUserWP | null> {
    // check if user already exists in db
    const foundUser = await this.prisma.user.findUnique({
      where: {
        email,
      },
    })
    let userID: string | undefined
    
    if (foundUser) {
       
      // check if stored password is the same as the one provided
      const isValidPassword = await this.usersService._comparePass(
        password,
        foundUser.password,
        )
         
        if (isValidPassword) userID = foundUser.id
    }
     
     
    
    // if user doesn't exist in db, get user from wp
    if (!userID) {
       
      const userWP = await _loginUserWP(email, password)
       
      if (!userWP) return null
       
      const foundUserID = await this.getUserID(email)
      console.log({foundUserID})
      if (!foundUserID) return null
       
      userID = foundUserID
    }
     
     
    if(!userID) return null
    const data = await this.usersService.getUserDataWP(userID)
     console.log({data})
    if (!data) return null
     
    return data as unknown as LoginUserWP
  }
  async getUserID (email: string) {
    // checks if user already exists in db
    const user = await this.prisma.user.findUnique({
      where: {
        email,
      },
    })
     
    if (user) return user.id
    const userID = await _getUserID(email)
    console.log({userID})

    if (!userID) return null
    return userID
  }
  async LoginGQL() {
    
  }
}
