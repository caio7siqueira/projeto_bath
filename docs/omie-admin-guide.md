# Guia Operacional – Integração Omie (Fase 3)

Este guia consolida os fluxos de administração, observabilidade e QA estabelecidos durante a Fase 3. Ele serve como referência rápida para habilitar novos tenants, revisar eventos e apresentar as telas homologadas para stakeholders.

## 1. Fluxos administrativos

### 1.1 Configurar credenciais por tenant
1. Acesse **Configurações → Omie** no painel (`/admin/settings/omie`).
2. Preencha `appKey` e `appSecret` no formulário “Credenciais & Teste”.
3. Clique em **Salvar credenciais**. O backend persiste na tabela `OmieConnection` e marca `source=TENANT` (ENV permanece como fallback).
4. Use o botão **Atualizar** do card “Status da Conexão” para confirmar timestamps.

### 1.2 Testar conexão
- **Teste com dados salvos:** disponível quando `connection.configured=true`. Mostra a fonte efetiva (Painel ou ENV).
- **Teste ad-hoc:** informe um par `appKey/appSecret` e clique em **Testar com dados acima**. O payload não é persistido, apenas usa override temporário.
- Mensagens de sucesso/erro ficam no callout verde/âmbar acima dos cards.

### 1.3 Monitorar e reenfileirar eventos
1. Utilize os filtros “Todos / Pendentes / Processando / Sucesso / Erro”. Cada filtro zera a paginação.
2. Coluna “Tentativas” exibe `attemptCount` e `lastErrorCode`. Datas usam fuso local (Intl `pt-BR`).
3. Para um evento em erro, clique em **Reprocessar**. O backend chama `POST /integrations/omie/reprocess/:eventId`, limpa `errorMessage` e marca `status=PENDING`.
4. O scheduler (cron de 1 minuto) reenfileira pendências automaticamente, mas o botão manual cria feedback imediato.
5. Links “Ver agendamento” levam ao detalhe `/admin/appointments/:id` para investigação cruzada.

## 2. Capturas homologadas (apps/web/docs/assets)

| Tela | Arquivo | Observações |
| --- | --- | --- |
| Dashboard overview | `../apps/web/docs/assets/dashboard.png` | Painel inicial com métricas do tenant demo |
| Agenda administrativa | `../apps/web/docs/assets/agenda.png` | Lista + calendário de agendamentos |
| Billing e assinatura | `../apps/web/docs/assets/billing.png` | Estado “Nenhum plano ativo” + CTA checkout |
| Cadastro de clientes | `../apps/web/docs/assets/cadastros.png` | Lista com filtros + ação “Novo cliente” |
| Integração Omie | `../apps/web/docs/assets/omie-integracao.png` | Mostra cards de status/credenciais e grid de eventos |

> Para atualizar as capturas, execute `CAPTURE_DOCS=true pnpm --filter @efizion/web test:e2e --grep @docs`. O teste `apps/web/tests/e2e/docs-screenshots.spec.ts` grava as imagens automaticamente.

## 3. Checklist de QA / Smoke (Fase 3)

1. **Salvar & testar credenciais:** limpar formulário, salvar novo par e testar. Validar toasts e chips de status.
2. **Fallback ENV:** com tenant sem credencial (`configured=false`), testar override digitando `appKey/appSecret` e ver mensagem “Teste concluído usando credenciais informadas”.
3. **Eventos em erro:** aplicar filtro “Erro”, reenfileirar item e verificar mensagem “Nenhum evento encontrado para este filtro”.
4. **Retorno à visão geral:** voltar para “Todos” e garantir que eventos pendentes reaparecem com badge “Pendente”.
5. **RBAC:** autenticar como usuário `STAFF` e confirmar bloqueio “Apenas administradores podem configurar integrações”.
6. **Playwright e2e:** rodar `pnpm --filter @efizion/web test:e2e` e confirmar sucesso nos cenários `Integração Omie` (credenciais + eventos).

## 4. Tratamento de erros e observações

- **Mensagens amigáveis:** erros de validação e falhas HTTP exibem callouts vermelhos/âmbar reutilizando `eventsError` ou `connectionError`.
- **Fallback global:** se `OMIE_APP_KEY/SECRET` estiverem definidos no ambiente, o status mostra `Fonte: Variáveis de ambiente`. Ao salvar no painel, o tenant passa a usar `source=TENANT` sem reiniciar o worker.
- **Scheduler & retries:** `apps/api/src/modules/omie/omie.scheduler.ts` inspeciona `OmieSalesEvent` a cada minuto e reenvia `PENDING`/`ERROR`. O campo `attemptCount` evita loops infinitos.
- **Auditoria:** endpoints `GET /integrations/omie/events`, `PUT /integrations/omie/connection`, `POST /integrations/omie/connection/test`, `POST /integrations/omie/reprocess/:eventId` estão documentados no bundle OpenAPI.
- **Assets & onboarding:** inclua `../apps/web/docs/assets/omie-integracao.png` e demais arquivos na entrega final (drive/sharepoint) para garantir consistência visual entre QA e stakeholders.

## 5. Referências rápidas

- UI: `apps/web/src/app/admin/settings/omie/page.tsx` (Next.js App Router, client component protegido por `useRole`).
- API: `apps/api/src/modules/omie/*` + `prisma/schema.prisma` (modelos `OmieConnection`, `OmieSalesEvent`).
- Testes: `apps/web/tests/e2e/omie-integration.spec.ts` (fluxos reais) e `apps/web/tests/e2e/docs-screenshots.spec.ts` (capturas para documentação).
- Scheduler/worker: `apps/api/src/modules/omie/omie.scheduler.ts` e fila `omie` no worker BullMQ.
