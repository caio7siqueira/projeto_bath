# Modelo de Dados (mínimo)

- Tenant: organização do sistema
- Location: filial do tenant
- User: usuário da aplicação (ADMIN/STAFF/GROOMER)
- Customer: cliente final
- Pet: animal do cliente
- Service: serviço de banho/tosa
- ServicePrice: preço por serviço
- Resource: recurso físico
- Appointment: agendamento
- AppointmentResource: relação agendamento-recurso
- RecurrenceSeries: regras de recorrência
- OmieConnection / OmieCustomerLink / OmieSalesEvent: integrações Omie
- MessageCreditsWallet / MessageCreditTransaction: créditos de mensagens
- NotificationJob: jobs de notificação
- AuditLog: auditoria
- BillingSubscription: assinaturas

## Integração Omie

- `OmieConnection`: um registro único por tenant contendo `appKey`/`appSecret` (ENV continua como fallback global).
- `OmieSalesEvent`: guarda o payload do agendamento e agora rastreia `attemptCount`, `lastAttemptAt` e `lastErrorCode` para observabilidade/retries.
- `OmieCustomerLink`: vínculo opcional entre `Customer` e IDs Omie para reconciliação futura.
