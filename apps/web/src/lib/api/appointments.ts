const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3000';
const TOKEN = process.env.NEXT_PUBLIC_DEMO_TOKEN || '';

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
  const url = qs
    ? `${API_BASE}/v1/appointments?${qs}`
    : `${API_BASE}/v1/appointments`;

  const res = await fetch(url, { headers: { Authorization: `Bearer ${TOKEN}` } });
  if (!res.ok) throw new Error(`Failed to list appointments: ${res.status}`);
  return res.json();
}

export async function fetchAppointment(id: string): Promise<Appointment> {
  const res = await fetch(`${API_BASE}/v1/appointments/${id}`, {
    headers: { Authorization: `Bearer ${TOKEN}` },
  });
  if (!res.ok) throw new Error(`Failed to fetch appointment: ${res.status}`);
  return res.json();
}

export async function createAppointment(dto: CreateAppointmentDto): Promise<Appointment> {
  const res = await fetch(`${API_BASE}/v1/appointments`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${TOKEN}`,
    },
    body: JSON.stringify(dto),
  });
  if (!res.ok) throw new Error(`Failed to create appointment: ${res.status}`);
  return res.json();
}

export async function updateAppointment(id: string, dto: UpdateAppointmentDto): Promise<Appointment> {
  const res = await fetch(`${API_BASE}/v1/appointments/${id}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${TOKEN}`,
    },
    body: JSON.stringify(dto),
  });
  if (!res.ok) throw new Error(`Failed to update appointment: ${res.status}`);
  return res.json();
}

export async function cancelAppointment(id: string): Promise<Appointment> {
  const res = await fetch(`${API_BASE}/v1/appointments/${id}/cancel`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${TOKEN}` },
  });
  if (!res.ok) throw new Error(`Failed to cancel appointment: ${res.status}`);
  return res.json();
}
