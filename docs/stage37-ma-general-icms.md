# Etapa 37 — Maranhão: regra geral de ICMS

O Maranhão entra inicialmente somente com a alíquota modal de **23%** para mercadorias e bens não abrangidos por hipóteses específicas. A Lei nº 12.426/2024 alterou a Lei nº 7.799/2002, e a nova alíquota produz efeitos a partir de **23/02/2025**.

Nas importações do exterior, aplica-se a alíquota interna pertinente à mercadoria ou ao bem. Para o escopo operacional desta etapa, o ImportaFácil reutiliza o motor `GENERAL` e a fórmula canônica de ICMS por dentro.

Fontes oficiais:
- https://www.diariooficial.ma.gov.br/download.eassinado.php?arq=EX20241125&arqv=2
- https://ui-sgc.sefaz.ma.gov.br/sgc/api/portal/arquivos/public/identificador?identificador=6a44492f-99c4-4e9d-a2c9-4ef275eb0008

FEPA/adicionais quando aplicáveis, mercadorias com alíquotas específicas, benefícios, reduções, isenções, diferimentos, antecipações, substituição tributária, regimes especiais e tratamentos setoriais permanecem fora do escopo inicial e fail-closed.
