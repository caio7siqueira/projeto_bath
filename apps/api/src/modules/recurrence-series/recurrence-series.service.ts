import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateRecurrenceSeriesDto, UpdateRecurrenceSeriesDto } from './dto';
import { generateRecurrenceDates } from './recurrence.helpers';

@Injectable()
export class RecurrenceSeriesService {
  constructor(private readonly prisma: PrismaService) {}

  async create(tenantId: string, dto: CreateRecurrenceSeriesDto) {
    // Cria série de recorrência
    const series = await this.prisma.recurrenceSeries.create({
      data: {
        tenantId,
        frequency: dto.rule as any,
        interval: dto.interval,
        startAt: new Date(dto.startDate),
        endAt: new Date(dto.endDate),
      },
    });
    // Gera datas recorrentes
    const dates = generateRecurrenceDates(dto.rule, dto.interval, dto.startDate, dto.endDate);
    // Cria instâncias de appointments
    for (const date of dates) {
      await this.prisma.appointment.create({
        data: {
          tenantId,
          locationId: dto.locationId,
          customerId: dto.customerId,
          petId: dto.petId,
          serviceId: dto.serviceId,
          startsAt: date.startsAt,
          endsAt: date.endsAt,
          // recurrenceSeriesId removido pois não existe no client
        },
      });
    }
    return series;
  }

  async update(tenantId: string, id: string, dto: UpdateRecurrenceSeriesDto) {
    // Atualiza série e materializa novas instâncias futuras
    const series = await this.prisma.recurrenceSeries.findFirst({ where: { id, tenantId } });
    if (!series) throw new NotFoundException('Recorrência não encontrada');
    await this.prisma.recurrenceSeries.update({
      where: { id },
      data: {
        frequency: (dto.rule as any) ?? series.frequency,
        interval: dto.interval ?? series.interval,
        startAt: dto.startDate ? new Date(dto.startDate) : series.startAt,
        endAt: dto.endDate ? new Date(dto.endDate) : series.endAt,
      },
    });
    // TODO: Materializar novas instâncias futuras se necessário
    return { message: 'Recorrência atualizada' };
  }
}
