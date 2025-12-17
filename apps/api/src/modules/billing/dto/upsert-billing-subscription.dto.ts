import { IsIn, IsNotEmpty, IsString } from 'class-validator';

export const BILLING_STATUSES = ['ACTIVE', 'PAST_DUE', 'CANCELLED', 'INACTIVE'] as const;
export type BillingStatus = (typeof BILLING_STATUSES)[number];

export class UpsertBillingSubscriptionDto {
  @IsString()
  @IsNotEmpty()
  plan!: string;

  @IsString()
  @IsIn(BILLING_STATUSES as unknown as string[])
  status!: BillingStatus;
}
