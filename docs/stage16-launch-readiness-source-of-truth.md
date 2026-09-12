# Etapa 16 — Fonte de verdade de prontidão comercial

## Objetivo
Substituir o checklist manual desatualizado por uma matriz versionada, auditável e consultável pelo próprio sistema.

## Arquitetura
`lib/launch-readiness.ts` centraliza os itens P0/P1/P2, seus status e evidências. O endpoint `GET /api/launch-readiness` expõe a mesma matriz em modo somente leitura.

Nenhum item pode ser marcado como `verified` sem pelo menos uma evidência versionada no repositório. O teste da etapa confirma que todos os caminhos de evidência existem.

## Estado reconciliado
- defesa comercial P0: verificada;
- escopo estadual e bloqueio fora de SC: verificados;
- regressão/build/deploy: verificados;
- status de produto, rastro jurídico, governança legislativa, II temporário, observabilidade e histórico: verificados;
- expansão estadual nacional: em andamento;
- homologação E2E representativa contra memória independente: pendente.

Enquanto o E2E independente permanecer pendente, o lançamento comercial irrestrito fica `blocked`. O beta controlado pode ser classificado apenas como `candidate_with_restrictions`, restrito a cenários homologados e sujeito à revisão operacional.

## Gate
1. todos os itens `verified` possuem evidências existentes no repositório;
2. somente o E2E independente permanece como P0 pendente;
3. expansão estadual permanece `in_progress` e não é confundida com cobertura nacional concluída;
4. o checklist antigo deixa de duplicar checkboxes manuais;
5. `npm run test:all` e `npm run build` permanecem verdes;
6. preview e produção Vercel `READY`, com smoke de `/api/launch-readiness`.
