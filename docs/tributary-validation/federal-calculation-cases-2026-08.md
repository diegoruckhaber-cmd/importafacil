# ImportaFácil — Validação Tributária Federal

Data-base: 2026-08-12
Status: especificação de validação — não considerar o motor validado apenas pela existência destes casos.

## Objetivo

Validar as fórmulas federais de uma importação antes de conectá-las ao resultado final do produto. Cada caso deve fechar matematicamente, preservar a rastreabilidade da regra e respeitar a vigência normativa da data da operação.

## Casos obrigatórios

### VA-01 — Valor aduaneiro sem dupla contagem
- Cenário: condição de venda em que o frete/seguro já esteja embutido no valor informado.
- Verificar: componentes já incluídos não podem ser adicionados novamente.
- Critério: valor aduaneiro = composição legal aplicável à condição de venda, sem duplicidade.

### VA-02 — Rateio multi-item
- 3 itens com pesos líquidos diferentes e FOB diferentes.
- Frete total e seguro total informados.
- Frete deve ser rateado segundo o critério aplicável ao processo/DUIMP.
- Seguro deve ser rateado segundo o critério aplicável.
- Critério: soma dos rateios = valor total informado, admitindo apenas ajuste de centavos controlado no último item.

### II-01 — Alíquota por NCM e vigência
- A alíquota não pode ser hard-coded.
- A seleção deve considerar NCM, EX quando aplicável, origem, data e fundamento/preferência tarifária.
- Se houver redução temporária, cota ou acordo, a regra aplicável deve ser explicitamente identificada.

### II-02 — Benefício/redução com vigência
- Criar operação imediatamente antes e imediatamente depois da vigência de uma regra.
- Critério: cada data deve selecionar sua própria regra; regra futura não pode contaminar cálculo histórico.

### IPI-01 — Base e alíquota
- Validar composição da base e seleção da alíquota pela TIPI/regra aplicável.
- Encargos eventualmente relevantes devem ser variáveis explícitas, não assumidos silenciosamente como zero.

### PIS-COFINS-01 — Regra vigente em 2026
- Validar seleção por NCM, data, fundamento e regime aplicável.
- A partir de 01/04/2026, considerar a sistemática decorrente da LC 224/2025 e IN RFB 2.305/2026.
- Não usar uma alíquota padrão fixa como substituto da tabela/regra vigente.
- Preservar precisão decimal antes do arredondamento monetário.

### PIS-COFINS-02 — Benefício reduzido em 2026
- Criar caso com benefício de isenção/alíquota zero afetado pela redução linear de benefícios.
- Critério: resultado deve refletir a regra vigente na data e registrar o fundamento utilizado.

### ICMS-01 — Por dentro
- A fórmula de ICMS deve ser parametrizada por UF e operação.
- Não assumir uma composição nacional única da base.
- O próprio ICMS deve integrar a base quando a legislação estadual determinar.

### ICMS-02 — Base estadual
- Comparar pelo menos dois cenários de UFs distintas.
- Critério: composição da base deve ser determinada pela regra estadual, e não por fórmula federal fixa.

### CONS-01 — Consolidação
- Calcular cada tributo por item.
- Consolidar sem perder fundamentos, alertas ou status de confiança.
- Soma dos itens deve fechar com o total da declaração.

## Regras de aprovação

1. Resultado matemático reproduzível.
2. Fórmula documentada.
3. Fonte normativa identificável.
4. Vigência identificada.
5. Exceções relevantes explicitadas.
6. Nenhuma ausência de regra pode ser interpretada como alíquota zero.
7. Benefício condicional não entra automaticamente como economia garantida.
8. Arredondamentos devem ocorrer no ponto definido pela regra operacional, e não arbitrariamente em cada etapa.

## Evidências externas a manter junto aos testes

- Receita Federal — manual de tributos da DI.
- Siscomex Importação nº 025/2026 — alterações de PIS/Cofins-Importação a partir de 01/04/2026.
- Siscomex — cotas e reduções tarifárias vigentes.
- Legislação estadual específica para cada cenário de ICMS.

## Próxima execução

Executar primeiro VA-01/VA-02 e depois II-01/II-02, IPI-01, PIS-COFINS-01/02 e ICMS-01/02. Somente após os casos unitários fecharem, executar CONS-01 com múltiplos itens.