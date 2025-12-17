import { Injectable } from '@nestjs/common';
import { PrismaService } from '@/prisma/prisma.service';

export interface UpdateTenantConfigDto {
  reminderEnabled?: boolean;
  reminderHoursBefore?: number;
  cancelWindowHours?: number;
}

@Injectable()
export class TenantConfigService {
  constructor(private prisma: PrismaService) {}

  async getOrCreate(tenantId: string) {
    const existing = await this.prisma.tenantConfig.findUnique({ where: { tenantId } });
    if (existing) return existing;
    return this.prisma.tenantConfig.create({
      data: {
        tenantId,
      },
    });
  }

  async update(tenantId: string, dto: UpdateTenantConfigDto) {
    await this.getOrCreate(tenantId);
    return this.prisma.tenantConfig.update({
      where: { tenantId },
      data: dto,
    });
  }
}
