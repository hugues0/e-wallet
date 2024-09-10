import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { CreateAuthDto } from './dto/create-auth.dto';
import { UpdateAuthDto } from './dto/update-auth.dto';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from 'src/prisma/prisma.service';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { SigninDto } from './dto/login.dto';
import { JwtPayload } from 'src/common/interfaces';
import { JWT_SECRET } from 'src/common/constants';
import { tokenValidator } from 'src/common/utils';
import * as _ from 'lodash';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwt: JwtService,
    private config: ConfigService,
  ) {}

  async signUp(signupDto: CreateAuthDto) {
    const { firstName, lastName, email, nationalIdNo, dateOfBirth } = signupDto;
    const existingUser = await this.prisma.user.findFirst({
      where: {
        OR: [{ nationalIdNo }, { email }],
      },
    });

    if (existingUser) {
      throw new ConflictException(
        'User with provided email or NID has already been registered',
      );
    }

    const salt = await bcrypt.genSalt();
    const password = await bcrypt.hash(signupDto.password, salt);

    const user = await this.prisma.user.create({
      data: {
        firstName,
        lastName,
        email,
        nationalIdNo,
        password,
        dateOfBirth,
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        status: true,
        email: true,
      },
    });

    return {
      message: `User created, a verification email has been sent to ${user.email}`,
      data: user,
    };
  }

  async login(signInDto: SigninDto) {
    const user = await this.prisma.user.findUnique({
      where: {
        email: signInDto.email,
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        nationalIdNo: true,
        dateOfBirth: true,
        email: true,
        password: true,
        isEmailVerified: true,
        status: true,
      },
    });
    if (!user) {
      throw new UnauthorizedException('Invalid email or password');
    }
    const hashMatch = await bcrypt.compare(signInDto.password, user.password);
    if (!hashMatch) {
      throw new UnauthorizedException('Invalid email or password');
    }
    if (hashMatch && !user.isEmailVerified) {
      throw new UnauthorizedException('Please verify your email');
    }

    const tokenData = _.omit(user, ['password']);

    const token = await this.generateToken(tokenData);

    return {
      message: 'You are successfully logged in',
      data: {
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        token,
      },
    };
  }

  async verify(email: string, token: string) {
    const userByEmail = await this.prisma.user.findFirst({
      where: {
        email,
      },
    });

    if (!userByEmail) {
      throw new NotFoundException(`User with email: ${email} was not found`);
    }

    if (userByEmail.isEmailVerified) {
      throw new BadRequestException('You email has already been verified');
    }
    await tokenValidator(token, userByEmail.password);

    const user = await this.prisma.user.update({
      data: {
        isEmailVerified: true,
      },
      where: {
        email,
      },
    });

    return {
      message: `Email successfully verified`,
      data: {
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
      },
    };
  }

  async generateToken(
    payload: JwtPayload,
    secret: string = this.config.get(JWT_SECRET),
  ): Promise<string> {
    return await this.jwt.signAsync(payload, {
      expiresIn: '2d',
      privateKey: secret,
    });
  }
}
