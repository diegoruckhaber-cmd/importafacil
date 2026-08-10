# Motor tributário — escopo e validação

## Objetivo

Separar o cálculo tributário da calculadora comercial e evoluí-lo por regras explícitas. O motor deve distinguir **base de cálculo**, **alíquota**, **valor calculado**, **valor devido** e **valor a recolher**, seguindo a estrutura usada pelo Siscomex.

## Camada atual — baseline ad valorem

A primeira camada suporta uma operação ordinária estimativa com:

- valor aduaneiro;
- II ad valorem;
- IPI ad valorem;
- PIS-Importação ad valorem;
- Cofins-Importação ad valorem;
- ICMS por dentro;
- outras despesas informadas pelo usuário.

Ela não presume tratamento fiscal que dependa de NCM, UF, fundamento legal ou regime especial.

## Regras que NÃO devem ser embutidas como constantes

- redução ou suspensão de tributos;
- isenção ou não incidência;
- alíquota específica;
- direitos antidumping ou compensatórios;
- CIDE;
- AFRMM;
- benefícios fiscais estaduais;
- ICMS-ST;
- regimes aduaneiros especiais;
- Simples Nacional, Lucro Presumido ou Lucro Real para fins de crédito/custo;
- IBS/CBS da Reforma Tributária.

Esses itens deverão entrar por regras parametrizadas e com vigência temporal.

## Caso de referência — valor aduaneiro

Para validação da formação do valor aduaneiro, usar o conceito oficial: mercadoria + frete + seguro, observadas as regras de valoração aduaneira e eventuais acréscimos/deduções legais.

## Caso de referência — ICMS por dentro

Para um cenário simplificado sem outras parcelas na base:

`BC ICMS = (valor aduaneiro + II) / (1 - alíquota ICMS)`

`ICMS = BC ICMS × alíquota ICMS`

Esse caso deve reproduzir os exemplos oficiais antes de adicionar parcelas estaduais específicas.

## Próximas camadas

1. Modelo de operação: NCM, UF destino, origem, data, Incoterm e modalidade.
2. Tabela de regras por vigência.
3. Tratamento de alíquotas ad valorem e específicas.
4. Fundamento legal e eventos de redução/suspensão/não incidência.
5. ICMS por UF e composição da base.
6. Créditos e distinção entre desembolso tributário e custo efetivo.
7. IBS/CBS 2026–2033.
8. Casos de teste automatizados antes de publicar o motor em produção.
