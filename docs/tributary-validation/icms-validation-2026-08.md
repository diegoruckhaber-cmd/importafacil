# ICMS Validation Protocol — Importação 2026

## Objetivo
Validar o cálculo de ICMS-Importação sem tratar uma fórmula nacional simplificada como regra universal.

## Princípios
1. ICMS é estadual: a UF da operação determina a regra aplicável.
2. A base é calculada "por dentro", quando exigido pela legislação aplicável.
3. A composição da base deve ser parametrizada por UF/operação e não hard-coded.
4. Benefícios, diferimentos, reduções, créditos presumidos e regimes especiais são regras separadas da alíquota padrão.
5. Benefício potencial não entra no resultado principal sem elegibilidade comprovada.
6. Todo resultado deve carregar fundamento, vigência e nível de confiança.

## Entradas mínimas
- UF do estabelecimento/destino
- data do fato gerador/operação
- valor aduaneiro
- II
- IPI, quando aplicável
- PIS-Importação
- Cofins-Importação
- despesas que a legislação estadual determine integrar a base
- alíquota interna/importação aplicável
- benefício/regime especial, quando houver
- créditos, quando relevantes ao cenário econômico

## Testes unitários

### ICMS por dentro
Para uma regra estadual cuja base seja formada por parcelas elegíveis antes do ICMS:

`ICMS = BaseSemICMS / (1 - alíquota) * alíquota`

O teste deve conferir também que:

`BaseComICMS - ICMS = BaseSemICMS`

### Composição estadual
Cada UF deverá possuir uma lista versionada de componentes da base. O teste deve rejeitar uma composição genérica quando a regra estadual exigir tratamento diferente.

### Benefício
Cenários:
- sem benefício;
- redução de base;
- redução de alíquota;
- diferimento;
- crédito presumido;
- regime especial/TTD;
- benefício potencial sem comprovação;
- benefício fora da vigência.

### Multi-item
- calcular ICMS por item;
- preservar bases e benefícios individualmente;
- consolidar apenas depois do cálculo;
- conferir que a soma dos itens corresponde ao total da operação, respeitando regras de arredondamento.

## Resultado esperado
Cada item deve retornar:
- base de cálculo;
- alíquota;
- ICMS devido;
- benefício aplicado, se houver;
- valor econômico do benefício, quando mensurável;
- fundamento legal;
- vigência;
- confiança: validado / condicional / não validado.

## Fontes de referência inicial
A Receita Federal descreve o ICMS de importação como cálculo "por dentro" e apresenta a forma matemática de inclusão do próprio imposto na base. Essa referência não substitui a legislação estadual aplicável à operação. Fonte oficial: https://www.gov.br/receitafederal/pt-br/assuntos/aduana-e-comercio-exterior/manuais/remessas-postal-e-expressa/preciso-pagar-impostos-nas-compras-internacionais/quanto-pagarei-de-imposto

## Observação crítica
Este documento é um protocolo de validação. Ele não autoriza o motor a assumir que uma única composição de base de ICMS vale para todas as UFs. A implementação definitiva deve consumir regras estaduais versionadas e evidências legais.