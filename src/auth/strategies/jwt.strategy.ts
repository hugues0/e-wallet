import { ExtractJwt, Strategy } from 'passport-jwt';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from 'src/prisma/prisma.service';
import { JWT_SECRET } from 'src/common/constants';
import { UserStatus } from '@prisma/client';
import { JwtPayload } from 'src/common/interfaces';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
  constructor(
    config: ConfigService,
    private prisma: PrismaService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      secretOrKey: config.get(JWT_SECRET),
    });
  }
  async validate(payload: JwtPayload) {
    const user: JwtPayload = (await this.prisma.user.findFirst({
      where: {
        id: payload?.id,
        isEmailVerified: true,
        status: UserStatus.ACTIVE,
      },
    })) as JwtPayload;
    return user;
  }
}
