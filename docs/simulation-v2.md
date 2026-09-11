# ImportaFácil — Simulation V2

## Objetivo

A Simulation V2 é a camada de produto do motor unificado de importação. Ela não recria fórmulas fiscais: orquestra os resolvers e motores já existentes para entregar um pré-estudo multi-item com status explícito, custo nacionalizado e métricas comerciais básicas.

## Contrato

Endpoint: `POST /api/simulation-v2`

Contrato de resposta: `importafacil-simulation-v2`.

Status possíveis:

- `calculated`: cálculo concluído sem pendência relevante;
- `alert`: cálculo concluído, mas existem alertas que devem ser lidos;
- `requires_input`: falta informação necessária para fechar o enquadramento;
- `blocked`: uma regra jurídica/fiscal bloqueia a operação automática;
- `unsupported`: II ou IPI não pôde ser resolvido no catálogo federal homologado.

Nenhum status de validação ou bloqueio pode ser convertido silenciosamente em cálculo final.

## Escopo da Etapa 3

A V2 suporta uma operação com um ou mais itens e mantém premissas compartilhadas como data, câmbio, frete, seguro, armazenagem, modal e declaração. Cada item preserva sua própria NCM, origem, quantidade, FOB, peso, ICMS, produtor/exportador, seletores de EX/quota e contexto de TTD.

O fluxo usa:

1. `resolveFederalTaxes` para o preflight federal e para a resolução oficial dentro do motor;
2. `calculateUnifiedImportSimulation` como motor canônico da operação;
3. resolver de defesa comercial existente;
4. decisão/benefício de SC e motor final de custo existentes.

A camada comercial é posterior ao cálculo fiscal. Para cada item ela informa:

- custo nacionalizado por unidade / preço de equilíbrio;
- margem alvo;
- preço unitário necessário para a margem alvo;
- receita-alvo do lote;
- lucro estimado do lote.

Essas métricas são calculadas sobre o custo nacionalizado da importação e **não representam preço fiscal de venda**. Tributos, crédito presumido, DIFAL, regime tributário do cliente e demais efeitos da saída/venda não são deduzidos nem inferidos nesta etapa.

## Fora do escopo desta etapa

A Etapa 3 não altera histórico/persistência, relatório, comparador de cenários ou contratos antigos de simulação. Essa migração pertence à Etapa 4. Também não declara encerrado o gate global de defesa comercial; a V2 apenas respeita e expõe os estados produzidos pelo resolver atual.

## Gate de aceite

A Etapa 3 só pode ser considerada encerrada quando:

- o teste `test-simulation-v2.mjs` passar dentro de `npm run test:all`;
- toda a bateria de regressão existente permanecer verde;
- `npm run build` passar no mesmo commit;
- o preview Vercel estiver `READY`;
- `/simulacao-v2` estiver funcional no deploy aprovado;
- após merge, o mesmo contrato estiver `READY` em produção.
