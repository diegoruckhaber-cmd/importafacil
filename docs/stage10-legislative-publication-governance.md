# Etapa 10 — Governança de atualização legislativa

## Objetivo

Fechar o item P1 que exige processo operacional de atualização legislativa documentado e impedir que coleta automática seja confundida com publicação automática de regra fiscal.

## Mudanças

- o workflow diário de defesa comercial deixa de possuir `contents: write` e deixa de executar `git push`;
- a coleta diária continua ativa, mas produz somente um artefato candidato por 14 dias para revisão;
- o ingest federal legado também passa a ser review-only e sem escrita no repositório;
- o runbook `docs/legislative-update-runbook.md` formaliza detecção, triagem, validação em fonte oficial, branch, regressão, PR, gate e verificação de produção;
- uma regressão arquitetural impede que esses workflows voltem a publicar regras fiscais diretamente.

## Política de publicação

Nenhuma mudança que altere alíquota, vigência, escopo, benefício, suspensão ou defesa comercial pode chegar ao `main` exclusivamente por execução de parser/workflow. A publicação fiscal exige revisão humana por PR e os gates técnicos do projeto.

## Gate

1. `test-legislative-publication-governance.mjs` passa em `npm run test:all`;
2. regressão completa permanece verde;
3. build de produção permanece verde;
4. preview Vercel fica `READY`;
5. os workflows auditados permanecem sem `contents: write` e sem `git push`;
6. após merge, o deploy de produção do mesmo commit fica `READY`.
