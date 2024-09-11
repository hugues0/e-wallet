import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsNumber, Max, Min } from 'class-validator';

export class TransactionOtpDto {
  @IsNumber()
  @Min(100000, {
    message: 'OTP should be six digits',
  })
  @Max(999999, {
    message: 'OTP should be six digits',
  })
  @IsNotEmpty()
  @ApiProperty({
    type: 'number',
    required: true,
  })
  otp: number;
}
