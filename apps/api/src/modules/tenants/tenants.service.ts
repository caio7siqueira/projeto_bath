import { Injectable, NotFoundException } from '@nestjs/common';
import { TenantsRepository } from './tenants.repository';
import { CreateTenantDto, UpdateTenantDto } from './dto';
import {
  PaginationQueryDto,
  paginatedResponse,
} from '../../common/dto/pagination.dto';

@Injectable()
export class TenantsService {
  constructor(private readonly repo: TenantsRepository) {}

  async create(dto: CreateTenantDto) {
    // PrismaExceptionFilter vai mapear P2002 → 409
    return this.repo.create(dto);
  }

  async findAll(query?: PaginationQueryDto) {
    // Se nenhum parâmetro de paginação foi fornecido, retorna array direto (backward compatible)
    if (!query || (query.page === undefined && query.pageSize === undefined && query.sort === undefined)) {
      return this.repo.findAll();
    }

    const { skip, take, orderBy, page, pageSize } = query.toPrisma();
    const [data, total] = await Promise.all([
      this.repo.findAllPaginated(skip, take, orderBy),
      this.repo.count(),
    ]);
    return paginatedResponse(data, total, page, pageSize);
  }

  async findById(id: string) {
    const tenant = await this.repo.findById(id);
    if (!tenant) {
      throw new NotFoundException(`Tenant ${id} não encontrado`);
    }
    return tenant;
  }

  async update(id: string, dto: UpdateTenantDto) {
    // PrismaExceptionFilter vai mapear P2025 → 404 e P2002 → 409
    return this.repo.update(id, dto);
  }
}
