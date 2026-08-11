# Pipeline de dados NCM e tratamento tributário

## Objetivo

Transformar dados oficiais de comércio exterior em regras versionadas que o motor possa consultar sem transformar uma tabela local em autoridade fiscal.

## Hierarquia de fontes

1. Receita Federal / Sistema Classif — NCM, notas legais, NESH, decisões e tratamento tributário/administrativo.
2. TEC / CAMEX — alíquotas do II, exceções, quotas e preferências tarifárias aplicáveis.
3. TIPI — alíquotas e regras do IPI.
4. Siscomex / Portal Único — tratamento administrativo, atributos, LPCO e vigência operacional.
5. Atos específicos — resoluções, portarias, leis, decretos e demais fundamentos que alterem a regra.

## Regra de versionamento

Cada regra importada deve carregar:

- NCM;
- tributo;
- alíquota ou tipo de alíquota;
- início da vigência;
- fim da vigência, quando existir;
- fonte;
- fundamento legal;
- identificador da publicação/ato, quando disponível;
- data de captura;
- prioridade;
- tipo de regra (exata, prefixo, Ex ou outra exceção suportada).

## Regra de segurança

O sistema nunca deve preencher uma alíquota como fato apenas porque ela apareceu em uma tabela antiga ou fonte não oficial. Quando não houver correspondência oficial vigente, o resultado deve ser `needsOfficialValidation = true`.

## Tratamento administrativo

Tratamento administrativo não é sinônimo de alíquota tributária. O pipeline deve manter esses domínios separados, pois uma NCM pode exigir LPCO, atributo de catálogo, anuência, monitoramento ou até proibição dependendo do produto e das condições da operação.

O Portal Único informa que suas tabelas são atualizadas continuamente e que a consulta detalhada ao tratamento administrativo efetivamente aplicável deve ser feita no Simulador de Tratamento Administrativo / ambiente oficial correspondente.

## Próxima etapa técnica

Construir adaptadores de ingestão para fontes oficiais e um processo de atualização controlado. O adaptador deve registrar a origem e a vigência de cada regra antes que ela seja disponibilizada ao motor de cálculo.
