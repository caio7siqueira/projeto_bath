# Envelope global de erros

Todas as rotas HTTP da API retornam erros padronizados no formato abaixo, emitido pelo filtro
[`GlobalExceptionFilter`](../apps/api/src/common/filters/global-exception.filter.ts):

```json
{
  "code": "ERR_BAD_REQUEST",
  "message": "Requisição inválida. Confira os campos enviados.",
  "details": {
    "fields": ["startsAt deve ser menor que endsAt"],
    "path": "/v1/appointments",
    "method": "POST",
    "requestId": "3f2f7c6b-0f5a-4d5a-8fb4-5d1b42e9af3b"
  }
}
```

## Exemplos reais

| Cenário | Endpoint | Status | Corpo de resposta |
| --- | --- | --- | --- |
| Validação de payload (duração inválida) | `POST /v1/appointments` | 400 | ```json
{
  "code": "ERR_BAD_REQUEST",
  "message": "Requisição inválida. Confira os campos enviados.",
  "details": {
    "fields": [
      "startsAt deve ser anterior a endsAt"
    ],
    "path": "/v1/appointments",
    "method": "POST"
  }
}
``` |
| Regra de negócio (slug duplicado) | `POST /v1/tenants` | 409 | ```json
{
  "code": "ERR_DUPLICATE_VALUE",
  "message": "Já existe um registro com os mesmos dados.",
  "details": {
    "campos": ["slug"],
    "path": "/v1/tenants",
    "method": "POST"
  }
}
``` |
| Acesso negado / isolamento multi-tenant | `GET /v1/protected/tenant/:id` | 403 | ```json
{
  "code": "ERR_FORBIDDEN",
  "message": "Você não possui permissão para acessar este recurso.",
  "details": {
    "path": "/v1/protected/tenant/2f432...",
    "method": "GET"
  }
}
``` |

## Convenções

- `code` segue a tabela definida em `STATUS_CODE_MAP`, garantindo previsibilidade para o frontend.
- `message` sempre exibe uma frase amigável em português; detalhes específicos residem em `details`.
- `details.requestId` é preenchido automaticamente quando o cabeçalho `x-request-id` é enviado (ou gerado internamente).
- Para erros de validação (`class-validator`), o array original retornado pelo Nest entra em `details.fields`.
- Logs estruturados utilizam o mesmo `requestId`, facilitando correlação no Grafana/Sentry.

Consuma esses códigos no frontend para decidir mensagens e fluxos (ex.: `ERR_RATE_LIMITED` pode renderizar UI de espera).
