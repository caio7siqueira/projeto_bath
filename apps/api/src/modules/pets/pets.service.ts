// ...existing code...
import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreatePetDto } from './dto/create-pet.dto';
import { UpdatePetDto } from './dto/update-pet.dto';

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
    if (pet.isDeceased && (dto.lifeStatus || dto.allowNotifications)) {
      // Permitir editar apenas nome, porte, foto (não desmarcar falecimento)
      // Se tentar editar status, bloquear
      throw new ForbiddenException('Não é permitido editar status ou notificações de pet falecido');
    }
    await this.prisma.pet.update({
      where: { id: petId },
      data: {
        name: dto.name,
        // Permitir editar apenas nome, porte, foto
      },
    });
    return this.prisma.pet.findUnique({ where: { id: petId } });
  }

  async listByCustomer(tenantId: string, customerId: string) {
    // Garantir que o customer pertence ao tenant
    const customer = await this.prisma.customer.findFirst({ where: { id: customerId, tenantId, isActive: true } });
    if (!customer) {
      throw new NotFoundException('Customer not found');
    }

    return this.prisma.pet.findMany({
      where: { tenantId, customerId },
      orderBy: { createdAt: 'desc' },
    });
  }
}
