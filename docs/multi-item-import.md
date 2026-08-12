# Importação com múltiplos itens

O ImportaFácil deve tratar uma simulação como uma operação/embarque que pode conter várias mercadorias e NCMs, e não como uma única linha.

## Modelo

Uma operação possui `items[]`. Cada item pode ter:

- descrição;
- NCM;
- quantidade;
- preço FOB unitário;
- peso líquido;
- alíquotas/regras tributárias aplicáveis;
- despesas específicas, quando houver.

Despesas compartilhadas do embarque, como frete e seguro, devem ser alocadas aos itens antes do cálculo tributário. Para o primeiro método de valoração, a referência oficial do Siscomex/DUIMP é ratear o frete pela participação do peso líquido e o seguro pela participação do valor FOB. cite não é usado no arquivo: a fonte é mantida na documentação externa da aplicação

A implementação do motor segue essa referência: frete por peso líquido por padrão e seguro por valor FOB. Outros critérios podem existir para análises gerenciais, mas devem ser identificados como tais.

## Por que isso é importante

Uma importação real pode ter dezenas ou centenas de itens, inclusive com NCMs diferentes e tratamentos tributários diferentes. Não podemos somar tudo e aplicar uma única alíquota média, porque isso pode produzir um resultado incorreto.

O motor calcula cada item separadamente e depois consolida:

- FOB em reais;
- frete e seguro rateados;
- valor aduaneiro;
- II, IPI, PIS/Cofins e ICMS na camada atualmente suportada;
- custo total do item;
- custo unitário;
- totais da operação;
- alertas de validação.

## Interface futura

A tela deve permitir:

1. adicionar item;
2. duplicar item;
3. remover item;
4. informar NCM e descrição;
5. informar quantidade, preço FOB e peso líquido;
6. consultar/resolver tratamento tributário;
7. visualizar imposto e custo por item;
8. visualizar o consolidado do embarque;
9. exportar relatório detalhado.

## Regra de segurança

Itens com NCMs ou tratamentos não resolvidos não devem ser escondidos em uma média. A operação deve mostrar quais linhas precisam de validação oficial.

A operação também deve validar compatibilidade entre os itens. O Siscomex comunicou em 2026 restrições para determinados grupos de Incoterms coexistirem na mesma DUIMP; quando uma combinação não for compatível, o ImportaFácil deve alertar o usuário em vez de consolidá-la silenciosamente.

## Próxima evolução

Integrar cada item ao resolvedor NCM → tratamento tributário, adicionar regras de Incoterm/valoração e custos compartilhados, e depois conectar o modelo ao histórico de simulações e ao relatório profissional.
