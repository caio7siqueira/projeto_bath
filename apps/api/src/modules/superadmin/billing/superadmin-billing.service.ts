import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';

@Injectable()
export class SuperadminBillingService {
  constructor(private readonly prisma: PrismaService) {}

  async listSubscriptions() {
    return this.prisma.billingSubscription.findMany({
      include: { plan: true, tenant: true },
    });
  }

  async suspend(id: string) {
    await this.prisma.billingSubscription.update({
      where: { id },
      data: { status: 'SUSPENDED' },
    });
    return { success: true };
  }

  async reactivate(id: string) {
    await this.prisma.billingSubscription.update({
      where: { id },
      data: { status: 'ACTIVE' },
    });
    return { success: true };
  }
}
