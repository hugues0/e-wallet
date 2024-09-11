import { Module } from '@nestjs/common';
import { OneTimePassCodeService } from './one-time-pass-code.service';

@Module({
  providers: [OneTimePassCodeService],
  exports: [OneTimePassCodeService],
})
export class OneTimePassCodeModule {}
