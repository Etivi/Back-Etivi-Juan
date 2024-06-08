import { Controller, Get, Body } from "@nestjs/common"

import { GoogleService } from "./google.service"
import { Delete, Post } from "@nestjs/common/decorators"
import { GoogleConnectDto } from "./dto"
import { UnauthorizedException } from "@nestjs/common"
import { ApiProperty, ApiTags } from "@nestjs/swagger"
import { Private } from "src/common/decorators/private.decorator"
import { GetCurrentUserID } from "src/common/decorators/get-current-user-id.decorator"
import { GetGoogleAuthClient } from "src/common/decorators/google/get-auth-client.decorator"
import { GoogleAuthWithTokenInfo } from "./types/google-auth.type"

@ApiTags("Google")
@Controller("google")
export class GoogleController {
  constructor(private readonly googleService: GoogleService) {}

  @Post("/connect")
  @Private()
  @ApiProperty({
    description: `Google Login which connects user's account
    
    It basically stores Google Access Token & Refresh Token on user table
    `,
  })
  async connect(
    @GetCurrentUserID() userID: string,
    @Body() body: GoogleConnectDto,
  ) {
    const token = body.google_token
    const connection = await this.googleService.connect(userID, token)
    try {
      return { connection }
    } catch (e) {
      throw new UnauthorizedException("Invalid Google token")
    }
  }
  @Delete("/disconnect")
  @Private()
  async disconnect(
    @GetCurrentUserID() userID: string
  ) {
    try {
      const isDisconnected = await this.googleService.disconnect(userID)
      return { status:isDisconnected }
    } catch (e) {
      throw new UnauthorizedException("Invalid Google token")
    }
  }

  @Get("/")
  @Private()
  async googleConnection(
    @GetGoogleAuthClient({
      includeTokenInfo: true,
    })
    googleAuthClient: GoogleAuthWithTokenInfo,
  ) {
    if (!googleAuthClient)
      throw new UnauthorizedException("No Google connection")
    return { tokenInfo: googleAuthClient.tokenInfo }
  }
}
