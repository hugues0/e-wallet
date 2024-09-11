import { Injectable } from '@nestjs/common';
import * as bcrypt from 'bcryptjs';

@Injectable()
export class OneTimePassCodeService {
  async generateOtp(): Promise<{
    otpExpiresAt: Date;
    otp: number;
    hashedOtp: string;
  }> {
    const randomNbr = Math.floor(100000 + Math.random() * 900000);
    const otpExpiresAt = new Date();
    otpExpiresAt.setMinutes(otpExpiresAt.getMinutes() + 5);
    const salt = await bcrypt.genSalt();
    const hashedOtp = await bcrypt.hash(`${randomNbr}`, salt);
    return {
      otpExpiresAt,
      otp: randomNbr,
      hashedOtp,
    };
  }
}
