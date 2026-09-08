# ImportaFácil — Checklist de lançamento

Atualizado em: 07/09/2026

## Critério de lançamento
O MVP comercial só é considerado liberado quando todos os itens P0 estiverem concluídos, a bateria `test:all` e o build de produção estiverem verdes e os cenários homologados estiverem explicitamente documentados. Uma regra fiscal não suportada deve bloquear o cálculo automático ou sinalizar validação; nunca deve gerar valor por inferência silenciosa.

## P0 — bloqueadores do lançamento
- [ ] Defesa comercial: suportar tipo de medida além de `antidumping`, incluindo medida compensatória.
- [ ] Defesa comercial: implementar `requiresScopeValidation` e `scopeCondition` no modelo/registry/resolver/API.
- [ ] Ésteres acéticos: bloquear cálculo automático quando não houver confirmação do escopo de embalagem (medida não se aplica a embalagem de capacidade <= 4 L).
- [ ] Batatas congeladas: estruturar e bloquear cálculo quando a descrição do produto puder cair na exclusão legal cadastrada.
- [ ] n-Butanol: separar as fontes oficiais EUA e África do Sul/Rússia, preservando vigências e matrizes próprias.
- [ ] Suspensões e alterações por interesse público: representar suspensão/alteração sem aplicar direito antigo silenciosamente.
- [ ] Compromissos de preço: modelar tratamento condicional; sem confirmação das condições, retornar validação em vez de presumir benefício.
- [ ] Medidas compensatórias: cadastrar e testar as medidas vigentes suportadas pelo índice oficial do MDIC.
- [ ] Cobertura efetiva: zerar casos em que uma combinação oficialmente coberta gera cálculo automático com escopo ambíguo; casos não resolvíveis devem retornar `requires_input`.
- [ ] ICMS: definir e documentar UFs/cenários efetivamente homologados para o MVP; fora do escopo, bloquear ou avisar claramente.
- [ ] Homologação E2E: validar conjunto representativo de operações reais contra memória de cálculo independente.
- [ ] Qualidade: `npm run test:all` verde no commit candidato.
- [ ] Produção: `npm run build` verde no commit candidato.
- [ ] Produção: deploy Vercel READY no mesmo commit aprovado.

## P1 — necessário para lançamento comercial controlado
- [ ] Mensagens da interface distinguem `calculado`, `alerta`, `requer validação` e `não suportado`.
- [ ] Fonte legal, vigência e motivo do bloqueio aparecem no resultado quando houver tratamento especial.
- [ ] Não existe fallback silencioso para alíquota de defesa comercial quando produtor/exportador ou escopo forem indispensáveis.
- [ ] Catálogos versionados possuem data/fonte de auditoria.
- [ ] Processo operacional de atualização legislativa está documentado; não prometer ingestão automática enquanto ela não existir.
- [ ] Teste de regressão para II temporário confirma que a alíquota padrão do snapshot continua sendo a taxa de cálculo e a medida temporária permanece alerta separado.

## P2 — pós-MVP
- [ ] Ampliar homologação estadual para cobertura nacional progressiva.
- [ ] Automatizar coleta/triagem legislativa com revisão humana antes de publicar regra fiscal.
- [ ] Observabilidade e alertas de divergência/erro em produção.
- [ ] Histórico/versionamento de regras consultável pela interface.

## Gate final
Status atual: **NÃO LIBERADO PARA LANÇAMENTO COMERCIAL IRRESTRITO**.

Beta controlado pode ser liberado quando os P0 técnicos de cálculo estiverem verdes e o uso ficar restrito aos cenários fiscais homologados. O lançamento comercial ocorre somente após o gate P0 completo e deploy do mesmo commit validado.
