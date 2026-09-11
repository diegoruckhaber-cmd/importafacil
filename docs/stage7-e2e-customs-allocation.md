# Etapa 7 — Homologação E2E de rateio aduaneiro

## Objetivo

Fechar uma divergência entre o contrato ponta a ponta já documentado em `docs/end-to-end-test-case-01.md` e o motor unificado de produção.

O contrato do projeto estabelece:

- frete internacional rateado segundo a participação do **peso líquido** de cada item no peso líquido total;
- seguro internacional rateado segundo a participação do **FOB** de cada item no FOB total;
- ausência de base válida para rateio deve falhar de forma explícita, nunca cair silenciosamente em outro critério.

Antes desta etapa, o motor unificado rateava tanto frete quanto seguro por valor do item. Isso podia produzir valor aduaneiro incorreto por item quando a proporção de peso era diferente da proporção de FOB.

## Implementação

`lib/unified-import-simulation.ts` passa a:

1. calcular o peso líquido total da operação;
2. bloquear a operação quando houver frete internacional positivo e peso líquido total igual a zero;
3. ratear frete internacional por `weight` no motor de custo;
4. usar a mesma participação de peso no valor aduaneiro enviado ao resolver de defesa comercial;
5. manter o seguro internacional por valor FOB (`item_value`), como já estava;
6. manter conservação integral dos valores rateados.

Nenhuma alíquota, benefício ou fórmula tributária foi criada ou alterada nesta etapa.

## Regressão independente

`scripts/test-e2e-customs-allocation-contract.mjs` usa um cenário em que as proporções de FOB e peso são propositalmente diferentes:

- item A: 10% do peso e 1/3 do FOB;
- item B: 90% do peso e 2/3 do FOB;
- frete: R$ 5.000;
- seguro: R$ 500.

Memória de rateio esperada:

- frete A: R$ 500;
- frete B: R$ 4.500;
- seguro A: R$ 166,666...;
- seguro B: R$ 333,333...;
- valor aduaneiro consolidado: R$ 20.500.

O teste também comprova que frete positivo com peso total zero gera erro explícito.

## Gate

A Etapa 7 só pode ser encerrada quando:

1. a regressão E2E de rateio passar;
2. `npm run test:all` permanecer verde;
3. `npm run build` passar no mesmo commit;
4. preview Vercel estiver `READY`;
5. após merge, o mesmo commit estiver `READY` em produção e o health endpoint responder 200.
