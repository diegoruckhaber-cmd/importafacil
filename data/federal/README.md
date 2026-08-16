# Catálogo federal 2026

Esta pasta é reservada para o snapshot versionado das fontes fiscais federais usadas pelo ImportaFácil.

## Fonte tarifária

O MDIC publica a página oficial **Tarifas Vigentes**, atualizada em 12/08/2026, com os Anexos I a X da Resolução Gecex nº 272/2021 e um workbook consolidado atualizado em 03/08/2026.

Fonte oficial:
https://www.gov.br/mdic/pt-br/assuntos/camex/se-camex/strat/tarifas/vigentes

O workbook contempla, entre outros, TEC, tarifas brasileiras diferentes da TEC, abastecimento, LETEC, LEBIT/BK, compromissos OMC, DCC e ACE-14.

## Fonte de IPI

A Receita Federal disponibiliza a TIPI em XLSX. A versão publicada em 13/02/2026 é a referência do catálogo de IPI 2026.

Fonte oficial:
https://www.gov.br/receitafederal/pt-br/acesso-a-informacao/legislacao/tipi-tabela-de-incidencia-do-imposto-sobre-produtos-industrializados

## Regra de publicação

Não adicionar manualmente dezenas de NCMs ao seed para simular completude. O catálogo definitivo deve ser gerado a partir dos arquivos oficiais, preservando:

- NCM;
- descrição quando disponível;
- alíquota;
- tipo de tratamento/fonte;
- vigência inicial e final;
- fundamento legal;
- prioridade do tratamento;
- indicação de quota/condição;
- identificação da versão da fonte.

A aplicação permanece **fail-closed** enquanto o snapshot integral não estiver versionado: uma NCM ausente não pode ser interpretada como II = 0% nem como TEC automaticamente.

O script `scripts/inspect-federal-tariff-workbook.py` deve ser usado primeiro para mapear a estrutura real do XLSX baixado. Só depois o transformador definitivo deve gerar os dados consumidos pelo resolver.
