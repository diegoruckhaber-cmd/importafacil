# E2E 03 — cenário-ouro matemático

Objetivo: validar a matemática do motor independentemente da legislação e impedir regressões nas fórmulas antes de conectar regras fiscais versionadas.

## Dados fixos

- Valor aduaneiro: R$ 100.000,00
- II: 10,00%
- IPI: 5,00%
- PIS-Importação: 2,10%
- Cofins-Importação: 9,65%
- ICMS: 18,00%
- Outras parcelas para a base do ICMS: R$ 0,00

> As alíquotas acima são apenas parâmetros matemáticos do teste. Este cenário não afirma que sejam as alíquotas juridicamente aplicáveis a uma NCM/operação real.

## Resultado matemático esperado

### II

Base = R$ 100.000,00

II = 100.000 × 10% = **R$ 10.000,00**

### IPI

Base = R$ 100.000,00 + R$ 10.000,00 = R$ 110.000,00

IPI = 110.000 × 5% = **R$ 5.500,00**

### PIS/Cofins

Neste vetor, a base matemática de teste é o valor aduaneiro.

PIS = 100.000 × 2,10% = **R$ 2.100,00**

Cofins = 100.000 × 9,65% = **R$ 9.650,00**

### ICMS por dentro — vetor matemático

Pré-base = 100.000 + 10.000 + 5.500 + 2.100 + 9.650 = **R$ 127.250,00**

Base ICMS = 127.250 ÷ (1 − 0,18) = **R$ 155.182,926829...**

ICMS = 155.182,926829... × 18% = **R$ 27.932,926829...**

Apresentação: **R$ 27.932,93**

### Total tributário do vetor

10.000 + 5.500 + 2.100 + 9.650 + 27.932,926829... = **R$ 55.182,926829...**

Apresentação: **R$ 55.182,93**

## Invariantes

1. II deve ser calculado sobre o valor aduaneiro.
2. IPI deve usar a base definida pelo vetor: valor aduaneiro + II.
3. PIS/Cofins devem preservar a precisão interna das alíquotas fornecidas.
4. ICMS deve ser calculado por dentro neste vetor.
5. Arredondamento deve ocorrer apenas na apresentação final, salvo regra legal específica do tributo.
6. A soma das linhas apresentadas deve fechar com o total apresentado dentro da tolerância de centavos.
7. Este teste matemático não autoriza o motor a aplicar automaticamente essas alíquotas em operações reais.

## Critério de aprovação

- [ ] II = R$ 10.000,00
- [ ] IPI = R$ 5.500,00
- [ ] PIS = R$ 2.100,00
- [ ] Cofins = R$ 9.650,00
- [ ] ICMS apresentado = R$ 27.932,93
- [ ] Total apresentado = R$ 55.182,93
- [ ] precisão interna preservada
- [ ] nenhuma regra jurídica inferida a partir deste vetor
