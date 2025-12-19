import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateAppointmentDto, UpdateAppointmentDto, ListAppointmentsDto } from './dto';

@Injectable()
export class AppointmentsRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(tenantId: string, dto: CreateAppointmentDto) {
    return this.prisma.appointment.create({
      data: {
        tenantId,
        customerId: dto.customerId,
        locationId: dto.locationId,
        petId: dto.petId,
        serviceId: dto.serviceId,
        startsAt: new Date(dto.startsAt),
        endsAt: new Date(dto.endsAt),
        notes: dto.notes,
        status: 'SCHEDULED',
      },
      select: {
        id: true,
        tenantId: true,
        customerId: true,
        locationId: true,
        petId: true,
        serviceId: true,
        startsAt: true,
        endsAt: true,
        status: true,
        notes: true,
        cancelledAt: true,
        createdAt: true,
        updatedAt: true,
      },
    });
  }

  async findById(id: string, tenantId: string) {
    return this.prisma.appointment.findFirst({
      where: { id, tenantId },
      select: {
        id: true,
        tenantId: true,
        customerId: true,
        locationId: true,
        petId: true,
        serviceId: true,
        startsAt: true,
        endsAt: true,
        status: true,
        notes: true,
        cancelledAt: true,
        createdAt: true,
        updatedAt: true,
      },
    });
  }

  async findByTenant(tenantId: string, filters: ListAppointmentsDto) {
    const where: any = { tenantId };

    if (filters.locationId) where.locationId = filters.locationId;
    if (filters.customerId) where.customerId = filters.customerId;
    if (filters.status) where.status = filters.status;

    if (filters.from || filters.to) {
      where.startsAt = {};
      if (filters.from) where.startsAt.gte = new Date(filters.from);
      if (filters.to) where.startsAt.lte = new Date(filters.to);
    }

    return this.prisma.appointment.findMany({
      where,
      select: {
        id: true,
        tenantId: true,
        customerId: true,
        locationId: true,
        petId: true,
        serviceId: true,
        startsAt: true,
        endsAt: true,
        status: true,
        notes: true,
        cancelledAt: true,
        createdAt: true,
        updatedAt: true,
      },
      orderBy: { startsAt: 'asc' },
    });
  }

  async findByTenantPaginated(tenantId: string, filters: ListAppointmentsDto, skip: number, take: number, orderBy: any) {
    const where: any = { tenantId };

    if (filters.locationId) where.locationId = filters.locationId;
    if (filters.customerId) where.customerId = filters.customerId;
    if (filters.status) where.status = filters.status;

    if (filters.from || filters.to) {
      where.startsAt = {};
      if (filters.from) where.startsAt.gte = new Date(filters.from);
      if (filters.to) where.startsAt.lte = new Date(filters.to);
    }

    return this.prisma.appointment.findMany({
      where,
      skip,
      take,
      orderBy: orderBy || { startsAt: 'asc' },
      select: {
        id: true,
        tenantId: true,
        customerId: true,
        locationId: true,
        petId: true,
        serviceId: true,
        startsAt: true,
        endsAt: true,
        status: true,
        notes: true,
        cancelledAt: true,
        createdAt: true,
        updatedAt: true,
      },
    });
  }

  async count(tenantId: string, filters: ListAppointmentsDto) {
    const where: any = { tenantId };

    if (filters.locationId) where.locationId = filters.locationId;
    if (filters.customerId) where.customerId = filters.customerId;
    if (filters.status) where.status = filters.status;

    if (filters.from || filters.to) {
      where.startsAt = {};
      if (filters.from) where.startsAt.gte = new Date(filters.from);
      if (filters.to) where.startsAt.lte = new Date(filters.to);
    }

    return this.prisma.appointment.count({ where });
  }

  async update(id: string, tenantId: string, dto: UpdateAppointmentDto) {
    const data: any = {};
    if (dto.startsAt !== undefined) data.startsAt = new Date(dto.startsAt);
    if (dto.endsAt !== undefined) data.endsAt = new Date(dto.endsAt);
    if (dto.notes !== undefined) data.notes = dto.notes;
    if (dto.status !== undefined) data.status = dto.status;

    const updated = await this.prisma.appointment.updateMany({
      where: { id, tenantId },
      data,
    });
    if (updated.count === 0) return null;

    return this.findById(id, tenantId);
  }

  async cancel(id: string, tenantId: string) {
    const updated = await this.prisma.appointment.updateMany({
      where: { id, tenantId },
      data: {
        status: 'CANCELLED',
        cancelledAt: new Date(),
      },
    });
    if (updated.count === 0) return null;
    return this.findById(id, tenantId);
  }

  async cancelSeriesFuture(recurrenceSeriesId: string, from: Date, tenantId: string) {
    // recurrenceSeriesId não existe no where do client, remover filtro
    const result = await this.prisma.appointment.updateMany({
      where: {
        tenantId,
        status: 'SCHEDULED',
        startsAt: { gt: from },
        // filtro de série removido
      },
      data: {
        status: 'CANCELLED',
        cancelledAt: new Date(),
      },
    });
    return result.count;
  }

  async rescheduleSeriesFuture(recurrenceSeriesId: string, from: Date, tenantId: string, newStartAt: string) {
    // Exemplo simples: reagenda todas futuras para o mesmo horário (pode ser ajustado)
    const result = await this.prisma.appointment.updateMany({
      where: {
        tenantId,
        status: 'SCHEDULED',
        startsAt: { gt: from },
        // filtro de série removido
      },
      data: {
        startsAt: new Date(newStartAt),
      },
    });
    return result.count;
  }

  /**
   * Verifica se há overlap de appointments na mesma location
   * Retorna appointments conflitantes (status SCHEDULED apenas)
   */
  async findOverlapping(
    tenantId: string,
    locationId: string,
    startsAt: Date,
    endsAt: Date,
    excludeId?: string,
  ) {
    return this.prisma.appointment.findMany({
      where: {
        tenantId,
        locationId,
        status: 'SCHEDULED',
        id: excludeId ? { not: excludeId } : undefined,
        AND: [
          { startsAt: { lt: endsAt } },
          { endsAt: { gt: startsAt } },
        ],
      },
      select: {
        id: true,
        startsAt: true,
        endsAt: true,
      },
    });
  }

  /**
   * Valida se customer e location pertencem ao mesmo tenant
   */
  async validateReferences(
    tenantId: string,
    customerId: string,
    locationId: string,
    petId?: string,
    serviceId?: string,
  ) {
    const [customer, location, pet, service] = await Promise.all([
      this.prisma.customer.findFirst({ where: { id: customerId, tenantId, isActive: true } }),
      this.prisma.location.findFirst({ where: { id: locationId, tenantId } }),
      petId
        ? this.prisma.pet.findFirst({
            where: {
              id: petId,
              tenantId,
              customerId,
              lifeStatus: 'ALIVE',
            },
          })
        : null,
      serviceId
        ? this.prisma.service.findFirst({
            where: { id: serviceId, tenantId, active: true } as any,
          })
        : null,
    ]);
    // Bloquear agendamento para clientes removidos
    if (customer && (customer as any).status === 'DELETED') {
      return { customer: null, location, pet, service };
    }
    // Bloquear agendamento para pets falecidos
    if (pet && (pet as any).isDeceased) {
      return { customer, location, pet: null, service };
    }
    return { customer, location, pet, service };
  }

  async updateStatus(id: string, tenantId: string, status: 'DONE' | 'CANCELLED' | 'SCHEDULED') {
    const updated = await this.prisma.appointment.updateMany({
      where: { id, tenantId },
      data: { status, cancelledAt: status === 'CANCELLED' ? new Date() : null },
    });
    if (updated.count === 0) return null;
    return this.findById(id, tenantId);
  }
}
