// ...existing code...
import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreatePetDto } from './dto/create-pet.dto';
import { UpdatePetDto } from './dto/update-pet.dto';
import { ListPetsQueryDto } from './dto/list-pets.dto';
import { PaginationQueryDto, paginatedResponse } from '../../common/dto/pagination.dto';
import { createApiCollectionResponse } from '../../common/dto/api-response.dto';

@Injectable()
export class PetsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(tenantId: string, customerId: string, dto: CreatePetDto) {
    // Garantir que o customer pertence ao tenant
    const customer = await this.prisma.customer.findFirst({ where: { id: customerId, tenantId, isActive: true } });
    if (!customer) {
      throw new NotFoundException('Customer not found');
    }
    if (customer.status === 'DELETED') {
      throw new ForbiddenException('Não é permitido criar pets para clientes removidos');
    }

    return this.prisma.pet.create({
      data: {
        tenantId,
        customerId,
        name: dto.name,
        species: dto.species,
        lifeStatus: dto.lifeStatus ?? 'ALIVE',
        allowNotifications: dto.allowNotifications ?? true,
        isDeceased: false,
      },
    });
  }

  async update(tenantId: string, petId: string, dto: UpdatePetDto) {
    const pet = await this.prisma.pet.findUnique({ where: { id: petId } });
    if (!pet) {
      throw new NotFoundException('Pet not found');
    }
    if (pet.tenantId !== tenantId) {
      throw new ForbiddenException('Cross-tenant access denied');
    }
    // Se pet já está falecido, não permitir editar status/notificações
    if (pet.isDeceased && (dto.lifeStatus || dto.allowNotifications !== undefined)) {
      throw new ForbiddenException('Não é permitido editar status ou notificações de pet falecido');
    }
    // Atualiza campos permitidos
    const updateData: any = {};
    if (dto.name !== undefined) updateData.name = dto.name;
    if (dto.lifeStatus !== undefined) {
      updateData.lifeStatus = dto.lifeStatus;
      // Se marcar como DECEASED, seta isDeceased true
      if (dto.lifeStatus === 'DECEASED') {
        updateData.isDeceased = true;
      } else if (dto.lifeStatus === 'ALIVE') {
        updateData.isDeceased = false;
      }
    }
    if (dto.allowNotifications !== undefined) updateData.allowNotifications = dto.allowNotifications;
    await this.prisma.pet.update({
      where: { id: petId },
      data: updateData,
    });
    return this.prisma.pet.findUnique({ where: { id: petId } });
  }

  async listByCustomer(tenantId: string, customerId: string, query?: PaginationQueryDto) {
    const customer = await this.prisma.customer.findFirst({ where: { id: customerId, tenantId, isActive: true } });
    if (!customer) {
      throw new NotFoundException('Customer not found');
    }

    const pagination = (query ?? new PaginationQueryDto()).toPrisma();
    const shouldPaginate = Boolean(query?.page || query?.pageSize || query?.sort);
    const skip = shouldPaginate ? pagination.skip : undefined;
    const take = shouldPaginate ? pagination.take : undefined;
    const orderBy = pagination.orderBy ?? { createdAt: 'desc' };

    const where = { tenantId, customerId };
    const [items, total] = await Promise.all([
      this.prisma.pet.findMany({ where, orderBy, skip, take }),
      this.prisma.pet.count({ where }),
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

  async listAll(tenantId: string, query?: ListPetsQueryDto) {
    const pagination = (query ?? new ListPetsQueryDto()).toPrisma();
    const where: any = { tenantId };

    if (query?.q) {
      where.name = { contains: query.q, mode: 'insensitive' };
    }

    const orderBy = pagination.orderBy ?? { createdAt: 'desc' };
    const [items, total] = await Promise.all([
      this.prisma.pet.findMany({
        where,
        orderBy,
        skip: pagination.skip,
        take: pagination.take,
      }),
      this.prisma.pet.count({ where }),
    ]);

    return paginatedResponse(items, total, pagination.page, pagination.pageSize);
  }
}
