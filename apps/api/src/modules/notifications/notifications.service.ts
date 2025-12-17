import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { NotificationsQueueService } from './notifications.queue';

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);
  constructor(
    private prisma: PrismaService,
    private queue: NotificationsQueueService
  ) {}

  private normalizePhone(raw: string): string | null {
    if (!raw) return null;
    const def = process.env.DEFAULT_COUNTRY_CODE || '+55';
    const digits = raw.replace(/[^0-9+]/g, '');
    if (digits.startsWith('+')) return digits;
    if (digits.startsWith('00')) return `+${digits.slice(2)}`;
    // assume local number; prepend default country code
    return `${def}${digits}`;
  }

  async scheduleAppointmentReminder(appointmentId: string) {
    const appt = await this.prisma.appointment.findUnique({
      where: { id: appointmentId },
      include: { customer: true },
    });

    if (!appt) throw new Error('Appointment not found');
    const normalized = appt.customer?.phone ? this.normalizePhone(appt.customer.phone) : null;
    if (!normalized) {
      this.logger.warn(`Customer ${appt.customerId} has no phone; skipping reminder`);
      return null;
    }

    // Tenant config for reminder window
    const cfg = await this.prisma.tenantConfig.findUnique({ where: { tenantId: appt.tenantId } });
    const hoursBefore = cfg?.reminderHoursBefore ?? 24;
    const enabled = cfg?.reminderEnabled ?? true;
    if (!enabled) {
      this.logger.log(`Tenant ${appt.tenantId} reminders disabled; skipping.`);
      return null;
    }

    const remindAt = new Date(appt.startsAt.getTime() - hoursBefore * 60 * 60 * 1000);
    const delayMs = remindAt.getTime() - Date.now();

    const message = `Lembrete: atendimento para ${appt.customer.name} em ${appt.startsAt.toLocaleString()}. Responda se precisar reagendar.`;

    const notif = await this.prisma.notificationJob.create({
      data: {
        tenantId: appt.tenantId,
        appointmentId: appt.id,
        type: 'SMS',
        status: 'SCHEDULED',
        payload: {
          to: normalized,
          message,
        },
      },
    });

    const jobId = await this.queue.enqueueSms({
      tenantId: appt.tenantId,
      to: normalized,
      message,
      delayMs,
      appointmentId: appt.id,
      notificationJobId: notif.id,
    });

    await this.prisma.notificationJob.update({
      where: { id: notif.id },
      data: { queueJobId: String(jobId) },
    });

    this.logger.log(`Scheduled SMS reminder job ${jobId} for appointment ${appt.id}`);
    return { notificationJobId: notif.id, jobId };
  }

  async cancelAppointmentReminders(appointmentId: string) {
    const jobs = await this.prisma.notificationJob.findMany({
      where: { appointmentId, status: 'SCHEDULED' },
    });

    for (const j of jobs) {
      if (j.queueJobId) {
        try {
          await this.queue.removeJob(j.queueJobId);
        } catch (e) {
          this.logger.warn(`Failed to remove queue job ${j.queueJobId}: ${e}`);
        }
      }
    }

    if (jobs.length) {
      await this.prisma.notificationJob.updateMany({
        where: { appointmentId, status: 'SCHEDULED' },
        data: { status: 'CANCELLED' },
      });
    }

    return { cancelled: jobs.length };
  }

  async rescheduleAppointmentReminder(appointmentId: string) {
    await this.cancelAppointmentReminders(appointmentId);
    return this.scheduleAppointmentReminder(appointmentId);
  }

  async markNotificationStatus(
    notificationJobId: string,
    status: 'SENT' | 'ERROR',
    providerMessageId?: string,
    errorMessage?: string
  ) {
    const data: any = { status };
    if (status === 'SENT') data.sentAt = new Date();
    if (providerMessageId) data.providerMessageId = providerMessageId;
    if (errorMessage) data.errorMessage = errorMessage;

    await this.prisma.notificationJob.update({
      where: { id: notificationJobId },
      data,
    });

    return { ok: true };
  }
}
