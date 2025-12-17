import { Injectable } from '@nestjs/common';
import { CreateTenantDto, UpdateTenantDto } from './dto';
import { PrismaService } from '@/prisma/prisma.service';

@Injectable()
export class TenantsRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateTenantDto) {
    return this.prisma.tenant.create({
      data: dto,
      select: {
        id: true,
        name: true,
        slug: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
      },
    });
  }

  async findAll() {
    return this.prisma.tenant.findMany({
      select: {
        id: true,
        name: true,
        slug: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findAllPaginated(skip: number, take: number, orderBy?: any) {
    return this.prisma.tenant.findMany({
      skip,
      take,
      orderBy: orderBy || { createdAt: 'desc' },
      select: {
        id: true,
        name: true,
        slug: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
      },
    });
  }

  async count() {
    return this.prisma.tenant.count();
  }

  async findById(id: string) {
    return this.prisma.tenant.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        slug: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
      },
    });
  }

  async update(id: string, dto: UpdateTenantDto) {
    return this.prisma.tenant.update({
      where: { id },
      data: dto,
      select: {
        id: true,
        name: true,
        slug: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
      },
    });
  }
}
