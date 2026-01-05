import { apiFetch } from '../api';

export type OmieEventStatus = 'PENDING' | 'PROCESSING' | 'SUCCESS' | 'ERROR';

export interface OmieConnectionStatusResponse {
  configured: boolean;
  source: 'TENANT' | 'ENV' | null;
  createdAt: string | null;
  updatedAt: string | null;
}

export interface OmieConnectionMutationResponse {
  message: string;
  updatedAt: string;
  source: 'TENANT';
}

export interface UpsertOmieConnectionDto {
  appKey: string;
  appSecret: string;
}

export interface TestOmieConnectionDto {
  appKey?: string;
  appSecret?: string;
}

export interface OmieEvent {
  id: string;
  tenantId: string;
  appointmentId?: string | null;
  status: OmieEventStatus;
  payload: Record<string, any>;
  errorMessage?: string | null;
  omieOrderId?: string | null;
  attemptCount: number;
  lastAttemptAt?: string | null;
  lastErrorCode?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface OmieEventsMeta {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
  status: OmieEventStatus | null;
}

export interface OmieEventsResponse {
  data: OmieEvent[];
  meta: OmieEventsMeta;
}

export async function fetchOmieConnectionStatus() {
  return apiFetch('/integrations/omie/connection', {
    cache: 'no-store',
  }) as Promise<OmieConnectionStatusResponse>;
}

export async function saveOmieConnection(body: UpsertOmieConnectionDto) {
  return apiFetch('/integrations/omie/connection', {
    method: 'PUT',
    body: JSON.stringify(body),
  }) as Promise<OmieConnectionMutationResponse>;
}

export async function testOmieConnection(body?: TestOmieConnectionDto) {
  return apiFetch('/integrations/omie/connection/test', {
    method: 'POST',
    body: body ? JSON.stringify(body) : undefined,
  }) as Promise<{ ok: boolean; source: 'TENANT' | 'ENV' | 'PROVIDED' }>;
}

export async function listOmieEvents(params: { status?: OmieEventStatus; page?: number; pageSize?: number } = {}) {
  const qs = new URLSearchParams();
  if (params.status) qs.set('status', params.status);
  if (params.page) qs.set('page', String(params.page));
  if (params.pageSize) qs.set('pageSize', String(params.pageSize));
  const query = qs.toString();
  return apiFetch(`/integrations/omie/events${query ? `?${query}` : ''}`, {
    cache: 'no-store',
  }) as Promise<OmieEventsResponse>;
}

export async function reprocessOmieEvent(eventId: string) {
  return apiFetch(`/integrations/omie/reprocess/${eventId}`, {
    method: 'POST',
  }) as Promise<{ message: string }>;
}
