# Cenários-base de teste do motor

## Cenário A — item único, cálculo básico

Objetivo: validar NCM, moeda, valor aduaneiro e tratamento tributário básico.

Critérios:
- NCM normalizada para 8 dígitos;
- regras somente dentro da vigência;
- ausência de regra não pode virar alíquota zero;
- resultado sinaliza necessidade de validação quando aplicável.

## Cenário B — múltiplos itens

Objetivo: validar cálculo individual e consolidação.

Critérios:
- cada item possui NCM e tributação próprios;
- frete comum é rateado por peso líquido;
- seguro comum é rateado por FOB;
- soma dos rateios deve reconciliar com o total informado;
- consolidação deve reconciliar com os itens.

## Cenário C — benefício condicional

Objetivo: validar separação entre benefício identificado e benefício aplicável.

Critérios:
- benefício existente sem regime especial confirmado = condicional;
- economia potencial não entra no cenário principal;
- resultado mostra a condição pendente;
- fundamento e vigência são exibidos no nível técnico.

## Cenário D — regra temporal

Objetivo: validar mudanças legislativas.

Critérios:
- uma consulta em data anterior à alteração usa a regra anterior;
- uma consulta posterior usa a regra nova;
- regra com vigência encerrada não pode ser selecionada.

## Cenário E — tratamento administrativo

Objetivo: manter tributação e licenciamento separados.

Critérios:
- exigência administrativa não altera automaticamente alíquota tributária;
- quando a regra depende de atributos do produto, o sistema solicita os atributos necessários;
- resultado administrativo possui alerta próprio.

## Cenário F — cenário com dados insuficientes

Objetivo: impedir falsa precisão.

Critérios:
- sistema identifica dados faltantes;
- não inventa origem, UF, regime, benefício ou alíquota;
- apresenta estimativa somente quando as hipóteses estiverem explícitas.
