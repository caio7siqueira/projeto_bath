import { NotificationsService } from '@efizion/contracts';
import { safeSdkCall } from './errors';
import { ensureMeta, unwrapCollection } from './sdk';

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
  sort?: string;
}

export async function listNotificationJobs(filters: NotificationJobsFilters = {}) {
  const response = await safeSdkCall(
    NotificationsService.notificationsControllerListJobs({
      status: filters.status,
      page: filters.page,
      pageSize: filters.pageSize,
      sort: filters.sort ?? 'createdAt:desc',
    }),
    'Não foi possível carregar os envios de notificação.',
  );
  const collection = unwrapCollection<NotificationJob>(response as any);
  const meta = ensureMeta(collection.meta, collection.data.length);
  return {
    data: collection.data,
    total: meta.total,
    page: meta.page,
    pageSize: meta.pageSize,
  } satisfies ListNotificationJobsResponse;
}
