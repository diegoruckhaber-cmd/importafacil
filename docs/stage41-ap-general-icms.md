# Etapa 41 — Amapá: ICMS geral de importação

## Escopo homologado

A Etapa 41 adiciona o Amapá ao motor estadual compartilhado `GENERAL` exclusivamente no escopo `general_rate_only`.

- UF: AP
- alíquota geral: 18%
- vigência adotada: 01/02/2016
- fórmula: a mesma fórmula compartilhada de ICMS-importação já usada pelas demais UFs `general_rate_only`; nenhuma fórmula tributária foi duplicada.

## Fundamento jurídico

A regra é sustentada pela Lei estadual nº 400/1997, art. 37, III, `i`, com redação da Lei nº 1.949/2015, que elevou a alíquota modal para 18%, e pelo art. 37, § 1º, V, que determina a aplicação das alíquotas internas à importação do exterior quando não utilizados os benefícios fiscais da Lei Federal nº 8.387/1991. O Decreto estadual nº 1.126/2016 ajustou o RICMS/AP à alíquota modal de 18%.

Fontes registradas no catálogo:

- https://elegis.al.ap.leg.br/portal/proposicao/2859/texto-integral
- https://diofe.portal.ap.gov.br/
- https://www.legisweb.com.br/legislacao/?id=318724

## Exclusões deliberadas

A homologação não modela a Área de Livre Comércio de Macapá e Santana (ALCMS) nem benefícios vinculados à Lei Federal nº 8.387/1991. Também permanecem fora do escopo benefícios, reduções, isenções, diferimentos, antecipações, substituição tributária, regimes especiais e alíquotas específicas por produto ou operação.

Quando a operação depender desses enquadramentos, o produto deve permanecer fail-closed em vez de aplicar a alíquota geral como fallback.

## Ativação e regressão

AP entra com as duas chaves exigidas pela arquitetura: registro estadual homologado e aprovação explícita de ativação `stage41-ap-general-rate`. A regressão dedicada valida a alíquota, a base `por dentro`, o valor do imposto, o warning de escopo, o bloqueio de TTD fora de SC e a manutenção de uma UF não homologada como controle negativo.

Ao final da etapa, o beta controlado passa a 24 UFs ativas. RR, SE e TO permanecem não homologadas, e o lançamento nacional irrestrito continua bloqueado.

## Ajuste de proveniência de Alagoas

Durante a alteração da matriz estadual, o identificador jurídico de AL foi alinhado da referência histórica à Lei nº 8.779/2022 para a Lei nº 9.776/2025, que sustenta a alíquota vigente de 20,5% desde 01/04/2026. Não houve alteração adicional na fórmula nem na alíquota de AL nesta etapa.
