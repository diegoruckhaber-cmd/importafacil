# Etapa 17 — Homologação E2E com evidência externa

## Objetivo
Fechar o último P0 técnico confrontando o motor com evidência produzida fora do ImportaFácil.

## Evidência
Foram usados registros aduaneiros efetivamente desembaraçados, anteriores a este benchmark e externos ao motor. O repositório público guarda apenas fatos numéricos sanitizados necessários à regressão; identificadores de cliente, fornecedor, declaração e contribuinte permanecem fora do código.

O benchmark principal reconcilia valor aduaneiro, II preferencial, IPI, PIS-Importação, Cofins-Importação, AFRMM/Siscomex na base estadual e ICMS de uma operação multi-item de SC. A tolerância máxima é de R$ 0,05 por linha para absorver arredondamentos do registro operacional.

Um segundo registro real de operação mista faz reconciliação adicional de base PIS/Cofins e encargos declarados, sem transformar taxas médias da operação em regra fiscal do produto.

## Fail-closed
Nenhum dado externo vira alíquota canônica. O benchmark só verifica que o motor reproduz uma referência observada quando recebe as mesmas premissas. Divergência acima da tolerância quebra `npm run test:all`.

## Gate
1. benchmark externo não contém identificadores sensíveis/comerciais;
2. operação principal reconcilia II, IPI, PIS, Cofins e ICMS dentro da tolerância;
3. operação secundária confirma PIS/Cofins sobre uma segunda base real;
4. bateria completa e build permanecem verdes;
5. preview e produção Vercel ficam READY;
6. somente após isso `p0-e2e-independent` pode ser marcado `verified`.
