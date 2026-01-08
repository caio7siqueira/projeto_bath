# Arquitetura (resumo)

- Monorepo com `apps` (api, worker, web) e `packages`.
- API NestJS com Swagger, prefixo `/v1`, envelope `{ data, meta }` automático e bundle OpenAPI versionado em `docs/openapi`.
- Worker NestJS com BullMQ e filas: omie, notifications, recurrence.
- Web Next.js com PWA habilitável consumindo o SDK `@efizion/contracts`.
- Banco Postgres com Prisma.

## Validação de Permissões do Runner

Para garantir que o runner possui as permissões corretas para criar pull requests, implementamos um mecanismo de validação que verifica as permissões do runner antes de permitir a criação de PRs. Este mecanismo assegura que o runner está alinhado com os níveis de acesso necessários, evitando problemas de permissões insuficientes.

### Mecanismo de Validação

1. **Verificação de Permissões**: Antes de iniciar o processo de criação de um PR, o sistema verifica se o runner possui as permissões necessárias. Isso inclui acesso de leitura e escrita ao repositório e permissões específicas para criar branches e PRs.

2. **Logs de Auditoria**: Todas as tentativas de criação de PRs são registradas em logs de auditoria, permitindo o monitoramento e a revisão das ações do runner.

3. **Notificações de Erro**: Caso o runner não possua as permissões adequadas, uma notificação de erro é gerada, detalhando quais permissões estão faltando e sugerindo ações corretivas.

4. **Documentação e Suporte**: A documentação do projeto inclui uma seção dedicada às permissões necessárias para o runner, além de orientações sobre como configurar corretamente o ambiente para evitar problemas de permissão.

Este mecanismo de validação é essencial para manter a integridade e a segurança do processo de desenvolvimento, garantindo que apenas runners devidamente autorizados possam interagir com o repositório de forma significativa.