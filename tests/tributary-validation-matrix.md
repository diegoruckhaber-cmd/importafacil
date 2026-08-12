# ImportaFácil — Matriz de validação tributária

Objetivo: validar o motor por fórmula e por cenário antes de integração com produção.

## 1. Valor aduaneiro / Incoterm
- [ ] EXW/FCA/FOB/CFR/CPT: validar componentes acrescidos conforme método aplicável.
- [ ] CIF/CIP/DAP e demais condições com seguro embutido: evitar dupla contagem.
- [ ] Operações com grupos de Incoterms incompatíveis na mesma DUIMP devem gerar alerta de desdobramento.

## 2. Rateios
- [ ] Frete internacional: rateio por peso líquido quando aplicável.
- [ ] Seguro: rateio por FOB quando aplicável.
- [ ] Soma dos rateios deve fechar exatamente com o total informado, respeitando arredondamento residual.
- [ ] Peso total zero e FOB total zero devem gerar erro explícito, nunca divisão silenciosa.

## 3. II
- [ ] Alíquota ad valorem parametrizada por NCM/data/fundamento.
- [ ] Preferência tarifária/acordo comercial deve ser regra explícita.
- [ ] Cotas e reduções temporárias devem carregar vigência e condição.
- [ ] Direitos antidumping/compensatórios devem permanecer separados do II comum.

## 4. IPI
- [ ] Base deve seguir a regra legal aplicável à importação.
- [ ] Alíquota deve ser derivada da TIPI/regra vigente, não hard-coded por NCM.
- [ ] Exceções, alíquota zero, suspensão e regimes especiais devem ser explícitos.

## 5. PIS/Cofins-Importação
- [ ] Alíquotas dependem da legislação/fundamento vigente na data.
- [ ] Validar alterações com vigência em 01/04/2026.
- [ ] Suportar alíquotas efetivas com três casas decimais quando exigidas.
- [ ] Não usar fórmula histórica de base sem validar o fundamento jurídico vigente.
- [ ] Benefícios, alíquota zero e adicionais devem ser regras versionadas.

## 6. ICMS
- [ ] Cálculo por dentro.
- [ ] Base construída pela regra da UF/operação, não por fórmula nacional fixa.
- [ ] Incluir/excluir componentes conforme legislação estadual.
- [ ] Benefícios, TTDs, reduções, diferimentos e créditos presumidos como regras condicionais.
- [ ] Distinguir desembolso de crédito recuperável.

## 7. Benefícios
- [ ] Benefício identificado ≠ benefício automaticamente aplicável.
- [ ] Validar UF, NCM, data, origem, destinação, regime, ato concessório e demais condições.
- [ ] Compatibilidade/cumulatividade entre benefícios deve ser verificada.
- [ ] Resultado deve possuir evidência/fundamento e nível de confiança.

## 8. Multi-item
- [ ] Cada item calcula sua própria tributação.
- [ ] Problema em um item não pode desaparecer na consolidação.
- [ ] Totais por tributo devem fechar com a soma dos itens.
- [ ] Rateios e arredondamentos devem fechar com o total da operação.

## 9. Critério de aprovação
Um cenário só será marcado como aprovado quando:
1. a fórmula matemática fechar;
2. a regra jurídica aplicável estiver identificada;
3. a vigência estiver correta;
4. exceções relevantes estiverem tratadas;
5. o resultado puder ser auditado por fundamento/evidência.

## Fontes de referência inicial
- Receita Federal — Manual de Importação / Aba Tributos.
- Siscomex — Comunicado Importação nº 025/2026 (PIS/Cofins-Importação).
- Siscomex — Comunicado Importação nº 041/2026 (Incoterms na DUIMP).
- Siscomex — página de Importação e tabelas de cotas/reduções.
