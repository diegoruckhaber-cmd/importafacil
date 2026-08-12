# E2E 03 — teste-ouro SC / TTD 409

Objetivo: validar separadamente o fluxo econômico e fiscal de uma importação em SC com TTD 409, sem tratar o benefício como simples redução do ICMS-Importação.

## Modelo jurídico a validar

1. Identificar estabelecimento importador/destinatário jurídico e UF competente.
2. Resolver elegibilidade do TTD 409 na data da operação.
3. Calcular o tratamento do ICMS-Importação conforme a regra vigente, incluindo eventual diferimento.
4. Separar eventual ICMS antecipado/recolhido do crédito correspondente.
5. Determinar a destinação da mercadoria após a entrada.
6. Para saída comercial elegível, resolver o crédito presumido conforme o regime e a legislação vigente.
7. Para mercadoria destinada à industrialização, não presumir o crédito da saída comercial; avaliar a regra específica e as condições do regime.
8. Apresentar separadamente imposto devido, desembolso, créditos e custo econômico.

## Evidências oficiais de referência

- COPAT 25/2026: TTD 409, importação por conta própria, mercadoria originária do Paraguai, entrada/desembaraço em outra UF por via terrestre e estabelecimento importador/destinatário jurídico em SC; a consulta reconhece a possibilidade do diferimento e crédito presumido, observadas as condições do regime e legislação vigente.
- COPAT 69/2024 e COPAT 22/2023: diferimento na importação, recolhimento do valor equivalente ao ICMS antecipado com crédito correspondente e uso do crédito presumido nas saídas comerciais; mercadoria utilizada como matéria-prima deve ser tratada conforme a regra aplicável à industrialização.
- COPAT 10/2026: a manutenção do crédito presumido pode depender de o produto resultante permanecer na mesma posição da NCM e de outras condições do art. 246, Anexo 2.

## Invariantes do teste

- benefício não entra no resultado principal sem elegibilidade comprovada;
- diferimento não é apresentado como redução definitiva do imposto;
- crédito presumido não é confundido com crédito financeiro comum;
- saída comercial e saída para industrialização seguem caminhos distintos quando a legislação assim determinar;
- a data da operação resolve a versão vigente da regra;
- qualquer alteração relevante de NCM/destinação deve gerar nova avaliação de elegibilidade;
- o resultado deve mostrar imposto bruto, benefício, imposto/desembolso efetivo, créditos e custo econômico em blocos separados;
- fundamento e fonte da regra devem acompanhar a conclusão.

## Critério de aprovação

O teste só será considerado aprovado quando um cálculo independente reproduzir os valores do motor e quando cada etapa do tratamento puder ser explicada por regra vigente e evidência oficial. Até lá, o cenário permanece como `validation_pending` e não pode alimentar uma promessa de economia ao usuário.
