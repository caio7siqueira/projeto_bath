import { Injectable } from '@nestjs/common';
import { PrismaService } from '@/prisma/prisma.service';
import { UpsertBillingSubscriptionDto } from './dto/upsert-billing-subscription.dto';

@Injectable()
export class BillingRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findLatestByTenant(tenantId: string) {
    return this.prisma.billingSubscription.findFirst({
      where: { tenantId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async createVersion(tenantId: string, dto: UpsertBillingSubscriptionDto) {
    return this.prisma.billingSubscription.create({
      data: {
        tenantId,
        plan: dto.plan,
        status: dto.status,
      },
    });
  }
}
