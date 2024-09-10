import { UnauthorizedException } from '@nestjs/common';
import * as jwt from 'jsonwebtoken';

export const tokenValidator = async (
  token: string,
  secret: string = process.env.JWT_SECRET,
) => {
  try {
    const validated = jwt.verify(token, secret);
    return validated;
  } catch (error) {
    throw new UnauthorizedException('Invalid Link or link has expired');
  }
};

export const tokenExtractor = async (token: string) => {
  try {
    const user = jwt.decode(token, {
      json: true,
    });
    return user;
  } catch (error) {}
};
