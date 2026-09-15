# Etapa 45 — Revisão nacional de release

## Objetivo

Formalizar o gate posterior à conclusão da cobertura estadual 27/27, reconciliar a documentação de lançamento com as fontes executáveis de verdade e separar de forma inequívoca **elegibilidade técnica** de **autorização comercial irrestrita**.

A Etapa 45 não altera fórmulas tributárias, não amplia o escopo fiscal e não autoriza automaticamente o go-live nacional irrestrito.

## Fontes de verdade

- prontidão: `lib/launch-readiness.ts` / `GET /api/launch-readiness`;
- escopo comercial: `lib/release-scope.ts` / `GET /api/release-scope`;
- ativação estadual: `lib/state-activation-guard.ts`;
- auditoria completa: `npm run test:all`;
- build de produção: `npm run build`.

## Pré-condições para revisão nacional

A revisão só pode ser considerada tecnicamente elegível quando, simultaneamente:

1. os 15 itens da matriz de prontidão estiverem `verified`;
2. não houver bloqueio P0;
3. o guardrail de ativação estadual estiver seguro;
4. as 27 UFs estiverem ativas e homologadas;
5. o release irrestrito retornar `eligible_for_release_review`;
6. regressão completa e build permanecerem verdes;
7. preview e produção estiverem `READY`;
8. os endpoints de produção refletirem os mesmos contratos versionados do repositório.

Qualquer regressão futura em um desses pré-requisitos deve impedir a promoção e manter o comportamento fail-closed.

## Escopo fiscal preservado

A cobertura 27/27 significa cobertura da regra explicitamente homologada para cada UF. Para UFs em `general_rate_only`, permanece autorizada somente a regra geral de ICMS de importação modelada na etapa correspondente.

Continuam fora do escopo automático, salvo implementação e homologação específicas: benefícios fiscais, reduções de base, isenções, diferimentos, antecipações, substituição tributária, fundos/adicionais, regimes especiais e alíquotas ou tratamentos específicos por produto, setor, contribuinte ou operação.

Nenhum desses tratamentos pode ser inferido por fallback silencioso.

## Decisão de release

O estado `eligible_for_release_review` representa **prontidão técnica para revisão**, e não autorização de lançamento irrestrito. A mudança para um eventual estado comercial irrestrito exige decisão manual explícita e uma etapa própria de promoção, com evidência versionada.

Portanto, esta etapa encerra a revisão técnica pós-27/27 sem alterar o status comercial irrestrito atual.

## Gate da Etapa 45

1. `docs/launch-checklist.md` reconciliado com 15/15, zero P0 e 27/27;
2. documentação diferencia `released_with_restrictions` de `eligible_for_release_review`;
3. teste automatizado confirma as 27 UFs, ausência de P0 e permanência do gate manual;
4. nenhuma regra tributária ou fórmula é alterada;
5. `npm run test:all` verde;
6. `npm run build` verde;
7. preview Vercel `READY` e smoke dos endpoints de readiness/release-scope consistente;
8. após merge, produção `READY` e smoke final consistente.
