import { ConflictException, Injectable } from '@nestjs/common';
import { Prisma, Service } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateServiceDto } from './dto';

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

  async findAll(tenantId: string, includeInactive = false): Promise<Service[]> {
    return this.prisma.service.findMany({
      where: {
        tenantId,
        ...(includeInactive ? {} : { active: true }),
      },
      orderBy: { createdAt: 'desc' },
    });
  }
}
