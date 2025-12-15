# test(e2e): suíte E2E com Testcontainers para auth, OTP e multi-tenant

## O que foi adicionado
- Endpoints protegidos para validação de RBAC/tenant (`/v1/protected/ping`, `/v1/protected/admin-only`, `/v1/protected/tenant/:tenantId`).
- Suíte E2E com Jest + ts-jest + supertest em `apps/api/test/e2e`, usando Testcontainers para Postgres e Redis (URL de DB e Redis injetadas dinamicamente, migrações Prisma aplicadas antes dos testes, teardown limpo).
- Provider de SMS em memória para capturar OTP em testes (override do TwilioProvider) e evitar custos externos.
- Casos cobertos: auth interno (register/login/refresh/logout), RBAC 403 para role inadequada, customer OTP (sucesso e lockout após 5 tentativas), barreira multi-tenant.
- Scripts: `pnpm -w test:e2e` (root) e `pnpm --filter @efizion/api test:e2e` (api).
- CI: novo job `e2e` em PRs e push para main executando `pnpm -w test:e2e` em runner com Docker.
- README e OpenAPI atualizados com endpoints e instruções de e2e.

## Como rodar e2e (requer Docker ou Codespaces)
```bash
pnpm install
pnpm -w test:e2e
```
- `TWILIO_DISABLED=true` já usado nos testes; SMS é mockado.
- Testcontainers sobe Postgres/Redis automaticamente; `DATABASE_URL` e `REDIS_URL` são injetados e `prisma migrate deploy` roda antes dos testes.
- Sem Docker local, rode somente build/typecheck/lint; e2e deve ser executado em Codespaces ou CI.

## Pendências
- Sem pendências funcionais identificadas; e2e roda apenas onde Docker está disponível.

## Checklist
- [x] Build
- [x] Typecheck
- [x] Lint
- [ ] Testes e2e (não executados localmente por ausência de Docker; previstos para CI/Codespaces)
