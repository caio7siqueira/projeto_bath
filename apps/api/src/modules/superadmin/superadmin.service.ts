import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class SuperadminService {
  constructor(private readonly prisma: PrismaService) {}

  async listTenants() {
    return this.prisma.tenant.findMany({
      select: {
        id: true,
        name: true,
        slug: true,
        isActive: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getTenant(id: string) {
    const tenant = await this.prisma.tenant.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        slug: true,
        isActive: true,
        createdAt: true,
        customers: { select: { id: true } },
        pets: { select: { id: true } },
        appointments: { select: { id: true } },
      },
    });
    if (!tenant) throw new NotFoundException('Tenant não encontrado');
    return {
      ...tenant,
      numCustomers: tenant.customers.length,
      numPets: tenant.pets.length,
      numAppointments: tenant.appointments.length,
    };
  }

  async suspendTenant(id: string) {
    await this.prisma.tenant.update({
      where: { id },
      data: { isActive: false },
    });
    await this.prisma.auditLog.create({
      data: {
        tenantId: id,
        action: 'TENANT_SUSPEND',
      },
    });
    return { message: 'Tenant suspenso' };
  }

  async activateTenant(id: string) {
    await this.prisma.tenant.update({
      where: { id },
      data: { isActive: true },
    });
    await this.prisma.auditLog.create({
      data: {
        tenantId: id,
        action: 'TENANT_ACTIVATE',
      },
    });
    return { message: 'Tenant reativado' };
  }

  async getAuditLogs() {
    return this.prisma.auditLog.findMany({
      orderBy: { createdAt: 'desc' },
      take: 100,
    });
  }
}
