# ImportaFácil — Runbook de atualização legislativa e publicação fiscal

## Princípio

Coleta automática não é publicação automática.

Workflows podem baixar fontes oficiais, gerar catálogos candidatos, validar estrutura e executar testes. Nenhuma alteração que mude regra fiscal, alíquota, vigência, escopo, benefício, suspensão ou defesa comercial pode chegar ao `main` apenas porque um parser encontrou uma mudança.

O `main` é a versão publicada do conhecimento fiscal do produto. Alterações fiscais entram nele somente por pull request revisada, com fonte oficial identificada, regressão específica e gate completo verde.

## Fluxo obrigatório

### 1. Detectar / coletar

A automação consulta uma fonte oficial suportada e gera um artefato candidato. O artefato não é usado pelo produto em produção e não é commitado automaticamente.

### 2. Triar a mudança

O revisor compara o candidato com o catálogo publicado e classifica a mudança:

- atualização semântica de alíquota/vigência;
- novo EX, quota ou tratamento tarifário;
- nova medida, alteração, suspensão ou encerramento de defesa comercial;
- mudança de escopo que exige novo dado do usuário;
- mudança apenas editorial/estrutural da fonte.

Se o parser não conseguir provar o escopo ou a regra, a implementação deve permanecer `requires_input`/bloqueada. Não completar lacunas por inferência.

### 3. Validar na fonte oficial

Toda mudança fiscal publicada deve preservar, quando disponível:

- órgão e fonte;
- URL oficial;
- ato/resolução/fundamento;
- data de publicação ou atualização;
- início/fim de vigência;
- escopo por NCM/origem/produtor/exportador;
- condição que impede cálculo automático.

### 4. Implementar em branch

Criar uma branch dedicada. Atualizar somente o catálogo/resolver necessário e adicionar regressão que reproduza a mudança jurídica. Não duplicar fórmula já existente.

### 5. Gate de publicação

Antes do merge:

1. regressão específica da mudança verde;
2. `npm run test:all` verde;
3. `npm run build` verde;
4. preview Vercel `READY` quando houver impacto executável/UI;
5. comportamento fail-closed conferido para dados faltantes e escopos ambíguos;
6. PR descrevendo fonte, efeito e limites do suporte.

### 6. Publicar e verificar produção

Somente após revisão, mergear no `main`. Validar o deploy Vercel do mesmo commit e executar o smoke aplicável. A data/fonte do catálogo deve continuar auditável no repositório ou no próprio resultado.

## Workflows

### Defesa comercial

`.github/workflows/sync-mdic-defesa-comercial.yml` roda como auditoria de candidato. Ele possui apenas `contents: read`, não executa `git push` e publica o JSON gerado como artefato temporário para revisão humana.

### Snapshot federal legado

`.github/workflows/ingest-official-fiscal-data.yml` é manual e gera somente artefato candidato histórico. Não publica em `main`.

### Snapshot federal de produção

O snapshot federal ativo é versionado e possui manifest de integridade. Uma nova edição oficial deve ser tratada em branch de atualização própria usando os scripts de inspeção/transformação existentes; o workflow histórico da Etapa 2 não deve ser interpretado como um serviço de atualização automática contínua.

## O que o produto pode afirmar

O ImportaFácil possui coleta/triagem automatizada em partes do corpus e catálogos versionados. A **publicação de regra fiscal é supervisionada**: exige revisão humana e gates de regressão/build/deploy.

Não afirmar que toda mudança legislativa é automaticamente detectada, interpretada e publicada sem revisão.

## Falhas e contingência

- fonte oficial indisponível: manter a versão publicada e registrar falha de coleta; não substituir por fonte não oficial silenciosamente;
- parser quebrou: não publicar candidato incompleto;
- vigência incerta: `requires_input`;
- conflito entre fontes/tratamentos: bloquear resolução automática até auditoria;
- mudança urgente: branch + regressão + revisão + gate continuam obrigatórios.
