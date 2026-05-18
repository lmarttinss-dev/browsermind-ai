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
    id: "top3-fornecedores-alibaba",
    name: "Top 3 Fornecedores (Alibaba)",
    description: "Seleciona os 3 melhores fornecedores com base em avaliação, certificações e MOQ",
    content: `Analise os fornecedores/produtos listados nesta página do Alibaba e selecione os TOP 3 melhores fornecedores para importação. Gere um relatório em Markdown.

Critérios de seleção (por ordem de prioridade):
1. Verified Supplier
2. Trade Assurance ativo
3. Rating/avaliação alta (4.5+)
4. Anos de operação (quanto mais, melhor)
5. MOQ (pedido mínimo) acessível
6. Taxa de resposta alta
7. Capacidade OEM/ODM
8. Certificações relevantes (ISO, CE, ROHS, FCC, etc.)

# Template do Relatório

## 🔍 Resumo da Busca

- Produto pesquisado:
- URL da página de resultados:
- Total de fornecedores analisados:

## 🏆 Top 3 Fornecedores Recomendados

### 🥇 1º — [Nome do Fornecedor]

- **Link do produto:** (URL completa da página do produto no Alibaba)
- **País/Região:**
- **Anos de operação:**
- **Verified Supplier:** Sim/Não
- **Trade Assurance:** Sim/Não (valor protegido se disponível)
- **Rating:** X/5 ⭐
- **Taxa de resposta:**
- **Preço indicado:**
- **MOQ (pedido mínimo):**
- **Capacidades:** OEM / ODM / Customização
- **Certificações:**
- **Por que foi escolhido:**

### 🥈 2º — [Nome do Fornecedor]

- **Link do produto:**
- **País/Região:**
- **Anos de operação:**
- **Verified Supplier:** Sim/Não
- **Trade Assurance:** Sim/Não
- **Rating:** X/5 ⭐
- **Taxa de resposta:**
- **Preço indicado:**
- **MOQ (pedido mínimo):**
- **Capacidades:** OEM / ODM / Customização
- **Certificações:**
- **Por que foi escolhido:**

### 🥉 3º — [Nome do Fornecedor]

- **Link do produto:**
- **País/Região:**
- **Anos de operação:**
- **Verified Supplier:** Sim/Não
- **Trade Assurance:** Sim/Não
- **Rating:** X/5 ⭐
- **Taxa de resposta:**
- **Preço indicado:**
- **MOQ (pedido mínimo):**
- **Capacidades:** OEM / ODM / Customização
- **Certificações:**
- **Por que foi escolhido:**

## 📊 Comparativo Rápido

| Critério | 🥇 1º | 🥈 2º | 🥉 3º |
|----------|-------|-------|-------|
| Verified | | | |
| Trade Assurance | | | |
| Rating | | | |
| Anos | | | |
| MOQ | | | |
| Preço | | | |

## ⚠️ Alertas e Riscos

Para cada fornecedor, liste:
- Pontos de atenção
- Riscos identificados
- O que verificar antes de fechar pedido

## 💡 Próximos Passos

- Ações recomendadas para contato
- Perguntas-chave para enviar ao fornecedor
- Dicas de negociação
- Sugestão de pedido inicial (quantidade para teste)`,
  },
]
