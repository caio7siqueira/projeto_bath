import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { NotificationsQueueService } from './notifications.queue';
import { normalizePhone } from '@/common/phone.util';

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);
  constructor(
    private prisma: PrismaService,
    private queue: NotificationsQueueService
  ) {}

  async scheduleAppointmentReminder(appointmentId: string) {
    const appt = await this.prisma.appointment.findUnique({
      where: { id: appointmentId },
      include: { customer: true },
    });

    if (!appt) throw new Error('Appointment not found');
    const normalized = appt.customer?.phone ? normalizePhone(appt.customer.phone) : null;
    if (!normalized) {
      this.logger.warn(`Customer ${appt.customerId} has no phone; skipping reminder`);
      return null;
    }

    // Tenant config for reminder window
    const cfg = await (this.prisma as any).tenantConfig.findUnique({ where: { tenantId: appt.tenantId } });
    const hoursBefore = cfg?.reminderHoursBefore ?? 24;
    const enabled = cfg?.reminderEnabled ?? true;
    if (!enabled) {
      this.logger.log(`Tenant ${appt.tenantId} reminders disabled; skipping.`);
      return null;
    }

    const remindAt = new Date(appt.startsAt.getTime() - hoursBefore * 60 * 60 * 1000);
    const delayMs = remindAt.getTime() - Date.now();

    const message = `Lembrete: atendimento para ${appt.customer.name} em ${appt.startsAt.toLocaleString()}. Responda se precisar reagendar.`;

    // Idempotência: reusa job pendente se existir
    const existing = await (this.prisma as any).notificationJob.findFirst({
      where: { appointmentId: appt.id, status: 'SCHEDULED' },
    });

    if (existing?.queueJobId) {
      try {
        await this.queue.removeJob(existing.queueJobId);
      } catch (e) {
        this.logger.warn(`Failed to remove existing reminder job ${existing.queueJobId}: ${e}`);
      }
    }

    const notif = existing
      ? await (this.prisma as any).notificationJob.update({
          where: { id: existing.id },
          data: {
            payload: { to: normalized, message },
            status: 'SCHEDULED',
            queueJobId: null,
            errorMessage: null,
          },
        })
      : await (this.prisma as any).notificationJob.create({
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

    await (this.prisma as any).notificationJob.update({
      where: { id: notif.id },
      data: { queueJobId: jobId ? String(jobId) : null },
    });

    this.logger.log(
      jobId
        ? `Scheduled SMS reminder job ${jobId} for appointment ${appt.id}`
        : `Reminder queued as no-op (no queue) for appointment ${appt.id}`,
    );
    return { notificationJobId: notif.id, jobId }; 
  }

  async cancelAppointmentReminders(appointmentId: string) {
    const jobs = await (this.prisma as any).notificationJob.findMany({
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
      await (this.prisma as any).notificationJob.updateMany({
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

    await (this.prisma as any).notificationJob.update({
      where: { id: notificationJobId },
      data,
    });

    return { ok: true };
  }
}
