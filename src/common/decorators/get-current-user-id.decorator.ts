import { createParamDecorator, ExecutionContext } from "@nestjs/common"

export const GetCurrentUserID = createParamDecorator(
  (data: undefined, ctx: ExecutionContext): number => {
    const request = ctx.switchToHttp().getRequest()
     

    return request.user["sub"]
  },
)
