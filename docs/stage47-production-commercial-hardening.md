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
- aviso obsoleto de checkout em modo de teste foi removido da interface;
- `/api/health` passou a derivar o escopo estadual do activation guard e reporta `national_27_uf`, 27 UFs ativas e `stateActivationStatus: safe` em produção.

## Auditoria externa de produção

### Stripe

A auditoria inicial da conta de produção em 2026-09-16 encontrou:

- 0 webhook endpoints;
- 0 produtos ativos;
- 0 preços recorrentes ativos;
- 0 assinaturas, inclusive históricas na consulta `status=all`;
- o antigo price ID de fallback existente no código não existia na conta de produção.

Após reautorização de escrita da conexão Stripe, a infraestrutura comercial live foi provisionada na mesma conta de produção:

- produto: `ImportaFácil PRO` (`prod_VGtQJOLMyvjxPt`);
- preço recorrente mensal: `R$ 29,90` em BRL (`price_1UGLdjKmvvWdDZmoz734i87Q`);
- lookup key: `importafacil_pro_monthly_brl`;
- webhook endpoint: `we_1UGLdwKmvvWdDZmoZgbBaEMP`;
- URL do webhook: `https://importafacil-gamma.vercel.app/api/stripe/webhook`;
- eventos habilitados: `checkout.session.completed`, `customer.subscription.created`, `customer.subscription.updated`, `customer.subscription.deleted`, `invoice.paid` e `invoice.payment_failed`;
- nenhuma assinatura live foi criada durante a configuração.

O signing secret do webhook não é registrado em documentação nem no repositório.

### Vercel

A conexão Vercel disponível neste ambiente não expõe mutação de environment variables. Portanto, a infraestrutura Stripe foi criada, mas o go-live de cobrança continua fail-closed até que o ambiente de produção contenha as credenciais correspondentes.

Variáveis a validar/configurar em produção:

- `STRIPE_SECRET_KEY` — chave live da mesma conta Stripe;
- `STRIPE_PRO_PRICE_ID=price_1UGLdjKmvvWdDZmoz734i87Q`;
- `STRIPE_WEBHOOK_SECRET` — signing secret do endpoint live acima;
- `SUPABASE_SERVICE_ROLE_KEY` — somente server-side, necessário para persistência do entitlement.

### Supabase

A revalidação live de schema/RLS foi tentada novamente após o provisionamento Stripe e continua bloqueada porque a conexão administrativa retorna `28P01 password authentication failed for user postgres`. Isso é um bloqueio de verificação, não evidência de falha das políticas existentes. Nenhuma alteração de schema/RLS foi aplicada nesta etapa sem introspecção confiável.

### GitHub

A branch `main` segue sem branch protection e o repositório não possui rulesets. O workflow existente `Full engine validation` continua sendo a bateria canônica de regressão + build. A proteção deve exigir PR e esse check antes de merge; a conexão GitHub disponível nesta etapa não expõe mutação administrativa de branch protection/rulesets.

## Gates remanescentes para monetização real

1. Configurar/validar as variáveis de produção no Vercel listadas acima.
2. Executar checkout real controlado, confirmar criação da assinatura e ativação PRO.
3. Validar persistência em `profiles` e `subscriptions` no Supabase.
4. Validar cancelamento e falha de pagamento retornando o entitlement para FREE quando aplicável.
5. Revalidar RLS/policies no Supabase assim que a conexão administrativa voltar a funcionar.
6. Ativar proteção de `main` exigindo PR + `Full engine validation`.

## Release

Esta etapa não promove o release comercial irrestrito. `eligible_for_release_review` continua sendo um gate manual e não equivale a autorização automática de go-live.

## Validação do candidato

O candidato da Etapa 47 passou no workflow canônico `Full engine validation` e no preview Vercel antes do merge. O follow-up de observabilidade nacional também passou regressões, build, preview, merge, produção READY e smoke de `/api/health` + `/api/launch-readiness`.
