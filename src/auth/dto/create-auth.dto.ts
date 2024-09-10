import { ApiProperty } from '@nestjs/swagger';
import {
  IsEmail,
  IsNotEmpty,
  IsString,
  MinLength,
  IsDateString,
  Matches,
} from 'class-validator';

export class CreateAuthDto {
  @IsString()
  @IsNotEmpty()
  @ApiProperty({
    type: 'string',
    default: 'Hugues',
    required: true,
  })
  firstName: string;

  @IsString()
  @IsNotEmpty()
  @ApiProperty({
    type: 'string',
    default: 'Ntwari',
    required: true,
  })
  lastName: string;

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
  @Matches(/^\d{16}$/, {
    message: 'The national id number must be a string with exactly 16 digits.',
  })
  @ApiProperty({
    type: 'string',
    default: '11996xxxxxxxxx',
    required: true,
  })
  nationalIdNo: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(8)
  @ApiProperty({
    type: 'string',
    required: true,
    default: 'password',
  })
  password: string;

  @IsNotEmpty()
  @IsDateString()
  @ApiProperty({
    type: 'string',
    format: 'date',
    required: true,
    default: new Date('1996-01-01'),
  })
  dateOfBirth: Date;
}
