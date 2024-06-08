import { createParamDecorator, ExecutionContext } from "@nestjs/common"
import { JWTPayload } from 'src/auth/strategies/at.strategy';

export const GetCurrentUser = createParamDecorator(
  (data: undefined | keyof JWTPayload, ctx: ExecutionContext): number => {
    const request = ctx.switchToHttp().getRequest()

    if (data) return request.user[data]
    return request.user
  },
)
