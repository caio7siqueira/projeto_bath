
import { apiFetch } from '../api';

export type NotificationStatus = 'SCHEDULED' | 'SENT' | 'ERROR' | 'CANCELLED';
export type NotificationChannel = 'SMS' | 'EMAIL' | 'WHATSAPP';

export interface NotificationJob {
  id: string;
  tenantId: string;
  appointmentId?: string | null;
  type: NotificationChannel;
  status: NotificationStatus;
  payload: any;
  errorMessage?: string | null;
  providerMessageId?: string | null;
  queueJobId?: string | null;
  sentAt?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ListNotificationJobsResponse {
  data: NotificationJob[];
  total: number;
  page: number;
  pageSize: number;
}

export interface NotificationJobsFilters {
  status?: NotificationStatus;
  type?: NotificationChannel;
  from?: string; // ISO
  to?: string;   // ISO
  page?: number;
  pageSize?: number;
}

import { getAuthToken } from './client';

export async function listNotificationJobs(filters: NotificationJobsFilters = {}) {
  const params = new URLSearchParams();
  if (filters.status) params.set('status', filters.status);
  if (filters.type) params.set('type', filters.type);
  if (filters.from) params.set('from', filters.from);
  if (filters.to) params.set('to', filters.to);
  if (filters.page) params.set('page', String(filters.page));
  if (filters.pageSize) params.set('pageSize', String(filters.pageSize));
  const qs = params.toString();
  return apiFetch(`/integrations/notifications/admin/jobs${qs ? `?${qs}` : ''}`, {
    headers: { Authorization: `Bearer ${getAuthToken()}` },
  }) as Promise<ListNotificationJobsResponse>;
}
