# Modelo de custos operacionais da importação

## Objetivo

O ImportaFácil deve calcular o custo econômico completo da operação, sem confundir custo operacional com base tributária.

## Camadas

1. Custo internacional: mercadoria, frete e seguro internacionais.
2. Tributos: II, IPI, PIS/Cofins-Importação, ICMS e demais tributos aplicáveis.
3. Custos operacionais: terminal/porto, armazenagem, handling, agente de carga, despachante, transporte nacional, inspeções, certificados, taxas bancárias e outros.
4. Custo financeiro: câmbio, financiamento/capital e demais despesas financeiras, quando informadas.

## Despesa operacional

Cada despesa deve possuir:

- categoria;
- descrição;
- fornecedor opcional;
- moeda;
- valor;
- incidência tributária, quando conhecida;
- possibilidade de crédito, quando conhecida;
- critério de rateio;
- item(s) beneficiário(s);
- origem do valor: informado, estimado ou tabela salva;
- observação e fonte, quando aplicável.

## Critérios de rateio

O sistema deve distinguir:

- **rateio fiscal**: somente quando houver fundamento que determine o critério;
- **rateio gerencial**: usado para apurar custo por item.

Para o valor aduaneiro da DUIMP, frete internacional deve seguir o rateio oficial por peso líquido e seguro internacional por FOB. Esse critério não deve ser reutilizado automaticamente para despesas operacionais que não integrem o valor aduaneiro.

Para despesas gerenciais, permitir valor FOB, peso, quantidade, volume, valor aduaneiro e percentual manual.

## Estimativa sem falsa precisão

Quando o usuário não informar uma despesa, o sistema poderá estimá-la apenas se existir uma tabela parametrizada e versionada. O resultado deve identificar o valor como **estimado**, nunca como custo confirmado.

Exemplo:

- THC: estimado — tabela do terminal;
- honorários de despacho: informado pelo usuário;
- transporte nacional: cotação informada;
- armazenagem: não informado.

## Resultado

A interface deve separar:

- custo internacional;
- carga tributária;
- custos operacionais;
- custo financeiro;
- custo total;
- custo por item.

O usuário deve conseguir abrir o detalhamento de cada grupo e visualizar a origem de cada valor.

## Regra de segurança fiscal

Uma despesa operacional não deve ser automaticamente adicionada à base de II, IPI, PIS/Cofins ou ICMS apenas por estar no custo total. O tratamento fiscal e o tratamento gerencial são dimensões separadas e devem ser calculados por regras específicas.

A documentação da Receita sobre DUIMP distingue o valor aduaneiro e os acréscimos/deduções próprios da valoração, enquanto despesas locais podem ter tratamento distinto. O motor deve respeitar essa separação.

## Próxima implementação

Construir tipos e funções para cadastrar despesas operacionais, validar moeda/valor, classificar a despesa, rateá-la aos itens e consolidar o custo posto. Em seguida, conectar a interface progressiva para mostrar somente as categorias relevantes ao usuário.
