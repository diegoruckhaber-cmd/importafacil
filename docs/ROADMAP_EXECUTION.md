# ImportaFácil — Roadmap operacional

Atualizado em 23/09/2026.

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
  - Evidência: Stage 69, CI verde, preview READY e produção READY no commit `8c6f6c53c81920520c27d00412fde3ab652ef382`.
  - Critério de saída: fluxo principal consistente e sem bloqueadores visuais.

- [x] 3. Prontidão operacional e fontes
  - [x] Revalidar status das fontes MDIC/federais.
  - [x] Confirmar freshness e fail-closed.
  - [x] Garantir que falhas recentes de auditoria reduzam readiness.
  - [x] Revisar sinais operacionais no dashboard/readiness.
  - Evidência: Stage 70, produção retornando HTTP 200, `operations.status=ready`, sem blockers; auditorias MDIC/federal passaram.
  - Critério de saída: sistema não declara prontidão quando evidência crítica está ausente, vencida ou falhou.

- [ ] 4. Teste E2E completo
  - [ ] Criar/usar conta de teste autenticada em produção.
  - [x] Contrato do simulador e superfícies públicas validados.
  - [x] Regressão da jornada cobre login, recomputação oficial no save, limite FREE, proveniência do histórico e gates PRO.
  - [ ] Fazer primeira simulação autenticada em produção.
  - [ ] Calcular.
  - [ ] Salvar.
  - [ ] Reabrir pelo histórico.
  - [ ] Comparar cenários.
  - [ ] Gerar relatório/PDF.
  - [ ] Validar limites FREE.
  - [ ] Validar benefícios PRO.
  - [ ] Validar erros e casos de borda.
  - Evidência técnica: Stage 72 em produção no commit `7a354247d15c4352c569131ffaab213f6c79a28d`, com 142/142 regressões no gate daquela etapa.
  - Evidência humana atual: nenhum save V2 pós-cutover com `server_execution` foi observado.
  - Critério de saída: jornada principal autenticada reproduzível sem intervenção técnica.

- [ ] 5. Piloto acompanhado
  - [x] Instrumentação estruturada disponível em produção em `/pilot`.
  - [x] Respostas protegidas por RLS e limitadas ao próprio usuário.
  - [x] Métricas definidas: facilidade, confiança, valor percebido e disposição de pagar.
  - [x] Canal de feedback endurecido com privilégios mínimos e RLS otimizado.
  - [ ] Definir grupo pequeno de usuários reais.
  - [ ] Medir tempo até primeira simulação.
  - [ ] Registrar divergências e dúvidas.
  - [ ] Identificar abandono/atrito.
  - [ ] Medir valor percebido e intenção de pagar.
  - Evidência técnica: Stage 73 em produção no commit `cea8d0da901d5b1249d8d2243afdb5565972fc08`; Stage 75 endureceu `beta_feedback`.
  - Critério de saída: feedback suficiente para separar defeitos, lacunas de UX e pedidos de produto.

- [ ] 6. Beta ampliado
  - [ ] Incorporar correções do piloto.
  - [ ] Revisar onboarding após uso real.
  - [ ] Confirmar limites FREE/PRO com jornada autenticada.
  - [ ] Confirmar monitoramento e alertas durante uso real.
  - [ ] Ampliar acesso de forma gradual.
  - [x] Gate automático impede revisão para lançamento irrestrito enquanto a validação humana estiver pendente.
  - Critério de saída: produto apto a receber mais usuários sem acompanhamento individual obrigatório.

## Hardening complementar concluído

- [x] Stage 75 — `beta_feedback` restrito a SELECT/INSERT/DELETE para autenticados; policies usam `(select auth.uid())`; advisors sem alerta RLS novo para a tabela.
- [x] Stage 76 — readiness de validação humana em produção:
  - `server_verified_v2`;
  - `live_pro_subscription`;
  - `pilot_response`.
  - O beta controlado permanece disponível, mas a revisão para lançamento irrestrito fica `blocked_pending_human_validation` até os três marcos existirem.
- [x] Stage 77 — remoção do rótulo interno “Simulation V2” da página 404 e alinhamento ao shell visual do produto.

## Gates humanos atualmente abertos

1. **Primeiro save V2 autenticado pós-cutover**
   - Estado atual: pendente.
   - Evidência esperada: registro com `result.contract = 'importafacil-simulation-v2'` e `server_execution` preenchido.

2. **Primeiro checkout PRO live**
   - Estado atual: pendente.
   - Evidência esperada: Stripe → webhook → `public.subscriptions` → perfil/entitlement PRO.

3. **Primeira participação real no piloto**
   - Estado atual: pendente.
   - Evidência esperada: ao menos uma resposta real em `public.pilot_responses`, acompanhada de uso real do simulador.

## Regra de avanço

Enquanto um gate humano estiver aberto, todo trabalho técnico independente continua avançando. Nenhum gate humano deve ser simulado diretamente no banco ou no Stripe, porque isso invalidaria a evidência E2E que o roadmap exige.
