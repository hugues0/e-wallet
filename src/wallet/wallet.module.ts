import { Module } from '@nestjs/common';
import { WalletService } from './wallet.service';
import { WalletController } from './wallet.controller';
import { MailService } from 'src/mail/mail.service';
import { GeneratePdfService } from 'src/helpers/generate-pdf/generate-pdf.service';

@Module({
  controllers: [WalletController],
  providers: [WalletService, MailService, GeneratePdfService],
})
export class WalletModule {}
