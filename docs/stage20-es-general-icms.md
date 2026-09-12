# Stage 20 — Espírito Santo: regra geral de ICMS

## Escopo aprovado
A homologação inicial do Espírito Santo é restrita à regra geral de ICMS de importação.

- UF: ES
- alíquota geral homologada: **17%**
- motor estadual: `GENERAL`
- escopo: `general_rate_only`
- fórmula: motor tributário canônico compartilhado; nenhuma fórmula estadual paralela.

## Base jurídica
O RICMS/ES, Decreto nº 1.090-R/2002, art. 71, I, estabelece alíquota de 17% nas operações no território do Estado e no recebimento/entrada de mercadorias ou bens importados do exterior, ressalvadas as hipóteses específicas previstas no próprio artigo.

Fonte oficial auditada em 12/09/2026:
- https://www2.sefaz.es.gov.br/LegislacaoOnline/lpext.dll/InfobaseLegislacaoOnline/ricms%20-%20dec%201090-r/02%20-%20t%EF%BF%BDtulo%20i/17%20-%20cap%20viii.htm?2.0=&f=templates&fn=document-frame.htm

## Fora do escopo inicial
Benefícios fiscais, FUNDAP/COMPETE/INVEST, reduções de base, isenções, ST, regimes especiais e alíquotas específicas por produto permanecem fora do escopo. Informações de TTD/regime especial continuam bloqueando o motor `GENERAL`.

## Gate
1. regressão específica de ES;
2. bateria completa de auditoria;
3. build de produção;
4. preview Vercel READY;
5. merge normal;
6. produção READY;
7. smoke comprovando ES + SC + SP ativos e demais UFs fail-closed.
