# Efizion Bath Monorepo

Requisitos: Node 20+, pnpm, Docker (opcional para dev local).

## Setup rápido

```powershell
corepack enable
corepack prepare pnpm@9.15.0 --activate
pnpm install
```

## Desenvolvimento

```powershell
docker compose up -d postgres redis
pnpm db:migrate
pnpm dev
```

- API: http://localhost:3000 (Swagger em /docs)
- Web: http://localhost:3001

## Scripts úteis
- `pnpm -w build` / `pnpm -w typecheck` / `pnpm -w lint`
- `pnpm db:generate` / `pnpm db:migrate` / `pnpm db:deploy` / `pnpm db:studio` / `pnpm db:seed`