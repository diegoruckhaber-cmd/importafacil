# Etapa 35 — Rio de Janeiro: regra geral de ICMS na importação

O Rio de Janeiro entra inicialmente somente com a alíquota geral de **16% de ICMS na importação**, prevista no art. 14, IV, da Lei nº 2.657/1996 para importações, exceto quando a mercadoria estiver sujeita a tributação específica.

A SEFAZ-RJ apresenta separadamente o adicional de **2% destinado ao FECP**. Por decisão de escopo, esta etapa não calcula o FECP: ele permanece fora da cobertura inicial, assim como mercadorias com tributação específica, benefícios, reduções, isenções, diferimentos, substituição tributária e regimes especiais.

Fontes oficiais:
- https://portal.fazenda.rj.gov.br/icms/wp-content/uploads/sites/42/2023/10/Tributacao-RJ-consumidor-final.pdf
- https://portal.fazenda.rj.gov.br/pagamentos/wp-content/uploads/sites/40/2023/10/Tributacao-RJ-consumidor-final.pdf

A etapa reutiliza o motor `GENERAL` e a fórmula canônica de ICMS por dentro. O percentual manual informado pelo usuário não substitui a regra homologada do RJ.
