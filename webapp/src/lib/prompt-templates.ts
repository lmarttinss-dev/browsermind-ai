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

⚠️  OBRIGATÓRIO: Preencha TODOS os campos listados no template sem exceção. Atenção especial para "Data de criação do anúncio" e "Dias ativo" — estes NÃO podem ser omitidos em hipótese alguma. Se o AvantPro não mostrar a data, procure no texto da página ou no HTML do anúncio. A data de criação é um dado crítico para análise de viabilidade.

💬  Q&A DO USUÁRIO: O conteúdo da página pode incluir uma seção "PERGUNTAS E RESPOSTAS / OPINIÕES DOS CLIENTES (COPIADO PELO USUÁRIO)" que contém perguntas, respostas e opiniões de clientes reais copiadas do Mercado Livre. Se esta seção estiver presente, ANALISE-A com atenção máxima. Extraia: dúvidas frequentes, qualidade do atendimento do vendedor, elogios e reclamações literais dos compradores, padrões recorrentes nas avaliações. Use esses dados para enriquecer TODAS as seções do relatório (Análise de Qualidade, Forças/Fraquezas, Diferenciação, Score Final).

# Template do Relatório

## 📋 Resumo para Esteira

> Este bloco é obrigatório e usado para alimentar o Kanban automaticamente.

- Nome: (nome completo do produto)
- Categoria: (categoria principal > subcategoria)
- Preço atual: R$ (valor no formato brasileiro, ex: 69,00)
- Vendas mensais estimadas: (número inteiro, ex: 223)
- Ritmo atual (vendas/mês): (número inteiro do AvantPro, ex: 223)
- Concorrência: (exatamente uma das opções: Baixa | Média | Alta | Saturado)
- Potencial de margem: (percentual ou faixa, ex: 35-45%)
- Score Final: (nota de 0 a 10 representando viabilidade geral)

---

## 📦 Informações do Produto

- Nome:
- URL:
- Categoria:
- Preço de venda atual (R$):
- Loja / Vendedor:
- Reputação do vendedor (MercadoLíder, Platinum, etc.):
- Posição no ranking da categoria:
- Selos e destaques (MAIS VENDIDO, OFERTA DO DIA, etc.):
- Avaliação média (estrelas):
- Quantidade de avaliações/opiniões:

## 📊 Métricas do AvantPro (extraídas do DOM)

- Preço de venda atual:
- Data de criação do anúncio: (formato dd/mm/aaaa — NÃO omita)
- Dias ativo: (calcule da data de criação até hoje — NÃO omita)
- Estoque disponível:
- Total vendido (histórico):
- Vendas por dia:
- Vendas mensais (unidades/mês) — total vendido no mês pelo AvantPro:
- Ritmo atual — vendas/mês (unidades/mês) — métrica principal de velocidade de venda do AvantPro:
- Visitas ao anúncio:
- Taxa de conversão (%):
- Receita mensal estimada: Ritmo atual × preço de venda (calcule: R$ X,XX)
- Faturamento total do vendedor (se disponível):
- Vendas totais do vendedor (se disponível):
- Localização do vendedor (se disponível):
- Ticket médio da loja (se disponível):

### 💰 Dados financeiros do vendedor (se disponíveis no AvantPro)

- Imposto por venda: R$ X,XX (X%)
- Comissão Mercado Livre por venda: R$ X,XX (X%)
- Valor líquido recebido por venda: R$ X,XX (X%)
- Custo fixo por venda na plataforma: (imposto + comissão)

## 🔥 Análise de Demanda e Concorrência

### Demanda

- Vendas diárias: interprete o ritmo (ex: 7/dia = giro consistente)
- Volume mensal (baseado no Ritmo atual): classifique como Baixo (<50), Médio (50-200), Alto (200-500) ou Muito Alto (>500)
- Taxa de conversão: classifique como Baixa (<5%), Média (5-10%), Alta (10-15%) ou Muito Alta (>15%)
- Tendência: interprete se a demanda está crescendo, estável ou caindo com base nos dados

### Concorrência

- Quantos produtos semelhantes aparecem na página:
- Faixa de preços dos concorrentes (mínimo — máximo):
- Onde este produto se posiciona na faixa (entrada, meio, topo):
- Concorrente principal: nome, preço e diferencial
- Barreiras de entrada identificadas:

### Análise de posicionamento

- Se o produto está na faixa mais competitiva (R$ 19–R$ 45): ALERTA — exige custo de importação muito baixo para competir
- Se está acima de R$ 60: oportunidade de margem, mas exige diferenciação (qualidade, marca, avaliações)
- Se estoque do concorrente está baixo (<5 unidades): possível janela de oportunidade para novos entrantes

## ⭐ Forças e Fraquezas do Vendedor Atual

### Forças

- Selos e reputação (MercadoLíder, +1000 vendas, bom atendimento)
- Tempo de mercado e estabilidade
- Qualidade do anúncio (fotos, descrição, vídeos)

### Fraquezas

- Fotos insuficientes ou de baixa resolução (oportunidade de diferenciação)
- Descrição pobre ou incompleta
- Estoque limitado ou rupturas frequentes
- Tempo de entrega elevado
- Ausência de variações (cores, tamanhos)

### Oportunidades de diferenciação para o importador

- Fotos profissionais em alta resolução
- Descrição rica com especificações detalhadas
- Vídeos demonstrativos
- Maior estoque e disponibilidade imediata
- Variações de cor/modelo
- Embalagem diferenciada
- Atendimento pós-venda superior

## � Análise de Perguntas, Respostas e Opiniões dos Clientes

> 📌 Se a seção "PERGUNTAS E RESPOSTAS / OPINIÕES DOS CLIENTES (COPIADO PELO USUÁRIO)" estiver presente no conteúdo da página, preencha esta seção OBRIGATORIAMENTE com base nela. Caso contrário, analise o que for possível extrair das avaliações visíveis na página.

### 📝 Perguntas e Respostas (Q&A)

- Principais dúvidas dos compradores:
- Qualidade das respostas do vendedor (ágeis, completas, evasivas):
- Tempo médio de resposta do vendedor:
- Perguntas sem resposta:
- Temas recorrentes nas perguntas (tamanho, material, compatibilidade, etc.):
- Oportunidades: informações que o vendedor NÃO está fornecendo e que você pode incluir no seu anúncio

### ⭐ Opiniões e Avaliações

- Nota média (se disponível):
- Distribuição das avaliações (5⭐ / 4⭐ / 3⭐ / 2⭐ / 1⭐):
- Principais elogios (cite trechos literais):
- Principais reclamações (cite trechos literais):
- Problemas recorrentes (defeito, tamanho errado, atraso na entrega, produto diferente da foto):
- Potencial de recompra (clientes comprariam novamente?):
- Risco de devolução (qual % dos compradores relata problemas graves?):

### 🎯 Insights para Diferenciação

- O que os clientes AMAM no produto (reforce no seu anúncio):
- O que os clientes ODEIAM no produto (corrija ou alerte no seu anúncio):
- Funcionalidades ou variações que os clientes pedem e não encontram:
- Oportunidades de melhoria no produto: qualidade, embalagem, manual, acessórios
- Como o vendedor atual lida com reclamações (oportunidade de atendimento superior)

## �🚚 Viabilidade para Importação Simplificada

### Características do produto para importação

- Tamanho e peso: classifique como Ideal / Viável / Problemático
- Risco alfandegário: Baixo / Médio / Alto
- Categoria NCM provável:
- Alíquota de Imposto de Importação (II) estimada para este NCM:
- Necessidade de certificação (Anatel, INMETRO, MAPA, etc.):

### Logística de Importação (B2B via Courier)

Para importações via Alibaba B2B, considere as transportadoras courier internacionais:

- **DHL Express**: ideal para cargas até 50 kg, entrega porta a porta em 3-7 dias úteis, desembaraço incluso
- **FedEx International Priority**: cargas até 68 kg, 2-5 dias úteis, boa cobertura na China
- **UPS Worldwide Express**: cargas até 70 kg, 2-5 dias úteis, rastreamento detalhado
- **Frete marítimo (LCL/FCL)**: para pedidos acima de 100 kg ou 0,5 m³, menor custo por kg mas prazo de 30-60 dias
- **Frete aéreo consolidado**: meio termo entre courier e marítimo, 7-15 dias, ideal para 30-200 kg

Estime o custo do frete com base em:
- Peso e dimensões estimadas do produto
- Modal mais adequado (courier para amostras e pequenos lotes; aéreo/marítimo para volumes maiores)
- Custo aproximado por kg: courier (US$ 8-15/kg), aéreo (US$ 4-8/kg), marítimo (US$ 0,50-2/kg)

### Cálculo de rentabilidade para o importador

Compare o custo total de importação (landed cost) com o valor líquido recebido na plataforma:

- Preço FOB do produto (fornecedor Alibaba): US$ X,XX / unidade
- MOQ (pedido mínimo) do fornecedor: X unidades
- Frete internacional estimado (DHL/FedEx/UPS): US$ X,XX (total) → US$ X,XX / unidade
- Valor CIF (produto + frete): US$ X,XX / unidade
- Imposto de Importação (II): X% sobre CIF = US$ X,XX
- ICMS-ST (se aplicável): X% = R$ X,XX
- Despesas aduaneiras (despachante, taxas): R$ X,XX
- Custo total de importação por unidade (landed cost): R$ X,XX
- Valor líquido por venda no ML: R$ X,XX (extraído do AvantPro)
- Margem bruta por unidade: R$ X,XX (valor líquido ML − landed cost)
- Margem percentual: X%

REGRA DE VIABILIDADE: O landed cost por unidade deve ser no máximo 60% do valor líquido recebido na plataforma (margem mínima de 40%). Para produtos de ticket baixo (< R$ 50), o frete via courier pode inviabilizar — considere frete marítimo ou aéreo consolidado para diluir o custo por unidade.

### Negociação com fornecedores Alibaba

- Solicitar cotação FOB (Free on Board) — nunca aceitar apenas o preço de lista
- Negociar MOQ flexível para primeiro pedido (amostra/teste)
- Confirmar se o fornecedor trabalha com DHL/FedEx/UPS colet account (você paga o frete direto)
- Verificar incoterms: FOB é o mais comum para B2B Chinês, EXW exige coordenação extra
- Prazo de produção estimado: X dias após confirmação do pedido

## 📈 Projeção Simplificada de Retorno

Gere uma tabela com as métricas coletadas e os custos estimados:

| Descrição | Valor |
|-----------|-------|
| Preço de venda (mercado) | R$ X,XX |
| Ritmo atual (vendas/mês) | X |
| Receita bruta mensal | R$ X,XX |
| (-) Comissão ML (X%) | R$ X,XX |
| (-) Imposto (X%) | R$ X,XX |
| Receita líquida mensal | R$ X,XX |
| (-) Custo de importação (X un × R$ X,XX) | R$ X,XX |
| Lucro bruto mensal estimado | R$ X,XX |

Use os percentuais reais do AvantPro para comissão ML e imposto. Se não disponíveis, use as médias de mercado: comissão ML ~13% + imposto ~7%.

## 💡 Oportunidades Estratégicas

### 🎯 Estratégias de Diferenciação

Com base nos pontos fracos do vendedor atual e nas características do produto, sugira estratégias concretas de diferenciação:

- **Qualidade do anúncio**: número de fotos ideal, resolução mínima (HD/4K), ângulos necessários, fotos de uso real
- **Conteúdo**: descrição rica com bullet points, tabela de especificações, comparação com concorrentes, FAQ
- **Mídia**: vídeo demonstrativo, vídeo de unboxing, GIFs de uso, tour 360°
- **Embalagem**: diferenciação visual, proteção extra, brindes (adesivo, cartão de agradecimento, manual em PT-BR)
- **Garantia**: prazo estendido, política de troca facilitada, suporte pós-venda via WhatsApp
- **Entrega**: Full vs. envio próprio, prazo menor que a média, rastreamento proativo
- **Preço**: estratégia de penetração (preço baixo inicial) vs. skimming (preço premium com diferenciação)

### 📦 Sugestão de Kits e Bundles

Proponha combinações de produtos que aumentem o ticket médio e a margem:

- **Kit econômico**: produto + item complementar de baixo custo (ex: case, película, suporte)
- **Kit completo**: produto + 2-3 acessórios essenciais (ex: capa + película + carregador)
- **Kit premium**: produto + acessórios premium + embalagem diferenciada (ex: case de luxo + película de vidro + cabo trançado)
- **Kit recarga**: produto + insumos de reposição (ex: refil, lâminas, filtros)
- **Kit presente**: produto + embalagem para presente + cartão personalizado

Para cada kit sugerido, estime:
- Preço de venda sugerido
- Custo total dos itens (importação)
- Margem estimada do kit

### 🔄 Upsells e Cross-sells

- **Upsell imediato**: versão superior do mesmo produto (ex: mais memória, material premium, cor exclusiva)
- **Cross-sell na oferta**: acessório relacionado na mesma compra (ex: comprou película → oferecer capa)
- **Cross-sell pós-venda**: e-mail/whatsapp após entrega oferecendo complemento com desconto
- **Recorrência**: produto de consumo que gera recompra (ex: película que trinca, refil, reposição)

### 🎨 Variações de Produto

Sugira variações que o fornecedor consegue entregar:

- Cores e acabamentos alternativos
- Tamanhos/versões (mini, padrão, pro)
- Materiais diferentes (plástico, metal, silicone, couro)
- Versões com e sem acessórios
- Embalagem padrão vs. premium

### 📊 Estratégias de Posicionamento

- **Líder em preço**: menor preço da categoria, volume alto, margem baixa
- **Diferenciação por qualidade**: preço médio-alto, fotos premium, marca própria
- **Especialista de nicho**: foco em subcategoria específica (ex: só películas para iPhone)
- **Marca própria**: criar identidade visual, logotipo, embalagem personalizada

### 🌐 Canais de Venda

- **Mercado Livre**: canal principal, uso de Full, anúncios pagos (Product Ads)
- **Shopee**: canal complementar, frete grátis, cupons
- **Amazon**: para produtos de maior valor agregado e marca própria
- **Loja própria / Shopify**: margem maior, controle total, remarketing
- **Atacado**: venda para lojistas, marketplaces B2B
- **Redes sociais**: Instagram Shopping, TikTok Shop, grupos de WhatsApp/Telegram

## 📈 Score Final

Atribua notas de 0 a 10 para cada critério:

| Critério | Nota |
|----------|------|
| Demanda | /10 |
| Margem potencial | /10 |
| Concorrência | /10 |
| Diferenciação possível | /10 |
| Facilidade de importação | /10 |
| Potencial de lucro | /10 |

**Score Final:** (média aritmética — DEVE ser igual ao valor informado no "Resumo para Esteira")

## ⚠️ Gatilhos de Alerta

Emita alertas automáticos quando:

- 🚨 **Conversão baixa**: taxa de conversão < 8% (indica baixa atratividade do anúncio ou produto)
- 🚨 **Concorrente dominante**: concorrente principal com estoque > 100 unidades E preço muito agressivo (< 70% do valor de mercado)
- 🚨 **Demanda em queda**: anúncio com > 1 ano E Ritmo atual em declínio nos últimos meses
- 🚨 **Margem inviável**: valor líquido recebido por venda < custo total de importação + margem de segurança de 30%
- 🚨 **Risco de certificação**: produto que exige Anatel/INMETRO sem certificação disponível no fornecedor
- 🚨 **Estoque baixo do concorrente**: pode ser oportunidade OU sinal de produto problemático (avalie o contexto)
- ✅ **Sinal positivo**: anúncio com < 90 dias E vendas crescentes (indica produto em ascensão)
- ✅ **Sinal positivo**: conversão > 12% (indica forte interesse do público e boa qualidade do anúncio)

## ✅ Conclusão Final

Forneça uma conclusão objetiva:

- **Veredito:** VIÁVEL / INVÁVEL / NECESSITA AVALIAÇÃO (explique)
- **Nível de risco:** Baixo / Médio / Alto
- **Potencial de escala:** Baixo / Médio / Alto
- **Investimento inicial estimado:** R$ X,XX (primeiro lote + frete + impostos)
- **Tempo estimado para retorno:** X meses
- **Melhor estratégia de venda:** (preço, diferenciação, volume, marca)
- **Recomendação final:** (próximos passos concretos)`
  },
  {
    id: "top5-fornecedores-alibaba",
    name: "Top 5 Fornecedores (Alibaba)",
    description: "Seleciona os 5 melhores fornecedores com base em avaliação, certificações e MOQ",
    content: `Analise os fornecedores/produtos listados nesta página do Alibaba e selecione os TOP 5 melhores fornecedores para importação. Gere um relatório em Markdown.

⚠️  É OBRIGATÓRIO listar exatamente 5 fornecedores no relatório. Se houver mais de 5 qualificados, escolha os 5 melhores. Se houver menos de 5 que atendam a TODOS os critérios, relaxe os critérios secundários (anos de operação, taxa de resposta) para completar os 5 — mas NUNCA inclua fornecedores sem o selo Verified Supplier.

IMPORTANTE: Só inclua fornecedores que sejam **Verified Supplier** (auditado pelo Alibaba). Descarte qualquer fornecedor que não tenha esse selo.

Métricas mínimas para os TOP 3 (eliminar se não atingir):
- Rating: ≥ 4.5/5 (ideal ≥ 4.7)
- Trade Assurance: ≥ US$ 10.000 (ideal ≥ US$ 50.000)
- Anos de operação: ≥ 3 anos (ideal ≥ 5)
- Taxa de resposta: ≥ 80% (ideal ≥ 90%)
- On-time delivery: ≥ 85% (ideal ≥ 95%)

Para o 4º e 5º colocados, os critérios podem ser mais flexíveis (Rating ≥ 4.0, Anos ≥ 1, Resposta ≥ 70%), desde que o fornecedor seja Verified Supplier.

Critérios de seleção (por ordem de prioridade):
1. Verified Supplier (obrigatório)
2. Trade Assurance alto — valor protegido demonstra volume de negócios reais
3. Rating + reviews reais — avaliações com fotos/detalhes valem mais
4. Anos de operação — estabilidade e experiência
5. MOQ flexível — aceita pedidos menores para primeiro pedido
6. Taxa de resposta alta — comunicação é tudo em importação
7. Capacidade OEM/ODM — possibilidade de customização futura
8. Certificações relevantes (ISO, CE, ROHS, FCC, etc.)

IMPORTANTE sobre links dos produtos:
- O link de cada produto está no elemento "h2.searchx-product-e-title > a" (atributo href)
- O href começa com "//" (sem protocolo). Adicione "https:" na frente para formar a URL completa
- REMOVA todos os parâmetros de query string (tudo após o "?") — eles causam redirecionamento para "product unavailable"
- Exemplo: href="//www.alibaba.com/product-detail/Nome-Produto_123456.html?spm=xxx&priceId=yyy"
  → URL final: https://www.alibaba.com/product-detail/Nome-Produto_123456.html
- Use SEMPRE a URL limpa (sem parâmetros) no relatório
- NÃO coloque a URL entre crases (backticks). Escreva a URL diretamente, ex: **Link do produto:** https://... (nunca dentro de \`\`)

# Template do Relatório

Use como título do relatório as características principais do produto pesquisado extraídas da página (ex: "# Fone Bluetooth TWS ANC - IP54 - USB-C").

## 🔍 Resumo da Busca

- Produto pesquisado:
- Características extraídas: (material, conectividade, certificações, resistência, etc.)
- URL da página de resultados:
- Total de fornecedores analisados:

## 🏆 Top 5 Fornecedores Recomendados

⚠️  PREENCHA TODAS AS 5 SEÇÕES ABAIXO. É obrigatório ter exatamente 5 fornecedores.

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

### 4º — [Nome do Fornecedor]

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

### 5º — [Nome do Fornecedor]

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

| Critério | 🥇 1º | 🥈 2º | 🥉 3º | 4º | 5º |
|----------|-------|-------|-------|----|----|
| Verified | | | | | |
| Trade Assurance | | | | | |
| Rating | | | | | |
| Anos | | | | | |
| MOQ | | | | | |
| Preço | | | | | |

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
    id: "comparacao-produtos",
    name: "Comparação de Produtos (Top 3)",
    description: "Compara produtos da triagem e seleciona os 3 mais promissores para importação",
    content: `Compare os produtos abaixo e selecione os TOP 3 mais promissores para importação simplificada.

Critérios de avaliação (use seu julgamento livre com base nos dados fornecidos):
- Score de demanda (0-10)
- Volume de vendas mensais
- Nível de concorrência (menor = melhor)
- Margem potencial
- Escalabilidade e facilidade operacional
- Potencial de diferenciação

IMPORTANTE: Sua resposta DEVE conter um bloco JSON delimitado por \`\`\`json ... \`\`\` com o ranking estruturado:
{
  "ranking": [
    { "productId": "ID_DO_PRODUTO", "position": 1, "reason": "Motivo resumido" },
    { "productId": "ID_DO_PRODUTO", "position": 2, "reason": "Motivo resumido" },
    { "productId": "ID_DO_PRODUTO", "position": 3, "reason": "Motivo resumido" }
  ]
}

Após o JSON, inclua um relatório em Markdown com:
1. Tabela comparativa de todos os produtos
2. Análise detalhada de cada produto do top 3
3. Recomendação final`,
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
- Use emojis nos cabeçalhos: 🧭 Tarefa 1, 🛡️ Tarefa 2, 📊 Tarefa 3, 🚪 Tarefa 4, 💰 Tarefa 5, 🎯 Tarefa 6, 🧭 Tarefa 7, 📅 Tarefa 8, 🔍 SEO, 🎨 Imagens, 💲 Precificação, 📋 Conclusão
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
pie showData
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

## 📊 Métricas da Categoria (AvantPro)
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
- **pie**: gráfico de pizza para distribuição (market share, concentração)

Coloque os gráficos próximos aos dados que eles representam.`,
  },
]
