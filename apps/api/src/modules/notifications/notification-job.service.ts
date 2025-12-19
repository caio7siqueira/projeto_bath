import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { Channel } from '@prisma/client';

@Injectable()
export class NotificationJobService {
  constructor(private readonly prisma: PrismaService) {}

  async createJob({ tenant_id, appointment_id, to }: {
    tenant_id: string;
    appointment_id?: string;
    to: string;
  }) {
    // Cria job idempotente
    return this.prisma.notificationJob.create({
      data: {
        tenantId: tenant_id,
        appointmentId: appointment_id,
        payload: {},
        status: 'SCHEDULED',
        channel: 'SMS',
      },
    });
  }

  async updateStatus(id: string, status: string, error?: string, provider_message_id?: string) {
    return this.prisma.notificationJob.update({
      where: { id },
      data: { status: status as any, providerMessageId: provider_message_id },
    });
  }

  async getLogs(tenant_id: string) {
    return this.prisma.notificationJob.findMany({
      where: { tenantId: tenant_id },
      orderBy: { createdAt: 'desc' },
      take: 100,
    });
  }
}
