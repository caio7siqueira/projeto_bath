# Changelog dos Contratos REST

## 2026-01-02 — Padronização `{ data, meta }`

- **Escopo:** Auth, Customers, Customer Contacts, Pets, Tenants/Locations, Appointments, Reports, Notifications e endpoints de Admin/Superadmin.
- **Mudanças principais:**
  - Todas as respostas agora seguem o envelope `{ data, meta }`. O campo `meta` é obrigatório em coleções paginadas e inclui `page`, `pageSize`, `total` e `totalPages`.
  - DTOs expostos no Swagger receberam `ApiProperty`/`ApiPropertyOptional` com exemplos atualizados, campos obrigatórios e validações alinhadas às regras de negócio.
  - Swagger UI (`/docs`) passou a aplicar o envelope automaticamente e expõe exemplos coerentes com o novo contrato.
- **Impacto no frontend:**
  - Atualizar selects para consumir `response.data` e, quando lista, utilizar `response.meta` para paginação.
  - Substituir tipos locais pelo pacote `@efizion/contracts` (ver `packages/contracts`).
  - Ajustar caches e React Query keys considerando que `data` é sempre o payload raiz.
- **Ferramentas novas:**
  - `pnpm openapi:bundle` → recria `docs/openapi/openapi.(json|yaml)`.
  - `pnpm openapi:sdk` → gera cliente Fetch + tipos compartilhados em `packages/contracts`.
  - `pnpm contracts:generate` → executa os dois passos na sequência.

## Referências

- Bundle OpenAPI: `docs/openapi/openapi.yaml`
- SDK/Tipos compartilhados: `packages/contracts`
- Exemplos de payload: seção "Contratos REST, OpenAPI e SDK" no `README.md`
