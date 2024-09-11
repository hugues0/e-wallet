import { Injectable } from '@nestjs/common';
import * as sgMail from '@sendgrid/mail';

type MailData = {
  to: string;
  templateId: string;
  firstName: string;
  dynamicData: unknown;
};
@Injectable()
export class MailService {
  constructor() {
    sgMail.setApiKey(process.env.SENDGRID_API_KEY);
  }
  async sendMail(mailData: MailData) {
    const { to, templateId } = mailData;
    const dynamic_template_data = mailData.dynamicData;
    const msg = {
      to,
      from: process.env.SENDER_EMAIL,
      templateId,
      dynamic_template_data,
    };
    try {
      await sgMail.send(msg);
    } catch (error) {
      console.log(error.message);
    }
  }
}
