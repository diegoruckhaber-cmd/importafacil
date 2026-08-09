# ImportaFácil V8 — infraestrutura comercial

## Banco
O `prisma/schema.prisma` modela:
- usuários;
- simulações;
- NCMs monitoradas;
- assinaturas.

## Pagamento
`/api/checkout` é a fronteira para checkout. Ele retorna 501 enquanto não houver credenciais e price ID configurados.

## Autenticação
A aplicação ainda não deve considerar o usuário autenticado. A próxima integração deve adicionar um provedor de autenticação e proteger as rotas de simulação/histórico.

## Publicação
Não há projeto Vercel conectado nesta conta neste momento. Portanto, esta versão está pronta para conexão, mas não foi declarada como produção.

## Variáveis
Copie `.env.example` para `.env.local` somente quando os serviços reais estiverem conectados.
