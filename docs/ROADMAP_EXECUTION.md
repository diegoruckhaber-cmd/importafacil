# ImportaFácil — Roadmap operacional

Atualizado em 22/09/2026.

Este documento é o checklist oficial de execução do projeto. A regra operacional é: ao concluir uma etapa, registrar a evidência objetiva, atualizar o status e avançar para a próxima sem aguardar nova priorização.

## Status

- [x] 0. Integridade das simulações salvas
  - Resultado persistido é recalculado no servidor.
  - Escrita direta por cliente autenticado foi revogada.
  - RPC oficial restrita ao service role.
  - Produção validada após o cutover.

- [ ] 1. Assinatura PRO — E2E real
  - [x] Produto e preço live configurados no Stripe.
  - [x] Checkout, webhook, portal e leitura de assinatura implementados.
  - [x] Readiness técnico validado sem cobrança.
  - [ ] Executar primeiro checkout live pela aplicação.
  - [ ] Confirmar pagamento/assinatura no Stripe.
  - [ ] Confirmar evento de webhook persistido.
  - [ ] Confirmar registro em public.subscriptions.
  - [ ] Confirmar mudança efetiva de FREE para PRO.
  - [ ] Confirmar entitlement PRO na interface.
  - Critério de saída: uma assinatura real comprovada ponta a ponta.

- [ ] 2. Consistência visual e UX
  - [ ] Home.
  - [ ] Autenticação.
  - [ ] Simulador.
  - [ ] Resultado e alertas.
  - [ ] Histórico.
  - [ ] Comparador.
  - [ ] Upgrade/assinatura.
  - [ ] Relatório/PDF.
  - [ ] Responsividade mobile.
  - Critério de saída: fluxo principal consistente e sem bloqueadores visuais.

- [ ] 3. Prontidão operacional e fontes
  - [ ] Revalidar status das fontes MDIC/federais.
  - [ ] Confirmar freshness e fail-closed.
  - [ ] Garantir que falhas recentes de auditoria reduzam readiness.
  - [ ] Revisar sinais operacionais no dashboard/readiness.
  - Critério de saída: sistema não declara prontidão quando evidência crítica está ausente, vencida ou falhou.

- [ ] 4. Teste E2E completo
  - [ ] Criar/usar conta de teste.
  - [ ] Fazer primeira simulação.
  - [ ] Calcular.
  - [ ] Salvar.
  - [ ] Reabrir pelo histórico.
  - [ ] Comparar cenários.
  - [ ] Gerar relatório/PDF.
  - [ ] Validar limites FREE.
  - [ ] Validar benefícios PRO.
  - [ ] Validar erros e casos de borda.
  - Critério de saída: jornada principal reproduzível sem intervenção técnica.

- [ ] 5. Piloto acompanhado
  - [ ] Definir grupo pequeno de usuários reais.
  - [ ] Medir tempo até primeira simulação.
  - [ ] Registrar divergências e dúvidas.
  - [ ] Identificar abandono/atrito.
  - [ ] Medir valor percebido e intenção de pagar.
  - Critério de saída: feedback suficiente para separar defeitos, lacunas de UX e pedidos de produto.

- [ ] 6. Beta ampliado
  - [ ] Incorporar correções do piloto.
  - [ ] Revisar onboarding.
  - [ ] Confirmar limites FREE/PRO.
  - [ ] Confirmar monitoramento e alertas.
  - [ ] Ampliar acesso de forma gradual.
  - Critério de saída: produto apto a receber mais usuários sem acompanhamento individual obrigatório.

## Bloqueios externos

A etapa 1 exige uma ação financeira real por um usuário na aplicação. Todo o restante que puder ser verificado sem cobrança deve continuar avançando em paralelo, mas a etapa só recebe status concluído quando houver evidência de pagamento, webhook e mudança de entitlement.
