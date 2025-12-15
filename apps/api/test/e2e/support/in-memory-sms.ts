import { SmsProvider } from '../../../src/integrations/twilio.provider';

export class InMemorySmsProvider implements SmsProvider {
  messages: { to: string; message: string }[] = [];
  async sendSms(to: string, message: string) {
    this.messages.push({ to, message });
  }
  lastCodeFor(to: string): string | undefined {
    const last = [...this.messages].reverse().find(m => m.to === to)?.message;
    if (!last) return undefined;
    const match = last.match(/(\d{4,8})/);
    return match?.[1];
  }
}
