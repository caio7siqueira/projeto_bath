import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

export interface UpdateTenantConfigDto {
  reminderEnabled?: boolean;
  reminderHoursBefore?: number;
  cancelWindowHours?: number;
}

@Injectable()
export class TenantConfigService {
  constructor(private prisma: PrismaService) {}

  async getOrCreate(tenantId: string) {
    const existing = await (this.prisma as any).tenantConfig.findUnique({ where: { tenantId } });
    if (existing) return existing;
    return (this.prisma as any).tenantConfig.create({
      data: {
        tenantId,
      },
    });
  }

  async update(tenantId: string, dto: UpdateTenantConfigDto) {
    await this.getOrCreate(tenantId);
    return (this.prisma as any).tenantConfig.update({
      where: { tenantId },
      data: dto,
    });
  }
}
