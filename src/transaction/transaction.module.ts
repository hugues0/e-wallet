import { Module } from '@nestjs/common';
import { TransactionService } from './transaction.service';
import { TransactionController } from './transaction.controller';
import { OneTimePassCodeService } from 'src/one-time-pass-code/one-time-pass-code.service';
import { BullModule } from '@nestjs/bullmq';
import { OtpProcessor } from 'src/processors/opt-queue.processor';
import { MailService } from 'src/mail/mail.service';

@Module({
  imports: [
    BullModule.registerQueue({
      name: 'otp',
    }),
  ],
  controllers: [TransactionController],
  providers: [
    TransactionService,
    OneTimePassCodeService,
    OtpProcessor,
    MailService,
  ],
})
export class TransactionModule {}
