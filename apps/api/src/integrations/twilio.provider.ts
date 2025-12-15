import { Injectable, Logger } from '@nestjs/common';

export interface SmsProvider {
  sendSms(to: string, message: string): Promise<void>;
}

@Injectable()
export class TwilioProvider implements SmsProvider {
  private readonly logger = new Logger(TwilioProvider.name);
  private readonly sid = process.env.TWILIO_ACCOUNT_SID;
  private readonly token = process.env.TWILIO_AUTH_TOKEN;
  private readonly from = process.env.TWILIO_FROM;

  async sendSms(to: string, message: string): Promise<void> {
    if (!this.sid || !this.token || !this.from || process.env.TWILIO_DISABLED === 'true') {
      this.logger.warn(`TWILIO disabled or missing credentials; mock send to ${to}: ${message}`);
      return;
    }

    // Lazy import to avoid dependency issues when not configured
    const twilio = (await import('twilio')).default;
    const client = twilio(this.sid, this.token);
    await client.messages.create({
      body: message,
      from: this.from!,
      to,
    });
  }
}
