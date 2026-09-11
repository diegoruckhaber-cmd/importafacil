# Etapa 11 — Observabilidade da Simulation V2

## Objetivo

Fechar o item P2 de observabilidade e alerta de erro/divergência em produção com sinais estruturados, auditáveis e compatíveis com privacidade.

## Sinais produzidos

Cada chamada de `POST /api/simulation-v2` emite um evento estruturado no runtime:

- evento concluído ou falho;
- status final (`calculated`, `alert`, `requires_input`, `blocked`, `unsupported` ou `error`);
- duração da execução;
- quantidade de itens;
- UF de destino quando informada;
- códigos de issues, sem mensagens brutas;
- versão do motor unificado e federal;
- SHA do deploy Vercel quando disponível.

Status `blocked`/`unsupported` e erros são enviados em nível de erro; `requires_input`/`alert` em warning; cálculo normal em info. Isso permite criar filtros e alertas no runtime Vercel sem alterar o cálculo.

## Privacidade

A telemetria não pode conter:

- NCM;
- descrição do item;
- produtor/exportador;
- valores FOB, mercadoria, custo, preço ou lucro;
- identificador do usuário;
- mensagem bruta de exceção ou fundamento jurídico integral.

A regressão da etapa trava esse contrato.

## Health check

`GET /api/health` passa a expor somente identidade técnica não sensível:

- contrato da API;
- versão dos motores;
- snapshot federal ativo;
- escopo estadual homologado;
- SHA do deploy e ambiente.

Isso permite identificar divergência de versão entre deploys sem abrir dados de simulação.

## Gate

1. `test-simulation-v2-observability.mjs` passa em `npm run test:all`;
2. toda a regressão permanece verde;
3. build de produção permanece verde;
4. preview Vercel fica `READY`;
5. `/api/health` retorna as versões esperadas no preview;
6. após merge, produção fica `READY` e o health check aponta para o SHA do merge.
