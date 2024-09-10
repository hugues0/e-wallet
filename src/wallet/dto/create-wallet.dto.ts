import { ApiProperty } from '@nestjs/swagger';
import { Currency } from '@prisma/client';
import { IsEnum, IsString } from 'class-validator';

export class CreateWalletDto {
  @IsString()
  @IsEnum(Currency)
  @ApiProperty({
    type: 'string',
    default: Currency.USD,
    required: true,
  })
  currency: Currency;
}
