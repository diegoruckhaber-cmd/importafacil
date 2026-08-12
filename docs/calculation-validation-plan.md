# Plano de validação dos cálculos

Este documento é obrigatório antes de promover o motor tributário para produção.

## Ordem de validação

1. Validação matemática de cada fórmula isolada.
2. Validação de rateios por item.
3. Validação do valor aduaneiro por Incoterm/condição de venda.
4. Validação de II e IPI.
5. Validação de PIS/Cofins-Importação conforme a regra vigente na data da operação.
6. Validação de ICMS por dentro, com composição da base conforme a UF e a regra aplicável.
7. Validação de benefícios, reduções, suspensões e regimes especiais.
8. Validação de créditos versus desembolso versus custo econômico.
9. Validação de custos operacionais e seu tratamento fiscal/gerencial separado.
10. Testes de regressão com cenários multi-item.

## Regras de segurança

- Nenhuma fórmula fiscal é considerada definitiva apenas porque produz um número plausível.
- Cada fórmula deve ter fundamento oficial e uma data de vigência quando depender de legislação variável.
- Uma regra de cálculo genérica deve ser explicitamente marcada como baseline até ser validada para a situação jurídica correspondente.
- Benefício não comprovado não reduz o custo principal; deve aparecer como cenário potencial/condicional.
- O resultado consolidado nunca pode esconder um alerta existente em um item.

## Primeiros vetores de regressão

### Vetor A — multi-item e rateio

Verificar que a soma do frete rateado por peso líquido reproduz exatamente o frete total, respeitando a precisão interna e arredondando somente na apresentação.

Verificar que a soma do seguro rateado por FOB reproduz exatamente o seguro total.

### Vetor B — imposto em cadeia

Para uma operação ad valorem de referência, verificar separadamente:

- II sobre o valor aduaneiro;
- IPI sobre valor aduaneiro + II, quando essa for a regra aplicável;
- PIS/Cofins conforme a regra vigente aplicável;
- ICMS por dentro conforme a base legal da UF.

Cada etapa deve expor base, alíquota, valor calculado e valor devido.

### Vetor C — data de vigência

Executar a mesma operação em duas datas que atravessem uma mudança legislativa. O resultado deve usar a regra vigente na respectiva data e preservar a regra histórica.

### Vetor D — benefício condicional

Quando houver benefício potencial sem comprovação de elegibilidade, o resultado principal deve permanecer conservador e a economia aparecer separadamente como potencial.

### Vetor E — falha segura

NCM sem regra oficial vigente, base inválida, peso zero para rateio por peso ou ausência de dados essenciais devem produzir alerta explícito, nunca uma alíquota ou custo inventado.

## Critério de aprovação

Um cenário só é considerado aprovado quando:

- as fórmulas individuais fecham;
- os rateios fecham;
- a consolidação fecha;
- os arredondamentos são controlados;
- a vigência é respeitada;
- os alertas são preservados;
- e a fonte/fundamento da regra utilizada é rastreável.

## Observação sobre o motor atual

`lib/tributary-engine.ts` é um motor de primeira etapa e declara expressamente que suas fórmulas são um baseline. Ele ainda não deve ser tratado como calculadora fiscal definitiva para todos os cenários brasileiros. A validação jurídica e matemática deve preceder qualquer uso de produção.
