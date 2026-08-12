# Perfil tributário, ICMS e créditos

## Objetivo

Separar três perguntas que não devem ser misturadas:

1. quanto a importação gera de tributo;
2. quanto será efetivamente recolhido;
3. quanto desse recolhimento pode gerar crédito e, portanto, não deve ser tratado automaticamente como custo econômico.

## Entradas do perfil

- regime da empresa: Simples Nacional, Lucro Presumido, Lucro Real ou não informado;
- UF de destino;
- alíquota de ICMS aplicável;
- tratamento de crédito de ICMS;
- tratamento de créditos de PIS/Cofins-Importação;
- regra específica sobre composição da base do ICMS, quando aplicável;
- eventual redução de base;
- observações/fundamentos.

## Regra de segurança

O motor não deve concluir que todo tributo pago é custo nem que todo tributo pago é crédito. Quando a informação depender do produto, finalidade, regime, benefício ou legislação estadual, o resultado deve ser `requires-validation`.

## ICMS

O ICMS de importação é calculado por dentro. A composição exata da base precisa ser parametrizada conforme a legislação aplicável à UF e à operação. A Receita Federal apresenta a fórmula-base por dentro, e administrações tributárias estaduais podem detalhar quais despesas aduaneiras entram na base. Por isso, o motor não deve usar uma composição universal como regra definitiva.

## Créditos

O produto deve exibir separadamente:

- tributo desembolsado;
- crédito potencial identificado;
- parcela tratada como custo líquido;
- parcela que requer validação.

Isso evita apresentar ao usuário um "custo efetivo" com falsa precisão.

## Reforma Tributária

A arquitetura reserva espaço para IBS/CBS e cClassTrib por item. Em 2026, o cClassTrib passou a ser informado nos itens das declarações de importação, e a Receita trata 2026 como ano de teste da CBS/IBS. A camada deve ser ativada por vigência, sem misturar regras do novo sistema com regras históricas.
