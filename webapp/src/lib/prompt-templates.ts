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

# Template do Relatório

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

Atribua notas de 0 a 10 para:

- Demanda:
- Margem:
- Concorrência:
- Escalabilidade:
- Facilidade operacional:
- Potencial de lucro:

## ✅ Conclusão Final

Forneça uma conclusão objetiva informando:

- Se vale importar ou não
- Nível de risco
- Potencial de escala
- Melhor estratégia de venda
- Recomendação final`,
  },
  {
    id: "analise-fornecedores-alibaba",
    name: "Análise de Fornecedores (Alibaba)",
    description: "Extrai e compara fornecedores listados na página de resultados do Alibaba",
    content: `Analise os fornecedores listados nesta página do Alibaba e gere um relatório comparativo em Markdown.

# Template do Relatório

## 🔍 Resumo da Busca

- Termo pesquisado:
- Total de fornecedores na página:
- Filtros ativos (Trade Assurance, Verified, etc.):

## 🏭 Fornecedores Encontrados

Para CADA fornecedor listado, extraia:

### Fornecedor [N]: [Nome]

- **Nome da empresa:**
- **País/Região:**
- **Anos de operação:**
- **Trade Assurance:** Sim/Não
- **Verified Supplier:** Sim/Não
- **Produtos principais:**
- **Preço indicado (se disponível):**
- **MOQ (pedido mínimo):**
- **Rating/Avaliação:**
- **Taxa de resposta:**
- **Capacidades:** OEM / ODM / Customização
- **Certificações visíveis:** (ISO, CE, ROHS, etc.)
- **Link do produto:** (URL da página do produto no Alibaba, não do perfil do fornecedor)

## 📊 Ranking Comparativo

Ordene os fornecedores por confiabilidade considerando:
1. Verified + Trade Assurance
2. Anos de mercado
3. Rating e taxa de resposta
4. Certificações relevantes

| # | Fornecedor | País | Anos | TA | Verified | Rating | MOQ | Preço |
|---|-----------|------|------|----|----------|--------|-----|-------|

## ⚠️ Análise de Risco

Para cada fornecedor, identifique:
- Sinais positivos (certificações, tempo de mercado, rating alto)
- Sinais de alerta (rating baixo, pouco tempo, sem Trade Assurance)
- Nível de risco: Baixo / Médio / Alto

## 💡 Recomendação

- Top 3 fornecedores recomendados para contato
- Justificativa para cada escolha
- Próximos passos sugeridos (solicitar cotação, pedir amostras, etc.)
- Perguntas-chave para fazer ao fornecedor`,
  },
]
