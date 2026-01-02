import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { PaginationQueryDto, paginatedResponse } from '../../common/dto/pagination.dto';
import { createApiCollectionResponse } from '../../common/dto/api-response.dto';

@Injectable()
export class SuperadminService {
  constructor(private readonly prisma: PrismaService) {}

  async listTenants(query?: PaginationQueryDto) {
    const pagination = (query ?? new PaginationQueryDto()).toPrisma();
    const shouldPaginate = Boolean(query?.page || query?.pageSize || query?.sort);
    const skip = shouldPaginate ? pagination.skip : undefined;
    const take = shouldPaginate ? pagination.take : undefined;
    const orderBy = pagination.orderBy ?? { createdAt: 'desc' };

    const [data, total] = await Promise.all([
      this.prisma.tenant.findMany({
        select: {
          id: true,
          name: true,
          slug: true,
          isActive: true,
          createdAt: true,
        },
        orderBy,
        skip,
        take,
      }),
      this.prisma.tenant.count(),
    ]);

    if (!shouldPaginate) {
      return createApiCollectionResponse(data, {
        total,
        page: 1,
        pageSize: total,
        totalPages: 1,
      });
    }

    return paginatedResponse(data, total, pagination.page, pagination.pageSize);
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

  async getAuditLogs(query?: PaginationQueryDto) {
    const pagination = (query ?? new PaginationQueryDto()).toPrisma();
    const shouldPaginate = Boolean(query?.page || query?.pageSize || query?.sort);
    const fallbackPageSize = shouldPaginate ? pagination.pageSize : 100;
    const skip = shouldPaginate ? pagination.skip : 0;
    const take = shouldPaginate ? pagination.take : fallbackPageSize;
    const orderBy = pagination.orderBy ?? { createdAt: 'desc' };

    const [logs, total] = await Promise.all([
      this.prisma.auditLog.findMany({ orderBy, skip, take }),
      this.prisma.auditLog.count(),
    ]);

    if (!shouldPaginate) {
      const totalPages = fallbackPageSize ? Math.ceil(total / fallbackPageSize) : 1;
      return createApiCollectionResponse(logs, {
        total,
        page: 1,
        pageSize: fallbackPageSize,
        totalPages: totalPages || 1,
      });
    }

    return paginatedResponse(logs, total, pagination.page, pagination.pageSize);
  }
}
