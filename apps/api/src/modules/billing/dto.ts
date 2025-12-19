export class CheckoutDto {
  planCode: string = '';
  // outros campos do checkout
}

export class CancelDto {
  // pode ser vazio no MVP
}

export class WebhookDto {
  providerSubscriptionId: string = '';
  status: string = '';
  // outros campos do webhook
}
