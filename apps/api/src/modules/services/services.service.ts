import { ConflictException, Injectable } from '@nestjs/common';
import { Prisma, Service } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateServiceDto } from './dto';
import { ListServicesQueryDto } from './dto/list-services-query.dto';
import { paginatedResponse, PaginatedResponse } from '../../common/dto/pagination.dto';
import { createApiCollectionResponse } from '../../common/dto/api-response.dto';

@Injectable()
export class ServicesService {
  constructor(private readonly prisma: PrismaService) {}

  async create(tenantId: string, dto: CreateServiceDto): Promise<Service> {
    try {
      return await this.prisma.service.create({
        data: {
          tenantId,
          name: dto.name,
          description: dto.description,
          baseDurationMinutes: dto.baseDurationMinutes,
          active: dto.active ?? true,
        } as any,
      });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
        throw new ConflictException('Já existe um serviço com esse nome neste tenant.');
      }
      throw error;
    }
  }

  async findAll(tenantId: string, query?: ListServicesQueryDto): Promise<PaginatedResponse<Service>> {
    const pagination = (query ?? new ListServicesQueryDto()).toPrisma();
    const shouldPaginate = Boolean(query?.page || query?.pageSize || query?.sort);
    const skip = shouldPaginate ? pagination.skip : undefined;
    const take = shouldPaginate ? pagination.take : undefined;
    const orderBy = pagination.orderBy ?? { createdAt: 'desc' };

    const where = {
      tenantId,
      ...(query?.includeInactive ? {} : { active: true }),
    };

    const [data, total] = await Promise.all([
      this.prisma.service.findMany({ where, orderBy, skip, take }),
      this.prisma.service.count({ where }),
    ]);

    if (!shouldPaginate) {
      return createApiCollectionResponse(data, {
        total,
        page: 1,
        pageSize: total,
        totalPages: 1,
      }) as PaginatedResponse<Service>;
    }

    return paginatedResponse(data, total, pagination.page, pagination.pageSize);
  }
}
