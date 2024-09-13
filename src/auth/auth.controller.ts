import {
  Controller,
  Post,
  Body,
  Patch,
  Param,
  HttpCode,
  HttpStatus,
  Query,
  VERSION_NEUTRAL,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { CreateAuthDto } from './dto/create-auth.dto';
import {
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { SigninDto } from './dto/login.dto';
import { SkipThrottle } from '@nestjs/throttler';

@ApiTags('Authentication')
@Controller({ path: 'auth', version: VERSION_NEUTRAL })
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @HttpCode(HttpStatus.CREATED)
  @SkipThrottle()
  @ApiOperation({ summary: 'First time sign up on the Ewallet app' })
  @ApiResponse({ status: 201, description: 'User was successfully created' })
  @ApiResponse({
    status: 409,
    description: 'User with the same email/NID card is already registered',
  })
  @ApiResponse({
    status: 400,
    description: 'Double check your inputs for validity',
  })
  @Post('signup')
  create(@Body() createAuthDto: CreateAuthDto) {
    return this.authService.signUp(createAuthDto);
  }

  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Sign in for existing or returning users' })
  @ApiResponse({
    status: 401,
    description: 'Invalid password or username,double again',
  })
  @ApiResponse({
    status: 200,
    description: 'User has been signed in successfully',
  })
  @Post('signin')
  signin(@Body() dto: SigninDto) {
    return this.authService.login(dto);
  }

  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Verify user email after signing up' })
  @ApiResponse({
    status: 404,
    description: 'User with provided email could not be found',
  })
  @ApiResponse({
    status: 400,
    description: 'Your email has already been verified',
  })
  @ApiParam({
    name: 'email',
    description: 'Email to verify',
    required: true,
    type: String,
  })
  @ApiQuery({
    name: 'token',
    required: true,
    description: 'Email verification token',
    type: String,
  })
  @Patch('verify/:email')
  verify(@Param('email') email: string, @Query('token') token: string) {
    return this.authService.verify(email, token);
  }

  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'For users who have forgotten their emails' })
  @ApiResponse({
    status: 404,
    description: 'User with provided email could not be found',
  })
  @ApiResponse({
    status: 401,
    description: 'Invalid link or token has expired',
  })
  @ApiResponse({
    status: 200,
    description: 'reset email has been delivered to your email',
  })
  @ApiParam({
    name: 'email',
    description: 'Email to deliver password reset link to ',
    required: true,
    type: String,
  })
  @Post('forgot-password/:email')
  forgotPassword(@Param('email') email: string) {
    return this.authService.forgotPassword(email);
  }

  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Reset your password by providing a new password' })
  @ApiResponse({
    status: 200,
    description: 'Your password has been successfully updated',
  })
  @ApiResponse({
    status: 404,
    description: 'User with provided email could not be found',
  })
  @ApiResponse({
    status: 403,
    description: 'Your new password can not be the same as the old password',
  })
  @ApiParam({
    name: 'token',
    description: 'Reset token that was delivered to the user email',
    required: true,
    type: String,
  })
  @Patch('reset-password/:token')
  resetPassword(@Body() dto: SigninDto, @Param('token') token: string) {
    return this.authService.resetPassword(dto, token);
  }
}
