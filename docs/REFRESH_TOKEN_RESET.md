# Comunicado: reset dos refresh tokens

Em 02/01/2026 atualizamos o backend para armazenar refresh tokens com hash, `jti` e cadeia de
revogação no banco (`refresh_token` table). Essa mudança impede o reuso de tokens roubados e
permite logout seletivo, mas invalida **todos os tokens emitidos antes do deploy**.

## O que muda para os usuários

1. Qualquer sessão persistida em navegadores, apps móveis ou integrações perderá a capacidade de
   renovar o token automaticamente.
2. Ao receber `401 ERR_UNAUTHORIZED` durante o refresh, basta executar um novo login / OTP para
   obter um par válido de tokens.
3. Depois do novo login, os tokens passam a ser rotacionados automaticamente a cada refresh e o
   logout expira apenas a sessão atual (ou todas, se o usuário solicitar).

## Instruções para a equipe de suporte

- Prepare respostas padrão informando que o re-login é esperado após o deploy de 02/01/2026.
- Oriente os clientes a: (a) sair do sistema, (b) limpar cache apenas se o problema persistir,
  (c) efetuar novo login (ou solicitar OTP) para forçar a emissão de um refresh token compatível.
- Monitore o dashboard de autenticação; picos de `ERR_UNAUTHORIZED` após `POST /v1/auth/refresh`
  durante a primeira hora são normais.
- Em caso de múltiplos dispositivos por usuário, cada um precisará repetir o processo apenas uma
  vez.

## Referências técnicas

- Implementação: [`AuthService.issueTokens`](../apps/api/src/modules/auth/auth.service.ts).
- Auditoria: novas colunas `jti`, `replacedByTokenId` e `revokedAt` permitem rastrear a árvore de
  sessões.
