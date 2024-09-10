import { Module } from '@nestjs/common';
import { MailService } from './mail.service';
import { BullBoardModule } from '@bull-board/nestjs';
import { BullMQAdapter } from '@bull-board/api/bullMQAdapter';
import { BullModule } from '@nestjs/bullmq';

@Module({
  imports: [
    BullModule.registerQueue({
      name: 'emails',
    }),
    BullBoardModule.forFeature({
      name: 'emails',
      adapter: BullMQAdapter,
    }),
  ],
  providers: [MailService],
})
export class MailModule {}
