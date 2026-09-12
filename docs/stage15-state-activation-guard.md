# Etapa 15 — Guardrail de ativação estadual em duas chaves

## Objetivo
Impedir que uma UF passe a ser tratada como ativa por uma alteração isolada de configuração ou por um pacote de evidências sem ativação correspondente.

## Arquitetura
A ativação passa a ter duas chaves independentes de governança:
1. a UF precisa constar como `homologated` na matriz de jurisdições;
2. precisa existir aprovação de ativação correspondente, com revisão jurídica e regressões verificadas e motor estadual compatível.

A aprovação contém somente metadados de governança. Não contém alíquotas, fórmulas, benefícios ou regras de elegibilidade fiscal.

`GET /api/state-homologation/status` expõe o resultado do guardrail em modo somente leitura.

## Fail-closed
- matriz marcada como homologada sem aprovação: `blocked`;
- aprovação sem UF homologada na matriz: não ativa a UF;
- revisão jurídica ou regressões não verificadas: `blocked`;
- divergência entre motor aprovado e motor cadastrado: `blocked`.

## Estado após esta etapa
SC continua sendo a única UF ativa. Nenhuma nova UF foi homologada sem pacote jurídico e motor estadual próprios.

## Gate
1. estado atual retorna `safe` com `activeUfs: ["SC"]`;
2. ativação somente na matriz é bloqueada;
3. aprovação isolada não ativa UF não homologada;
4. SP continua bloqueada no motor real;
5. `npm run test:all` e `npm run build` verdes;
6. preview e produção Vercel `READY`, com smoke de `/api/state-homologation/status`.
