# ImportaFácil — infraestrutura e publicação

## Execução local

Instale as dependências com `npm install` e use os scripts definidos em `package.json`. A regressão completa do motor é executada por `npm run test:all`; o build de produção por `npm run build`.

## Variáveis de ambiente

Use `.env.example` como referência. Credenciais reais não devem ser versionadas. Integrações externas devem permanecer fail-closed quando a configuração necessária não estiver disponível.

## Banco, autenticação e pagamentos

Os módulos de banco, autenticação e checkout devem ser tratados como integrações independentes do motor tributário. Nenhuma ausência de credencial pode degradar silenciosamente regras fiscais ou liberar funcionalidades protegidas.

## Publicação

O repositório está conectado ao projeto Vercel `importafacil`:

- branch `main`: produção;
- branches/PRs: preview;
- regressão + build: workflow `.github/workflows/recovery-validation.yml` (`Full engine validation`);
- build/preview adicional: integração Vercel.

Antes de mergear uma etapa, a regressão completa, o build e o preview devem estar verdes. Após o merge, o deploy de produção deve ficar `READY` e os endpoints relevantes devem passar por smoke test.

## Fontes de verdade de release

- `GET /api/launch-readiness`: prontidão e evidências;
- `GET /api/release-scope`: escopo comercial;
- `docs/launch-checklist.md`: resumo humano, subordinado aos contratos executáveis.

O estado `eligible_for_release_review` não equivale a autorização automática de lançamento comercial irrestrito.
