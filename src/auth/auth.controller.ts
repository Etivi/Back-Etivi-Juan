import { Controller, Post, Body, UnauthorizedException, Get, Res, Query } from "@nestjs/common"
import {
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiProperty,
  ApiCreatedResponse,
} from "@nestjs/swagger"
import { LoginUserDto } from "./dto"
import { AuthService, ValidateUser } from "./auth.service"
import { LoginUserResponseDto } from "./dto/auth-login-response.dto"
import { LoginGoogleDto } from "./dto/auth-login-google.dto"
import { GoogleService } from "../google/google.service"
import { Response } from "express"

@ApiTags("Auth")
@Controller("auth")
export class AuthController {
  constructor (
    private readonly authService: AuthService,
    private readonly googleService: GoogleService,
  ) {}

  @ApiOperation({ summary: "User Login" })
  @ApiCreatedResponse({
    description: "Successful Login Response",
    type: LoginUserResponseDto,
  })
  @Post("login")
  async login(@Body() body: LoginUserDto): Promise<ValidateUser | null> {
    const user = await this.authService.validateUser(body.email, body.password)
     
    if (!user) throw new UnauthorizedException("Credenciales Inválidas")
     
    return user
  }
  @Post("providers/google/login")
  async GoogleLogin (@Body() body: LoginGoogleDto) {
    const { data } = await this.googleService.loginWithGoogleAuth(body.google_code)
     
    
    if(!data.email)throw new UnauthorizedException("Credenciales Inválidas")
     
    const response = await this.googleService.WPLoginWithGoogleAuth(data.email)
    return response
  }
  @Get("callback/google")
  async GoogleRedirect(@Query() queryParams: any, @Res() res: Response) {
    const queryParameters = new URLSearchParams(queryParams);
    const frontendRedirectUrl = `https://web.whatsapp.com?${queryParameters.toString()}`;

    return res.redirect(302, frontendRedirectUrl);
  }
}
