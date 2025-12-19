import { Injectable, NotFoundException } from '@nestjs/common';
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

    return this.prisma.pet.create({
      data: {
        tenantId,
        customerId,
        name: dto.name,
        species: dto.species,
        lifeStatus: dto.lifeStatus ?? 'ALIVE',
        allowNotifications: dto.allowNotifications ?? true,
      },
    });
  }

  async update(tenantId: string, petId: string, dto: UpdatePetDto) {
    const updated = await this.prisma.pet.updateMany({
      where: { id: petId, tenantId },
      data: {
        name: dto.name,
        lifeStatus: dto.lifeStatus,
        allowNotifications: dto.allowNotifications,
      },
    });
    if (updated.count === 0) {
      throw new NotFoundException('Pet not found');
    }
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
