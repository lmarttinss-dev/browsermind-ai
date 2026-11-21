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
- Análise pela idade do anúncio (use a Data de criação do AvantPro):
  - 🟢 Menos de 180 dias (6 meses) com bom ritmo de vendas → indica ALTA DEMANDA RECENTE e produto em ascensão (tendência de crescimento)
  - 🟡 Entre 180 e 365 dias com vendas consistentes → demanda CONSOLIDADA e estável
  - 🔴 Mais de 365 dias → demanda MADURA, verifique se o ritmo de vendas ainda é relevante ou se o produto já passou do pico
  - Cruze SEMPRE a idade do anúncio com o Ritmo atual: um anúncio jovem (< 180 dias) com alto volume de vendas é o melhor indicador de oportunidade quente

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

## 💬 Análise de Perguntas, Respostas e Opiniões dos Clientes

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

## 🚚 Viabilidade para Importação Simplificada

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
- 🚨 **Demanda em queda**: anúncio com > 1 ano E Vendas mensais em declínio nos últimos meses
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
    content: `Analise a viabilidade comercial da amostra de anúncios capturada pelo AvantPro.

O relatório HTML segue um template fixo com 17 seções:
1. Métricas da Categoria
2. Perfil Logístico
3. Perfil de Conta e Catálogo
4. Frete dos Vendedores (valores, cobertura e percentuais por vendedor único)
5. Demanda (idade dos anúncios, vendas estimadas e ritmo atual)
6. Concorrência
7. Concentração de Mercado
8. Oportunidade de Entrada
9. Potencial de Lucro
10. Score de Oportunidade
11. Estratégia Recomendada
12. Plano de 30 Dias
13. SEO
14. Imagens
15. Precificação
16. Sugestão de Preço
17. Conclusão Executiva

Use somente as evidências capturadas. Diferencie observações, estimativas e hipóteses. Não invente margens, retorno, vendas ou sazonalidade.
Frete é exclusivamente o campo Frete do AvantPro; não é o valor cobrado do comprador.
A aplicação calcula indicadores, datas e percentuais e monta as tabelas, gráficos, HTML e PDF. A IA fornece a interpretação no contrato estruturado do servidor.`,
  },
  {
    id: "analise-anuncio-independente",
    name: "Ficha do Produto",
    description: "Síntese do produto com características, perguntas, opiniões e melhorias baseadas nas evidências.",
    content: `Crie uma ficha objetiva deste produto: síntese e público, características comprovadas, benefícios percebidos, pontos de atenção nas opiniões, perguntas e respostas disponíveis e melhorias vinculadas às evidências.
Foque no produto e na experiência de uso. Não avalie vendedor, desempenho comercial, demanda, concorrência, logística, margem ou viabilidade. Não invente características, opiniões, perguntas, respostas ou frequências. Sem evidência, indique ausência de dados.
Use o contrato estruturado da aplicação. A análise aprofundada pertence ao relatório de mercado.`,
  },
]
