# Arquitetura (resumo)

- Monorepo com `apps` (api, worker, web) e `packages`.
- API NestJS com Swagger, prefixo `/v1` e health.
- Worker NestJS com BullMQ e filas: omie, notifications, recurrence.
- Web Next.js com PWA habilitável.
- Banco Postgres com Prisma.
