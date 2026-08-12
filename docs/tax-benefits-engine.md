# Motor de benefícios fiscais e regimes especiais

O ImportaFácil trata benefícios como regras versionadas, separadas da alíquota padrão.

## Tipos suportados na arquitetura

- isenção
- redução
- suspensão
- crédito presumido
- diferimento
- regime especial

## Dimensões de aplicação

Uma regra pode depender de:

- NCM;
- UF;
- regime tributário;
- data de vigência;
- ato concessório/habilitação;
- condições da operação;
- finalidade da mercadoria;
- origem/destino;
- modalidade de importação.

## TTD em Santa Catarina

TTD não será tratado como uma simples "alíquota especial". A regra precisa armazenar o ato/regime, condições, vigência e eventuais efeitos sobre recolhimento, crédito presumido, diferimento ou carga efetiva.

A legislação catarinense estabelece que pedidos de regime especial são feitos por meio do aplicativo TTD da SEF/SC e que determinados tratamentos diferenciados dependem de registro prévio. O RICMS/SC também contém regras específicas para importação e liberação/exoneração do ICMS.

Consultas tributárias da SEF/SC mostram que a interação entre TTDs e outros benefícios pode depender da operação e da mercadoria. Portanto, o motor não deve aplicar benefícios cumulativamente sem verificar compatibilidade.

## Regra de segurança

Benefício fiscal sem fonte oficial, vigência e condições suficientes deve retornar `requiresManualValidation = true`.

Um benefício que dependa de ato concessório ou habilitação também deve gerar alerta mesmo que a regra esteja cadastrada.

## Próxima etapa

Criar uma matriz de compatibilidade entre benefícios para impedir combinações incompatíveis e conectar a resolução de benefícios ao cálculo por item.
