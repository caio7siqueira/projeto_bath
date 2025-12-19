export class CheckoutDto {
  plan_code: string;
  // outros campos do checkout
}

export class CancelDto {
  // pode ser vazio no MVP
}

export class WebhookDto {
  provider_subscription_id: string;
  status: string;
  // outros campos do webhook
}
