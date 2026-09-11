# Etapa 5 — Hardening P0 de defesa comercial

Data de auditoria: 11/09/2026.

## Objetivo

Fechar os bloqueadores P0 de defesa comercial que afetam cálculo automático. A regra central permanece fail-closed: se produto, origem, produtor/exportador, vigência, suspensão, compromisso de preço ou escopo não puderem ser determinados com segurança, o resultado deve ser `requires_input` e nenhum valor deve ser incorporado ao custo.

## Cobertura compensatória auditada

O índice oficial do MDIC registra medidas compensatórias além de antidumping. O crawler histórico do projeto filtrava apenas páginas cujo tipo continha `antidumping`; por isso a Etapa 5 adiciona uma camada auditada imediata para as medidas compensatórias vigentes que podem ser resolvidas com segurança:

- Corpos moedores para moinho — Índia — NCM 7325.91.00 — 4,69% ad valorem — vigência 01/07/2030;
- Laminados de alumínio — China — NCMs 7606.11.90, 7606.12.90, 7606.91.00, 7606.92.00, 7607.11.90 e 7607.19.90 — 14,88% para Neuman e 14,93% residual — vigência 21/12/2027;
- Produtos de aço inoxidável laminados a frio 304 — Indonésia — NCMs 7219.32.00, 7219.33.00, 7219.34.00, 7219.35.00 e 7220.20.90 — 18,79% ad valorem — vigência 02/12/2027.

Fonte: páginas individuais e índice oficial de medidas em vigor do MDIC/SECEX.

Filmes PET/Índia permanece fora de cálculo automático corrente: a página oficial registra vigência nominal até 30/08/2026. Sem ato posterior auditado que sustente continuidade após essa data, o sistema não deve presumir vigência em 11/09/2026.

## Compromisso de preço

Ácido cítrico originário da China possui direito antidumping e compromisso de preço, com lista de empresas e preço mínimo corrigido periodicamente. A Etapa 5 bloqueia cálculo automático desse cenário até validação do produtor/exportador e da condição de preço aplicável. O sistema não transforma compromisso de preço em benefício presumido.

## Escopo e exclusões

Permanecem travados em `requires_input`:

- ésteres acéticos quando não houver validação da condição de embalagem (exclusão para capacidade não superior a 4 litros);
- batatas congeladas quando a descrição/apresentação puder cair nas exclusões de escopo cadastradas;
- combinações NCM/origem com mais de um escopo oficial coincidente;
- medidas com cobrança suspensa, que são identificadas mas não compõem valor a recolher enquanto a suspensão estiver vigente.

## n-Butanol

As fontes oficiais para Estados Unidos e para África do Sul/Rússia devem permanecer separadas, preservando vigências e matrizes próprias. O teste P0 impede que essas fontes voltem a ser colapsadas.

## Limite operacional

A camada auditada P0 protege produção imediatamente. O sincronizador histórico do MDIC ainda deve ser evoluído em etapa de automação legislativa para ingerir novos tipos de medida de forma automática com revisão humana; o checklist do projeto classifica automação de coleta/triagem legislativa como pós-MVP/P2. Até lá, medidas novas ou não auditadas devem falhar fechadas.

## Gate

A Etapa 5 exige:

- regressão específica de medida compensatória, compromisso de preço, escopo, suspensão e ambiguidade;
- bateria completa `npm run test:all` verde;
- build Next.js verde;
- preview Vercel READY;
- merge e produção READY no mesmo commit aprovado.
