# Etapa 8 — Escopo estadual homologado e fail-closed por UF

## Objetivo

Fechar o bloqueador P0 do checklist que exige declarar quais UFs/cenários de ICMS estão efetivamente homologados e impedir que operações fora desse escopo recebam cálculo estadual indevido.

O motor estadual existente do ImportaFácil é um motor de **Santa Catarina**. Antes desta etapa, o contrato unificado não carregava a UF da operação. Uma integração podia, portanto, fornecer dados de uma operação destinada a outra UF e ainda assim receber as regras estaduais de SC.

## Escopo homologado nesta versão

- **SC — Santa Catarina:** homologado para o motor estadual automático já existente e seus cenários cobertos pelas regressões jurídicas/fiscais.
- **Demais UFs:** não homologadas nesta versão. O cálculo estadual automático é bloqueado explicitamente.

A ausência de `destinationUf` em consumidores legados continua sendo interpretada como `SC`, porque todos os fluxos existentes foram construídos sobre o motor SC. Novas integrações devem enviar a UF explicitamente.

## Contrato

`UnifiedImportSimulationInput` passa a aceitar `destinationUf`.

O resultado calculado inclui:

```text
jurisdiction.destinationUf
jurisdiction.stateEngine
jurisdiction.status
jurisdiction.homologatedUfs
operation.destinationUf
```

Para uma UF diferente de SC, o motor não tenta adaptar alíquota, benefício, DIFAL ou regra de outro estado. Ele encerra o cálculo com mensagem explícita de UF não homologada.

A Simulation V2 preserva o campo até o motor canônico e converte a tentativa de cálculo fora de SC para status `blocked`, issue `state_jurisdiction_unsupported` e `summary: null`.

## Fail-closed

O gate é executado **antes** da resolução monetária estadual. Isso evita que:

- ICMS de SC seja aplicado em uma operação de SP, ES, PE, PR, RO, MG, MS, RJ ou outra UF;
- benefícios/TTDs de SC sejam tratados como se fossem benefícios nacionais;
- uma UF não homologada seja silenciosamente reduzida a tributação normal de SC.

## Regressão

`scripts/test-state-jurisdiction-scope.mjs` trava:

1. SC explícito, inclusive normalização de `sc` para `SC`;
2. compatibilidade dos consumidores legados, cujo contexto existente é SC;
3. bloqueio de SP, ES, PE, PR, RO, MG, MS e RJ;
4. rejeição de UF em formato inválido;
5. propagação da jurisdição pela Simulation V2;
6. resposta V2 `blocked` e sem resumo monetário para UF fora do escopo;
7. transporte do campo na API `/api/sc-federal-calculate`.

## Gate de encerramento

A Etapa 8 só pode ser encerrada quando:

- a regressão de jurisdição passar;
- a bateria completa permanecer verde;
- build/TypeScript passarem no mesmo commit;
- preview Vercel estiver `READY`;
- o merge estiver `READY` em produção e `/api/health` responder 200.

Expandir a cobertura estadual é trabalho futuro por UF, com fonte jurídica, memória de cálculo e homologação próprias. Não deve ser feito por fallback genérico.
