import { Job } from 'bullmq';

export interface NotificationJobData {
  type: 'SMS' | 'EMAIL' | 'WHATSAPP';
  to: string;
  message: string;
  appointmentId?: string;
  tenantId: string;
}

export async function processNotificationJob(job: Job<NotificationJobData>): Promise<void> {
  console.log(`[NOTIFICATION] Processing job ${job.id}`, job.data);

  const { type, to, message, appointmentId, tenantId } = job.data;

  try {
    if (type === 'SMS') {
      // TODO: implementar envio via Twilio
      console.log(`[NOTIFICATION] Send SMS to ${to}: ${message}`);
      await new Promise((resolve) => setTimeout(resolve, 100));
    } else if (type === 'EMAIL') {
      // TODO: implementar envio de email
      console.log(`[NOTIFICATION] Send EMAIL to ${to}`);
      await new Promise((resolve) => setTimeout(resolve, 100));
    } else if (type === 'WHATSAPP') {
      // TODO: implementar WhatsApp via Twilio
      console.log(`[NOTIFICATION] Send WhatsApp to ${to}`);
      await new Promise((resolve) => setTimeout(resolve, 100));
    }

    console.log(`[NOTIFICATION] Job ${job.id} completed for tenant ${tenantId}`);
  } catch (error) {
    console.error(`[NOTIFICATION] Job ${job.id} failed:`, error);
    throw error;
  }
}
