# Efizion Bath Monorepo

SaaS multi-tenant para petshops (PWA + NestJS + Worker + Prisma + BullMQ)

## Setup rápido (Codespaces)

```bash
# Setup completo automático
chmod +x setup.sh
./setup.sh

# Desenvolvimento
cp env.example .env
pnpm install
pnpm db:deploy
pnpm db:seed
pnpm dev
```

## Setup local (sem Docker)

Preferir Codespaces/devcontainer. Se não houver Postgres acessível via `DATABASE_URL`, pule migrations localmente e use apenas build/typecheck/lint. Rode migrations no Codespaces/CI.

## Setup manual (com Docker)

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
- Web: http://localhost:3001 (padrão; altere PORT se precisar)
- Postgres: `localhost:5432`
- Redis: `localhost:6379`

## Scripts úteis

- `pnpm -w build` / `pnpm -w typecheck` / `pnpm -w lint`
- `pnpm db:generate` / `pnpm db:deploy` / `pnpm db:seed` / `pnpm db:studio`
- `pnpm db:migrate` (dev local com histórico interativo)

## Autenticação

### Usuários internos
- Endpoints: `/v1/auth/register`, `/v1/auth/login`, `/v1/auth/refresh`, `/v1/auth/logout`
- JWT Bearer com `sub`, `email`, `role`.

### Clientes (OTP via SMS)
- Endpoints: `/v1/customer-auth/request-otp`, `/v1/customer-auth/verify-otp`
- JWT Bearer com claims `{ tenantId, customerId, actorType: "customer" }`
- SMS via Twilio. Em dev/CI sem credenciais, o envio é mockado.

## Migrations e testes

- Local sem DB: pule migrations e avance com build/typecheck/lint.
- Codespaces/CI: rode migrations e e2e. Para e2e, usamos Testcontainers (Docker necessário). Sem Docker, os testes e2e são pulados.

### Rodar e2e (requer Docker)

```bash
# Codespaces / Linux
pnpm install
pnpm db:deploy
pnpm db:seed
pnpm -w test:e2e
```

```powershell
# Windows PowerShell (Docker Desktop ligado)
pnpm install
pnpm db:deploy
pnpm db:seed
pnpm -w test:e2e
```

Variáveis de ambiente em e2e:
- `TWILIO_DISABLED=true` (mock de SMS)
- `DATABASE_URL` e `REDIS_URL` são injetados dinamicamente pelos testes via Testcontainers