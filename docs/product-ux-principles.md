# ImportaFácil — princípios de UX tributária

## Princípio central

A complexidade deve ficar no motor, não na cabeça do usuário.

## Progressive disclosure

A primeira experiência deve pedir apenas os dados necessários para produzir uma simulação inicial. Dados avançados aparecem apenas quando forem necessários para aumentar a precisão ou quando o usuário optar por detalhamento.

### Fluxo inicial

1. Produtos: descrição, NCM e quantidade.
2. Valores: preço, moeda e condição de venda.
3. Logística: origem, destino, frete, seguro e peso.
4. Empresa: UF e regime tributário.
5. Fiscal avançado: benefícios/regimes especiais, quando aplicável.
6. Resultado: custo total, custo por item e alertas.

## Resultado em camadas

### Camada executiva

- custo total da importação;
- custo por item;
- tributos totais;
- economia potencial;
- alertas críticos.

### Camada técnica

- bases de cálculo;
- alíquotas;
- rateios;
- créditos;
- benefícios;
- tratamento administrativo.

### Camada de evidências

- fonte oficial;
- fundamento legal;
- vigência;
- condição que levou à conclusão;
- nível de confiança.

## Incerteza explícita

Nunca transformar uma hipótese fiscal em certeza. Usar estados:

- `validated` — regra e condições suficientemente verificadas;
- `conditional` — existe regra, mas há condição que depende de informação/concessão;
- `insufficient-data` — faltam dados da operação;
- `not-applicable` — regra analisada e não aplicável.

## Simulação conservadora

Quando um benefício ou crédito não puder ser confirmado, o resultado principal deve permanecer conservador e apresentar separadamente o cenário potencial.

Exemplo:

Custo sem benefício: R$ 520.000
Custo potencial com benefício: R$ 475.000
Economia potencial: R$ 45.000
Status: validar elegibilidade

## Princípio de concorrência

A Receita já oferece um simulador oficial gratuito para tratamento tributário e administrativo. O ImportaFácil não deve competir apenas por mostrar alíquotas. O diferencial deve ser transformar dados da operação em custo efetivo, análise por item, cenários, benefícios, créditos, margem e explicação auditável.

## Regra de design

"Simples para usar. Profundo para confiar."
