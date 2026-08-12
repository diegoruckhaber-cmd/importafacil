# SC — Rulebook de benefícios de ICMS na importação

## Objetivo

Registrar benefícios de SC como regras jurídicas condicionais, e não como simples alíquotas.

## Regra de segurança

Nenhum benefício deve ser apresentado ao usuário como automaticamente aplicável. O motor deve separar existência do benefício, elegibilidade e efeito financeiro.

## TTD 409/410 — referência estrutural

- Base normativa principal cadastrada: art. 246 do Anexo 2 do RICMS/SC.
- O tratamento pode envolver diferimento na importação e crédito presumido nas operações subsequentes, conforme o regime e suas condições.
- A existência de TTD/regime especial concedido ao contribuinte é condição relevante.
- A aplicação pode depender de NCM, natureza/destinação da mercadoria, operação de saída, origem, local/via de desembaraço e outras condições do regime.
- O motor deve consultar exceções e atos posteriores antes de concluir pela aplicabilidade.

## Evidências oficiais recentes

1. COPAT Consulta 10/2026: TTD 409/410 e importação de bobinas de aço. A alteração da posição da NCM após fracionamento pode impedir a fruição do crédito presumido quando descaracteriza a mercadoria importada.
2. COPAT Consulta 19/2026: TTD 410 e TTD 77 não podem ser tratados como benefícios livremente intercambiáveis; a tributação depende da destinação e do regime aplicável.
3. COPAT Consulta 25/2026: TTD 409 em importação por conta própria de mercadoria originária do Paraguai, com entrada/desembaraço em outra UF por via terrestre; a decisão ressalta as condições do regime especial e da legislação vigente.
4. COPAT Consulta 4/2026: NCM 2710.12.49 enquadrada na vedação do Decreto 2.128/2009, mesmo com denominação comercial diferente; a classificação legal da NCM prevalece para a análise da vedação.
5. Decreto 1.453/2026: alteração do Decreto 2.128/2009 com efeitos desde 01/03/2026, demonstrando a necessidade de versionamento temporal das exceções.

## Modelo de regra

Cada benefício deve ser armazenado com:

- UF;
- identificador do benefício/TTD;
- tributo;
- tipo de efeito (diferimento, crédito presumido, redução, isenção etc.);
- fundamento principal;
- fundamentos complementares;
- data inicial e final de vigência;
- exigência de regime especial;
- NCM/posição/subposição abrangida ou excluída;
- origem relevante;
- local de desembaraço relevante;
- modal/via relevante;
- destinação relevante;
- tipo de operação/saída;
- compatibilidades;
- incompatibilidades;
- condições documentais;
- obrigações acessórias;
- fonte oficial;
- data da última verificação;
- nível de confiança.

## Critério de qualidade

Regra concreta só pode ser marcada como `validated` após conferência da legislação vigente e das condições do benefício. Regra em pesquisa deve permanecer `candidate`/`needsReview` e não pode alimentar um cálculo definitivo.

## Estados futuros

O mesmo modelo será reutilizado para RO, ES, PE, MG e demais UFs. A implementação deve ser incremental: primeiro regras com fonte oficial e condição claramente identificável; depois expansão de cobertura.
