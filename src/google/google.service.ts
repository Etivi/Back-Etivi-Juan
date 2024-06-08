import { Injectable, UnauthorizedException } from "@nestjs/common"
import { ConnectionType } from "@prisma/client"
import { OAuth2Client, TokenInfo } from "google-auth-library"
import { google } from "googleapis"
import { PrismaService } from "nestjs-prisma"
import { UsersService } from "../users/users.service"
import { AuthService } from "src/auth/auth.service"

@Injectable()
export class GoogleService {
  constructor (
    private readonly prisma: PrismaService,
    private readonly auth: AuthService,
    private readonly usersService: UsersService,
  ) {}
  public static async getGoogleAuth (token: string, isCode = false) {
    try {
      const oauth2Client = new google.auth.OAuth2(
        process.env.GOOGLE_CLIENT_ID,
        process.env.GOOGLE_CLIENT_SECRET,
      )
      if (isCode) {
        // retrieve an access token & refresh token
        const { tokens } = await oauth2Client.getToken(token)
        // validate if token is valid
        oauth2Client.setCredentials(tokens)
      } else {
        // validate if token is valid
        oauth2Client.setCredentials({ access_token: token })
      }
      return oauth2Client
    } catch (e) {
      throw new UnauthorizedException("Invalid Google token")
    }
  }
  async loginWithGoogleAuth (code: string) {
    const oauth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      process.env.GOOGLE_REDIRECT_URI,
    )
    const { tokens } = await oauth2Client.getToken(code)
    oauth2Client.setCredentials(tokens)

    const data = await oauth2Client.getTokenInfo(tokens.access_token!)

    return { data }
  }
  async WPLoginWithGoogleAuth (email: string) {
    let userID: string | null = ""
    const foundUser = await this.prisma.user.findUnique({
      where: {
        email,
      },
    })
    if (foundUser) userID = foundUser.id
    if (!userID) userID = await this.auth.getUserID(email)
    if (!userID) throw new UnauthorizedException("Credenciales Inválidas")

    const userData = await this.usersService.getUserDataWP(userID)

    if (!userData) throw new UnauthorizedException("Credenciales Inválidas")
    if (!foundUser) await this.usersService.createUser(userData.userData, "")

    const access_token = await this.auth.generateToken(userData.userData.ID)
    const response = {
      user: userData,
      access_token,
    }
    return response
  }
  async getGoogleAuthWithCode (code: string) {
    const oauth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      process.env.GOOGLE_REDIRECT_URI,
    )
    const { tokens } = await oauth2Client.getToken(code)

    oauth2Client.setCredentials(tokens)
    return oauth2Client
  }
  async getGoogleAuthFromDB (userID: string) {
    try {
      const user = await this.prisma.user.findUnique({
        where: { id: userID },
      })
      if (!user) return null
      const connection = await this.prisma.connection.findFirst({
        where: {
          user: {
            id: user.id,
          },
          type: ConnectionType.GOOGLE,
        },
      })
      if (!connection) return null
      // check if token is valid
      const authClient = await GoogleService.getGoogleAuth(connection.access_token)
      authClient.setCredentials({
        access_token: connection.access_token,
        refresh_token: connection.refresh_token,
      })

      let tokenInfo: TokenInfo | null = null
      try {
        tokenInfo = await authClient.getTokenInfo(
          authClient.credentials.access_token!,
        )
      } catch (e) {

        try {
          // refresh token
          const token = await authClient.refreshAccessToken()
          authClient.setCredentials(token.credentials)
          tokenInfo = await authClient.getTokenInfo(
            authClient.credentials.access_token!,
          )
        } catch (e) {
          throw new UnauthorizedException("Venció tu Sesión de Google")
        }
      }
      return { authClient, tokenInfo }
    } catch (e) {
      return null
    }
  }
  async connect (userID: string, token: string) {
    try {
      const authClient = await this.getGoogleAuthWithCode(token)

      const tokenInfo = await authClient.getTokenInfo(
        authClient.credentials.access_token!,
      )
      if (
        !(
          authClient.credentials?.refresh_token &&
          authClient.credentials?.access_token
        )
      ) {

        return null
      }
      await this.prisma.connection.deleteMany({
        where: {
          user: {
            id: userID,
          },
          type: ConnectionType.GOOGLE,
        },
      })
      const connection = await this.prisma.user.update({
        where: { id: userID },
        data: {
          connections: {
            create: {
              type: ConnectionType.GOOGLE,
              access_token: authClient.credentials.access_token,
              refresh_token: authClient.credentials.refresh_token,
              email: tokenInfo.email || "",
            },
          },
        },
      })

      return { tokenInfo, user: connection }
    } catch (e) {
      return null
    }
  }
  async disconnect(userID: string) {
    try {
      await this.prisma.connection.deleteMany({
        where: {
          user: {
            id: userID,
          },
          type: ConnectionType.GOOGLE,
        },
      })
      return true
    } catch (e) {
      return false
    }
  }
  async getClient ({
    googleToken,
    userID,
  }: {
    googleToken?: string
    userID?: string
  }) {
    let auth: OAuth2Client | undefined

    if (!(googleToken || userID)) return null

    if (googleToken) {
      auth = await GoogleService.getGoogleAuth(googleToken)
    } else if (userID) {
      auth = (await this.getGoogleAuthFromDB(userID))?.authClient
    }
    return auth
  }
}
