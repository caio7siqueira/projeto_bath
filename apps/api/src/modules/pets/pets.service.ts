import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaClient, $Enums } from '@prisma/client';
import { CreatePetDto } from './dto/create-pet.dto';
import { UpdatePetDto } from './dto/update-pet.dto';

@Injectable()
export class PetsService {
  private readonly prisma = new PrismaClient();

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
        lifeStatus: dto.lifeStatus ?? $Enums.LifeStatus.ALIVE,
        allowNotifications: dto.allowNotifications ?? true,
      },
    });
  }

  async update(tenantId: string, petId: string, dto: UpdatePetDto) {
    const pet = await this.prisma.pet.findUnique({ where: { id: petId }, select: { tenantId: true } });
    if (!pet) {
      throw new NotFoundException('Pet not found');
    }
    if (pet.tenantId !== tenantId) {
      throw new ForbiddenException('Access denied');
    }

    return this.prisma.pet.update({
      where: { id: petId },
      data: {
        name: dto.name,
        lifeStatus: dto.lifeStatus,
        allowNotifications: dto.allowNotifications,
      },
    });
  }
}
