# Fluxo tributário por item

A simulação multi-item segue esta ordem:

1. Receber dados gerais do embarque.
2. Receber itens individualmente: NCM, quantidade, FOB unitário, peso líquido e demais dados necessários.
3. Resolver o tratamento NCM por item e pela data de referência.
4. Alocar custos comuns do embarque.
5. Calcular o valor aduaneiro de cada item.
6. Calcular II, IPI, PIS/Cofins e ICMS segundo as regras aplicáveis ao item.
7. Consolidar o resultado da operação.
8. Exibir alertas para itens sem tratamento oficial resolvido.

## Rateio padrão

O fluxo padrão acompanha a lógica atual da DUIMP: frete internacional proporcional ao peso líquido do item em relação ao peso líquido total; seguro internacional proporcional ao valor FOB do item em relação ao FOB total. A Receita documenta expressamente esses dois critérios no Manual da DUIMP.

O sistema pode oferecer outros métodos para cenários gerenciais, mas deve identificá-los como método analítico e não como regra fiscal padrão.

## Regras de segurança

- Nunca aplicar uma alíquota média de várias NCMs.
- Nunca esconder um item com tratamento não resolvido dentro do consolidado.
- Não tratar uma regra local antiga como fonte fiscal vigente.
- Não confundir custo gerencial com base fiscal.
- Manter os cálculos por item para permitir auditoria do resultado.
