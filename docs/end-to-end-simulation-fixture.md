# Fixture de simulação ponta a ponta

Este cenário é um caso de teste funcional do ImportaFácil. Os números abaixo são deliberadamente hipotéticos e servem para validar arquitetura, rateio, rastreabilidade e UX; não devem ser tratados como alíquotas fiscais reais.

## Operação

- Data de referência: 2026-08-12
- Origem: China
- Destino: Santa Catarina
- Moeda: USD
- Câmbio de teste: R$ 5,40
- Incoterm: CIF
- Frete internacional total: USD 5.000,00
- Seguro internacional total: USD 300,00
- Regime tributário: Lucro Presumido
- Regime especial: não informado

## Itens

| Item | NCM de teste | Quantidade | FOB unitário USD | Peso líquido kg |
|---|---|---:|---:|---:|
| A | 3907.00.00 | 500 | 10,00 | 8.000 |
| B | 3206.00.00 | 200 | 25,00 | 2.000 |
| C | 3812.00.00 | 100 | 40,00 | 500 |

FOB total: USD 15.000,00
Peso total: 10.500 kg

## Rateio esperado

O padrão fiscal do motor deve seguir a lógica documentada para DUIMP:

- Frete por peso líquido: item A 76,190476%; item B 19,047619%; item C 4,761905%.
- Seguro por FOB: item A 33,333333%; item B 33,333333%; item C 33,333333%.

Valores de teste:

- Frete A: USD 3.809,52381
- Frete B: USD 952,38095
- Frete C: USD 238,09524
- Seguro A/B/C: USD 100,00 cada

O motor deve preservar a soma exata dos rateios ao total da operação, evitando perda de centavos por arredondamento.

## Regras do teste

1. Cada item possui sua própria resolução de NCM.
2. Uma NCM sem regra oficial vigente não recebe alíquota presumida de 0%.
3. O resultado deve marcar o item como `needsOfficialValidation` quando faltar evidência oficial vigente.
4. Tratamento administrativo deve ser exibido separado da tributação.
5. Benefício fiscal potencial não entra no custo principal enquanto a elegibilidade estiver condicional.
6. O resultado deve separar custo estimado, cenário condicional e resultado validado.
7. O usuário deve conseguir abrir a trilha de auditoria de cada tributo/benefício.

## UX esperada

Primeiro mostrar:

- custo total;
- custo por item;
- tributos totais;
- alertas relevantes.

Depois permitir expandir:

- bases de cálculo;
- alíquotas;
- rateios;
- benefícios;
- fundamentos legais;
- vigências;
- fontes.

## Critério de aprovação

A simulação só pode ser considerada aprovada quando:

- os três itens forem processados independentemente;
- frete e seguro forem integralmente distribuídos;
- nenhum arredondamento alterar o total da operação;
- incertezas forem explicitamente exibidas;
- a interface não exigir do usuário dados avançados que não sejam necessários ao cenário.
