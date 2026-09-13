# Etapa 36 — Rio Grande do Norte: regra geral de ICMS

O Rio Grande do Norte entra inicialmente somente com a alíquota modal de **20%** para mercadorias, bens e serviços não abrangidos pelas hipóteses específicas. A Lei nº 11.999/2024 alterou o art. 27, I, `a`, da Lei nº 6.968/1996. Para o escopo operacional do ImportaFácil, adota-se **01/04/2025** como início seguro da alíquota majorada, em linha com a implementação regulamentar estadual.

Nas importações do exterior, a legislação estadual remete às alíquotas internas aplicáveis conforme a mercadoria. A etapa reutiliza o motor `GENERAL` e a fórmula canônica de ICMS por dentro.

Fontes oficiais:
- https://www.al.rn.leg.br/storage/legislacao/2025/stqpzaxnkhj8e1efdy6wnsk815m85v.pdf
- https://webdisk.diariooficial.rn.gov.br/Jornal/12024-12-20.pdf
- https://www.al.rn.leg.br/noticia/31640/deputados-aprovam-adequacao-do-icms-de-18-para-20

FECOP/adicionais quando aplicáveis, produtos com alíquotas específicas, benefícios, reduções, isenções, diferimentos, substituição tributária, regimes especiais e tratamentos setoriais permanecem fora do escopo inicial e fail-closed.
