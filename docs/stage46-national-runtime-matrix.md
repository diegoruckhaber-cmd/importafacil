# Etapa 46 — Matriz nacional de runtime

## Objetivo

Transformar a cobertura estadual 27/27 em uma prova única de integração no caminho real da Simulation V2, do contrato HTTP até o motor unificado.

As etapas estaduais 19–44 validaram cada UF isoladamente. Esta etapa adiciona um gate transversal que falha se qualquer UF homologada deixar de calcular pelo runtime de produto ou se uma UF `general_rate_only` aceitar silenciosamente tratamento estadual fora do escopo.

## Escopo

A matriz nacional executa `POST /api/simulation-v2` em memória para todas as 27 UFs usando uma operação federal resolvível e verifica:

1. contrato `importafacil-simulation-v2` preservado;
2. HTTP 200 para o caminho normal homologado;
3. jurisdição retornada para a UF solicitada;
4. 27 UFs presentes no conjunto homologado;
5. cálculo e resumo efetivamente produzidos;
6. para UFs `GENERAL`, alíquota aplicada igual à regra geral homologada;
7. para UFs `general_rate_only`, TTD/regime especial permanece fail-closed;
8. tentativa fora da jurisdição homologada permanece bloqueada;
9. bloqueios de escopo estadual são devolvidos como resultado estruturado da Simulation V2, e não como erro HTTP genérico.

## Correção de consistência

Antes desta etapa, o motor unificado já bloqueava corretamente benefícios/regimes especiais nas UFs `general_rate_only`, porém a camada Simulation V2 não classificava essa mensagem como bloqueio de escopo. O resultado podia subir até a rota como HTTP 400 genérico.

A Etapa 46 passa a distinguir:

- `state_jurisdiction_unsupported`: UF sem jurisdição homologada;
- `state_scope_unsupported`: UF homologada, mas tratamento solicitado fora do escopo homologado;
- `state_rule_blocked`: demais bloqueios de regra estadual;
- `state_rule_requires_input`: condição estadual que exige validação.

Isso não flexibiliza nenhuma regra fiscal. Ao contrário: mantém o comportamento fail-closed e melhora a semântica entregue ao produto.

## Gate

- matriz nacional verde para 27/27 UFs;
- todas as UFs `general_rate_only` rejeitam TTD/regime especial com status `blocked` e código `state_scope_unsupported`;
- UF inválida retorna status `blocked` e `state_jurisdiction_unsupported`;
- regressão completa `npm run test:all` verde;
- build de produção verde;
- preview Vercel `READY`;
- merge somente após gates verdes;
- produção `READY` e smoke final dos contratos de readiness/release-scope.
