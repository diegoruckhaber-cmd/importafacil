# Etapa 21 — Pernambuco: regra geral de ICMS

## Escopo
Pernambuco entra inicialmente somente com a regra geral do ICMS nas operações internas ou de importação: **20,5%**, vigente desde 1º de janeiro de 2024 nas demais hipóteses do art. 15, VII, da Lei nº 15.730/2016.

Fonte oficial: https://www.sefaz.pe.gov.br/Legislacao/Tributaria/Documents/legislacao/Leis_Tributarias/2016/Lei15730_2016.htm

## Arquitetura
PE usa `stateEngine: GENERAL` e a fórmula canônica compartilhada do ICMS por dentro. Não há fórmula tributária paralela por estado.

## Fora do escopo inicial
FECEP, PRODEPE, PRODEAUTO, benefícios, reduções, isenções, substituição tributária, regimes especiais e alíquotas específicas por produto. Qualquer solicitação de tratamento especial permanece fail-closed.

## Gate
Regressão dedicada da taxa de 20,5%, fórmula por dentro, two-key activation, bateria completa, build, preview, merge e smoke de produção.
