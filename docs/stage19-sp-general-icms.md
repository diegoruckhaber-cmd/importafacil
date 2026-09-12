# Stage 19 — São Paulo: regra geral de ICMS

## Escopo aprovado

A primeira homologação estadual fora de Santa Catarina é deliberadamente restrita à **regra geral de ICMS de importação** de São Paulo.

- UF: SP
- Alíquota geral homologada: **18%**
- Motor estadual: `GENERAL`
- Escopo: `general_rate_only`
- Fórmula do ICMS: reutiliza o motor tributário canônico compartilhado; nenhuma fórmula paulista paralela é criada.

## Base jurídica

Fontes oficiais da Secretaria da Fazenda e Planejamento do Estado de São Paulo:

- RICMS/SP (Decreto 45.490/2000), art. 52, I — alíquota de 18% nas operações internas e nas operações iniciadas no exterior, ressalvadas as exceções legais.
- RICMS/SP, art. 37, IV — base do ICMS na importação.
- RICMS/SP, art. 49 — o imposto integra sua própria base de cálculo.

Fontes:
- https://legislacao.fazenda.sp.gov.br/Paginas/art052.aspx
- https://legislacao.fazenda.sp.gov.br/Paginas/art037.aspx

## Limites explícitos

Esta etapa **não** homologa:

- benefícios fiscais;
- redução de base;
- isenções;
- substituição tributária;
- regimes especiais;
- alíquotas específicas por produto, setor ou hipótese legal;
- qualquer tratamento que dependa de enquadramento além da regra geral.

Esses tratamentos permanecem fora do escopo inicial. O resultado informa essa limitação e a arquitetura continua preparada para ampliar a homologação depois, sem alterar a fórmula central.

## Guardrails

1. O valor de ICMS digitado pelo usuário não substitui a alíquota geral homologada de SP.
2. SP não usa o motor de benefícios de SC.
3. Informar TTD ou regime especial em SP bloqueia o cálculo nesse escopo inicial.
4. UFs ainda não homologadas continuam fail-closed.
5. A ativação requer simultaneamente registro de jurisdição e aprovação de ativação (two-key guard).

## Gate de fechamento

- regressão específica de SP;
- bateria completa de auditoria;
- build de produção;
- preview Vercel READY;
- merge normal;
- deploy de produção READY;
- smoke de produção confirmando SC + SP ativos e demais UFs ainda bloqueadas.
