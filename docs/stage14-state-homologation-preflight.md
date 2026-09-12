# Etapa 14 — Pré-homologação estadual baseada em evidências

## Objetivo
Criar um gate técnico/jurídico para preparar a futura homologação de uma nova UF sem permitir que um pacote incompleto ou ambíguo ative cálculo estadual.

## Arquitetura
`state-homologation-package.ts` valida apenas a completude mínima do pacote de evidências: UF válida, identificação de motor candidato, data de auditoria, fontes oficiais com validade verificada e regressões declaradas.

O resultado `eligible_for_review` significa apenas que o pacote pode seguir para revisão humana. Ele **não** significa que a UF está homologada e nunca altera a matriz de jurisdições.

`GET /api/state-homologation/preflight` é somente leitura e publica o contrato do gate, não recebe nem persiste regras fiscais.

## Fail-closed
- fonte sem URL HTTPS oficial: bloqueia;
- validade não verificada: bloqueia;
- ausência de regressão ou motor candidato: bloqueia;
- pacote tecnicamente completo: apenas `eligible_for_review`, jamais ativação automática.

## Gate
1. pacote incompleto retorna `blocked`;
2. pacote sintético completo pode retornar `eligible_for_review`;
3. a mesma UF continua `unsupported` na matriz e bloqueada no motor real;
4. nenhuma alíquota, benefício ou fórmula fiscal é cadastrada nesta camada;
5. `npm run test:all` e `npm run build` verdes;
6. preview e produção Vercel `READY`, com smoke do contrato de preflight.
