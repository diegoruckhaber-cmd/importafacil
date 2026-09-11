# Etapa 9 — Rastro jurídico no resultado da Simulation V2

## Objetivo

Fechar o item P1 do checklist de lançamento que exige que fonte legal, vigência e motivo do bloqueio/tratamento especial apareçam no resultado quando houver tratamento fiscal especial.

A etapa não cria fundamentos jurídicos novos e não recalcula tributos. Ela apenas projeta, em um contrato uniforme de auditoria, metadados que já são produzidos pelos resolvers homologados.

## Contrato

`POST /api/simulation-v2` passa a retornar `legalTrace`, com entradas por item e por área:

- `federal`: II e IPI, com status, fundamento, fonte/URL e vigência quando presentes no snapshot oficial;
- `defense_commercial`: tipo de medida, fundamento, fonte oficial, URL, validade e condição/razão quando houver;
- `state`: TTD/regime especial SC, decisão, fundamentos/reasons já produzidos pelo motor estadual e bloqueios existentes.

O mesmo conteúdo é convertido em texto e anexado a `attentionPoints`, portanto aparece na interface existente sem criar um segundo motor ou caminho de cálculo.

## Guardrails

- a projeção é posterior ao cálculo/resolução;
- a camada de proveniência não importa nem chama motores tributários;
- ausência de metadado não é preenchida por inferência;
- URL só é exposta quando já veio do resolver/catálogo;
- tratamento estadual comum, sem TTD/regime/bloqueio, não gera ruído de proveniência especial;
- status do cálculo não é alterado apenas pela presença do rastro jurídico.

## Gate de aceite

A etapa só é encerrada quando:

1. `test-simulation-v2-legal-provenance.mjs` passa dentro de `npm run test:all`;
2. toda a regressão pré-existente permanece verde;
3. `npm run build` passa no mesmo commit;
4. preview Vercel fica `READY`;
5. `/simulacao-v2` e `/api/simulation-v2` continuam funcionais;
6. após merge, produção fica `READY` no commit aprovado.
