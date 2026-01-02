## Variáveis de ambiente (Web)

Para o frontend acessar a API corretamente, defina a variável:

```
NEXT_PUBLIC_API_URL=https://api.efizion.com.br # produção
NEXT_PUBLIC_API_URL=http://localhost:3000      # local
```

Configure no arquivo `.env.local` em `apps/web` para desenvolvimento local.
# Efizion Bath Monorepo

[![E2E CI](https://github.com/caio7siqueira/projeto_bath/actions/workflows/e2e.yml/badge.svg)](https://github.com/caio7siqueira/projeto_bath/actions/workflows/e2e.yml)

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

## CI

- A CI roda E2E em pull requests e na branch `main` usando GitHub Actions (Testcontainers com Docker disponível no runner).
- Workflow: `E2E CI` (`.github/workflows/e2e.yml`).
- Para validar localmente os mesmos passos:

```bash
pnpm install --frozen-lockfile
pnpm -w test:e2e
```

## Setup local (sem Docker)

Preferir Codespaces/devcontainer. Se não houver Postgres acessível via `DATABASE_URL`, pule migrations localmente e use apenas build/typecheck/lint. Rode migrations no Codespaces/CI.

## Contratos REST, OpenAPI e SDK

### Envelope `{ data, meta }`

Todas as rotas HTTP retornam o contrato envelope:

```json
{
  "data": { "...payload..." },
  "meta": {
    "page": 1,
    "pageSize": 20,
    "total": 42,
    "totalPages": 3
  }
}
```

- `meta` só aparece em coleções; erros continuam usando os `HttpException` padrões do Nest.
- Regras de validação e campos obrigatórios estão descritos nos DTOs e no bundle OpenAPI.

### Bundle OpenAPI

- Arquivos sempre atualizados em `docs/openapi/openapi.json` e `docs/openapi/openapi.yaml`.
- Para gerar novamente (ex.: após alterar DTOs):

```bash
pnpm openapi:bundle      # gera JSON/YAML aplicando o envelope automaticamente
pnpm openapi:sdk         # gera tipos + cliente HTTP em packages/contracts
pnpm contracts:generate  # encadeia os dois passos
```

### SDK compartilhado (`@efizion/contracts`)

- Código-fonte em `packages/contracts` com exports de `src/types.ts` (tipos puros) e `src/sdk` (cliente Fetch).
- Exemplo básico de uso no frontend Next.js:

```ts
import { CustomersService, OpenAPI } from '@efizion/contracts';

OpenAPI.BASE = process.env.NEXT_PUBLIC_API_URL!;
OpenAPI.TOKEN = async () => localStorage.getItem('token') ?? undefined;

const customersApi = new CustomersService();
const { data, meta } = await customersApi.customersControllerFindAll({
  page: 1,
  pageSize: 20,
});

console.log(meta.total, data[0].name);
```

### Exemplos de payload

#### Auth → Login (`POST /v1/auth/login`)

Request:

```json
{
  "email": "admin@example.com",
  "password": "StrongPass123!",
  "tenantSlug": "efizion-bath-demo"
}
```

Response:

```json
{
  "data": {
    "accessToken": "jwt...",
    "refreshToken": "jwt...",
    "user": {
      "id": "...",
      "role": "ADMIN",
      "tenantId": "..."
    }
  }
}
```

Campos obrigatórios: `email`, `password`, `tenantSlug`. Validações seguem `RegisterDto/LoginDto` no OpenAPI.

#### Customers → Listagem paginada (`GET /v1/customers?page=1&pageSize=10`)

Response:

```json
{
  "data": [
    {
      "id": "...",
      "name": "John Doe",
      "phone": "+5511999999999",
      "email": "john@example.com",
      "optInGlobal": true,
      "createdAt": "2026-01-02T12:00:00.000Z"
    }
  ],
  "meta": {
    "page": 1,
    "pageSize": 10,
    "total": 1,
    "totalPages": 1
  }
}
```

Parâmetros aceitos: `page`, `pageSize` (1-100), `q` (busca textual). Todos documentados no bundle.

#### Appointments → Criação (`POST /v1/appointments`)

Request:

```json
{
  "customerId": "uuid",
  "locationId": "uuid",
  "startsAt": "2026-01-02T13:00:00Z",
  "endsAt": "2026-01-02T14:00:00Z",
  "notes": "Cliente prefere manhã"
}
```

Response:

```json
{
  "data": {
    "id": "...",
    "status": "SCHEDULED",
    "startsAt": "2026-01-02T13:00:00Z",
    "endsAt": "2026-01-02T14:00:00Z",
    "customerId": "uuid",
    "locationId": "uuid"
  }
}
```

Validações: duração mínima de $5$ minutos, `startsAt < endsAt`, overlap bloqueado (409). Tudo refletido em `CreateAppointmentDto`.

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

## Guia do Frontend/Admin (Micro-etapa 7)

### Visão geral e onboarding rápido
- **Onde fica:** todo o painel administrativo vive em `apps/web` (Next.js 14 App Router). Rode `pnpm --filter @efizion/web dev` para levantar somente o frontend ou `pnpm dev` para todo o monorepo.
- **Providers obrigatórios:** o `AuthProvider` (tokens/foco em login) já envolve toda a árvore em `apps/web/src/app/layout.tsx`, junto com as fontes `Plus Jakarta Sans` e `Space Grotesk`. Reaproveite `page-shell` e componentes de layout antes de criar wrappers novos.
- **Stack base:** Zustand (`apps/web/src/lib/store.ts`) para cache local, React Hook Form + Zod para formulários, SWR apenas em páginas legacy (preferir hooks dedicados).
- **Checklist inicial:** copie `.env.local` para `apps/web`, configure `NEXT_PUBLIC_API_URL` e (quando necessário) `NEXT_PUBLIC_DEMO_TOKEN`, execute `pnpm install` e rode os testes E2E (`pnpm --filter @efizion/web test`) antes de abrir PR.

### Integração com o SDK `@efizion/contracts`
- **Configuração única:** `apps/web/src/lib/contracts-client.ts` chama `ensureContractsClientConfig()` durante o boot para setar `OpenAPI.BASE`, `WITH_CREDENTIALS` e o resolver de token (lendo `localStorage`).
- **Camada REST pura:** `apps/web/src/lib/api.ts` centraliza `apiFetch` com headers, tratamento 401 e normalização de erro via `normalizeApiError`.
- **Serviços gerados:** use os clients gerados em `apps/web/src/lib/api/*`. Exemplo real, extraído de `apps/web/src/lib/hooks.ts`:

```ts
import { createService } from '@/lib/api/services';

export async function createNewService(dto: CreateServiceDto) {
  const service = await createService(dto); // usa o SDK configurado
  setServices((prev) => [service, ...prev]);
  return service;
}
```
- **Quando usar qual camada:**
  - **SDK (`@efizion/contracts`):** sempre que precisar de tipagem forte do OpenAPI ou endpoints novos.
  - **`apiFetch`:** requests simples ou quando ainda não geramos o cliente; mantenha o padrão `await apiFetch('/customers', { method: 'POST', body: JSON.stringify(dto) })`.

### Hooks, stores e utilitários principais
- `AuthProvider` + `useAuth` (`apps/web/src/lib/auth-context.tsx`): guardam `user`, tokens, refresh e redirect pós-login.
- `useRole` (`apps/web/src/lib/use-role.ts`): devolve `isAdmin`, `isStaff`, `hasRole(...)` para gates e banners.
- `useCustomers`, `useAppointments`, `useServices`, `usePets`, `useLocations` (`apps/web/src/lib/hooks.ts`): manipulam cache do Zustand, normalizam erros e já expõem `fetch*`, `create*`, `update*` e `cancel*` com mensagens padrão.
- `useAppStore` (`apps/web/src/lib/store.ts`): único ponto de verdade para listas renderizadas em dashboard, agenda e cadastros.
- `normalizeApiError` (`apps/web/src/lib/api/errors.ts`): converte `{ code, status, details }` em mensagens amigáveis + `details` opcionais para os banners.

### Padrões visuais, shells e estados
- **Componentes fundacionais:** `Card`, `Button`, `Badge` (design tokens), `PageHeader` e `Shell` (estrutura responsiva com gutters fixos).
- **Navegação e contexto:** `Breadcrumbs` (`apps/web/src/components/navigation/Breadcrumbs.tsx`) define `<nav aria-label="Trilha de navegação">` com nota auxiliar.
- **Loaders / Skeletons:** `HeroSkeleton`, `ListSkeleton`, `CardGridSkeleton`, `ChartSkeleton` e `SkeletonBlock` vivem em `apps/web/src/components/feedback/VisualStates.tsx`. Use `HeroSkeleton` para headers, `ListSkeleton` para listagens com/sem ações e `CardGridSkeleton` para KPIs.
- **Empty states:** `EmptyState` aceita `variant="card"|"inline"`, ícone (emoji ok) e CTA – padrão no dashboard e billing.
- **Error banners:** `ErrorBanner` seta `role="alert"`, `aria-live="assertive"` e permite `data-error-scenario` para testes (ver specs E2E de Auth/Billing).
- **Shells reutilizáveis:** dashboards usam `page-shell` (ver `apps/web/src/app/admin/billing/page.tsx`), listas usam `StackedList` + `FiltersPanel`, formulários longos seguem `FormSection` + `FormActions` (ver cadastros de clientes/pets/serviços).

### Estratégia de acessibilidade
- **Foco e teclado:** todos os botões/links utilizam Tailwind focus rings (`focus-visible:ring-*`). Priorize `Button`/`Link` padrões e evite `div` clicável.
- **Semântica:** `Breadcrumbs` encapsula `<nav>`, banners usam `role="alert"`, skeletons omitem `aria` e deixam conteúdo real assumir o foco.
  - **Skip link e landmarks:** `apps/web/src/app/layout.tsx` injeta o link "Pular para o conteúdo principal" (classe `.skip-link`) e envolve as páginas em `header`/`main`/`footer` com `role` explícito.
- **Contraste:** tokens `text-slate-900`, `brand-600`, `bg-red-50` seguem WCAG AA; alinhe mudanças em `globals.css` com o time de design antes de customizar.
- **Anunciadores:** Next adiciona `#__next-route-announcer__`. Os testes E2E mostram como filtrar `data-error-scenario` para não conflitar com esse elemento.
  - **Pendências de A11y:** revisar o comportamento de foco ao fechar modais/toasts e avaliar skip-links secundários (filtros/lateral) para acessos prolongados.

### Scripts, variáveis e deploy (apps/web)

| Tipo | Comando |
| --- | --- |
| Dev isolado | `pnpm --filter @efizion/web dev` (usa `PORT=3001` por padrão) |
| Build | `pnpm --filter @efizion/web build` |
| Start (preview) | `pnpm --filter @efizion/web start` |
| Typecheck | `pnpm --filter @efizion/web typecheck` |
| Teste headless | `pnpm --filter @efizion/web test` ou `test:e2e` |
| Teste interativo | `pnpm --filter @efizion/web test:e2e:ui` |
| Captura de telas | `CAPTURE_DOCS=true pnpm --filter @efizion/web test -- --grep "@docs"` |

**Variáveis importantes**

| Variável | Descrição |
| --- | --- |
| `NEXT_PUBLIC_API_URL` | URL base da API (sem `/v1`). Obrigatório para builds e preview. |
| `NEXT_PUBLIC_DEMO_TOKEN` | Token opcional usado nas rotas demo do dashboard para liberar modo read-only. |
| `PORT` | Define a porta do Next (`dev`/`start`). Útil quando rodar paralelo ao backend. |
| `CAPTURE_DOCS` | Quando `true`, habilita o spec `docs-screenshots` para gerar novas imagens do README. |

**Deploy manual (Vercel/Render/VM):**
1. Garantir `pnpm --filter @efizion/web build` sem erros.
2. Exportar `NEXT_PUBLIC_API_URL` no painel do provedor.
3. Configurar `PLAYWRIGHT_BROWSERS_PATH=0` apenas para CI (não requerido em produção).
4. Publicar via `turbo deploy` ou pipeline preferido (ver `docs/SETUP_DEPLOY.md`).
- O `next.config.js` já define `allowedDevOrigins` para `localhost`/`127.0.0.1` (3000–3100), permitindo que o Playwright utilize `http://127.0.0.1:3100` sem novos avisos.

### Testes automatizados (smoke/E2E)
- **Escopo atual:** login, agenda (CRUD + conflitos), billing (checkout/cancel/restrição), cadastros (cliente/pet/serviço + erros) e navegação.
- **Onde ficam:** `apps/web/tests/e2e/*.spec.ts` utiliza Playwright com mock backend (`tests/e2e/support/mock-backend.ts`).
- **Executar localmente:** `pnpm --filter @efizion/web test` (headless) ou `pnpm --filter @efizion/web test:e2e:ui` (Visual Runner).
- **Relatórios:** abra `pnpm exec playwright show-report` após a execução. Os traces/snapshots estão em `apps/web/test-results` e podem ser anexados ao QA.
- **Mock-infra:** ajustar fixtures no helper antes de mudar contratos reais para evitar escrita em produção.
- **Status recente:** 2026-01-02 → `pnpm --filter @efizion/web test` retornou 15/15 cenários verdes (Auth, Agenda, Billing, Cadastros e Navegação).
- **Capturas:** gere imagens oficiais com `CAPTURE_DOCS=true pnpm --filter @efizion/web test -- --grep "@docs"` (os PNGs ficam em `apps/web/docs/assets`).

### Fluxos principais (diagramas textuais)

```mermaid
flowchart LR
    Login[[Login Admin]] --> Dashboard[Dashboard]
    Dashboard --> KPI{Cards e gráficos}
    Dashboard --> AgendaLink[Ir para Agenda]
    AgendaLink --> AgendaLista[Lista + filtros + skeleton]
    AgendaLista --> NovoAgendamento[Modal/Form Novo]
    Dashboard --> BillingLink
    BillingLink --> BillingPage[Resumo / EmptyState]
    BillingPage --> Checkout
    Dashboard --> Cadastros[Clientes/Pets/Serviços]
```

- **Dashboard:** cards de métricas + gráficos (`CardGridSkeleton` → cards com CTA). Breadcrumb volta para `/admin/dashboard`.
- **Agenda:** `page-shell` com filtros persistentes, formulário `Novo Agendamento` compartilha hooks de pets/clientes para popular selects.
- **Billing:** `EmptyState` mostra CTA “Ativar assinatura”; ao clicar abre `/admin/billing/checkout` com `ErrorBanner`/`SuccessMessage`. Fluxo de cancelamento segue `/admin/billing/cancel`.
- **Cadastros:** cada CRUD usa `FormSection` + `ErrorBanner`. Após salvar, `router.push` volta para lista e `useCustomers/usePets/useServices` atualizam o cache.

### Capturas de tela reais

As imagens abaixo foram geradas com o spec `docs-screenshots` (ver comando acima):

![Dashboard](apps/web/docs/assets/dashboard.png)
![Agenda administrativa](apps/web/docs/assets/agenda.png)
![Billing/assinatura](apps/web/docs/assets/billing.png)
![Cadastro de clientes](apps/web/docs/assets/cadastros.png)

### Onboarding para novos devs/analistas
1. **Ferramentas:** Node 20 + pnpm 8, Playwright (`pnpm --filter @efizion/web exec playwright install --with-deps` no primeiro dia).
2. **Clonar & instalar:** `pnpm install` na raiz → `pnpm --filter @efizion/web dev`.
3. **Credenciais:** peça ao time Ops o `.env.local` com `NEXT_PUBLIC_API_URL` e tokens demo.
4. **Conhecer hooks:** leia `apps/web/src/lib/hooks.ts` (CRUD), `auth-context` (login/logout) e `use-role` (feature flags) antes de tocar telas.
5. **Componentes chave:** `Button`, `Card`, `Breadcrumbs`, `VisualStates` (skeleton/error) e `Table/List` dentro de `apps/web/src/components`. Reutilize antes de criar variações.
6. **Fluxo de review:** abra PR com screenshot do estado feliz + link do relatório Playwright; descreva mudanças de contrato no `docs/contracts-changelog.md`.

### Pendências e próximos passos
- Automatizar upload dos relatórios Playwright como artefato de CI.
- Documentar o comportamento de foco em modais e toasts (após incluir skip-links secundários).
- Validar as capturas de tela em dispositivos móveis (hoje foram geradas apenas em viewport desktop 1440×900).


## Healthchecks

Todos os apps do monorepo expõem healthchecks simples, sem dependências externas, para uso em CI/CD, monitoramento e automação. Nenhum healthcheck lança erro ou depende de banco/redis.

### API

- **Endpoint:** `GET /v1/health`
- **Resposta:**
  ```json
  { "ok": true, "timestamp": "2024-01-01T00:00:00.000Z" }
  ```

### Worker

- **Export:** `getHealth()` em `apps/worker/src/health.ts`
- **Uso:**
  ```ts
  import { getHealth } from './health';
  getHealth(); // { status: 'ok', app: 'worker', uptime: 123.45, timestamp: '...' }
  ```

### Web

- **Arquivo:** `/public/health.json`
- **Exemplo:**
  ```json
  { "status": "ok", "app": "web", "timestamp": "2024-01-01T00:00:00.000Z" }
  ```

---
## Endpoints

Consulte `docs/contracts-changelog.md` para um histórico de alterações de contrato e exemplos adicionais por módulo. Os exemplos abaixo já assumem o envelope `{ data, meta }` descrito anteriormente.

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

### Integrações e Worker

#### Omie (não bloqueante)
- Ao marcar agendamento como DONE, criamos `OmieSalesEvent` (`status=PENDING`) e enfileiramos para o worker.
- Worker chama `POST /integrations/omie/internal/process/:eventId` para processar (upsert cliente + pedido de venda).
- Reprocesso: `POST /integrations/omie/reprocess/:eventId` (ADMIN).

#### Notificações (SMS / WhatsApp via Twilio)
- Ao criar agendamento, agendamos `NotificationJob` para T - `reminderHoursBefore` (padrão 24h) e enfileiramos.
- Se `startsAt` mudar → reagendamos; se cancelar → cancelamos jobs pendentes.
- Worker envia SMS/WhatsApp via Twilio e marca `SENT`/`ERROR` via `POST /integrations/notifications/internal/mark/:id`.
- Admin: listar jobs do tenant em `GET /integrations/notifications/admin/jobs?status=SCHEDULED|SENT|ERROR&page=1&pageSize=20`.

#### Configuração por Tenant
- `GET /admin/tenant-config` (ADMIN) retorna ou cria defaults.
- `PUT /admin/tenant-config` (ADMIN) para atualizar `reminderEnabled`, `reminderHoursBefore` e `cancelWindowHours`.

### Variáveis de ambiente

API (NestJS):
- `DATABASE_URL`, `JWT_SECRET`, `JWT_REFRESH_SECRET`
- `REDIS_URL`
- `OMIE_APP_KEY`, `OMIE_APP_SECRET`

Worker:
- `REDIS_URL`
- `API_BASE_URL` (ex. `http://api:3000` ou URL pública da API)
- `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, `TWILIO_FROM`
- `TWILIO_WHATSAPP_FROM` (opcional, ex. `whatsapp:+14155238886`)
- `DEFAULT_COUNTRY_CODE` (opcional, default `+55`)
- `DEFAULT_COUNTRY_ISO` (opcional, default `BR`, usado para normalização de telefone)

## Scripts úteis

- `pnpm -w build` / `pnpm -w typecheck` / `pnpm -w lint`
- `pnpm db:generate` / `pnpm db:deploy` / `pnpm db:seed` / `pnpm db:studio`
- `pnpm db:migrate` (dev local com histórico interativo)
- `pnpm openapi:bundle` / `pnpm openapi:sdk` / `pnpm contracts:generate` (atualizam docs e SDK)

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

## Checkpoint — 2025-12-17

### Estado Atual
- Autenticação JWT (usuários internos) com refresh token e RBAC mínimo (ADMIN/STAFF).
- Agenda com validações (duração mínima, overlap, multi-tenant) e ações de status (DONE/NO_SHOW/CANCELLED).
- Integrações assíncronas via BullMQ/Redis:
  - Omie: criação de `OmieSalesEvent` ao marcar DONE e processamento no worker (upsert cliente + pedido de venda) com retries.
  - SMS/WhatsApp via Twilio: lembrete agendado por tenant (padrão 24h antes), reagenda ao mudar horário e cancela ao cancelar o agendamento com idempotência no job.
- Configuração por tenant (`TenantConfig`): `reminderEnabled`, `reminderHoursBefore`, `cancelWindowHours`.
- Billing: assinatura por tenant com status e plano; bloqueio de agendamento se assinatura inativa/em atraso.
- Normalização de telefone via `libphonenumber-js` (E.164) para clientes/contatos e lembretes.
- Endpoints de admin: listar NotificationJobs por tenant; gerir TenantConfig; gerir assinatura (billing) com UI dedicada.

### Componentes
- `apps/web` (Next.js): login, rotas protegidas e RBAC no UI.
- `apps/api` (NestJS + Prisma): REST, multi-tenant, integrações e filas.
- `apps/worker` (Node + BullMQ): processadores de `omie` e `notifications` com Twilio.
- Banco: PostgreSQL (Prisma). Filas: Redis.

### Principais Filas
- `omie`: processa `OmieSalesEvent` via API interna `POST /integrations/omie/internal/process/:eventId`.
- `notifications`: envia SMS/WhatsApp via Twilio e marca status na API.

## Deploy em Produção — Checklist

### Infraestrutura
- Banco: PostgreSQL gerenciado (alta disponibilidade e backups automáticos).
- Filas: Redis gerenciado (com persistência e monitoramento).
- Runtime: Docker/Kubernetes (separar pods para API e Worker; HPA recomendado).
- Observabilidade: logs centralizados, métricas (CPU/mem/filas), alertas e tracing opcional.

### Variáveis de Ambiente
- API (NestJS): `DATABASE_URL`, `JWT_SECRET`, `JWT_REFRESH_SECRET`, `REDIS_URL`, `OMIE_APP_KEY`, `OMIE_APP_SECRET`.
- Worker: `REDIS_URL`, `API_BASE_URL` (URL pública/privada da API), `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, `TWILIO_FROM`, `TWILIO_WHATSAPP_FROM` (opcional), `DEFAULT_COUNTRY_CODE` (padrão `+55`), `DEFAULT_COUNTRY_ISO` (padrão `BR`).

### Passos de Deploy
1) Instalar dependências e gerar cliente Prisma
```powershell
pnpm install
pnpm --filter @efizion/api prisma generate
```
2) Aplicar migrations (produção)
```powershell
pnpm --filter @efizion/api prisma migrate deploy
```
3) Build e Start
```powershell
pnpm --filter @efizion/api build
pnpm --filter @efizion/api start

pnpm --filter @efizion/worker build
pnpm --filter @efizion/worker start
```
4) DNS/SSL e Gateway
- Configurar domínio e TLS para a API (Nginx/Ingress Controller). Se o Web for SPA/PWA, servir via CDN/Static host.

### Operação e Confiabilidade
- Health Checks: habilitar endpoints de saúde e timeouts de readiness/liveness.
- Logs: coletar stdout/stderr (JSON) e configurar retenção/consulta.
- Métricas: monitorar filas (tamanho, latência, falhas), taxa de erro da API e latência.
- Backups: política diária do PostgreSQL e snapshots do Redis (se aplicável).
- Rotação de segredos: gerenciar via Secret Manager/Vault.

## Roadmap de Evolução

### Curto Prazo
- UI Admin (Web) para: TenantConfig e listagem/consulta de NotificationJobs.
- Normalização de telefone com lib especializada (ex.: `libphonenumber-js`) e validações mais fortes.
- Idempotência adicional no agendamento de lembretes para evitar duplicações em fluxos concorrentes.
- Rate limiting e circuit breaker nas integrações (Omie/Twilio) e DLQ para jobs que estourarem tentativas.

### Médio Prazo
- Templates de mensagens por tenant (com variáveis) e opt-out do cliente.
- Políticas de cancelamento usando `cancelWindowHours` (bloqueio ou fluxos de cobrança).
- Webhooks/Callbacks do Omie e reconciliação; mapeamento real de produtos/serviços.
- Painéis de observabilidade (Grafana) para métricas de filas e integrações.

### Longo Prazo
- Multi-tenant hard (schema por tenant) ou soft isolation reforçado (row level security em nível DB).
- Billing/assinaturas: integrar `BillingSubscription` ao gateway de pagamento.
- Internacionalização (i18n) e suporte a múltiplos países (telefone, fuso horário, moeda).

## Política de Imports e Blindagem CI/CD

> **ATENÇÃO:** Este monorepo **NÃO** permite o uso de aliases TypeScript (`@/`, `src/`, etc.) em produção. Todos os imports devem ser **absolutos reais** a partir da raiz do monorepo (ex: `apps/api/src/...`).

### Regras obrigatórias:
- **Proibido** usar `@/`, `src/` ou qualquer alias em qualquer arquivo `.ts`.
- **Proibido** definir `paths` no `tsconfig.json` para produção.
- **Obrigatório** usar caminhos absolutos reais em todos os imports internos (exemplo: `import { X } from 'apps/api/src/common/x';`).
- **CI/CD**: Pull requests e builds de produção falharão se houver qualquer uso de alias ou import inválido.

### Como revisar:
- Antes de abrir PR, busque por `@/` e `src/` nos imports:
  ```bash
  grep -E "@/|src/" apps/api/src/**/*.ts apps/worker/src/**/*.ts
  ```
  O resultado deve ser **vazio**.
- Se encontrar, corrija para o caminho absoluto real.

### Motivo
- O Node.js puro (Railway, Docker, CI/CD) **NÃO** resolve aliases do TypeScript em runtime.
- Evita dependência de hacks como `tsconfig-paths` ou `module-alias`.
- Garante que qualquer erro de importação será detectado no build/test, nunca em produção.

---