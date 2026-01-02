import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { AppointmentsSummaryDto } from './dto/appointments-summary.dto';
import { AppointmentsTimeseriesDto } from './dto/appointments-timeseries.dto';
import { createApiCollectionResponse } from '../../common/dto/api-response.dto';

@Injectable()
export class ReportsService {
  constructor(private readonly prisma: PrismaService) {}

  async getAppointmentsSummary(tenantId: string, dto: AppointmentsSummaryDto) {
    const where: Prisma.AppointmentWhereInput = { tenantId };

    if (dto.from || dto.to) {
      where.startsAt = {};
      if (dto.from) where.startsAt.gte = new Date(dto.from);
      if (dto.to) where.startsAt.lte = new Date(dto.to);
    }

    const [total, scheduled, completed, cancelled] = await Promise.all([
      this.prisma.appointment.count({ where }),
      this.prisma.appointment.count({ where: { ...where, status: 'SCHEDULED' } }),
      // Consider both 'DONE' and 'COMPLETED' as completed
      this.prisma.appointment.count({ where: { ...where, OR: [{ status: 'DONE' }, { status: 'COMPLETED' }] } }),
      this.prisma.appointment.count({ where: { ...where, status: 'CANCELLED' } }),
    ]);

    return { total, scheduled, completed, cancelled };
  }

  async getAppointmentsTimeseries(tenantId: string, dto: AppointmentsTimeseriesDto) {
    const granularity = dto.granularity || 'day';
    const where: Prisma.AppointmentWhereInput = { tenantId };

    if (dto.from || dto.to) {
      where.startsAt = {};
      if (dto.from) where.startsAt.gte = new Date(dto.from);
      if (dto.to) where.startsAt.lte = new Date(dto.to);
    }

    const appointments = await this.prisma.appointment.findMany({
      where,
      select: { startsAt: true, status: true },
      orderBy: { startsAt: 'asc' },
    });

    const bucketKey = (date: Date) => {
      if (granularity === 'month') {
        return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, '0')}`;
      }
      return date.toISOString().slice(0, 10);
    };

    const buckets = new Map<string, { period: string; scheduled: number; completed: number; cancelled: number }>();

    for (const appointment of appointments) {
      const key = bucketKey(new Date(appointment.startsAt));
      if (!buckets.has(key)) {
        buckets.set(key, { period: key, scheduled: 0, completed: 0, cancelled: 0 });
      }
      const bucket = buckets.get(key)!;

      if (appointment.status === 'SCHEDULED') bucket.scheduled += 1;
      if (appointment.status === 'DONE' || appointment.status === 'COMPLETED') bucket.completed += 1;
      if (appointment.status === 'CANCELLED') bucket.cancelled += 1;
    }

    const series = Array.from(buckets.values()).sort((a, b) => a.period.localeCompare(b.period));
    return createApiCollectionResponse(series);
  }
}
