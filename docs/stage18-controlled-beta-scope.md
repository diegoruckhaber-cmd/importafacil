# Etapa 18 — Gate de beta controlado

## Objetivo
Converter a prontidão técnica P0 em uma política comercial explícita, sem confundir beta homologado em SC com cobertura nacional.

## Política
- beta controlado: liberado com restrições quando todos os P0 estão verdes e o guardrail estadual está seguro;
- escopo estadual ativo atual: somente SC;
- lançamento nacional irrestrito: bloqueado enquanto não houver homologação das 27 UFs;
- nenhuma mensagem de prontidão técnica autoriza cálculo estadual fora da matriz homologada.

`GET /api/release-scope` é a fonte de verdade do escopo comercial. A interface exibe o aviso de beta e de cobertura SC de forma persistente.

## Fail-closed
A ampliação do escopo depende da matriz estadual e do guardrail de ativação em duas chaves. Um P0 técnico verde, isoladamente, não cria cobertura tributária nacional.

## Gate
1. beta controlado retorna `released_with_restrictions`;
2. somente SC aparece em `activeUfs`;
3. lançamento irrestrito retorna `blocked_by_state_scope` enquanto faltarem UFs;
4. interface exibe claramente a restrição SC;
5. motor real continua bloqueando SP e demais UFs não homologadas;
6. regressão completa, build, preview e produção permanecem verdes.
