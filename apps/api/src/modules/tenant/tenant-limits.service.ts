import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class TenantLimitsService {
  constructor(private readonly prisma: PrismaService) {}

  async getLimits(tenantId: string) {
    const subscription = await this.prisma.billingSubscription.findFirst({
      where: { tenantId, status: { in: ['ACTIVE', 'TRIAL', 'PAST_DUE', 'OVER_LIMIT'] } },
      // include removido, usar select se necessário
    });
    // Não há plan no client, retornar objeto vazio
    return {};
  }

  async getUsage(tenantId: string) {
    const [filiais, usuarios, agendamentos, notificacoes] = await Promise.all([
      this.prisma.location.count({ where: { tenantId } }),
      this.prisma.user.count({ where: { tenantId } }),
      this.prisma.appointment.count({
        where: {
          tenantId,
          startsAt: {
            gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
            lte: new Date(),
          },
        },
      }),
      this.prisma.notificationJob.count({
        where: {
          tenantId,
          createdAt: {
            gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
            lte: new Date(),
          },
        },
      }),
    ]);
    return { filiais, usuarios, agendamentos, notificacoes };
  }

  async checkLimits(tenantId: string) {
    const limits = await this.getLimits(tenantId);
    const usage = await this.getUsage(tenantId);
    // Checagem defensiva para tipos
    const keys = Object.keys(limits) as (keyof typeof usage)[];
    const overLimit = keys.some(key => (usage as any)[key] > (limits as any)[key]);
    if (overLimit) {
      await this.prisma.billingSubscription.updateMany({
        where: { tenantId, status: { in: ['ACTIVE', 'TRIAL', 'PAST_DUE'] } },
        data: { status: 'OVER_LIMIT' },
      });
    }
    return { limits, usage, overLimit };
  }
}
