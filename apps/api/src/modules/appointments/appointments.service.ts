import {
  Injectable,
  BadRequestException,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { AppointmentsRepository } from './appointments.repository';
import { CreateAppointmentDto, UpdateAppointmentDto, ListAppointmentsDto } from './dto';
import { paginatedResponse } from '../../common/dto/pagination.dto';
import { OmieService } from '../omie/omie.service';
import { NotificationsService } from '../notifications/notifications.service';
import { BillingService } from '../billing/billing.service';

const MIN_DURATION_MINUTES = 5;

@Injectable()
export class AppointmentsService {
  constructor(
    private readonly repository: AppointmentsRepository,
    private readonly omieService: OmieService,
    private readonly notificationsService: NotificationsService,
    private readonly billingService: BillingService,
  ) {}

  async create(tenantId: string, dto: CreateAppointmentDto) {
    await this.billingService.ensureActiveSubscription(tenantId);

    // Validação: startsAt < endsAt
    const startsAt = new Date(dto.startsAt);
    const endsAt = new Date(dto.endsAt);

    if (startsAt >= endsAt) {
      throw new BadRequestException('startsAt deve ser anterior a endsAt');
    }

    // Validação: duração mínima de 5 minutos
    const durationMs = endsAt.getTime() - startsAt.getTime();
    const durationMinutes = durationMs / (1000 * 60);

    if (durationMinutes < MIN_DURATION_MINUTES) {
      throw new BadRequestException(
        `Duração mínima do agendamento é ${MIN_DURATION_MINUTES} minutos`,
      );
    }

    // Validação: customerId e locationId pertencem ao tenant
    const { customer, location, pet, service } = await this.repository.validateReferences(
      tenantId,
      dto.customerId,
      dto.locationId,
      dto.petId,
      dto.serviceId,
    );

    if (!customer) {
      throw new NotFoundException(
        `Cliente ${dto.customerId} não encontrado no tenant ${tenantId}`,
      );
    }

    if (!location) {
      throw new NotFoundException(
        `Localização ${dto.locationId} não encontrada no tenant ${tenantId}`,
      );
    }

    if (dto.petId && !pet) {
      throw new NotFoundException('Pet não encontrado ou inativo para este cliente.');
    }

    if (dto.serviceId && !service) {
      throw new NotFoundException('Serviço não encontrado ou inativo.');
    }

    // Verificação de conflito: overlap com outros appointments SCHEDULED
    const overlapping = await this.repository.findOverlapping(
      tenantId,
      dto.locationId,
      startsAt,
      endsAt,
    );

    if (overlapping.length > 0) {
      throw new ConflictException(
        `Conflito: já existe agendamento na mesma localização entre ${overlapping[0].startsAt.toISOString()} e ${overlapping[0].endsAt.toISOString()}`,
      );
    }

    const created = await this.repository.create(tenantId, dto);

    // Agenda lembrete por SMS 24h antes (não bloqueante)
    try {
      await this.notificationsService.scheduleAppointmentReminder(created.id);
    } catch (err) {
      console.error('Failed to schedule SMS reminder:', err);
    }

    return created;
  }

  async findAll(tenantId: string, filters: ListAppointmentsDto) {
    // Backward compatibility: se não tem paginação, retorna array
    if (filters.page === undefined && filters.pageSize === undefined && filters.sort === undefined) {
      return this.repository.findByTenant(tenantId, filters);
    }

    // Paginação
    const { skip, take, orderBy, page, pageSize } = filters.toPrisma();
    const [data, total] = await Promise.all([
      this.repository.findByTenantPaginated(tenantId, filters, skip, take, orderBy),
      this.repository.count(tenantId, filters),
    ]);

    const paginated = paginatedResponse(data, total, page, pageSize);
    // Retrocompatibilidade: expõe campos no topo além do meta
    return {
      data: paginated.data,
      total: paginated.meta.total,
      page: paginated.meta.page,
      pageSize: paginated.meta.pageSize,
      totalPages: paginated.meta.totalPages,
      meta: paginated.meta,
    };
  }

  async findOne(id: string, tenantId: string) {
    const appointment = await this.repository.findById(id, tenantId);

    if (!appointment) {
      throw new NotFoundException(`Agendamento ${id} não encontrado`);
    }

    return appointment;
  }

  async update(id: string, tenantId: string, dto: UpdateAppointmentDto) {
    // Busca o appointment existente
    const existing = await this.repository.findById(id, tenantId);

    if (!existing) {
      throw new NotFoundException(`Agendamento ${id} não encontrado`);
    }

    // Se está atualizando horários, valida
    if (dto.startsAt !== undefined || dto.endsAt !== undefined) {
      const startsAt = dto.startsAt ? new Date(dto.startsAt) : existing.startsAt;
      const endsAt = dto.endsAt ? new Date(dto.endsAt) : existing.endsAt;

      if (startsAt >= endsAt) {
        throw new BadRequestException('startsAt deve ser anterior a endsAt');
      }

      const durationMs = endsAt.getTime() - startsAt.getTime();
      const durationMinutes = durationMs / (1000 * 60);

      if (durationMinutes < MIN_DURATION_MINUTES) {
        throw new BadRequestException(
          `Duração mínima do agendamento é ${MIN_DURATION_MINUTES} minutos`,
        );
      }

      // Verifica overlap (excluindo o appointment atual)
      const overlapping = await this.repository.findOverlapping(
        tenantId,
        existing.locationId,
        startsAt,
        endsAt,
        id,
      );

      if (overlapping.length > 0) {
        throw new ConflictException(
          `Conflito: já existe agendamento na mesma localização entre ${overlapping[0].startsAt.toISOString()} e ${overlapping[0].endsAt.toISOString()}`,
        );
      }
    }

    const updated = await this.repository.update(id, tenantId, dto);
    if (!updated) {
      throw new NotFoundException(`Agendamento ${id} não encontrado`);
    }

    // Se o horário mudou, reagenda lembrete (não bloqueante)
    try {
      const newStartsAt = updated.startsAt.getTime();
      const oldStartsAt = existing.startsAt.getTime();
      if (newStartsAt !== oldStartsAt) {
        await this.notificationsService.rescheduleAppointmentReminder(id);
      }
    } catch (err) {
      console.error('Failed to reschedule SMS reminder after update:', err);
    }

    return updated;
  }

  async cancel(id: string, tenantId: string) {
    const existing = await this.repository.findById(id, tenantId);

    if (!existing) {
      throw new NotFoundException(`Agendamento ${id} não encontrado`);
    }

    // Idempotente: se já está cancelado, retorna o mesmo
    if (existing.status === 'CANCELLED') {
      return existing;
    }

    const cancelled = await this.repository.cancel(id, tenantId);
    if (!cancelled) {
      throw new NotFoundException(`Agendamento ${id} não encontrado`);
    }

    // Cancela lembretes pendentes (não bloqueante)
    try {
      await this.notificationsService.cancelAppointmentReminders(id);
    } catch (err) {
      console.error('Failed to cancel SMS reminders after cancellation:', err);
    }

    return cancelled;
  }

  async markDone(id: string, tenantId: string) {
    const existing = await this.repository.findById(id, tenantId);

    if (!existing) {
      throw new NotFoundException(`Agendamento ${id} não encontrado`);
    }

    if (existing.status === 'CANCELLED') {
      throw new BadRequestException('Não é possível marcar como DONE um agendamento cancelado');
    }

    // Idempotente
    if (existing.status === 'DONE') {
      return existing;
    }

    const updated = await this.repository.updateStatus(id, tenantId, 'DONE');
    if (!updated) {
      throw new NotFoundException(`Agendamento ${id} não encontrado`);
    }

    // Criar evento Omie de forma não bloqueante
    try {
      await this.omieService.createSalesEventForAppointment(id);
    } catch (error) {
      // Não bloqueia o fluxo se falhar
      console.error(`Failed to create Omie event for appointment ${id}:`, error);
    }

    return updated;
  }

  async cancelWithScope(id: string, tenantId: string, scope: 'ONE' | 'SERIES') {
    const appointment = await this.repository.findById(id, tenantId);
    if (!appointment) throw new NotFoundException('Agendamento não encontrado');
    // O campo recurrenceSeriesId pode não estar presente no select, buscar novamente se necessário
    let recurrenceSeriesId = (appointment as any).recurrenceSeriesId;
    if (scope === 'ONE' || !recurrenceSeriesId) {
      return this.cancel(id, tenantId);
    }
    // scope=SERIES: cancela todas futuras da série
    const now = new Date();
    const cancelled = await this.repository.cancelSeriesFuture(recurrenceSeriesId, now, tenantId);
    return { message: 'Instâncias futuras canceladas', count: cancelled };
  }

  async rescheduleWithScope(id: string, tenantId: string, scope: 'ONE' | 'SERIES', newStartAt: string) {
    const appointment = await this.repository.findById(id, tenantId);
    if (!appointment) throw new NotFoundException('Agendamento não encontrado');
    let recurrenceSeriesId = (appointment as any).recurrenceSeriesId;
    if (scope === 'ONE' || !recurrenceSeriesId) {
      return this.update(id, tenantId, { startsAt: newStartAt });
    }
    // scope=SERIES: reagenda todas futuras da série
    const now = new Date();
    const updated = await this.repository.rescheduleSeriesFuture(recurrenceSeriesId, now, tenantId, newStartAt);
    return { message: 'Instâncias futuras reagendadas', count: updated };
  }

}
