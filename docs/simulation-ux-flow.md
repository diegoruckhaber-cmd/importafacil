# Fluxo de Simulação — UX progressiva

## Princípio

> Simples para usar. Profundo para confiar.

A complexidade tributária deve permanecer no motor. A interface deve solicitar apenas os dados necessários para aumentar a precisão da simulação.

## Etapas

### 1. Produtos
- descrição;
- NCM;
- quantidade;
- valor unitário e moeda;
- peso líquido por item quando necessário ao rateio.

O usuário pode adicionar vários itens antes de avançar.

### 2. Logística
- Incoterm;
- país de origem;
- porto/local de embarque;
- destino/UF;
- frete internacional;
- seguro;
- outros acréscimos/deduções relevantes.

### 3. Empresa
- UF do estabelecimento/importador;
- regime tributário;
- opção de informar regime especial/benefício conhecido.

### 4. Perguntas condicionais
O sistema só mostra perguntas adicionais quando uma regra relevante exigir a informação. Exemplos:
- benefício fiscal potencial identificado;
- regime especial necessário;
- origem relevante para preferência tarifária;
- tratamento administrativo dependente de atributos do produto;
- crédito tributário dependente da utilização/destinação.

### 5. Resultado
Mostrar primeiro:
- custo total;
- custo por item;
- tributos totais;
- despesas;
- economia potencial identificada.

Aprofundamento progressivo:
1. resumo;
2. composição do custo;
3. tributação por item;
4. benefícios e cenários;
5. base legal/evidências;
6. alertas e dados pendentes.

## Estados de confiança

### Estimativa
Resultado calculado com dados mínimos e hipóteses explícitas.

### Provável
Principais variáveis tributárias e operacionais informadas, sem pendências materiais conhecidas.

### Condicional
Existe benefício, crédito, regime ou tratamento dependente de condição não confirmada.

### Validado
Todas as regras automatizáveis relevantes possuem fonte oficial vigente e as condições necessárias foram informadas/confirmadas.

## Regra de segurança de apresentação

Uma economia potencial não deve ser incorporada ao custo principal quando sua elegibilidade estiver pendente. O resultado deve separar:
- cenário conservador;
- cenário potencial;
- condições necessárias para alcançar o cenário potencial.

## Referência operacional

A Receita Federal informa que seu simulador oficial usa NCM, valor aduaneiro e moeda como dados básicos e retorna alíquotas ad valorem, valores estimados e controles administrativos. O ImportaFácil deve manter a simplicidade dessa entrada, mas acrescentar a camada gerencial, estadual, multi-item e de decisão econômica.

Na DUIMP, os fundamentos legais disponíveis para o item dependem de informações já prestadas, como NCM e país de origem, e o cálculo dos tributos ocorre por item. O ImportaFácil deve reproduzir esse princípio sem expor toda a complexidade ao usuário inicial.
