
import { apiFetch } from '../api';
import { getAuthToken } from './client';

export type BillingStatus = 'ACTIVE' | 'PAST_DUE' | 'CANCELLED' | 'INACTIVE';

export interface BillingSubscription {
  id: string;
  tenantId: string;
  plan: string;
  status: BillingStatus;
  createdAt: string;
  updatedAt: string;
  trialEndsAt?: string;
}

export interface UpsertBillingSubscriptionDto {
  plan: string;
  status: BillingStatus;
}


export async function fetchBillingSubscription(): Promise<BillingSubscription | null> {
  try {
    return await apiFetch('/admin/billing/subscription', {
      headers: { Authorization: `Bearer ${getAuthToken()}` },
    });
  } catch (err: any) {
    if (err && err.status === 404) return null;
    throw new Error(`Falha ao carregar assinatura: ${err?.status || ''}`);
  }
}


export async function upsertBillingSubscription(
  dto: UpsertBillingSubscriptionDto,
): Promise<BillingSubscription> {
  return apiFetch('/admin/billing/subscription', {
    method: 'PUT',
    headers: { Authorization: `Bearer ${getAuthToken()}` },
    body: JSON.stringify(dto),
  });
}
