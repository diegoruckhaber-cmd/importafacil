# Motor NCM → tratamento tributário

## Princípio

O ImportaFácil não deve hard-codear uma alíquota de NCM como se fosse permanente. A NCM de 8 dígitos é usada para identificar tratamento tributário e administrativo, mas a regra aplicável depende também da vigência, origem, Ex, acordo, quota, regime e demais condições da operação.

A Receita informa que a NCM define alíquotas no comércio exterior e que a TEC associa NCM às alíquotas do Imposto de Importação. O Sistema Classif reúne NCM, notas legais, NESH, decisões de classificação e tratamento tributário/administrativo. O Painel Tarifário da CAMEX consolida regras como exceções, quotas, Ex-tarifários e acordos, mas é consultivo.

## Resolução

1. Normalizar NCM para oito dígitos.
2. Receber a data da operação/consulta.
3. Procurar regra exata e, quando suportado, regra de prefixo.
4. Respeitar início e fim de vigência.
5. Priorizar Ex e regra específica quando houver correspondência.
6. Registrar fonte e fundamento legal da regra.
7. Se não houver regra confiável, retornar `needsOfficialValidation` em vez de inventar alíquota.

## Fontes oficiais prioritárias

- Receita Federal / Sistema Classif: NCM, notas legais, NESH, decisões e tratamento tributário/administrativo.
- TEC/CAMEX: alíquotas e exceções tarifárias.
- TIPI: IPI por NCM.
- Siscomex/CAMEX: quotas, reduções temporárias, Ex-tarifários e defesa comercial.
- Acordos comerciais: preferências tarifárias condicionadas à origem e requisitos aplicáveis.

## Regra de segurança do produto

A tabela local é cache/fallback e mecanismo de testes. Ela não é autoridade fiscal. Qualquer resultado sem fonte oficial vigente deve ser explicitamente marcado como estimativa e exigir validação.

## Fora do escopo desta camada

- ICMS por UF e benefícios estaduais;
- PIS/Cofins com regimes e exceções específicas;
- IBS/CBS da transição da Reforma Tributária;
- antidumping, salvaguardas e compensatórios;
- regimes aduaneiros especiais;
- créditos tributários por regime da empresa.

Esses itens serão resolvidos em camadas próprias para evitar que uma única regra de NCM esconda condições tributárias diferentes.
