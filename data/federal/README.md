# Catálogo federal 2026

Esta pasta contém o snapshot versionado das fontes fiscais federais consumidas pelo ImportaFácil.

## Fonte tarifária — II

A referência corrente é o workbook oficial do MDIC **Tarifas Vigentes — Anexos I a X da Resolução Gecex nº 272/2021**, publicado em **08/09/2026**.

Fonte oficial:
https://www.gov.br/mdic/pt-br/assuntos/camex/se-camex/strat/tarifas/vigentes

O snapshot semântico versionado é:

`data/federal/official-snapshot-2026-09-08.json`

Ele preserva, conforme a estrutura de cada anexo, NCM, descrição, alíquota brasileira aplicada, TEC, tipo de tratamento, EX, quota e unidade, início/fim de vigência, ato/fundamento e condições de escopo. O conjunto cobre TEC, tarifas brasileiras diferentes da TEC, desabastecimento, LETEC, LEBIT/BK, concessões OMC, DCC, ACE-14 e o escopo potencial do setor aeronáutico.

## Fonte de IPI

A Receita Federal disponibiliza a TIPI em XLSX. A versão publicada em **13/02/2026 (ADE RFB 001/2026)** é a referência do catálogo de IPI 2026.

Fonte oficial:
https://www.gov.br/receitafederal/pt-br/acesso-a-informacao/legislacao/tipi-tabela-de-incidencia-do-imposto-sobre-produtos-industrializados

O snapshot preserva a alíquota geral, EX, descrição e o tratamento `NT` quando presente.

## Regra de resolução

O snapshot integral está versionado e é consumido pelo resolver canônico `lib/federal-tax-resolution.ts`. O simulador e a API de diagnóstico devem usar esse mesmo resolver; não é permitido criar um segundo algoritmo que leia o JSON diretamente e escolha alíquota por posição/ordem de linha.

A aplicação continua **fail-closed** quando o enquadramento jurídico não é inequívoco. Em especial:

- NCM ausente não vira II/IPI zero;
- tratamentos concorrentes com alíquotas diferentes não são resolvidos pela primeira ocorrência;
- EX só é aplicado quando o EX informado corresponde ao registro;
- reduções condicionadas a quota exigem confirmação da elegibilidade/disponibilidade;
- vigência é respeitada pela data da importação;
- EX da TIPI com tratamento materialmente diferente bloqueia o cálculo enquanto o enquadramento não for informado;
- escopo aeronáutico potencial gera alerta e não presume benefício;
- override manual só pode ocorrer quando explicitamente informado como override profissional e fica marcado como não automático.

## Publicação e auditoria

`scripts/ingest-official-fiscal-data.py` gera o snapshot a partir dos XLSX oficiais. Antes da publicação, a CI valida cobertura semântica e metadados. `data/federal/snapshot-integrity-manifest.json` fixa os blobs dos arquivos fiscais críticos, e a bateria completa inclui testes de independência da ordem das linhas, concorrência, EX, quota, vigência e `NT`.
