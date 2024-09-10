import { Injectable } from '@nestjs/common';
import { Queue } from 'bullmq';
import { InjectQueue } from '@nestjs/bullmq';

@Injectable()
export class MailService {
  constructor(@InjectQueue('emails') private emailsqueue: Queue) {}
}
