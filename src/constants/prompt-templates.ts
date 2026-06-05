export type PromptTemplate = {
  id: string
  name: string
  description: string
  content: string
}

export const PROMPT_TEMPLATES: PromptTemplate[] = [
  {
    id: "importacao-simplificada",
    name: "Análise para Importação Simplificada",
    description: "Relatório completo de viabilidade do produto para importação simplificada",
    content: `Analise a viabilidade deste produto para importação simplificada e gere um relatório padronizado em Markdown. Inclua a URL do produto analisado.

IMPORTANTE: O relatório DEVE começar com o bloco "Resumo para Esteira" exatamente no formato abaixo. Esses campos são extraídos automaticamente pelo sistema.

# Template do Relatório

## 📋 Resumo para Esteira

> Este bloco é obrigatório e usado para alimentar o Kanban automaticamente.

- Nome: (nome completo do produto)
- Categoria: (categoria principal > subcategoria)
- Preço atual: R$ (valor no formato brasileiro, ex: 49,90)
- Vendas mensais estimadas: (número inteiro, ex: 1.200)
- Concorrência: (exatamente uma das opções: Baixa | Média | Alta | Saturado)
- Potencial de margem: (percentual ou faixa, ex: 35-45%)
- Score Final: (nota de 0 a 10 representando viabilidade geral)

---

## 📦 Informações do Produto

- Nome:
- URL:
- Categoria:
- Preço atual:
- Data do anúncio:
- Dias ativo:
- Loja/Vendedor:
- Reputação do vendedor:

## 📊 Métricas do Mercado Livre

- Total de vendas:
- Vendas por dia:
- Vendas mensais estimadas:
- Faturamento mensal estimado:
- Número de visitas:
- Taxa de conversão estimada:
- Quantidade de avaliações:
- Nota média:
- Tendência de crescimento:

## ⭐ Análise de Qualidade

Avalie:

- Qualidade percebida do produto
- Principais elogios nas avaliações
- Principais reclamações
- Frequência de problemas relatados
- Potencial de recompra
- Risco de devolução/reembolso

## 🔥 Análise de Demanda

Avalie:

- Nível de demanda atual
- Potencial de viralização
- Competitividade da categoria
- Saturação do mercado
- Potencial para anúncios pagos
- Público-alvo provável

## 🚚 Viabilidade para Importação Simplificada

Avalie:

- Facilidade de importação
- Tamanho/peso ideal para importação
- Risco alfandegário
- Potencial de margem
- Facilidade logística
- Possibilidade de diferenciação
- Complexidade operacional

## 💡 Oportunidades Estratégicas

Identifique:

- Possíveis melhorias no produto
- Kits/bundles possíveis
- Upsells
- Variações interessantes
- Estratégias de posicionamento

## 📈 Score Final

Atribua notas de 0 a 10 para cada critério:

| Critério | Nota |
|----------|------|
| Demanda | /10 |
| Margem | /10 |
| Concorrência | /10 |
| Escalabilidade | /10 |
| Facilidade operacional | /10 |
| Potencial de lucro | /10 |

**Score Final:** (média ponderada, nota única de 0 a 10 — DEVE ser igual ao valor informado no "Resumo para Esteira")

## ✅ Conclusão Final

Forneça uma conclusão objetiva informando:

- Se vale importar ou não
- Nível de risco
- Potencial de escala
- Melhor estratégia de venda
- Recomendação final`,
  },
  {
    id: "tendencias-alta-demanda",
    name: "Tendências: Alta Demanda e Baixa Concorrência",
    description: "Identifica produtos com alta demanda e baixa concorrência em categorias do Mercado Livre",
    content: `Analise os produtos listados nesta página de categoria/tendências do Mercado Livre e identifique oportunidades com ALTA DEMANDA e BAIXA CONCORRÊNCIA. Gere um relatório em Markdown.

Página de exemplo: https://lista.mercadolivre.com.br/celulares-telefones/smartwatches-acessorios/peliculas-protetoras/

INSTRUÇÕES DE ANÁLISE:

1. Para cada produto listado, colete:
   - Link do produto (URL completa do anúncio)
   - Título do anúncio
   - Preço
   - Quantidade vendida (se visível)
   - Avaliações (quantidade e nota)
   - Tipo de envio (Full, grátis, etc.)
   - Vendedor (se é loja oficial ou vendedor comum)

2. Critérios para ALTA DEMANDA:
   - Muitas vendas (>100/mês)
   - Muitas avaliações positivas
   - Presença de múltiplos vendedores do mesmo produto
   - Produtos com frete grátis/Full (indica volume)
   - Preço acessível para compra por impulso

3. Critérios para BAIXA CONCORRÊNCIA:
   - Poucos vendedores oferecendo o produto exato
   - Anúncios mal otimizados (fotos ruins, títulos fracos)
   - Poucos vendedores com Mercado Líder
   - Ausência de lojas oficiais dominando
   - Espaço para diferenciação (kits, variações, qualidade superior)

4. Sinais de OPORTUNIDADE:
   - Produto com muita venda mas poucos anúncios bem feitos
   - Nichos dentro da categoria com pouca competição
   - Produtos complementares pouco explorados
   - Variações de produto que ninguém oferece
   - Kits/combos que não existem na categoria

# Template do Relatório

## 🔍 Visão Geral da Categoria

- Categoria analisada:
- URL:
- Total de produtos analisados:
- Faixa de preço predominante:
- Ticket médio:
- Nível geral de concorrência: (Baixo / Médio / Alto / Saturado)

## 🏆 Top 5 Oportunidades Identificadas

Para cada oportunidade:

### 🥇 Oportunidade #1 — [Nome do Produto/Nicho]

- **Produto/Nicho:**
- **Link do produto:**
- **Faixa de preço:**
- **Demanda estimada:** (Alta / Muito Alta)
- **Concorrência atual:** (Baixa / Média-Baixa)
- **Por que é oportunidade:**
- **Evidências de demanda:**
  - Vendas observadas nos anúncios:
  - Volume de avaliações:
  - Posição nos resultados:
- **Gaps identificados:**
  - O que falta nos anúncios atuais:
  - Diferenciação possível:
- **Estratégia sugerida de entrada:**
- **Risco:**

(Repetir para #2, #3, #4, #5)

## 📊 Mapa de Concorrência

| Produto/Nicho | Demanda | Concorrência | Oportunidade | Ticket Médio |
|---------------|---------|--------------|--------------|-------------|
| | Alta/Média/Baixa | Alta/Média/Baixa | ⭐⭐⭐⭐⭐ | R$ |

## 🚫 Produtos/Nichos a EVITAR

Liste produtos com:
- Mercado saturado (muitos vendedores fortes)
- Margens muito baixas
- Dominados por lojas oficiais
- Guerra de preço insustentável

## 💡 Estratégias de Diferenciação

Para as oportunidades identificadas, sugira:
- Melhorias no título e SEO
- Fotos/vídeos que faltam
- Kits e combos possíveis
- Variações inexploradas
- Descrições otimizadas
- Estratégias de preço

## 🎯 Plano de Ação

1. Produto prioritário para começar:
2. Investimento inicial estimado:
3. Margem potencial:
4. Tempo estimado para primeiras vendas:
5. Próximos passos recomendados:`,
  },
  {
    id: "analise-oferta-demanda-concorrencia",
    name: "Análise de Oferta, Demanda e Concorrência",
    description: "Relatório estratégico completo sobre viabilidade comercial de um produto no Mercado Livre",
    content: `# Análise de Oferta, Demanda e Concorrência — Mercado Livre

## Contexto

Você é um especialista em **Market Intelligence para Mercado Livre**, com foco em análise de nichos, validação de produtos e identificação de oportunidades.

Seu objetivo é analisar os dados fornecidos e produzir um relatório estratégico completo sobre a viabilidade comercial do produto.

---

# Objetivos da Análise

Determinar:

- Nível de demanda
- Nível de concorrência
- Saturação do mercado
- Oportunidade de entrada
- Potencial de faturamento
- Dificuldade para ranquear organicamente
- Possibilidade de diferenciação
- Estratégia recomendada

---

# Dados Coletados

## Categoria

**[INSERIR NOME DA CATEGORIA]**

---

## Indicadores Gerais

| Métrica | Valor |
|----------|---------|
| Total de vendas da página | 14.237 |
| Taxa Clássico | 13% |
| Taxa Premium | 18% |

---

## Anúncios Encontrados

### Anúncio 1

| Métrica | Valor |
|----------|---------|
| Vendas | 10.000 |
| Participação | 70,2% |
| Visitas | 31.846 |
| Tempo de anúncio | 1.757 dias |
| Faturamento estimado | R$ 151.500 |

---

### Anúncio 2

| Métrica | Valor |
|----------|---------|
| Vendas | 1.000 |
| Participação | 7,0% |
| Visitas | 1.498 |
| Tempo de anúncio | 76 dias |
| Faturamento estimado | Não informado |

---

### Anúncio 3

| Métrica | Valor |
|----------|---------|
| Vendas | 25 |
| Participação | 0,2% |
| Tempo de anúncio | 215 dias |

---

### Anúncio 4

| Métrica | Valor |
|----------|---------|
| Vendas | 25 |
| Participação | 0,2% |
| Tempo de anúncio | 252 dias |

---

# Tarefa 1 — Análise da Demanda

Avalie:

- Existe demanda validada?
- A demanda é crescente, estável ou concentrada?
- Quantidade estimada de vendas mensais.
- Potencial de faturamento da categoria.
- Potencial de recorrência.

### Classificação

Escolha uma:

- Muito Baixa
- Baixa
- Média
- Alta
- Muito Alta

### Justificativa

Explique detalhadamente os motivos da classificação.

---

# Tarefa 2 — Análise da Concorrência

Avalie:

- Quantidade de vendedores relevantes.
- Quantidade de anúncios ativos competitivos.
- Nível de maturidade dos concorrentes.
- Dependência da categoria em poucos vendedores.
- Facilidade para novos vendedores entrarem.

### Classificação

Escolha uma:

- Muito Baixa
- Baixa
- Média
- Alta
- Muito Alta

### Justificativa

Explique os fatores que influenciam a concorrência.

---

# Tarefa 3 — Análise de Concentração de Mercado

Calcule:

### Participação do líder

(%)

### Participação dos Top 3

(%)

### Participação dos Top 10

(%)

Determine se o mercado é:

- Pulverizado
- Moderadamente Concentrado
- Altamente Concentrado

Explique:

- Quais riscos existem.
- Quais vantagens existem.
- Se há dependência excessiva de poucos vendedores.

---

# Tarefa 4 — Oportunidade de Entrada

Responda:

### Existe espaço para novos vendedores?

### O líder domina por:

- Antiguidade?
- Preço?
- Reputação?
- SEO?
- Catálogo?
- Volume?

### Um novo vendedor conseguiria competir através de:

- Melhor preço
- Melhor kit
- Melhor oferta
- Melhor anúncio
- Melhor SEO
- Melhor logística
- Melhor reputação

Explique em detalhes.

---

# Tarefa 5 — Potencial de Lucro

Considerando:

- Taxa da categoria
- Competitividade
- Volume de vendas
- Possível guerra de preços

Avalie:

- Margem potencial
- Margem provável
- Risco de erosão de margem

Classifique:

- Muito Baixo
- Baixo
- Médio
- Alto
- Muito Alto

---

# Tarefa 6 — Score de Oportunidade

Atribua uma nota de 0 a 10 para:

| Critério | Nota |
|-----------|--------|
| Demanda | |
| Concorrência | |
| Potencial de Lucro | |
| Facilidade de Entrada | |
| Escalabilidade | |

---

## Score Final

Calcule:

Score Final = Média das Notas

---

### Interpretação

| Nota | Interpretação |
|--------|----------------|
| 0–4 | Evitar |
| 5–6 | Arriscado |
| 7–8 | Boa oportunidade |
| 9–10 | Excelente oportunidade |

---

# Tarefa 7 — Estratégia Recomendada

Escolha apenas uma:

- Entrar imediatamente
- Entrar com diferenciação
- Entrar com kit
- Entrar via catálogo
- Testar com estoque mínimo
- Não entrar

Explique detalhadamente a decisão.

---

# Tarefa 8 — Plano de Ataque de 30 Dias

Monte um plano contendo:

## Semana 1

- Pesquisa de fornecedores
- Definição de preço
- Criação do anúncio

## Semana 2

- SEO de título
- SEO de atributos
- Criação de imagens

## Semana 3

- Campanhas patrocinadas
- Ajustes de conversão

## Semana 4

- Escala
- Otimizações
- Reinvestimento

---

# Estratégia de SEO

Sugira:

- Título ideal
- Palavras-chave secundárias
- Estratégia de atributos
- Estratégia de catálogo

---

# Estratégia de Imagens

Sugira:

- Quantidade de imagens
- Sequência ideal do carrossel
- Diferenciais visuais
- Gatilhos de conversão

---

# Estratégia de Precificação

Defina:

- Preço de entrada
- Preço competitivo
- Faixa máxima aceitável
- Estratégia contra líderes

---

# Conclusão Executiva

Produza uma conclusão final de até 10 linhas contendo:

1. Vale a pena entrar?
2. Qual o principal risco?
3. Qual a principal oportunidade?
4. Qual a estratégia recomendada?
5. Qual a nota final do produto?
6. Qual o potencial de crescimento?

---

# Regras de Análise

Considere que:

- Participação acima de 50% indica forte concentração.
- Anúncios antigos possuem vantagem histórica.
- Mercados pulverizados tendem a ser mais acessíveis.
- Mercados concentrados exigem diferenciação.
- Demanda validada é obrigatória.
- Priorize oportunidades com alta demanda e baixa barreira de entrada.
- Considere tanto curto quanto longo prazo.

Forneça respostas objetivas, quantitativas e estratégicas.`,
  },
]
