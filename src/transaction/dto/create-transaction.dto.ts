import { ApiProperty } from '@nestjs/swagger';
import { Currency, TransactionType } from '@prisma/client';
import {
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsPositive,
  IsString,
} from 'class-validator';

export class CreateTransactionDto {
  @IsNumber()
  @IsPositive()
  @ApiProperty({
    type: 'number',
    required: true,
    minimum: 1,
    default: 1,
  })
  amount: number;

  @IsString()
  @IsEnum(Currency)
  @ApiProperty({
    type: 'string',
    default: Currency.USD,
    required: true,
  })
  currency: Currency;

  @IsString()
  @IsEnum(TransactionType)
  @IsNotEmpty()
  @ApiProperty({
    type: 'string',
    default: TransactionType.INTERWALLET,
    required: true,
  })
  type: TransactionType;

  @IsString()
  @IsNotEmpty()
  @ApiProperty({
    type: 'string',
    required: true,
  })
  senderWalletId: string;

  @IsString()
  @IsNotEmpty()
  @ApiProperty({
    type: 'string',
    required: true,
  })
  receiverWalletId: string;
}
