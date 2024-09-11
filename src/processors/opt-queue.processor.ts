import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { MailService } from 'src/mail/mail.service';

@Processor('otp')
export class OtpProcessor extends WorkerHost {
  constructor(private emailService: MailService) {
    super();
  }
  async process(job: Job<any, any, string>): Promise<any> {
    this.emailService.sendMail(job.data);
  }
  onActive(job: Job) {
    console.log(`Processing job ${job.id}: ${job.name} ...`);
  }
}
