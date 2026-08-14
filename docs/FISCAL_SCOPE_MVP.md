# ImportaFácil — escopo fiscal do MVP

## Objetivo desta fase

O primeiro acesso de testes será liberado somente depois de concluirmos a cobertura fiscal planejada para **Santa Catarina + tributos federais da importação**. Outros estados ficam fora do MVP.

## Santa Catarina

- ICMS-Importação e formação da base.
- TTD 409 e TTD 410, com decisão conservadora por item.
- TTD 77 como tratamento específico/condicional quando a operação exigir.
- Diferimento, crédito presumido e tratamento das saídas subsequentes separados por etapa.
- Validação de ato concessivo e condições de elegibilidade.
- Alertas para hipóteses que dependem de NCM, destinação, fracionamento, outro diferimento ou regra específica.
- Rateio de despesas por item sem misturar critério de rateio com decisão de base tributária.

## Federal

- II: alíquota estatutária + camada de tratamento especial, sem inferência de benefício sem fundamento.
- IPI-Importação: cálculo sobre a base aplicável, condicionado à alíquota NCM/TIPI validada.
- PIS-Importação e Cofins-Importação: regras versionadas para 2026, incluindo a mudança de 01/04/2026 e os tratamentos reduzidos quando comprovadamente aplicáveis.
- Regimes especiais federais (Drawback, Reporto, RETID, Recine): catálogo e guardrails de elegibilidade; não zerar tributos automaticamente apenas pelo código do regime.
- Alertas para fundamentos legais e tratamentos administrativos que exigem validação específica.

## Critério de liberação

O sistema deve calcular uma operação multi-item completa, mostrar a composição do custo por item e indicar explicitamente qualquer regra que permaneça condicional. O usuário não deve receber um número fiscal apresentado como definitivo quando faltarem dados essenciais.

## Fora do MVP

- Regras estaduais de outras UFs.
- Automação indiscriminada de benefícios sem fundamento legal.
- Cobertura exaustiva de todas as exceções NCM/TIPI/TEC sem fonte estruturada e versionada.
