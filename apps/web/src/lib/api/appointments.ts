import {
  AppointmentsService,
  type CreateAppointmentDto as ContractsCreateAppointmentDto,
  type UpdateAppointmentDto as ContractsUpdateAppointmentDto,
} from '@efizion/contracts';
import { safeSdkCall } from './errors';
import { unwrapCollection, unwrapData } from './sdk';

export type CreateAppointmentDto = ContractsCreateAppointmentDto;
export type UpdateAppointmentDto = ContractsUpdateAppointmentDto;

export type AppointmentStatus = 'SCHEDULED' | 'CANCELLED' | 'DONE';

export interface Appointment {
  id: string;
  tenantId: string;
  customerId: string;
  locationId: string;
  petId?: string | null;
  serviceId?: string | null;
  startsAt: string;
  endsAt: string;
  status: AppointmentStatus;
  notes?: string | null;
  createdAt: string;
  updatedAt: string;
  recurrenceSeriesId?: string | null;
}

export interface ListAppointmentsQuery {
  locationId?: string;
  customerId?: string;
  from?: string; // ISO 8601
  to?: string;   // ISO 8601
  status?: AppointmentStatus;
  page?: number;
  pageSize?: number;
  sort?: string;
}

export async function listAppointments(filters?: ListAppointmentsQuery): Promise<Appointment[]> {
  const response = await safeSdkCall(
    AppointmentsService.appointmentsControllerFindAll({
      locationId: filters?.locationId,
      customerId: filters?.customerId,
      from: filters?.from,
      to: filters?.to,
      status: filters?.status,
      page: filters?.page,
      pageSize: filters?.pageSize,
      sort: filters?.sort,
    }),
    'Não foi possível carregar os agendamentos.',
  );
  const { data } = unwrapCollection<Appointment>(response as any);
  return data;
}


export async function fetchAppointment(id: string): Promise<Appointment> {
  const response = await safeSdkCall(
    AppointmentsService.appointmentsControllerFindOne({ id }),
    'Não encontramos o agendamento solicitado.',
  );
  return unwrapData<Appointment>(response as any);
}


export async function createAppointment(dto: CreateAppointmentDto): Promise<Appointment> {
  const response = await safeSdkCall(
    AppointmentsService.appointmentsControllerCreate({
      requestBody: dto,
    }),
    'Não foi possível criar o agendamento.',
  );
  return unwrapData<Appointment>(response as any);
}

export async function updateAppointment(id: string, dto: UpdateAppointmentDto): Promise<Appointment> {
  const response = await safeSdkCall(
    AppointmentsService.appointmentsControllerUpdate({
      id,
      requestBody: dto,
    }),
    'Não foi possível atualizar o agendamento.',
  );
  return unwrapData<Appointment>(response as any);
}
export async function cancelAppointment(id: string): Promise<Appointment> {
  const response = await safeSdkCall(
    AppointmentsService.appointmentsControllerCancel({ id }),
    'Não foi possível cancelar o agendamento.',
  );
  return unwrapData<Appointment>(response as any);
}
