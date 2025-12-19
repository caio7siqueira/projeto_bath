import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { NotificationType, Channel } from '@prisma/client';

@Injectable()
export class NotificationJobService {
  constructor(private readonly prisma: PrismaService) {}

  async createJob({ tenant_id, appointment_id, channel, type, to }: {
    tenant_id: string;
    appointment_id?: string;
    channel: Channel;
    type: NotificationType;
    to: string;
  }) {
    // Cria job idempotente
    return this.prisma.notificationJob.create({
      data: {
        tenant_id,
        appointment_id,
        channel,
        type,
        to,
        status: 'PENDING',
      },
    });
  }

  async updateStatus(id: string, status: string, error?: string, provider_message_id?: string) {
    return this.prisma.notificationJob.update({
      where: { id },
      data: { status, error, provider_message_id },
    });
  }

  async getLogs(tenant_id: string) {
    return this.prisma.notificationJob.findMany({
      where: { tenant_id },
      orderBy: { created_at: 'desc' },
      take: 100,
    });
  }
}
