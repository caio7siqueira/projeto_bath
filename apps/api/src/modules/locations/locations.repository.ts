import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateLocationDto, UpdateLocationDto } from './dto';

@Injectable()
export class LocationsRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(tenantId: string, dto: CreateLocationDto) {
    return this.prisma.location.create({
      data: {
        tenantId,
        name: dto.name,
      },
      select: {
        id: true,
        tenantId: true,
        name: true,
        createdAt: true,
        updatedAt: true,
      },
    });
  }

  async findByTenant(tenantId: string, skip?: number, take?: number, orderBy?: Record<string, 'asc' | 'desc'>) {
    return this.prisma.location.findMany({
      where: { tenantId },
      select: {
        id: true,
        tenantId: true,
        name: true,
        createdAt: true,
        updatedAt: true,
      },
      orderBy: orderBy ?? { createdAt: 'desc' },
      skip,
      take,
    });
  }

  async countByTenant(tenantId: string) {
    return this.prisma.location.count({ where: { tenantId } });
  }

  async findById(id: string, tenantId: string) {
    return this.prisma.location.findFirst({
      where: { id, tenantId },
      select: {
        id: true,
        tenantId: true,
        name: true,
        createdAt: true,
        updatedAt: true,
      },
    });
  }

  async update(id: string, tenantId: string, dto: UpdateLocationDto) {
    return this.prisma.location.updateMany({
      where: { id, tenantId },
      data: dto,
    });
  }

  async findByIdRaw(id: string) {
    return this.prisma.location.findUnique({ where: { id } });
  }
}
