import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { TenantsRepository } from './tenants.repository';
import { CreateTenantDto, UpdateTenantDto } from './dto';

@Injectable()
export class TenantsService {
  constructor(private readonly repo: TenantsRepository) {}

  async create(dto: CreateTenantDto) {
    try {
      return await this.repo.create(dto);
    } catch (error: any) {
      if (error.code === 'P2002') {
        throw new ConflictException(`Slug "${dto.slug}" já existe`);
      }
      throw error;
    }
  }

  async findAll() {
    return this.repo.findAll();
  }

  async findById(id: string) {
    const tenant = await this.repo.findById(id);
    if (!tenant) {
      throw new NotFoundException(`Tenant ${id} não encontrado`);
    }
    return tenant;
  }

  async update(id: string, dto: UpdateTenantDto) {
    try {
      return await this.repo.update(id, dto);
    } catch (error: any) {
      if (error.code === 'P2025') {
        throw new NotFoundException(`Tenant ${id} não encontrado`);
      }
      if (error.code === 'P2002') {
        throw new ConflictException(`Slug já existe`);
      }
      throw error;
    }
  }
}
