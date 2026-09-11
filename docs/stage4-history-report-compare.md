# Etapa 4 — Histórico, relatório e comparador

A Etapa 4 migra as superfícies consumidoras para o contrato `importafacil-simulation-v2` sem recriar ou recalcular regras tributárias.

## Persistência

`POST /api/simulations` aceita `mode: "v2"` e persiste `input` + `result` exatamente como produzidos pela Simulation V2. O endpoint não executa o calculador legado nesse modo.

## Histórico

O painel reconhece três gerações de registro: `v2`, `sc` e `legacy`. Registros antigos continuam legíveis. Novas simulações devem ser iniciadas em `/simulacao-v2`.

## Detalhe

`/simulacao/[id]` detecta o contrato salvo. Para V2, reproduz status, resumo, itens, custos e métricas comerciais a partir do snapshot persistido.

## Relatório

O relatório PRO trabalha com uma Simulation V2 salva. Ele não chama resolver federal, decision engine ou motor de custo. A saída representa o snapshot auditável da simulação.

## Comparador

O comparador PRO seleciona de 2 a 4 Simulation V2 salvas e compara custo nacionalizado, tributos, defesa comercial, economia de ICMS-importação, receita alvo e lucro estimado. Não há recálculo fiscal durante a comparação.

## Compatibilidade

Registros legados e operações SC antigas continuam acessíveis no histórico e detalhe. A migração não altera dados existentes e não requer mudança de schema no Supabase, pois `input` e `result` já são persistidos como estruturas JSON.

## Gate

A etapa só pode ser encerrada após:

- regressão `test-simulation-v2-history-report-compare.mjs` verde;
- bateria completa de testes verde;
- build Next.js verde;
- preview Vercel READY;
- smoke das rotas `/dashboard`, `/simulacao-v2`, `/relatorio` e `/comparar`;
- merge e deploy de produção READY.
