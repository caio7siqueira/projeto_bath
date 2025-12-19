// MVP: mock provider para integração futura
export class BillingProvider {
  async createSubscription(tenantId: string, planCode: string) {
    // Simula criação no provider
    return {
      provider: 'PAGARME',
      provider_subscription_id: 'mock-' + tenantId,
      status: 'ACTIVE',
    };
  }

  async cancelSubscription(providerSubscriptionId: string) {
    // Simula cancelamento
    return { success: true };
  }
}
