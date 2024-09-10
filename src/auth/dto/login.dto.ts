import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsString } from 'class-validator';

export class SigninDto {
  @IsString()
  @IsNotEmpty()
  @IsEmail()
  @ApiProperty({
    type: 'string',
    default: 'hntwari2@yopmail.com',
    required: true,
  })
  email: string;

  @IsString()
  @IsNotEmpty()
  @ApiProperty({
    type: 'string',
    default: 'password',
    required: true,
  })
  password: string;
}
