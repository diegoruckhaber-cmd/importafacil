# Teste ponta a ponta 01 — Importação multi-item

## Objetivo
Validar a cadeia completa do ImportaFácil sem depender de uma alíquota tributária inventada: itens → rateio → valor aduaneiro → resolução tributária → alertas → consolidação.

## Cenário
- 3 itens com NCMs diferentes.
- Moeda negociada: USD.
- Frete internacional informado no embarque.
- Seguro internacional informado no embarque.
- UF de destino: SC.
- Data de referência configurável.
- Regime tributário configurável.

## Regras de rateio
1. Frete internacional: proporcional ao peso líquido de cada item sobre o peso líquido total.
2. Seguro internacional: proporcional ao FOB de cada item sobre o FOB total.
3. O valor aduaneiro de cada item deve refletir seu valor na condição de venda + frete e seguro internacionais atribuídos + demais acréscimos/deduções aplicáveis.

## Resultado esperado
Para cada item:
- valor FOB;
- peso líquido;
- frete atribuído;
- seguro atribuído;
- valor aduaneiro;
- regras tributárias encontradas;
- benefícios potencialmente aplicáveis;
- nível de confiança;
- alertas de dados insuficientes ou validação oficial.

Para a operação:
- FOB total;
- frete total;
- seguro total;
- valor aduaneiro total;
- tributos consolidados somente quando houver regra confiável;
- lista de itens pendentes;
- distinção entre custo estimado, provável, condicional e validado.

## Casos de falha obrigatórios
- NCM inválida: bloquear cálculo daquele item.
- NCM sem regra oficial vigente: não assumir alíquota zero; marcar como `needsOfficialValidation`.
- Peso total zero com frete informado: impedir rateio automático por peso.
- FOB total zero com seguro informado: impedir rateio automático por FOB.
- Regra fora da vigência: não aplicar.
- Benefício sem comprovação de elegibilidade: mostrar economia apenas como potencial e não incluí-la no cenário principal.
- Tratamento administrativo: manter separado da tributação e exigir consulta oficial quando a informação depender do ambiente vigente.

## Critérios de aceitação
O teste só é aprovado quando:
1. A soma dos fretes atribuídos aos itens reproduz o frete do embarque, respeitando a precisão interna.
2. A soma dos seguros atribuídos reproduz o seguro do embarque.
3. Nenhuma NCM sem regra confiável recebe automaticamente 0%.
4. Cada item mantém sua própria trilha de evidência e confiança.
5. A consolidação não apaga alertas ou condições individuais.
6. O resultado executivo é simples, enquanto o detalhamento técnico permanece acessível.

## Base oficial de referência
A documentação da Receita para a DUIMP informa que o frete internacional é rateado segundo a participação do peso líquido da adição no peso líquido total e o seguro segundo a participação do FOB da adição no FOB total. O simulador oficial também deixa claro que sua consulta retorna tratamento tributário e administrativo conforme os dados informados e que as alíquotas exibidas são ad valorem.

Este arquivo é um contrato de teste. Nenhum valor tributário específico deve ser hard-coded como se fosse legislação vigente; regras fiscais devem vir do rulebook versionado e de fontes oficiais.
