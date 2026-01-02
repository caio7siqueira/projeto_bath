import { BillingService, type UpsertBillingSubscriptionDto as ContractsUpsertBillingSubscriptionDto } from '@efizion/contracts';
import { normalizeApiError, safeSdkCall } from './errors';
import { unwrapData } from './sdk';

export type BillingStatus =
  | 'TRIAL'
  | 'ACTIVE'
  | 'PAST_DUE'
  | 'SUSPENDED'
  | 'CANCELED'
  | 'CANCELLED'
  | 'INACTIVE';

export interface BillingSubscription {
  id: string;
  tenantId: string;
  plan: string;
  status: BillingStatus;
  createdAt: string;
  updatedAt: string;
  trialEndsAt?: string;
}

export type UpsertBillingSubscriptionDto = ContractsUpsertBillingSubscriptionDto & {
  plan: string;
  status: BillingStatus;
};


export async function fetchBillingSubscription(): Promise<BillingSubscription | null> {
  try {
    const response = await safeSdkCall(
      BillingService.billingControllerGetCurrent(),
      'Não conseguimos carregar sua assinatura.',
    );
    return unwrapData<BillingSubscription | null>(response as any);
  } catch (error) {
    const parsed = normalizeApiError(error, 'Não conseguimos carregar sua assinatura.');
    if (parsed.status === 404) return null;
    throw parsed;
  }
}


export async function upsertBillingSubscription(
  dto: UpsertBillingSubscriptionDto,
): Promise<BillingSubscription> {
  const response = await safeSdkCall(
    BillingService.billingControllerUpsert({
      requestBody: dto,
    }),
    'Não conseguimos atualizar sua assinatura.',
  );
  return unwrapData<BillingSubscription>(response as any);
}

export async function activateBillingPlan(plan: string) {
  return upsertBillingSubscription({ plan, status: 'ACTIVE' });
}

export async function cancelBillingPlan(plan: string) {
  return upsertBillingSubscription({ plan, status: 'CANCELED' });
}
