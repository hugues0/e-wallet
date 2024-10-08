import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export const LoggedInUser = createParamDecorator(
  (key: string | undefined, ctx: ExecutionContext) => {
    const request: Express.Request = ctx.switchToHttp().getRequest();
    if (key) {
      return request.user[key];
    }
    return request.user;
  },
);
