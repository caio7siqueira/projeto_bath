# Checklist de QA Automático por PR

## FRONTEND
- [ ] Nenhum FormField sem schema Zod correspondente
- [ ] Nenhum useState em formulário com React Hook Form
- [ ] Nenhum onChange manual em inputs de form
- [ ] Nenhuma chamada HTTP para endpoint inexistente
- [ ] Nenhuma navegação para rota inexistente
- [ ] Console sem 404 ou erros React

## BACKEND
- [ ] Nenhum endpoint fora de /v1
- [ ] Nenhum acesso sem validação de tenant
- [ ] Nenhuma mutação sem validação DTO
- [ ] Nenhuma action destrutiva sem guard explícito

## AUTOMAÇÃO
- [ ] Script para buscar "/pets" como endpoint raiz
- [ ] Script para buscar router.push para rotas inexistentes
- [ ] CI falha se encontrado

## Observações
- O checklist deve ser validado em toda PR antes de merge/deploy.
- Scripts e integração CI estão na pasta `tools/qa`.
