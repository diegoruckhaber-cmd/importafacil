# Etapa 13 — Matriz canônica de jurisdições estaduais

## Objetivo
Dar início à expansão estadual progressiva sem aplicar regras de uma UF a outra e sem cadastrar alíquotas por inferência.

## Arquitetura
A matriz `state-jurisdiction-registry.ts` é apenas metadado de capacidade. Ela informa quais UFs possuem motor estadual homologado; não contém fórmulas, alíquotas, benefícios ou regras fiscais duplicadas.

Nesta etapa:
- SC permanece a única UF homologada;
- as 26 demais UFs ficam explicitamente `unsupported`;
- `GET /api/state-jurisdictions` expõe a matriz em modo somente leitura;
- o motor atual continua sendo a fonte de cálculo e continua bloqueando UFs não homologadas.

## Fail-closed
Uma UF só pode mudar de `unsupported` para `homologated` após pacote jurídico e bateria de regressão próprios. Ausência de evidência nunca é convertida em suporte implícito.

## Gate
1. a matriz contém exatamente as 27 UFs;
2. somente SC aparece como homologada;
3. o cálculo SC continua funcionando;
4. UF não homologada continua bloqueada no motor real;
5. `npm run test:all` e `npm run build` verdes;
6. preview e produção Vercel `READY`, com smoke de `/api/state-jurisdictions`.
