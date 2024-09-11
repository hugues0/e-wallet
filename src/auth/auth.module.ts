import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { JwtModule } from '@nestjs/jwt';
import { JwtStrategy } from './strategies';
import { BullModule } from '@nestjs/bullmq';
import { EmailsProcessor } from 'src/processors/emails-queue.processor';
import { MailService } from 'src/mail/mail.service';

@Module({
  imports: [
    JwtModule.register({}),
    BullModule.registerQueue({
      name: 'emails',
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService, JwtStrategy, EmailsProcessor, MailService],
})
export class AuthModule {}
