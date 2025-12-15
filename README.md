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

### Auth (Internal Users)
```bash
# Register
curl -X POST http://localhost:3000/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email":"admin@example.com",
    "password":"StrongPass123!",
    "name":"Admin",
    "role":"ADMIN",
    "tenantSlug":"efizion-bath-demo"
  }'

# Login
curl -X POST http://localhost:3000/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email":"admin@example.com",
    "password":"StrongPass123!",
    "tenantSlug":"efizion-bath-demo"
  }'

# Refresh token
curl -X POST http://localhost:3000/v1/auth/refresh \
  -H "Content-Type: application/json" \
  -d '{"refreshToken":"..."}'

# Logout
curl -X POST http://localhost:3000/v1/auth/logout \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"refreshToken":"..."}'
```

### Tenants (admin-only)
```bash
# Create tenant
curl -X POST http://localhost:3000/v1/tenants \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"name":"Petshop Central","slug":"petshop-central"}'

# List tenants
curl http://localhost:3000/v1/tenants \
  -H "Authorization: Bearer $TOKEN"

# Get tenant by ID
curl http://localhost:3000/v1/tenants/{id} \
  -H "Authorization: Bearer $TOKEN"

# Update tenant
curl -X PATCH http://localhost:3000/v1/tenants/{id} \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"name":"New Name","isActive":true}'
```

### Locations (admin/staff per tenant)
```bash
# Create location
curl -X POST http://localhost:3000/v1/locations \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"name":"Sala de Banho A"}'

# List locations (tenant-scoped)
curl http://localhost:3000/v1/locations \
  -H "Authorization: Bearer $TOKEN"

# Get location by ID
curl http://localhost:3000/v1/locations/{id} \
  -H "Authorization: Bearer $TOKEN"

# Update location
curl -X PATCH http://localhost:3000/v1/locations/{id} \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"name":"Sala de Secagem"}'
```

### Customers (admin/staff per tenant)
```bash
# Create customer
curl -X POST http://localhost:3000/v1/customers \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name":"John Doe",
    "phone":"+5511999999999",
    "email":"john@example.com",
    "cpf":"12345678900",
    "optInGlobal":true
  }'

# List customers (no pagination - backward compatible)
curl http://localhost:3000/v1/customers \
  -H "Authorization: Bearer $TOKEN"

# List customers (with pagination)
curl "http://localhost:3000/v1/customers?page=1&pageSize=10" \
  -H "Authorization: Bearer $TOKEN"

# Search customers
curl "http://localhost:3000/v1/customers?q=john" \
  -H "Authorization: Bearer $TOKEN"

# Get customer by ID
curl http://localhost:3000/v1/customers/{id} \
  -H "Authorization: Bearer $TOKEN"

# Update customer
curl -X PATCH http://localhost:3000/v1/customers/{id} \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name":"John Updated",
    "email":"john.updated@example.com"
  }'

# Delete customer (soft delete)
curl -X DELETE http://localhost:3000/v1/customers/{id} \
  -H "Authorization: Bearer $TOKEN"
```

### Customer Auth (OTP via SMS)
```bash
# Request OTP
curl -X POST http://localhost:3000/v1/customer-auth/request-otp \
  -H "Content-Type: application/json" \
  -d '{
    "phone":"+5511999999999",
    "tenantSlug":"efizion-bath-demo"
  }'

# Verify OTP
curl -X POST http://localhost:3000/v1/customer-auth/verify-otp \
  -H "Content-Type: application/json" \
  -d '{
    "phone":"+5511999999999",
    "code":"000000",
    "tenantSlug":"efizion-bath-demo"
  }'
```

### Appointments (Agendamentos - admin/staff per tenant)
```bash
# Create appointment
curl -X POST http://localhost:3000/v1/appointments \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "customerId":"uuid-do-cliente",
    "locationId":"uuid-da-location",
    "startsAt":"2024-12-20T10:00:00Z",
    "endsAt":"2024-12-20T11:00:00Z",
    "notes":"Cliente preferiu horário da manhã"
  }'

# List appointments (no pagination - backward compatible)
curl http://localhost:3000/v1/appointments \
  -H "Authorization: Bearer $TOKEN"

# List appointments (with pagination)
curl "http://localhost:3000/v1/appointments?page=1&pageSize=10" \
  -H "Authorization: Bearer $TOKEN"

# List appointments by location
curl "http://localhost:3000/v1/appointments?locationId=uuid-da-location" \
  -H "Authorization: Bearer $TOKEN"

# List appointments by customer
curl "http://localhost:3000/v1/appointments?customerId=uuid-do-cliente" \
  -H "Authorization: Bearer $TOKEN"

# List appointments by period
curl "http://localhost:3000/v1/appointments?from=2024-12-20T00:00:00Z&to=2024-12-21T00:00:00Z" \
  -H "Authorization: Bearer $TOKEN"

# List appointments by status
curl "http://localhost:3000/v1/appointments?status=SCHEDULED" \
  -H "Authorization: Bearer $TOKEN"

# Get appointment by ID
curl http://localhost:3000/v1/appointments/{id} \
  -H "Authorization: Bearer $TOKEN"

# Update appointment
curl -X PATCH http://localhost:3000/v1/appointments/{id} \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "startsAt":"2024-12-20T11:00:00Z",
    "endsAt":"2024-12-20T12:00:00Z",
    "notes":"Reagendado a pedido do cliente"
  }'

# Cancel appointment (idempotent)
curl -X POST http://localhost:3000/v1/appointments/{id}/cancel \
  -H "Authorization: Bearer $TOKEN"
```

**Regras de negócio:**
- Duração mínima: 5 minutos
- Validação: `startsAt < endsAt`
- Overlap detection: retorna 409 Conflict se já existe agendamento SCHEDULED na mesma location com overlap
- Multi-tenant: validação de `customerId` e `locationId` pertencentes ao mesmo tenant
- Cancelamento: idempotente, seta `status = CANCELLED` e `cancelledAt = now()`
```

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