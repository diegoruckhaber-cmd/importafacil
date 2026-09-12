# ImportaFácil — Prontidão de lançamento

A fonte canônica de prontidão comercial é `lib/launch-readiness.ts`.

O status consolidado pode ser consultado em `GET /api/launch-readiness`.

Este arquivo não duplica checkboxes manuais para evitar divergência entre documentação e código. Cada item da matriz possui prioridade (`P0`, `P1`, `P2`), status (`verified`, `in_progress`, `pending`), evidências versionadas e nota de escopo.

## Estado atual

- beta controlado: candidato com restrições;
- lançamento comercial irrestrito: bloqueado;
- único P0 ainda pendente: homologação E2E representativa contra memória de cálculo independente;
- escopo estadual ativo: SC;
- expansão estadual nacional: em andamento e fail-closed.

Uma alteração de status só deve ocorrer junto com evidência versionada e regressão correspondente.
