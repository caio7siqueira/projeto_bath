import { Injectable } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { CreateAppointmentDto, UpdateAppointmentDto, ListAppointmentsDto } from './dto';

@Injectable()
export class AppointmentsRepository {
  private readonly prisma = new PrismaClient();

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

    return this.prisma.appointment.update({
      where: { id },
      data,
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

  async cancel(id: string, tenantId: string) {
    return this.prisma.appointment.update({
      where: { id },
      data: {
        status: 'CANCELLED',
        cancelledAt: new Date(),
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
  async validateReferences(tenantId: string, customerId: string, locationId: string) {
    const [customer, location] = await Promise.all([
      this.prisma.customer.findFirst({ where: { id: customerId, tenantId } }),
      this.prisma.location.findFirst({ where: { id: locationId, tenantId } }),
    ]);

    return { customer, location };
  }
}
