# Arquitetura (resumo)

- Monorepo com `apps` (api, worker, web) e `packages`.
- API NestJS com Swagger, prefixo `/v1`, envelope `{ data, meta }` automático e bundle OpenAPI versionado em `docs/openapi`.
- Worker NestJS com BullMQ e filas: omie, notifications, recurrence.
- Web Next.js com PWA habilitável consumindo o SDK `@efizion/contracts`.
- Banco Postgres com Prisma.
