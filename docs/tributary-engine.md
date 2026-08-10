# Motor Tributário — arquitetura

## Objetivo

Separar cálculo matemático, catálogo de regras e dados de tratamento tributário. A produção só deve aplicar uma regra quando houver fonte, vigência e escopo compatíveis com a operação.

## Dimensões mínimas do tratamento

- NCM
- data de referência
- país de origem/preferência tarifária
- UF do desembaraço/destino, conforme a regra aplicável
- regime aduaneiro
- regime tributário do importador
- benefício/redução/suspensão/isenção
- eventual alíquota específica ou unidade de medida
- fundamento legal/fonte

## Camadas

1. **Entrada da operação**: valores, moeda, frete, seguro e despesas.
2. **Tratamento NCM**: alíquotas e exigências vigentes.
3. **Motor de bases**: calcula cada base de forma independente.
4. **Benefícios e exceções**: aplica redução, suspensão, isenção ou regime especial explicitamente.
5. **Tributos**: calcula II, IPI, PIS/Cofins, ICMS e demais parcelas aplicáveis.
6. **Créditos**: separa desembolso de custo efetivo.
7. **Formação de preço**: custo, markup, margem, lucro e ROI.

## Regra de segurança

O sistema não deve inventar uma alíquota quando não houver tratamento confiável. Deve sinalizar que a operação precisa de validação fiscal.

## Fontes prioritárias

- Receita Federal / Portal Siscomex
- legislação federal (Planalto)
- legislação e orientações da SEFAZ da UF aplicável
- CAMEX/Gecex e atos de comércio exterior
- fontes oficiais do regime especial ou benefício

O simulador oficial da Receita usa NCM, valor aduaneiro e moeda para consultar o tratamento tributário e administrativo vigente. O ImportaFácil deve usar essa lógica como referência, mas manter seu próprio modelo auditável e versionado.
