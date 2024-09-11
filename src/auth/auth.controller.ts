import {
  Controller,
  Post,
  Body,
  Patch,
  Param,
  HttpCode,
  HttpStatus,
  Query,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { CreateAuthDto } from './dto/create-auth.dto';
import { ApiTags } from '@nestjs/swagger';
import { SigninDto } from './dto/login.dto';
import { SkipThrottle } from '@nestjs/throttler';

@ApiTags('Authentication')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @HttpCode(HttpStatus.CREATED)
  @SkipThrottle()
  @Post('signup')
  create(@Body() createAuthDto: CreateAuthDto) {
    return this.authService.signUp(createAuthDto);
  }

  @HttpCode(HttpStatus.OK)
  @Post('signin')
  signin(@Body() dto: SigninDto) {
    return this.authService.login(dto);
  }

  @HttpCode(HttpStatus.OK)
  @Patch('verify/:email')
  verify(@Param('email') email: string, @Query('token') token: string) {
    return this.authService.verify(email, token);
  }

  @HttpCode(HttpStatus.OK)
  @Post('forgot-password/:email')
  forgotPassword(@Param('email') email: string) {
    return this.authService.forgotPassword(email);
  }

  @HttpCode(HttpStatus.OK)
  @Patch('reset-password/:token')
  resetPassword(@Body() dto: SigninDto, @Param('token') token: string) {
    return this.authService.resetPassword(dto, token);
  }
}
