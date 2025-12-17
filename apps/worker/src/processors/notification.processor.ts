import { Job } from 'bullmq';
import twilio from 'twilio';

export interface NotificationJobData {
  type: 'SMS' | 'EMAIL' | 'WHATSAPP';
  to: string;
  message: string;
  appointmentId?: string;
  tenantId: string;
  notificationJobId?: string;
}

export async function processNotificationJob(job: Job<NotificationJobData>): Promise<void> {
  console.log(`[NOTIFICATION] Processing job ${job.id}`, job.data);

  const { type, to, message, appointmentId, tenantId, notificationJobId } = job.data;

  try {
    if (type === 'SMS') {
      const accountSid = process.env.TWILIO_ACCOUNT_SID;
      const authToken = process.env.TWILIO_AUTH_TOKEN;
      const from = process.env.TWILIO_FROM; // e.g., "+1XXXXXXXXXX"
      if (!accountSid || !authToken || !from) {
        throw new Error('Twilio not configured: TWILIO_ACCOUNT_SID/AUTH_TOKEN/FROM');
      }

      const client = twilio(accountSid, authToken);
      const result = await client.messages.create({ from, to, body: message });
      console.log(`[NOTIFICATION] SMS sent to ${to} with sid ${result.sid}`);

      // Callback para API marcar como SENT
      if (notificationJobId) {
        const apiUrl = process.env.API_BASE_URL || 'http://localhost:3000';
        await fetch(`${apiUrl}/integrations/notifications/internal/mark/${notificationJobId}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status: 'SENT', providerMessageId: result.sid }),
        });
      }
    } else if (type === 'EMAIL') {
      // TODO: implementar envio de email
      console.log(`[NOTIFICATION] Send EMAIL to ${to}`);
      await new Promise((resolve) => setTimeout(resolve, 100));
    } else if (type === 'WHATSAPP') {
      const accountSid = process.env.TWILIO_ACCOUNT_SID;
      const authToken = process.env.TWILIO_AUTH_TOKEN;
      const from = process.env.TWILIO_WHATSAPP_FROM; // e.g., "whatsapp:+14155238886"
      if (!accountSid || !authToken || !from) {
        throw new Error('Twilio WhatsApp not configured: TWILIO_ACCOUNT_SID/AUTH_TOKEN/WHATSAPP_FROM');
      }
      const client = twilio(accountSid, authToken);
      const result = await client.messages.create({ from, to: to.startsWith('whatsapp:') ? to : `whatsapp:${to}`, body: message });
      console.log(`[NOTIFICATION] WhatsApp sent to ${to} with sid ${result.sid}`);
      if (notificationJobId) {
        const apiUrl = process.env.API_BASE_URL || 'http://localhost:3000';
        await fetch(`${apiUrl}/integrations/notifications/internal/mark/${notificationJobId}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status: 'SENT', providerMessageId: result.sid }),
        });
      }
    }

    console.log(`[NOTIFICATION] Job ${job.id} completed for tenant ${tenantId}`);
  } catch (error) {
    console.error(`[NOTIFICATION] Job ${job.id} failed:`, error);
    // Callback para marcar como ERROR
    if (job.data.notificationJobId) {
      try {
        const apiUrl = process.env.API_BASE_URL || 'http://localhost:3000';
        await fetch(`${apiUrl}/integrations/notifications/internal/mark/${job.data.notificationJobId}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status: 'ERROR', errorMessage: `${error}` }),
        });
      } catch (callbackErr) {
        console.error('Failed to callback API for notification error:', callbackErr);
      }
    }
    throw error;
  }
}
