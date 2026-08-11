# Importação com múltiplos itens

O ImportaFácil deve tratar uma simulação como uma operação/embarque que pode conter várias mercadorias e NCMs, e não como uma única linha.

## Modelo

Uma operação possui `items[]`. Cada item pode ter:

- descrição;
- NCM;
- quantidade;
- preço FOB unitário;
- alíquotas/regras tributárias aplicáveis;
- despesas específicas, quando houver.

Despesas compartilhadas do embarque, como frete e seguro, devem ser alocadas aos itens antes do cálculo tributário. A primeira implementação usa o valor FOB de cada item como critério de rateio. Futuramente o usuário poderá escolher valor FOB, peso, volume, quantidade ou percentual informado.

## Por que isso é importante

Uma importação real pode ter dezenas ou centenas de itens, inclusive com NCMs diferentes e tratamentos tributários diferentes. Não podemos somar tudo e aplicar uma única alíquota média, porque isso pode produzir um resultado incorreto.

O motor calcula cada item separadamente e depois consolida:

- FOB em reais;
- valor aduaneiro;
- tributos;
- custo total do item;
- custo unitário;
- totais da operação;
- custo médio ponderado da operação.

## Interface futura

A tela deve permitir:

1. adicionar item;
2. duplicar item;
3. remover item;
4. informar NCM e descrição;
5. informar quantidade e FOB;
6. consultar/resolver tratamento tributário;
7. visualizar imposto e custo por item;
8. visualizar o consolidado do embarque;
9. exportar relatório detalhado.

## Regra de segurança

Itens com NCMs ou tratamentos não resolvidos não devem ser escondidos em uma média. A operação deve mostrar quais linhas precisam de validação oficial.

## Próxima evolução

Adicionar uma etapa específica de alocação de custos comuns e integrar cada item ao resolvedor NCM → tratamento tributário. Depois, conectar o modelo ao histórico de simulações e ao relatório profissional.
