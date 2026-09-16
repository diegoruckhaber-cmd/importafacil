# Etapa 47 — Production & Commercial Hardening

Data da auditoria: 2026-09-16.

## Objetivo

Endurecer o perímetro de produção e monetização sem alterar fórmulas, alíquotas, fontes fiscais ou decisões do motor tributário.

## Alterações de código

- checkout Stripe passou a exigir `STRIPE_PRO_PRICE_ID` explicitamente e não possui fallback hardcoded;
- webhook Stripe preserva verificação HMAC do corpo bruto, tolerância temporal e comparação timing-safe;
- eventos de assinatura relevantes incluem checkout, criação/atualização/exclusão de assinatura e eventos de fatura paga/falha;
- entitlement PRO é fail-closed: somente assinaturas `active` ou `trialing` liberam PRO;
- persistência no Supabase agora valida respostas HTTP; falhas não podem retornar webhook 200 silenciosamente;
- contratos públicos de release foram reconciliados: beta controlado = `released_with_restrictions`; release comercial irrestrito = `eligible_for_release_review`;
- aviso obsoleto de checkout em modo de teste foi removido da interface.

## Auditoria externa de produção

### Stripe

Na conta de produção auditada em 2026-09-16 foram encontrados:

- 0 webhook endpoints;
- 0 produtos ativos;
- 0 preços recorrentes ativos;
- 0 assinaturas, inclusive históricas na consulta `status=all`;
- o antigo price ID de fallback existente no código não existe na conta de produção.

Conclusão: o código fica preparado e fail-closed, mas a monetização real permanece indisponível até que produto/preço recorrente, endpoint de webhook e variáveis de ambiente de produção sejam configurados e validados.

### Supabase

A revalidação live de schema/RLS ficou bloqueada porque a conexão administrativa retornou `28P01 password authentication failed for user postgres`. Isso é um bloqueio de verificação, não evidência de falha das políticas existentes. Nenhuma alteração de schema/RLS foi aplicada nesta etapa sem introspecção confiável.

### GitHub

A branch `main` segue sem branch protection e o repositório não possui rulesets. O workflow existente `Full engine validation` continua sendo a bateria canônica de regressão + build. A proteção deve exigir PR e esse check antes de merge; a conexão GitHub disponível nesta etapa não expõe mutação administrativa de branch protection/rulesets.

## Gates para monetização real

1. Criar/configurar no Stripe o produto PRO e seu preço mensal coerente com a oferta exibida no produto.
2. Configurar `STRIPE_PRO_PRICE_ID` no ambiente de produção.
3. Criar endpoint Stripe apontando para `/api/stripe/webhook` e assinar os eventos homologados.
4. Configurar `STRIPE_WEBHOOK_SECRET` no ambiente de produção.
5. Confirmar `SUPABASE_SERVICE_ROLE_KEY` somente no servidor e validar as tabelas `profiles`/`subscriptions` e suas políticas.
6. Executar checkout real controlado, confirmar ativação PRO e depois validar cancelamento/falha de pagamento.
7. Ativar proteção de `main` exigindo PR + `Full engine validation`.

## Release

Esta etapa não promove o release comercial irrestrito. `eligible_for_release_review` continua sendo um gate manual e não equivale a autorização automática de go-live.

## Validação do candidato

O candidato da Etapa 47 passou no workflow canônico `Full engine validation` e no preview Vercel antes do merge.
