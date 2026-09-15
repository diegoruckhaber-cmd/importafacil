# ImportaFácil

Motor de simulação de importação com regras tributárias versionadas, rastreabilidade jurídica, comportamento fail-closed e escopo estadual explicitamente homologado.

## Estado atual

- cobertura estadual: **27/27 UFs**;
- novas homologações estaduais usam escopo `general_rate_only`, salvo tratamento específico explicitamente modelado;
- matriz de prontidão: **15/15 itens `verified`**, sem bloqueios P0;
- beta controlado: `released_with_restrictions`;
- release comercial irrestrito: `eligible_for_release_review` — ainda depende de decisão manual de promoção;
- produção: projeto Vercel `importafacil` conectado à branch `main`.

## Fontes de verdade

- prontidão técnica/comercial: `lib/launch-readiness.ts` e `GET /api/launch-readiness`;
- escopo comercial: `lib/release-scope.ts` e `GET /api/release-scope`;
- ativação estadual: `lib/state-activation-guard.ts`;
- documentação de release: `docs/launch-checklist.md`;
- regressão completa: `npm run test:all`.

## Política fiscal

Cobertura nacional não significa suporte automático a todas as exceções tributárias. Benefícios, reduções, isenções, diferimentos, antecipações, ST, fundos/adicionais, regimes especiais e tratamentos específicos permanecem fora do escopo quando não estiverem explicitamente modelados, documentados, testados e homologados.
