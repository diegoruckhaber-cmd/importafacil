# Etapa 12 — Histórico/versionamento de regras consultável

## Objetivo
Fechar o item P2 de histórico/versionamento consultável sem criar uma segunda fonte tributária.

## Arquitetura
`GET /api/rule-history` e `/regras` são projeções somente leitura do registro jurídico canônico e da identidade do snapshot federal ativo. Não calculam tributos, não contêm alíquotas próprias e não publicam regras fiscais.

## Fail-closed
A ausência de uma fonte no registro canônico não é preenchida por inferência nesta camada. A interface mostra apenas o que já foi versionado e auditado pelo motor existente; ausência de data de vigência não significa vigência ilimitada.

## Gate
1. `test-rule-history.mjs` passa em `npm run test:all`;
2. toda a regressão permanece verde;
3. build de produção permanece verde;
4. preview Vercel fica `READY`;
5. `/api/rule-history` e `/regras` respondem no preview;
6. após merge, produção fica `READY`, `/api/health` aponta para o SHA do merge e as duas rotas respondem sem erro.
