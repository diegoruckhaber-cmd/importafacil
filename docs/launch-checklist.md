# ImportaFácil — Prontidão de lançamento

A fonte canônica e executável de prontidão técnica/comercial é `lib/launch-readiness.ts`, exposta em modo somente leitura por `GET /api/launch-readiness`. A fonte canônica do escopo comercial é `lib/release-scope.ts`, exposta por `GET /api/release-scope`.

Este arquivo é apenas um resumo humano. Em qualquer divergência, os contratos executáveis e seus testes prevalecem.

## Estado atual — após Etapa 44

- matriz de prontidão: **15/15 itens `verified`**;
- bloqueios P0: **zero**;
- escopo estadual homologado: **27/27 UFs**;
- política estadual das novas UFs: `general_rate_only`, salvo tratamentos explicitamente modelados e homologados;
- beta controlado: **`released_with_restrictions`** no contrato de escopo comercial;
- lançamento comercial irrestrito: **`eligible_for_release_review`**;
- expansão estadual nacional: **concluída**;
- comportamento fora do escopo: **fail-closed**.

## Limite da elegibilidade técnica

`eligible_for_release_review` não significa lançamento comercial irrestrito autorizado. A cobertura nacional removeu o bloqueio técnico de escopo estadual, mas a autorização final de go-live irrestrito continua sendo uma decisão manual de release.

A conclusão das 27 UFs não amplia o escopo tributário automaticamente. Benefícios, reduções, isenções, diferimentos, antecipações, substituição tributária, fundos/adicionais, regimes especiais e tratamentos específicos por produto ou setor continuam bloqueados quando não estiverem explicitamente modelados, documentados, testados e homologados.

Uma alteração de status só deve ocorrer junto com evidência versionada e regressão correspondente.
