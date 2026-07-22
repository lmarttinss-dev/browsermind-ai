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
    content: `Analise a viabilidade de importação simplificada deste produto com base nas métricas do AvantPro visíveis na página. Gere um relatório padronizado em Markdown. Inclua a URL do produto analisado.

IMPORTANTE: O relatório DEVE começar com o bloco "Resumo para Esteira" exatamente no formato abaixo. Esses campos são extraídos automaticamente pelo sistema.

PRIORIZE SEMPRE as métricas exatas extraídas do AvantPro (DOM da página). Complemente com informações contextuais da página quando necessário.

💬  Q&A DO USUÁRIO: O conteúdo da página pode incluir uma seção "PERGUNTAS E RESPOSTAS / OPINIÕES DOS CLIENTES (COPIADO PELO USUÁRIO)" que contém perguntas, respostas e opiniões de clientes reais copiadas do Mercado Livre. Se esta seção estiver presente, ANALISE-A com atenção máxima. Extraia: dúvidas frequentes, qualidade do atendimento do vendedor, elogios e reclamações literais dos compradores, padrões recorrentes nas avaliações. Use esses dados para enriquecer TODAS as seções do relatório.

# Template do Relatório

## 📋 Resumo para Esteira

> Este bloco é obrigatório e usado para alimentar o Kanban automaticamente.

- Nome: (nome completo do produto)
- Categoria: (categoria principal > subcategoria)
- Preço atual: R$ (valor no formato brasileiro, ex: 49,90)
- Vendas mensais estimadas: (número inteiro, ex: 1.200)
- Ritmo atual (vendas/mês): (número inteiro do AvantPro, ex: 1.200)
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
- Ritmo atual (vendas/mês) — métrica principal de velocidade de venda do AvantPro:
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

## � Análise de Perguntas, Respostas e Opiniões dos Clientes

> 📌 Se a seção "PERGUNTAS E RESPOSTAS / OPINIÕES DOS CLIENTES (COPIADO PELO USUÁRIO)" estiver presente no conteúdo da página, preencha esta seção OBRIGATORIAMENTE com base nela. Caso contrário, analise o que for possível extrair das avaliações visíveis na página.

- Principais dúvidas dos compradores
- Qualidade das respostas do vendedor (ágeis, completas, evasivas)
- Tempo médio de resposta
- Perguntas sem resposta
- Temas recorrentes (tamanho, material, compatibilidade)
- Nota média das avaliações e distribuição (5⭐/4⭐/3⭐/2⭐/1⭐)
- Principais elogios (cite trechos)
- Principais reclamações recorrentes
- O que os clientes AMAM e ODEIAM no produto
- Oportunidades de diferenciação baseadas no feedback real dos clientes

## �🔥 Análise de Demanda

Avalie:

- Nível de demanda atual
- Potencial de viralização
- Competitividade da categoria
- Saturação do mercado
- Potencial para anúncios pagos
- Público-alvo provável
- Análise pela idade do anúncio (use a Data do anúncio e Dias ativo):
  - Menos de 180 dias (6 meses) com bom ritmo de vendas → indica ALTA DEMANDA RECENTE e produto em ascensão
  - Entre 180 e 365 dias com vendas consistentes → demanda CONSOLIDADA
  - Mais de 365 dias → demanda MADURA, verifique se o ritmo ainda é relevante
  - Cruze a idade do anúncio com o Ritmo atual: anúncio jovem (< 180 dias) com alto volume é o melhor indicador de oportunidade

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

# ⚠️ FORMATO DA RESPOSTA — LEIA ANTES DE COMEÇAR

> 🚨 **INEGOCIÁVEL**: O formato da sua resposta DEVE seguir ESTRITAMENTE a estrutura abaixo. Não improvise títulos, não mude a ordem das seções, não omita nenhuma seção obrigatória.

## Primeira linha do relatório (EXATA, copie literalmente)

Sua resposta DEVE começar exatamente assim:

\`\`\`
# 🕵️ Análise de Oferta, Demanda e Concorrência — Mercado Livre
**Categoria:** [NOME DA CATEGORIA]
**URL:** [https://lista.mercadolivre.com.br/[PATH-DA-CATEGORIA]](https://lista.mercadolivre.com.br/[PATH-DA-CATEGORIA])
**Data da análise:** [DATA]
\`\`\`

**🚨 REGRA CRÍTICA — LEIA COM ATENÇÃO:**
- **QUEBRE AS LINHAS**: Categoria, URL e Data DEVEM ficar cada um em sua própria linha (3 linhas separadas). Use Enter entre cada campo.
- **ANTI-EXEMPLO (NUNCA faça isto):** \`**Categoria:** Capas **URL:** https://... **Data:** 23 de Junho\` ← TUDO EM UMA LINHA = **PROIBIDO**
- **EXEMPLO CORRETO (sempre faça isto):** a Categoria na linha 2, a URL na linha 3, a Data na linha 4 — cada uma em sua própria linha
- O título é EXATAMENTE \`# 🕵️ Análise de Oferta, Demanda e Concorrência — Mercado Livre\`
- A URL da categoria DEVE ser a URL completa do Mercado Livre, em formato de link Markdown \`[URL](URL)\` para abrir em nova aba
- A data DEVE estar no formato "DD de Mês de AAAA"
- NÃO invente um título diferente (ex: "Relatório de Market Intelligence" está PROIBIDO)

## Estrutura geral

- A primeira seção após o cabeçalho DEVE ser \`## 📊 Métricas da Categoria (AvantPro)\` com a tabela completa de métricas — NUNCA pule esta seção
- Dentro de \`## 📊 Métricas da Categoria (AvantPro)\`, inclua OBRIGATORIAMENTE a subseção \`### 📦 Perfil Logístico da Categoria\` logo após a tabela de métricas, contendo a tabela de percentuais (Full, Flex, Frete Grátis, Normal) e a análise do perfil logístico
- Use emojis nos cabeçalhos: 📊 Métricas, 📦 Perfil Logístico, 🧭 Tarefa 1, 🛡️ Tarefa 2, 📊 Tarefa 3, 🚪 Tarefa 4, 💰 Tarefa 5, 🎯 Tarefa 6, 🧭 Tarefa 7, 📅 Tarefa 8, 🔍 SEO, 🎨 Imagens, 💲 Precificação, 📋 Conclusão
- Use tabelas Markdown para dados comparativos (NÃO use listas)
- Use **negrito** para valores numéricos e classificações
- Use > para alertas e insights

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

> ⚠️ **Fonte da Verdade**: Os dados abaixo são fornecidos pela extensão **AvantPro** diretamente do Mercado Livre. Baseie TODAS as suas análises, cálculos e conclusões exclusivamente nesses dados. Não invente, estime ou assuma métricas que não estejam presentes abaixo.

## Categoria

**[INSERIR NOME DA CATEGORIA]**

**URL da categoria:** **[INSERIR URL COMPLETA]** — use sempre a URL completa do Mercado Livre (ex: \`https://lista.mercadolivre.com.br/celulares-telefones/acessorios-celulares/aneis-celulares\`), nunca apenas o path relativo.

---

## Métricas da Categoria (AvantPro)

| Métrica | Valor |
|----------|---------|
| Total de Vendas da Página (últimos meses) | (ex: 9.377) |
| Taxa Clássico | (ex: 12,0%) |
| Taxa Premium | (ex: 17,0%) |
| Medalhas (Ouro/Platina/Diamante/Black) | (ex: 6/9/16/20) |
| Full | (ex: 28) |
| Frete Grátis | (ex: 17) |
| Menor Preço | R$ (ex: 19,00) |
| Maior Preço | R$ (ex: 158,00) |
| Menor Faturamento | R$ (ex: 19,00) |
| Maior Faturamento | R$ (ex: 49.970,00) |
| Vendedores | (ex: 26) |
| Catálogos | (ex: 14) |
| Anúncios Patrocinados | (ex: 12) |
| Fora de Catálogo | (ex: 38) |
| ProdutoPro | (ex: 2) |
| Oficiais | (ex: 7) |
| Internacional | (ex: 3) |

---

### 📦 Perfil Logístico da Categoria

> Calcule o percentual de cada modalidade logística com base nas métricas acima. Use o total de **Vendedores** como denominador. Considere que um mesmo vendedor pode usar múltiplas modalidades (Full + Frete Grátis, etc.), então os percentuais podem ultrapassar 100%.

| Modalidade | Quantidade | Percentual |
|------------|-----------|------------|
| **Full** | (valor da métrica Full) | (Full ÷ Vendedores × 100)% |
| **Flex** | (estime com base na análise dos anúncios individuais) | (Flex ÷ Vendedores × 100)% |
| **Frete Grátis** | (valor da métrica Frete Grátis) | (Frete Grátis ÷ Vendedores × 100)% |
| **Normal (sem benefício)** | (Vendedores − estimativa de sobreposição) | (restante)% |

#### � Gráfico do Perfil Logístico (Mermaid)

Gere um gráfico de pizza com a distribuição das modalidades logísticas entre os vendedores:

> 🚨 **ATENÇÃO**: Use apenas os rótulos: Full, Flex, Frete Grátis, Normal. Some os percentuais para garantir que totalizam ~100% (arredonde se necessário).

\`\`\`mermaid
pie
    title "Perfil Logístico da Categoria"
    "Full" : 65
    "Flex" : 10
    "Frete Grátis" : 15
    "Normal" : 10
\`\`\`

#### �📝 Análise do Perfil Logístico

- **Predominância:** identifique a modalidade dominante (ex: "80% dos vendedores no Full")
- **Impacto competitivo:** explique como o perfil logístico afeta a concorrência — categorias com alto % de Full indicam barreira de entrada maior (exige envio de estoque para o CD do ML), enquanto categorias com baixo % de Full indicam oportunidade para diferenciação logística
- **Oportunidade:** se há poucos vendedores usando Full ou Flex, oferecer entrega rápida via essas modalidades pode ser um diferencial competitivo decisivo
- **Alerta:** se a categoria é dominada por Full (>70%), entrar sem Full exige preço muito mais baixo ou diferenciação forte para competir

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
- Análise pela idade dos anúncios (use o campo Tempo de anúncio em dias):
  - Anúncios com menos de 180 dias e bom volume de vendas → sinal de DEMANDA RECENTE e CRESCENTE (produto em ascensão)
  - Anúncios entre 180-365 dias → demanda CONSOLIDADA e estável
  - Anúncios com mais de 365 dias → demanda MADURA, possível saturação ou declínio
  - Se há MUITOS anúncios jovens (< 180 dias) na categoria → indica que a categoria está aquecida e atraindo novos vendedores
  - Se há POUCOS anúncios jovens mas vendas concentradas em anúncios antigos → barreira de entrada alta, categoria dominada por players estabelecidos
  - Cruze a idade dos anúncios com o volume de vendas: anúncios jovens com alta participação são o melhor indicador de oportunidade quente

### Métricas de Oportunidade da Categoria

Com base nos dados de categoria do Mercado Livre, determine:

- **Índice de Oportunidade:** (Baixo | Médio | Alto — ideal: Baixo ou Médio)
- **Receita média por vendedor:** R$ (ideal: R$ 10.000 – R$ 50.000)
- **Vendedores com medalhas na categoria:** (% do total de sellers — ideal: 0%–20%, indica categoria ainda em desenvolvimento e sem domínio de operadores profissionais)

### Dinâmica e Sazonalidade

Analise a tendência de longo prazo (até 24 meses) para distinguir se a categoria está em declínio real ou apenas passando por uma baixa sazonal:

- **Tendência de vendas:** (Crescente | Estável | Declinante)
- **Sazonalidade identificada:** (Sim/Não)
- **Mês mais forte historicamente:**
- **Mês mais fraco historicamente:**
- **Impacto de feriados:** (Natal, Black Friday, Dia das Mães — quais afetam e com que intensidade?)
- **Risco de "estoque parado" nos meses fracos:** (Baixo | Médio | Alto)

### Gráfico de Sazonalidade (Mermaid)

Gere um gráfico de barras com as vendas mensais estimadas (últimos 12 meses). Use blocos de código com linguagem \`mermaid\`:

> 🚨 **ATENÇÃO**: No \`x-axis\`, NUNCA use \`/\` (barra) ou \`-\` (hífen). Use apenas nomes de meses abreviados (Jan, Fev, Mar...) ou ano isolado (2025, 2026). \`Jul/25\` quebra o parser! Sempre: \`x-axis [Jul, Ago, Set, Out, Nov, Dez, Jan, Fev, Mar, Abr, Mai, Jun]\`

\`\`\`mermaid
xychart
    title "Vendas Mensais Estimadas (12 meses)"
    x-axis [Jan, Fev, Mar, Abr, Mai, Jun, Jul, Ago, Set, Out, Nov, Dez]
    y-axis "Unidades" 0 --> 5000
    bar [1200, 980, 1100, 850, 1400, 2100, 720, 600, 800, 1300, 3200, 2800]
\`\`\`

### Classificação

Escolha uma:

- Muito Baixa
- Baixa
- Média
- Alta
- Muito Alta

### Justificativa

Explique detalhadamente os motivos da classificação. Analise se a demanda é crescente ou apenas concentrada em poucos meses. Lembre-se: sazonalidade não é risco, é informação para planejar estoque e janelas de lançamento.

---

# Tarefa 2 — Análise da Concorrência

Avalie:

- Quantidade de vendedores relevantes.
- Quantidade de anúncios ativos competitivos.
- Nível de maturidade dos concorrentes.
- Dependência da categoria em poucos vendedores.
- Facilidade para novos vendedores entrarem.

### Sinais de Categoria Saudável

Três condições que, quando verdadeiras simultaneamente, indicam oportunidade real:

- **Receita total da categoria:** R$ (≥ R$ 5 milhões é sinal positivo de mercado aquecido)
- **Monopolização pelos top sellers:** (% do mercado — < 20% é saudável, > 50% é perigoso)
- **Concentração de marcas:** (nenhuma marca domina a prateleira | 1-2 marcas fortes | muitas marcas estabelecidas — ideal: nenhuma marca isolada domina)

### Vendedores de Destaque

- **Vendedores de crescimento acelerado:** identifique sellers que estão crescendo rápido a partir de uma base pequena — eles geralmente percebem tendências antes dos líderes de mercado e merecem ser estudados com cuidado.
- **Vendedores para monitoramento contínuo:** quais sellers performam acima da média e merecem ser adicionados a um monitoramento permanente (Seller Tracker)?

### Classificação

Escolha uma:

- Muito Baixa
- Baixa
- Média
- Alta
- Muito Alta

### Justificativa

Explique os fatores que influenciam a concorrência. Considere se a categoria está aberta a novos entrantes ou já é dominada por players estabelecidos com marcas fortes.

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

### Gráfico de Concentração (Mermaid)

Gere um gráfico de pizza com a distribuição de market share entre os principais vendedores:

\`\`\`mermaid
pie
    title "Market Share por Vendedor"
    "Líder" : 45
    "2º Colocado" : 18
    "3º Colocado" : 10
    "Demais vendedores" : 27
\`\`\`

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

# 💲 Sugestão de Precificação para Venda

Com base na análise da concorrência, determine o preço ideal de venda:

## Análise das Faixas de Preço da Concorrência

- Faixa de entrada (menores preços praticados): R$ X,XX a R$ X,XX — (quantos concorrentes nesta faixa)
- Faixa intermediária: R$ X,XX a R$ X,XX — (quantos concorrentes nesta faixa)
- Faixa premium: R$ X,XX a R$ X,XX — (quantos concorrentes nesta faixa)

## Posicionamento Recomendado

Escolha uma estratégia e justifique:

- **Entrada (preço mais baixo):** competir por volume, margens menores, risco de guerra de preços
- **Intermediário (preço médio):** equilíbrio entre volume e margem, diferencial no anúncio/produto
- **Premium (preço acima da média):** qualidade superior, marca, embalagem, atendimento — exige diferenciação clara

## Preço Sugerido

| Estratégia | Preço Sugerido | Margem Estimada | Volume Esperado (un./mês) | Faturamento Projetado |
|------------|---------------|-----------------|--------------------------|----------------------|
| Entrada | R$ X,XX | X% | X | R$ X.XXX,XX |
| Competitivo | R$ X,XX | X% | X | R$ X.XXX,XX |
| Premium | R$ X,XX | X% | X | R$ X.XXX,XX |

## Simulação de Rentabilidade

Considerando o custo total de importação por unidade (landed cost) e as taxas da plataforma:

| Preço de Venda | Custo por Unidade | Taxas ML (X%) | Lucro Líquido/Un. | Margem Líquida |
|---------------|-------------------|---------------|-------------------|---------------|
| R$ X,XX | R$ X,XX | R$ X,XX | R$ X,XX | X% |

## Estratégia de Precificação Psicológica

- Preço com final .90 ou .99: (ex: R$ 49,90 em vez de R$ 50,00)
- Preço âncora: (ex: risque o preço antigo e mostre o novo com desconto)
- Atacado/combo: (ex: leve 2 por R$ 89,90 — cada um sai a R$ 44,95)
- Gatilho de escassez: (ex: "últimas unidades a este preço")

## Cronograma de Ajuste de Preços

- **Lançamento:** preço X% abaixo do mercado para gerar primeiras vendas e avaliações
- **Crescimento:** ajuste gradual até o preço competitivo após X avaliações positivas
- **Maturidade:** preço premium após consolidar reputação (X vendas/mês)

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

**Fonte da Verdade — AvantPro**: Todos os dados da seção "Métricas da Categoria (AvantPro)" são extraídos diretamente do Mercado Livre e constituem a única fonte de verdade para esta análise. Suas conclusões DEVEM ser fundamentadas nesses números.

Considere que:

- Participação acima de 50% indica forte concentração.
- Anúncios antigos possuem vantagem histórica.
- Mercados pulverizados tendem a ser mais acessíveis.
- Mercados concentrados exigem diferenciação.
- Demanda validada é obrigatória.
- Priorize oportunidades com alta demanda e baixa barreira de entrada.
- Considere tanto curto quanto longo prazo.

### Critérios para Nicho Promissor

- **Índice de Oportunidade Baixo ou Médio** + **Receita por vendedor R$ 10k–50k** + **0–20% de vendedores com medalhas** = nicho promissor e pouco atendido — você pode ganhar dinheiro sem competir contra muitos vendedores experientes.
- **Receita total da categoria ≥ R$ 5 milhões** + **Top sellers < 20% do mercado** + **Nenhuma marca dominante** = oportunidade real de entrada com espaço para construir volume.
- **Sazonalidade não é risco** — é informação estratégica para planejar estoque, escolher janelas de lançamento e encontrar oportunidades nos meses em que concorrentes desistem.
- **Vendedores de crescimento acelerado** merecem atenção redobrada — monitore-os permanentemente para se antecipar a movimentos, não apenas reagir.
- Categoria com **tendência de alta ou estável** é positiva; **tendência de queda consistente** é sinal de alerta que exige investigação mais profunda.

Forneça respostas objetivas, quantitativas e estratégicas.

---

# 📐 FORMATO DE SAÍDA OBRIGATÓRIO

> ⚠️ **CRÍTICO**: Siga ESTRITAMENTE o formato abaixo. Não invente seções diferentes, não altere a ordem, não use estilos alternativos. A consistência do formato é obrigatória.

## Estrutura Geral

- Use emojis nos cabeçalhos de seção EXATAMENTE como especificado abaixo.
- Use tabelas Markdown para dados comparativos (não use listas onde tabelas são especificadas).
- Use negrito para destacar **valores numéricos** e **classificações**.
- Use citações (>) para alertas, notas e insights estratégicos.
- Use blocos de código \`\`\`mermaid para gráficos.

## Cabeçalho do Relatório

O relatório DEVE começar exatamente com este formato:

\`\`\`
# 🕵️ Análise de Oferta, Demanda e Concorrência — Mercado Livre
**Categoria:** [NOME]
**URL:** [https://lista.mercadolivre.com.br/[PATH-DA-CATEGORIA]](https://lista.mercadolivre.com.br/[PATH-DA-CATEGORIA])
**Data da análise:** [DATA]

---

## �📊 Métricas da Categoria (AvantPro)
[Aqui vai a tabela de métricas — SEMPRE em formato de tabela Markdown de 2 colunas: Métrica | Valor]
\`\`\`

### Regras do Cabeçalho

- **🚨 QUEBRA DE LINHA OBRIGATÓRIA**: Categoria, URL e Data DEVEM estar em linhas separadas. Use Enter (quebra de linha) entre cada campo. NUNCA coloque os três na mesma linha.
- **ANTI-EXEMPLO (PROIBIDO):** \`**Categoria:** X **URL:** Y **Data:** Z\` — tudo na mesma linha.
- **EXEMPLO CORRETO:** cada campo \`**Categoria:**\`, \`**URL:**\` e \`**Data da análise:**\` em sua própria linha, um abaixo do outro.
- **URL da categoria**: Use SEMPRE a URL completa do Mercado Livre (ex: https://lista.mercadolivre.com.br/celulares-telefones/acessorios-celulares/aneis-celulares). Use formato de link Markdown \`[URL](URL)\` para que o link abra em nova aba. **NUNCA** use apenas o path relativo.
- **Data da análise**: Use a data atual no formato "DD de Mês de AAAA".

## Seções Obrigatórias (na ordem)

### 📊 Métricas da Categoria (AvantPro)

> ⚠️ **OBRIGATÓRIO**: Esta seção DEVE ser incluída logo após o cabeçalho, ANTES da Tarefa 1.

Reproduza a tabela completa de métricas do AvantPro fornecida nos "Dados Coletados". Formato: tabela Markdown de 2 colunas (Métrica | Valor), com **negrito** nos valores numéricos. NÃO omita esta seção — ela é a base de toda a análise.

### 📦 Perfil Logístico da Categoria

> ⚠️ **OBRIGATÓRIO**: Esta seção DEVE ser incluída logo após a tabela de métricas do AvantPro.

Calcule o percentual de cada modalidade logística com base nas métricas. Use **tabela Markdown de 3 colunas** (Modalidade | Quantidade | Percentual) com as linhas: Full, Flex, Frete Grátis, Normal. Após a tabela, inclua o **📊 Gráfico do Perfil Logístico** em bloco \`\`\`mermaid com pie chart da distribuição. Em seguida, a subseção **📝 Análise do Perfil Logístico** com bullet points cobrindo: predominância, impacto competitivo, oportunidade e alerta.

### 🧭 Tarefa 1 — Análise da Demanda

Deve conter OBRIGATORIAMENTE as subseções abaixo, nesta ordem:

#### 📈 Volume e Validação
Parágrafo(s) analisando a demanda. Destaque anúncios mais relevantes em bullet points com **negrito** nos nomes dos vendedores e números.

#### 🎯 Classificação da Demanda: **[CLASSIFICAÇÃO]**
Formato: "**ALTA**", "**MÉDIA**", "**BAIXA**", "**MUITO ALTA**" ou "**MUITO BAIXA**"

#### 📝 Justificativa
Parágrafo(s) explicando a classificação.

#### 📊 Métricas de Oportunidade da Categoria
SEMPRE em formato de tabela Markdown de 3 colunas:

\`\`\`
| Indicador | Valor | Análise |
|-----------|-------|---------|
| **Índice de Oportunidade** | **[BAIXO/MÉDIO/ALTO]** | [análise] |
| **Receita média por vendedor** | **R$ [valor]** | [análise] |
| **Vendedores com medalhas** | **[X] de [Y] ([Z]%)** | [análise] |
\`\`\`

#### 🌡️ Dinâmica e Sazonalidade
SEMPRE em formato de tabela Markdown de 2 colunas:

\`\`\`
| Indicador | Valor |
|-----------|-------|
| Tendência de vendas | **[Crescente/Estável/Declinante]** |
| Sazonalidade identificada | **[Sim/Não]** |
| Mês mais forte | **[MÊS]** |
| Mês mais fraco | **[MÊS]** |
| Impacto de feriados | **[descrição]** |
| Risco de "estoque parado" | **[Baixo/Médio/Alto]** |
\`\`\`

#### Gráfico de Sazonalidade
Bloco \`\`\`mermaid com xychart. Inclua legenda interpretativa abaixo do gráfico em citação (>).

---

### 🛡️ Tarefa 2 — Análise da Concorrência

#### 🏢 Estrutura Competitiva
Tabela Markdown com top vendedores (Vendedor | Vendas Estimadas | Participação | Ritmo Atual /mês).

#### 🩺 Sinais de Categoria Saudável
Tabela Markdown de 3 colunas: Indicador | Valor | Análise.

#### 🚀 Vendedores de Destaque
Subseções:

##### Crescimento Acelerado
Bullet points com **nome do vendedor** em negrito, localização, ritmo de vendas, dias de anúncio, estratégia.

##### Para Monitoramento Contínuo
Bullet points com **nome do vendedor**.

#### 🎯 Classificação da Concorrência: **[CLASSIFICAÇÃO]**

#### 📝 Justificativa
Parágrafo(s).

---

### 📊 Tarefa 3 — Análise de Concentração de Mercado

#### 📈 Participação de Mercado
Tabela Markdown: Grupo | Participação.

#### Gráfico de Concentração
Bloco \`\`\`mermaid com pie chart.

#### 🧩 Tipo de Mercado: **[PULVERIZADO/MODERADAMENTE CONCENTRADO/ALTAMENTE CONCENTRADO]**

#### 📋 Análise
Subseções:

##### Riscos
Bullet points.

##### Vantagens
Bullet points.

##### Dependência
Parágrafo.

---

### 🚪 Tarefa 4 — Oportunidade de Entrada

#### ✅ Existe espaço para novos vendedores?
**SIM** ou **NÃO**, seguido de bullet points com subnichos/oportunidades.

#### 🏆 O líder domina por:
Tabela Markdown: Fator | Peso (com ✅ ou ❌).

#### 🎯 Um novo vendedor conseguiria competir através de:
Bullet points com **negrito** no início de cada item.

---

### 💰 Tarefa 5 — Potencial de Lucro

#### 📊 Análise de Margem
Tabela Markdown: Fator | Valor.

#### 🎯 Classificação do Potencial de Lucro: **[CLASSIFICAÇÃO]**

#### 📝 Justificativa
Parágrafo(s).

---

### 🎯 Tarefa 6 — Score de Oportunidade

Tabela Markdown: Critério | Nota | Justificativa.

#### 📊 Score Final

\`\`\`
### **Score Final = ([notas]) / [quantidade] = [resultado]**
\`\`\`

Tabela de interpretação: Nota | Interpretação.

---

### 🧭 Tarefa 7 — Estratégia Recomendada

#### 🎯 **[ESTRATÉGIA EM NEGRITO E CAIXA ALTA]**

#### 📝 Justificativa Detalhada
Parágrafo(s) com bullet points numerados de caminhos possíveis.

---

### 📅 Tarefa 8 — Plano de Ataque de 30 Dias

Uma subseção por semana (\`#### 📆 Semana 1 — [TÍTULO]\`), cada uma com tabela Markdown: Dia | Ação.

---

### 🔍 Estratégia de SEO

#### 🏷️ Título Ideal
Citação (>) com o título exato entre aspas.

#### 🔑 Palavras-chave Secundárias
Bullet points com \`código\` em cada keyword.

#### 📋 Estratégia de Atributos
Bullet points com **negrito** no nome do atributo.

#### 📚 Estratégia de Catálogo
Parágrafo com recomendação clara.

---

### 🎨 Estratégia de Imagens

#### 📸 Quantidade
Número.

#### 🎞️ Sequência Ideal do Carrossel
Lista numerada de 1 a N.

#### 🧲 Gatilhos de Conversão
Bullet points com **negrito** no tipo de gatilho.

---

### 💲 Estratégia de Precificação

#### 💰 Preços Recomendados
Tabela Markdown: Estratégia | Preço | Margem Estimada.

#### ⚔️ Estratégia Contra Líderes
Bullet points.

---

### � Sugestão de Precificação para Venda

#### 📊 Análise das Faixas de Preço da Concorrência
Tabela Markdown: Faixa | Intervalo de Preço | Concorrentes | % do Mercado.

#### 🎯 Posicionamento Recomendado
**ESTRATÉGIA EM NEGRITO** com parágrafo justificando a escolha com base nos dados da concorrência.

#### 💰 Preço Sugerido por Estratégia
Tabela Markdown: Estratégia | Preço Sugerido | Margem Estimada | Volume Esperado (un./mês) | Faturamento Projetado.

#### 🧮 Simulação de Rentabilidade
Tabela Markdown: Preço de Venda | Custo/Un. (landed cost) | Taxas ML | Lucro Líquido/Un. | Margem Líquida.

#### 🧠 Precificação Psicológica
Bullet points com **negrito** no tipo de gatilho (preço .90/.99, âncora, combo, escassez).

#### 📅 Cronograma de Ajuste de Preços
Tabela Markdown: Fase | Preço | Objetivo | Gatilho para Mudança.

---

### �📋 Conclusão Executiva

Lista numerada de 1 a 6 respondendo exatamente:

1. **Vale a pena entrar?** [resposta]
2. **Principal risco:** [resposta]
3. **Principal oportunidade:** [resposta]
4. **Estratégia recomendada:** [resposta]
5. **Nota final do produto:** [X/10] — [interpretação]
6. **Potencial de crescimento:** [resposta]

Finalize com uma citação (> 🧠 **Decisão:** [resumo da decisão com valores de investimento e projeção]).

---

## Regras de Consistência

1. **TODAS as tabelas** devem usar formato Markdown com \`|\` e alinhamento consistente.
2. **TODOS os valores numéricos** devem estar em **negrito**.
3. **TODAS as classificações** (Alta/Média/Baixa) devem estar em **negrito**.
4. **TODOS os alertas/insights** devem usar citação (>).
5. **NUNCA** invente seções fora das especificadas acima.
6. **NUNCA** altere a ordem das seções.
7. **NUNCA** omita uma seção obrigatória.
8. Use emojis EXATAMENTE como especificado nos cabeçalhos.

### Regra de URLs

- **URLs de categorias SEMPRE completas**: Use a URL completa do Mercado Livre (ex: https://lista.mercadolivre.com.br/celulares-telefones/acessorios-celulares/aneis-celulares). **NUNCA** use apenas o path relativo. **NUNCA** coloque a URL entre crases (backticks) — o Markdown só gera link clicável quando a URL está em texto puro, sem formatação ao redor.

### Uso de Gráficos Mermaid

- **xychart**: gráfico de barras para séries temporais (vendas mensais, receita ao longo do tempo)
- **pie**: gráfico de pizza para distribuição (market share, concentração). Use apenas \`pie\` na primeira linha, NUNCA \`pie showData\` (inválido no Mermaid v11).

> 🚨 **ASPAS RETAS OBRIGATÓRIAS**: Use SEMPRE aspas retas \`"\"\` (U+0022) nos títulos e labels dos gráficos Mermaid. NUNCA use aspas curvas \`""\` (smart quotes) — elas quebram o parser do Mermaid e causam erro de renderização. Exemplo correto: \`title "Vendas Mensais"\`, NUNCA \`title "Vendas Mensais"\`.

> 🚨 **X-AXIS SEM CARACTERES ESPECIAIS**: No \`x-axis\` do \`xychart\`, NUNCA use \`/\` (barra) ou \`-\` (hífen) nos labels. Use apenas nomes de meses abreviados (Jan, Fev, Mar, Abr, Mai, Jun, Jul, Ago, Set, Out, Nov, Dez) ou ano isolado (2025, 2026). Exemplo CORRETO: \`x-axis [Jul, Ago, Set, Out]\`. Exemplo ERRADO: \`x-axis [Jul/25, Ago/25]\` — barras quebram o parser!

Coloque os gráficos próximos aos dados que eles representam.`,
  },
]
