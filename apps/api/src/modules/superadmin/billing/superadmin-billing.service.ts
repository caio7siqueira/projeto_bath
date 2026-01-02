import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { PaginationQueryDto, paginatedResponse } from '../../../common/dto/pagination.dto';
import { createApiCollectionResponse } from '../../../common/dto/api-response.dto';

@Injectable()
export class SuperadminBillingService {
  constructor(private readonly prisma: PrismaService) {}

  async listSubscriptions(query?: PaginationQueryDto) {
    const pagination = (query ?? new PaginationQueryDto()).toPrisma();
    const shouldPaginate = Boolean(query?.page || query?.pageSize || query?.sort);
    const skip = shouldPaginate ? pagination.skip : undefined;
    const take = shouldPaginate ? pagination.take : undefined;
    const orderBy = pagination.orderBy ?? { createdAt: 'desc' };

    const [items, total] = await Promise.all([
      this.prisma.billingSubscription.findMany({
        include: { plan: true, tenant: true },
        orderBy,
        skip,
        take,
      }),
      this.prisma.billingSubscription.count(),
    ]);

    if (!shouldPaginate) {
      return createApiCollectionResponse(items, {
        total,
        page: 1,
        pageSize: total,
        totalPages: 1,
      });
    }

    return paginatedResponse(items, total, pagination.page, pagination.pageSize);
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
