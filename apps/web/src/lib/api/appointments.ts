

import { apiFetch } from '../api';
import { getAuthToken } from './client';

export type AppointmentStatus =
  | 'SCHEDULED'
  | 'CANCELLED'
  | 'COMPLETED'
  | 'DONE'
  | 'RESCHEDULED'
  | 'NO_SHOW';

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
}

export interface CreateAppointmentDto {
  customerId: string;
  locationId: string;
  petId?: string;
  serviceId?: string;
  startsAt: string; // ISO 8601
  endsAt: string;   // ISO 8601
  notes?: string;
}

export interface UpdateAppointmentDto {
  startsAt?: string;
  endsAt?: string;
  notes?: string;
  status?: AppointmentStatus;
}

export interface ListAppointmentsQuery {
  locationId?: string;
  customerId?: string;
  from?: string; // ISO 8601
  to?: string;   // ISO 8601
  status?: AppointmentStatus;
}


export async function listAppointments(filters?: ListAppointmentsQuery): Promise<Appointment[]> {
  const search = new URLSearchParams();
  if (filters?.locationId) search.set('locationId', filters.locationId);
  if (filters?.customerId) search.set('customerId', filters.customerId);
  if (filters?.from) search.set('from', filters.from);
  if (filters?.to) search.set('to', filters.to);
  if (filters?.status) search.set('status', filters.status);
  const qs = search.toString();
  return apiFetch(`/appointments${qs ? `?${qs}` : ''}`, {
    headers: { Authorization: `Bearer ${getAuthToken()}` },
  });
}


export async function fetchAppointment(id: string): Promise<Appointment> {
  return apiFetch(`/appointments/${id}`, {
    headers: { Authorization: `Bearer ${getAuthToken()}` },
  });
}


export async function createAppointment(dto: CreateAppointmentDto): Promise<Appointment> {
  return apiFetch('/appointments', {
    method: 'POST',
    headers: { Authorization: `Bearer ${getAuthToken()}` },
    body: JSON.stringify(dto),
  });
}

export async function updateAppointment(id: string, dto: UpdateAppointmentDto): Promise<Appointment> {
  return apiFetch(`/appointments/${id}`, {
    method: 'PATCH',
    headers: { Authorization: `Bearer ${getAuthToken()}` },
    body: JSON.stringify(dto),
  });
}
export async function cancelAppointment(id: string): Promise<Appointment> {
  return apiFetch(`/appointments/${id}/cancel`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${getAuthToken()}` },
  });
}
