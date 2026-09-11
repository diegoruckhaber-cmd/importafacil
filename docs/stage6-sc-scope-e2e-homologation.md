# Etapa 6 — SC scope end-to-end homologation

## Objetivo

Fechar a diferença entre **ter um corpus jurídico de Santa Catarina** e **provar que o motor de decisão usado em produção respeita esse corpus**.

A etapa não cria alíquotas, não altera bases de cálculo e não inventa benefícios. Ela amplia apenas o contrato factual da camada conservadora de elegibilidade e trava os comportamentos esperados por regressão executável.

## Escopo homologado

O `sc-decision-engine` passa a reconhecer explicitamente os fatos jurídicos já presentes no corpus 2026:

- TTD 409 e 410 para comercialização;
- TTD 410 com destinação industrial;
- combinação lógica 409/410 para fracionamento;
- alteração ou manutenção da posição NCM após fracionamento;
- vedação do Decreto 2.128/2009;
- coincidência de NCM sem correspondência automática da descrição legal;
- origem Paraguai com configuração rodoviária tratada de forma condicional;
- limiar agregado do art. 110-B para Mercosul (`< 50%` e `>= 50%`);
- transferência interestadual entre estabelecimentos do mesmo titular;
- ausência de eleição tributária quando exigida;
- coexistência 409 + 77 em operação multi-item;
- compatibilidade com redução específica de base de cálculo;
- ausência de ato concessivo válido.

## Semântica fail-closed

- `apply`: os fatos informados bastam para a decisão de elegibilidade daquela camada; cálculos monetários continuam nos motores próprios.
- `conditional`: existe enquadramento possível, porém falta condição, comprovação ou compatibilidade que não pode ser presumida.
- `deny`: há fato conhecido incompatível com a concessão automática.

Nenhum caso `conditional` é promovido a `apply` por conveniência econômica.

## Gate de aceite

O teste `scripts/test-sc-decision-engine-homologation.mjs` executa os 13 casos de `SC_DECISION_REGRESSION_CASES` contra `decideSCItem`, que é a função de produção. Além disso, trava independência multi-item, fronteira do limiar de 50% e transferência sem eleição.

A Etapa 6 só pode ser encerrada quando:

1. 13/13 casos jurídicos do corpus produzirem a decisão esperada no motor real;
2. `npm run test:all` permanecer verde;
3. `npm run build` passar no mesmo commit;
4. preview Vercel estiver `READY`;
5. após merge, o deploy de produção do mesmo commit estiver `READY`.
