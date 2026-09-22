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

- [x] 2. Consistência visual e UX
  - [x] Home.
  - [x] Autenticação.
  - [x] Simulador.
  - [x] Resultado e alertas.
  - [x] Histórico.
  - [x] Comparador.
  - [x] Upgrade/assinatura.
  - [x] Relatório/PDF.
  - [x] Responsividade mobile.
  - Evidência: Stage 69, CI verde, preview READY e produção READY no commit 8c6f6c53c81920520c27d00412fde3ab652ef382.
  - Critério de saída: fluxo principal consistente e sem bloqueadores visuais.

- [x] 3. Prontidão operacional e fontes
  - [x] Revalidar status das fontes MDIC/federais.
  - [x] Confirmar freshness e fail-closed.
  - [x] Garantir que falhas recentes de auditoria reduzam readiness.
  - [x] Revisar sinais operacionais no dashboard/readiness.
  - Evidência: Stage 70, produção retornando HTTP 200, operations.status=ready, sem blockers; auditorias MDIC/federal passaram no commit 473911993c681da84aff2921b0cd765326b4fb85.
  - Critério de saída: sistema não declara prontidão quando evidência crítica está ausente, vencida ou falhou.

- [ ] 4. Teste E2E completo
  - [ ] Criar/usar conta de teste autenticada em produção.
  - [x] Contrato do simulador e superfícies públicas validados; falta sessão real para a jornada autenticada.
  - [ ] Fazer primeira simulação autenticada em produção.
  - [ ] Calcular.
  - [ ] Salvar.
  - [ ] Reabrir pelo histórico.
  - [ ] Comparar cenários.
  - [ ] Gerar relatório/PDF.
  - [ ] Validar limites FREE.
  - [ ] Validar benefícios PRO.
  - [ ] Validar erros e casos de borda.
  - Evidência atual: todas as superfícies principais respondem 200 em produção; 6 registros históricos existem, porém 0 são V2 e 0 possuem server_execution, portanto não contam como prova pós-cutover.
  - Critério de saída: jornada principal autenticada reproduzível sem intervenção técnica.

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
