# E2E 02 — cenário adversarial tributário

Objetivo: tentar quebrar o motor com uma operação multi-item que combina regra tributária conhecida, item sem regra validada e benefício condicional.

## Dados do cenário

- Data da operação: 2026-08-12
- Moeda: USD
- Câmbio de teste: R$ 5,50
- UF de destino: SC
- Regime: Lucro Presumido
- Frete internacional: USD 6.000
- Seguro internacional: USD 600

Itens:

| Item | NCM de teste | FOB USD | Peso kg | Situação |
|---|---|---:|---:|---|
| 1 | 3907.00.00 | 20.000 | 8.000 | regra cadastrada |
| 2 | 3206.00.00 | 10.000 | 2.000 | regra cadastrada |
| 3 | 9999.99.99 | 5.000 | 500 | sem regra oficial |

## Invariantes

1. Frete total rateado por peso deve somar exatamente USD 6.000 antes do arredondamento final.
2. Seguro total rateado por FOB deve somar exatamente USD 600 antes do arredondamento final.
3. Nenhum item sem regra oficial pode receber alíquota zero por ausência de cadastro.
4. Um benefício condicional não pode reduzir o custo principal enquanto sua elegibilidade estiver pendente.
5. O resultado consolidado deve preservar os alertas dos itens individuais.
6. A confiança da operação deve ser limitada pelo item/regra de menor confiança quando esse item impactar o cálculo.
7. Arredondamentos devem ocorrer nos pontos definidos pelo motor, evitando diferença acumulada entre item e total.
8. A alteração da data de referência deve poder mudar a regra vigente sem alterar retroativamente a versão histórica armazenada.

## Resultado esperado do cenário

O motor deve produzir um resultado calculável para os itens 1 e 2, marcar o item 3 como `needsOfficialValidation = true` e impedir que a ausência da regra seja interpretada como tributação zero. Se houver benefício condicional para SC, ele deve aparecer como cenário potencial/condicional, não como economia garantida.

## Critérios de aprovação

- [ ] soma do frete rateado = frete total
- [ ] soma do seguro rateado = seguro total
- [ ] item 3 não recebe alíquota implícita de 0%
- [ ] alerta do item 3 aparece no consolidado
- [ ] benefício pendente não entra no custo principal
- [ ] resultado mostra nível de confiança
- [ ] data de referência participa da resolução das regras
- [ ] nenhuma regra histórica é sobrescrita por atualização posterior
