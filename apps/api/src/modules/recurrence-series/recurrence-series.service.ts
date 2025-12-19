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
        rule: dto.rule,
        // startDate e endDate removidos pois não existem no client
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
        rule: dto.rule ?? series.rule,
        // startDate e endDate removidos pois não existem no client
      },
    });
    // TODO: Materializar novas instâncias futuras se necessário
    return { message: 'Recorrência atualizada' };
  }
}
