import { ExtractJwt, Strategy } from "passport-jwt"
import { PassportStrategy } from "@nestjs/passport"
import { Injectable,ExecutionContext } from "@nestjs/common"

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor () {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: true,
      secretOrKey: process.env.JWT_SECRET!,
    })
    
  }

  async validate(payload: JWTPayload) {
    
    return payload
  }
}

export interface JWTPayload{
  sub: string,
  email: string,
  iat: number,
  exp: number
}