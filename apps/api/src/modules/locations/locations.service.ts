import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { LocationsRepository } from './locations.repository';
import { CreateLocationDto, UpdateLocationDto } from './dto';
import { PaginationQueryDto, paginatedResponse } from '../../common/dto/pagination.dto';
import { createApiCollectionResponse } from '../../common/dto/api-response.dto';

@Injectable()
export class LocationsService {
  constructor(private readonly repo: LocationsRepository) {}

  async create(tenantId: string, dto: CreateLocationDto) {
    return this.repo.create(tenantId, dto);
  }

  async findByTenant(tenantId: string, query?: PaginationQueryDto) {
    const pagination = (query ?? new PaginationQueryDto()).toPrisma();
    const shouldPaginate = Boolean(query?.page || query?.pageSize || query?.sort);
    const skip = shouldPaginate ? pagination.skip : undefined;
    const take = shouldPaginate ? pagination.take : undefined;
    const orderBy = pagination.orderBy ?? { createdAt: 'desc' };

    const [data, total] = await Promise.all([
      this.repo.findByTenant(tenantId, skip, take, orderBy),
      this.repo.countByTenant(tenantId),
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

  async findById(id: string, tenantId: string) {
    const location = await this.repo.findById(id, tenantId);
    if (!location) {
      throw new NotFoundException(`Location ${id} não encontrada`);
    }
    return location;
  }

  async update(id: string, tenantId: string, dto: UpdateLocationDto) {
    // Validar que a location pertence ao tenant
    const location = await this.repo.findByIdRaw(id);
    if (!location) {
      throw new NotFoundException(`Location ${id} não encontrada`);
    }
    if (location.tenantId !== tenantId) {
      throw new ForbiddenException(`Sem permissão para acessar essa location`);
    }

    const result = await this.repo.update(id, tenantId, dto);
    if (!result.count) {
      throw new NotFoundException(`Location ${id} não encontrada`);
    }
    return this.repo.findById(id, tenantId);
  }
}
