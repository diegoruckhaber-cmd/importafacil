# Etapa 38 — Amazonas: regra geral de ICMS

O Amazonas entra inicialmente somente com a alíquota geral de **20%** para as demais mercadorias. A Lei Complementar nº 242/2022 alterou o art. 12, I, `b`, do Código Tributário Estadual (LC nº 19/1997). Para o escopo operacional do ImportaFácil, adota-se **01/04/2023**, data das tabelas de tributação publicadas pela SEFAZ/AM após a alteração.

O art. 12, § 1º, III, do Código Tributário do Amazonas determina que as alíquotas internas são aplicadas à entrada de mercadorias ou bens importados do exterior. A etapa reutiliza o motor `GENERAL` e a fórmula canônica de ICMS por dentro.

Fontes oficiais:
- https://legisla.imprensaoficial.am.gov.br/diario_am/10/1997/12/2962
- https://legisla.imprensaoficial.am.gov.br/diario_am/10/2022/12/9242
- https://online.sefaz.am.gov.br/sinf2004/DI/index.asp

Zona Franca de Manaus, incentivos fiscais, reduções de base/carga (inclusive hipóteses de ativo permanente), remessas internacionais sujeitas ao RTS, adicionais, isenções, diferimentos, antecipações, substituição tributária, combustíveis, regimes especiais e alíquotas específicas permanecem fora do escopo inicial e fail-closed.
