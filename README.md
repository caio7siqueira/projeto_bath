# Efizion Bath Monorepo

SaaS multi-tenant para petshops (PWA + NestJS + Worker + Prisma + BullMQ)

## Setup rápido (Codespaces/Linux)

```bash
# Setup completo automático
chmod +x setup.sh
./setup.sh

# Desenvolvimento
pnpm dev
```

## Setup manual

```bash
# 1. Copiar variáveis de ambiente
cp env.example .env

# 2. Subir infraestrutura
docker compose up -d postgres redis

# 3. Instalar dependências
pnpm install

# 4. Rodar migrations
pnpm db:migrate

# 5. Seed (opcional)
pnpm db:seed

# 6. Dev
pnpm dev
```

## Endpoints

- API: http://localhost:3000 (Swagger: `/docs`, Health: `/v1/health`)
- Web: http://localhost:3001
- Postgres: `localhost:5432`
- Redis: `localhost:6379`

## Scripts úteis

- `pnpm -w build` / `pnpm -w typecheck` / `pnpm -w lint`
- `pnpm db:generate` / `pnpm db:migrate` / `pnpm db:deploy` / `pnpm db:studio` / `pnpm db:seed`