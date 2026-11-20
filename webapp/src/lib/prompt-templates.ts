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
    name: "Análise de Anúncio (Catálogo ou Independente)",
    description: "Diagnóstico completo de um anúncio do Mercado Livre com métricas do AvantPro. Detecta automaticamente se é produto de catálogo ou independente e adapta a análise.",
    content: `Analise este anúncio do Mercado Livre com base nas métricas do AvantPro visíveis na página. Gere um diagnóstico completo focado em identificar gargalos, riscos e oportunidades de melhoria. Inclua a URL do anúncio analisado.

⚠️  PRIMEIRO PASSO OBRIGATÓRIO: Identifique se este é um PRODUTO DE CATÁLOGO ou um ANÚNCIO INDEPENDENTE. O tipo de análise Muda COMPLETAMENTE dependendo desta classificação.

⚠️  SEÇÕES COMUNS OBRIGATÓRIAS: SEMPRE gere, nesta ordem e ANTES de qualquer bloco do tipo, as duas seções: "📋 Resumo para Esteira" e "📈 Demanda Recente (Velocidade de Vendas)". Os blocos "SE FOR ..." são ADICIONAIS — complementam as seções comuns, NUNCA as substituem. Se qualquer seção comum faltar, o relatório está INCOMPLETO.

⚠️  NÃO INCLUA NO RELATÓRIO: os títulos internos "SE FOR ..." e "Template — ..." são apenas instruções de geração. O relatório final NÃO deve conter esses títulos — gere apenas as seções de conteúdo.

IMPORTANTE: PRIORIZE SEMPRE as métricas exatas extraídas do AvantPro (DOM da página). Complemente com informações contextuais da página quando necessário.

⚠️  FORMATO DE PREÇO: Use SEMPRE o formato brasileiro com vírgula como separador decimal (ex: R$ 66,79, NUNCA R$ 66.79).

⚠️  FOCO PRINCIPAL: Identificar PONTOS NEGATIVOS e gargalos no desempenho do anúncio. Seja crítico e objetivo — aponte exatamente o que está prejudicando as vendas, a margem ou a conversão.

💬  Q&A DO USUÁRIO: O conteúdo da página pode incluir uma seção "PERGUNTAS E RESPOSTAS / OPINIÕES DOS CLIENTES (COPIADO PELO USUÁRIO)" que contém perguntas, respostas e opiniões de clientes reais copiadas do Mercado Livre. Se esta seção estiver presente, ANALISE-A com atenção máxima. Extraia: dúvidas frequentes, qualidade do atendimento do vendedor, elogios e reclamações literais dos compradores, padrões recorrentes nas avaliações. Use esses dados para enriquecer TODAS as seções do relatório (Pontos Negativos, Oportunidades de Melhoria, Score Final).

🎨  GRÁFICOS MERMAID: Você PODE usar gráficos Mermaid para enriquecer o relatório com visualizações de dados. Use pie charts para distribuição de market share no catálogo e xychart para tendências de vendas.

⚠️  REGRAS CRÍTICAS DE SINTAXE (Mermaid v11) — siga à risca para evitar erros:

1. Use SEMPRE aspas retas \" (U+0022) — NUNCA aspas curvas \"\" (smart quotes)
2. Pie charts: use APENAS \`pie\` na primeira linha — NUNCA \`pie showData\` (inválido no v11)
3. Xychart: NUNCA use / ou - nos labels do x-axis (ex: use \"Jan\", não \"Jan/26\")
4. Percentuais de pie chart DEVEM ser números inteiros que somem exatamente 100%
5. Coloque gráficos próximos aos dados que representam

---

## 🔍 Identificação do Tipo de Anúncio

## Como identificar se é PRODUTO DE CATÁLOGO:

Um produto de catálogo no Mercado Livre é uma ficha unificada onde MÚLTIPLOS VENDEDORES oferecem o MESMO produto. Sinais claros:

- A página mostra "X vendedores" ou "X opções" ou "Disponível em X cores/tamanhos" com seletores
- Aparece uma seção "Outros vendedores" ou "Comparar preços" ou "Todos os vendedores"
- O selo "MAIS VENDIDO" ou "OFERTA DO DIA" pode alternar entre vendedores
- O AvantPro pode mostrar dados agregados do catálogo (vendas totais de todos os vendedores)
- Na URL, produtos de catálogo geralmente têm uma estrutura de breadcrumb mais genérica
- Aparece "ProdutoPro" ou indicadores de catálogo estruturado

## Como identificar se é ANÚNCIO INDEPENDENTE:

- A página mostra apenas UM vendedor ("Vendido por [LOJA]" sem opção de escolher outro)
- Não há seção de "Outros vendedores" ou comparação de preços
- O anúncio é único — o vendedor tem controle total sobre fotos, descrição, título
- O AvantPro mostra métricas específicas DESTE vendedor (não agregadas)
- Pode ter selos como "LOJA OFICIAL" ou "MERCADO LÍDER" sem compartilhar com outros

## Resultado da Identificação:

Preencha OBRIGATORIAMENTE:

- **URL do anúncio:**
- **Tipo identificado:** 📚 PRODUTO DE CATÁLOGO ou 📦 ANÚNCIO INDEPENDENTE
- **Data da análise:** (use a data atual no formato "DD de Mês de AAAA")
- **Evidências:** (como foi identificado — cite elementos visíveis na página)

---

## 📋 Resumo para Esteira

> 🚨 Este bloco é OBRIGATÓRIO e usado para alimentar o Kanban automaticamente. Preencha TODOS os campos sem exceção. O Score Final da conclusão DEVE ser IGUAL ao informado aqui.

- Nome: (nome completo do produto)
- Categoria: (categoria principal > subcategoria)
- Preço atual: R$ (valor no formato brasileiro, ex: 66,79)
- Tipo: (exatamente uma das opções: 📚 Catálogo | 📦 Independente)
- Vendas mensais: (número inteiro — métrica Vendas mensais do AvantPro)
- Demanda recente: (exatamente uma das opções: 🔥 Forte | ✅ Ativa | ⚠️ Fraca | ❌ Estagnada)
- Nível de competição: (exatamente uma das opções: Baixa | Média | Alta | Saturado)
  - Para catálogo: baseado na quantidade de vendedores e competitividade da buy box
  - Para independente: baseado na concorrência da categoria
- Potencial de melhoria: (APENAS o percentual ou faixa, sem texto. Ex: 25-40%)
- Score Final: (nota de 0 a 10 representando saúde/viabilidade geral)

---

## 📈 Demanda Recente (Velocidade de Vendas)

> Avalie se a demanda é RECENTE e ATIVA, não apenas histórica. Use as métricas do AvantPro para distinguir "vendeu no passado" de "está vendendo agora".

- Vendas por dia (atual): X — métrica "Vendas por dia" do AvantPro
- Vendas mensais (atual): X — métrica "Vendas mensais" do AvantPro
- Total vendido (histórico acumulado): X — métrica "Vendidos" do AvantPro
- Data de criação do anúncio/catálogo: dd/mm/aaaa
- Idade do anúncio: X dias/meses (calcule da data de criação até hoje)
- Média histórica por dia: Total vendido ÷ idade em dias = X/dia
- Comparação: vendas por dia ATUAL vs média histórica (acelerando? estável? desacelerando?)
- Estoque atual: X unidades

Classificação da demanda recente (exatamente uma das opções):
- 🔥 Forte: vendas/dia atuais ≥ 2x a média histórica OU estoque baixo + vendas/dia altas
- ✅ Ativa: vendas/dia atuais > 0 e próximas da média histórica
- ⚠️ Fraca: vendas/dia atuais baixas e em queda vs média histórica
- ❌ Estagnada: vendas/dia = 0 e/ou sem vendas recentes

- Avaliações recentes: datas das últimas avaliações visíveis na página (semanas/meses) — indicam compras recentes
- Veredito: a demanda é recente e sustentável ou é demanda passada? Justifique em 1-2 frases.

> ⚠️ A classificação "Demanda recente" deve ser IGUAL à informada no bloco "Resumo para Esteira".

---

# SE FOR 📚 PRODUTO DE CATÁLOGO → ADICIONE O BLOCO ABAIXO

> ⚠️ Gere o bloco abaixo ADICIONALMENTE, DEPOIS das seções comuns (Resumo para Esteira e Demanda Recente).
> ⚠️ Um produto de catálogo é uma FICHA UNIFICADA onde vários vendedores competem pelo mesmo produto. A análise deve focar em POSICIONAMENTO COMPETITIVO e ESTRATÉGIA PARA VENCER A BUY BOX.

# Template — Produto de Catálogo

## 📚 Visão Geral do Catálogo

- Nome do produto (catálogo):
- URL do catálogo:
- Categoria:
- Total de vendedores no catálogo: (quantos sellers oferecem este mesmo produto)
- Tipo de catálogo: (ProdutoPro / Catálogo padrão / Catálogo com variações)
- Este vendedor está no catálogo? (Sim — analisar posição / Não — analisar entrada)

## 📦 Características do Produto

> Extraia da página do anúncio as características físicas e técnicas do produto. Estes dados são compartilhados por todos os vendedores do catálogo.

- Categoria / subcategoria:
- Material e composição:
- Dimensões e peso:
- Cores / tamanhos / modelos (variações disponíveis no catálogo):
- Compatibilidade (quando aplicável):
- Especificações relevantes (voltagem, conectividade, capacidade, etc.):
- Itens inclusos na embalagem:

## 📝 Descrição do Catálogo

> No Mercado Livre, a descrição do produto em catálogos costuma ser PADRONIZADA e compartilhada entre todos os vendedores. Avalie a descrição do catálogo: se está bem estruturada ou se há oportunidades de melhoria que todo o catálogo se beneficiaria (fotos genéricas, falta de especificações, etc.).

- Resumo da descrição do catálogo (3-5 tópicos objetivos):
- Proposta de valor central:
- Pontos fracos da descrição padronizada (o que falta ou está mal explicado):
- Oportunidade: se a descrição for FRACA, isso afeta TODOS os vendedores igualmente — mas você pode se destacar em outros fatores (preço, frete, reputação)

### 📊 Métricas do Catálogo (AvantPro — agregadas de TODOS os vendedores)

| Métrica | Valor |
|---------|-------|
| Preço médio do catálogo | R$ |
| Faixa de preço (mínimo — máximo) | R$ — R$ |
| Total vendido (catálogo — todos os vendedores) | X unidades |
| Vendas por dia (catálogo) | X |
| Vendas mensais (catálogo inteiro) | X |
| Visitas ao catálogo | X |
| Taxa de conversão do catálogo | X% |
| Estoque total (todos os vendedores somados) | X unidades |
| Tempo do catálogo (data de criação) | dd/mm/aaaa |
| Faturamento total do catálogo | R$ |

---

## 🔎 Diagnóstico Rápido do Catálogo

> Preencha esta tabela OBRIGATORIAMENTE antes de prosseguir. Use os dados da página e do AvantPro para determinar cada critério.

| Critério | Resultado |
|----------|-----------|
| Existe catálogo? | ✅ Sim / ❌ Não |
| Tipo | Proprietário / Participante / Não está no catálogo |
| Pode vender? | ✅ Sim / ❌ Não / ⚠️ Restrições |
| Catálogo fechado? | ❌ Não / ✅ Sim (novos vendedores bloqueados) |
| Concorrentes | (número de vendedores no catálogo) |
| Buy Box concentrada? | Baixa / Média / Alta |
| Guerra de preço | Baixa / Média / Alta |
| Margem líquida estimada | (percentual calculado com base no preço de venda − taxas ML − custo) |
| Nível de dificuldade | X/10 |
| Recomendação | (frase curta: entrar, evitar, monitorar, etc.) |

---

## 🏆 Posicionamento no Catálogo

> Se este vendedor JÁ está no catálogo, analise sua posição. Se NÃO está, analise a viabilidade de entrada.

### 📊 Tabela de Vendedores no Catálogo

Liste os vendedores visíveis ordenados por relevância (buy box primeiro):

| # | Vendedor | Preço | Reputação | Tipo de Envio | Estoque | Avaliações | Buy Box? |
|---|----------|-------|-----------|---------------|---------|------------|----------|
| 1 | | R$ | ⭐/Medalha | Full/Flex/Correios | X un. | X ⭐ | ✅ Sim |
| 2 | | R$ | ⭐/Medalha | Full/Flex/Correios | X un. | X ⭐ | ❌ |
| 3 | | R$ | ⭐/Medalha | Full/Flex/Correios | X un. | X ⭐ | ❌ |
| ... | | | | | | | |

### 🥇 Análise do Vendedor na Buy Box (posição #1)

- **Quem é o vencedor da buy box:** (nome do vendedor)
- **Por que ele vence:**
  - Preço: é o mais barato? (Sim/Não — posição de preço: Xº mais barato)
  - Reputação: MercadoLíder / Platinum / Gold?
  - Full: Sim/Não
  - Tempo de entrega: X dias
  - Estoque: X unidades
  - Avaliações: X positivas
- **O que falta para este vendedor (analisado) superar o líder:**
  - Se o preço é o fator decisivo: quanto precisaria baixar?
  - Se reputação é o fator: quantas vendas/avaliações faltam?
  - Se Full é o fator: vale a pena enviar para Full?

---

## 💰 Análise de Precificação no Catálogo

### Estrutura de Preços dos Concorrentes

| Faixa de Preço | Vendedores | % do Catálogo | Perfil |
|---------------|------------|---------------|--------|
| R$ X — R$ Y (Entrada) | X | X% | Preço agressivo, margem baixa |
| R$ Y — R$ Z (Meio) | X | X% | Equilíbrio preço/reputação |
| R$ Z+ (Premium) | X | X% | Diferenciação, frete grátis, Full |

### Posicionamento de Preço do Vendedor Analisado

- Preço atual do vendedor: R$ X,XX
- Posição no ranking de preços: Xº mais barato de Y vendedores
- Diferença para o mais barato: R$ X,XX (X% a mais)
- Diferença para a média: R$ X,XX
- Faixa recomendada pelo AvantPro: R$ X,XX a R$ X,XX
- O preço está dentro da faixa recomendada? Sim / Não
- Estratégia de preço atual: (Agressivo / Competitivo / Premium / Fora do mercado)

### Simulação de Ajuste de Preço

| Cenário | Preço | Posição no Ranking | Margem Estimada | Vendas Esperadas/mês | Faturamento Projetado |
|---------|-------|-------------------|-----------------|---------------------|----------------------|
| Agressivo (top 3 mais barato) | R$ | Xº | X% | X | R$ |
| Competitivo (preço médio) | R$ | Xº | X% | X | R$ |
| Premium (top 3 mais caro) | R$ | Xº | X% | X | R$ |

---

## 🚚 Comparativo de Logística no Catálogo

| Vendedor | Tipo de Envio | Prazo de Entrega | Frete | Custo para o Vendedor |
|----------|---------------|------------------|-------|----------------------|
| Vendedor #1 | Full / Flex / Correios | X dias | Grátis / R$ X,XX | R$ X,XX |
| Vendedor #2 | Full / Flex / Correios | X dias | Grátis / R$ X,XX | R$ X,XX |
| **Vendedor analisado** | Full / Flex / Correios | X dias | Grátis / R$ X,XX | R$ X,XX |

### Análise Logística

- **Full é diferencial neste catálogo?** (quantos % dos vendedores usam Full)
- **Frete grátis é esperado?** (quantos % oferecem frete grátis)
- **Prazo de entrega do vendedor analisado vs. concorrência:** (mais rápido / na média / mais lento)
- **Oportunidade logística:** se a concorrência usa Correios e este vendedor pode usar Full, é vantagem decisiva

---

## ⭐ Comparativo de Reputação

| Vendedor | Medalha | Vendas Totais | Avaliações | Nota Média | Tempo de Mercado |
|----------|---------|---------------|------------|------------|------------------|
| #1 | | | | ⭐ | |
| #2 | | | | ⭐ | |
| **Analisado** | | | | ⭐ | |

### Análise de Reputação

- A reputação é fator decisivo na buy box deste catálogo? (Sim/Não)
- O vendedor analisado tem reputação suficiente para competir? (Sim/Não)
- Se não: quantas vendas/avaliações precisa para se equiparar ao líder?
- Estratégia para construir reputação: (preço baixo inicial, frete grátis, atendimento excepcional)

---

## 💬 Perguntas e Respostas (Catálogo)

> 📌 Esta seção é preenchida com o conteúdo de perguntas e respostas copiado pelo usuário ("PERGUNTAS E RESPOSTAS / OPINIÕES DOS CLIENTES (COPIADO PELO USUÁRIO)"). Se estiver presente no conteúdo da página, preencha esta seção OBRIGATORIAMENTE. No catálogo, as perguntas e respostas são COMPARTILHADAS entre todos os vendedores.

- Principais dúvidas dos compradores sobre o produto:
- Qualidade das respostas dos vendedores no catálogo (ágeis, completas, evasivas):
- Perguntas sem resposta (oportunidade para se destacar respondendo):
- Temas recorrentes nas perguntas (tamanho, material, compatibilidade, etc.):
- Oportunidades: informações que NENHUM vendedor está fornecendo e que você pode incluir no seu anúncio

## ⭐ Opiniões do Produto (Catálogo)

> 📌 Esta seção é preenchida com as opiniões/avaliações dos clientes copiadas pelo usuário. Se estiverem presentes no conteúdo da página, preencha esta seção OBRIGATORIAMENTE. No catálogo, as opiniões são COMPARTILHADAS entre todos os vendedores — avaliações negativas sobre OUTROS vendedores também afetam SEU anúncio.

- Nota média do catálogo (se disponível):
- Distribuição das avaliações (5⭐ / 4⭐ / 3⭐ / 2⭐ / 1⭐):
- Principais elogios (cite trechos literais):
- Principais reclamações (cite trechos literais):
- Problemas recorrentes (defeito, tamanho errado, atraso na entrega, produto diferente da foto):
- Potencial de recompra (clientes comprariam novamente?):
- Risco de devolução (qual % dos compradores relata problemas graves?):

## 🎯 Insights para Diferenciação no Catálogo

- O que os clientes AMAM no produto (reforce no seu posicionamento):
- O que os clientes ODEIAM no produto (corrija ou alerte na sua descrição):
- Funcionalidades ou variações que os clientes pedem e não encontram:
- Oportunidades de melhoria no produto: qualidade, embalagem, manual, acessórios
- Como a concorrência lida com reclamações (oportunidade de atendimento superior)
- Diferenciais de atendimento que podem fazer você vencer a buy box mesmo sem ser o mais barato

---

## 📊 Market Share Estimado no Catálogo

> Calcule a fatia de mercado de cada vendedor com base nas vendas proporcionais.

| Vendedor | Vendas Estimadas | % do Catálogo | Faturamento Estimado |
|----------|-----------------|---------------|---------------------|
| #1 (Buy Box) | X | X% | R$ |
| #2 | X | X% | R$ |
| **Analisado** | X | X% | R$ |
| Demais | X | X% | R$ |

### Concentração do Catálogo

- Top 1 detém X% das vendas
- Top 3 detêm X% das vendas
- Classificação: (Pulverizado / Moderadamente Concentrado / Altamente Concentrado)
- Se altamente concentrado no top 1: o que ele faz diferente? (preço, Full, reputação, anúncios pagos?)

---

## 🎯 Estratégia para Vencer a Buy Box

> A buy box é a posição de destaque onde o botão "Comprar" principal leva ao seu anúncio. É onde acontecem ~80% das vendas do catálogo.

### Pré-requisitos para Disputar a Buy Box

Marque o que este vendedor JÁ tem e o que PRECISA:

| Requisito | Status | Ação Necessária |
|-----------|--------|-----------------|
| Preço competitivo (dentro da faixa) | ✅ / ❌ | |
| Reputação (MercadoLíder ou melhor) | ✅ / ❌ | |
| Full ou Frete Grátis | ✅ / ❌ | |
| Estoque suficiente (> 20 un.) | ✅ / ❌ | |
| Bom histórico de entregas | ✅ / ❌ | |
| Avaliações positivas recentes | ✅ / ❌ | |

### Estratégia Recomendada

Escolha UMA estratégia principal:

1. **Guerra de preço**: baixar para ser o mais barato — risco de margem zero, mas ganha buy box rápido
2. **Diferenciação por serviço**: preço médio + Full + frete grátis + atendimento premium — ganha buy box por qualidade
3. **Nichos de variação**: focar em cor/tamanho/modelo que ninguém tem estoque — menos competição
4. **Entrada gradual**: preço baixo para construir reputação → depois sobe para preço competitivo
5. **Não competir**: se o líder é uma loja oficial com preço impossível de bater, evite este catálogo

---

## 🚨 Pontos Negativos e Riscos (Catálogo)

### 🔴 Riscos Específicos de Produto de Catálogo

- **Guerra de preços**: se 3+ vendedores baixam preço constantemente, margem tende a zero
- **Dependência da buy box**: se não estiver na buy box, as vendas caem 70-90%
- **Loja oficial no catálogo**: se há uma loja oficial da marca, ela tem vantagem permanente
- **Vendedor internacional**: sellers da China/Paraguai com preço muito baixo podem inviabilizar
- **Catálogo saturado**: mais de 10 vendedores para o mesmo produto → margem diluída
- **Risco de suspensão do catálogo**: se o Mercado Livre descontinuar o catálogo, perde-se o histórico

### 🟡 Pontos de Atenção no Catálogo

- **Preço desatualizado**: se o vendedor não ajusta o preço há semanas, perdeu a buy box sem saber
- **Estoque oculto**: concorrentes podem ter estoque maior que o declarado
- **Avaliações cross-vendedor**: no catálogo, avaliações são compartilhadas — uma reclamação sobre outro vendedor pode afetar todos
- **Variações não cobertas**: se o vendedor não tem todas as variações do catálogo, perde clientes que buscam cor/tamanho específico

---

## 💡 Oportunidades de Melhoria (Catálogo)

### 🎯 Ações Imediatas para Vencer a Buy Box

1. **Ajustar preço** para a faixa recomendada pelo AvantPro
2. **Ativar Full** se a concorrência não usa (diferencial decisivo)
3. **Aumentar estoque** na variação mais vendida
4. **Responder perguntas** pendentes (aumenta reputação no catálogo)
5. **Atualizar GTIN/EAN** se estiver incorreto (melhora posicionamento)

### 📈 Estratégias de Curto Prazo

1. **Product Ads no catálogo**: anúncios pagos para aparecer como destaque
2. **Oferecer parcelamento sem juros** se a concorrência não oferece
3. **Envio Full**: prioridade na buy box do Mercado Livre
4. **Preço dinâmico**: ajustar preço 2x/dia para manter posição competitiva
5. **Monitorar concorrentes**: verificar diariamente se houve mudança de preço ou estoque

---

## 📈 Score Final do Catálogo

| Critério | Nota | Justificativa |
|----------|------|---------------|
| Competitividade de preço | /10 | (posição no ranking de preços) |
| Força da reputação | /10 | (medalhas, avaliações, tempo de mercado) |
| Vantagem logística | /10 | (Full, frete grátis, prazo de entrega) |
| Potencial de buy box | /10 | (chance real de conquistar a posição #1) |
| Tamanho do catálogo | /10 | (volume de vendas total do catálogo) |
| Risco de saturação | /10 | (quanto menor o risco, maior a nota) |

**Score Final:** X/10 (média aritmética — DEVE ser igual ao valor informado no "Resumo para Esteira")

### Interpretação

| Nota | Diagnóstico | Ação Recomendada |
|------|-------------|------------------|
| 0–3 | 🔴 **Crítico** | Catálogo saturado ou inviável — evite entrar |
| 4–5 | 🟡 **Frágil** | Catálogo competitivo, exige estratégia agressiva de preço ou Full |
| 6–7 | 🟡 **Regular** | Boa oportunidade se conseguir vantagem em preço ou logística |
| 8–9 | 🟢 **Saudável** | Catálogo com espaço — entre com preço competitivo e escale |
| 10 | 🟢 **Excelente** | Oportunidade rara — catálogo com alta demanda e baixa competição |

---

## ✅ Conclusão — Produto de Catálogo

### 🎯 Decisão Estratégica

> Decisão: **[DISPUTAR BUY BOX / ENTRAR COM DIFERENCIAÇÃO / MONITORAR / EVITAR]**

### 📋 Checklist de Ações

- [ ] Ajustar preço para posição competitiva (top 3 mais barato)
- [ ] Ativar Full (se viável financeiramente)
- [ ] Aumentar estoque na variação principal
- [ ] Melhorar descrição e fotos (mesmo em catálogo, ajuda na conversão)
- [ ] Responder TODAS as perguntas pendentes
- [ ] Iniciar Product Ads no catálogo
- [ ] Monitorar preços dos concorrentes diariamente
- [ ] Verificar se o GTIN/EAN está correto

### 🧠 Veredito Final

> (2-3 frases com a recomendação final baseada nos dados do catálogo)

---

# SE FOR 📦 ANÚNCIO INDEPENDENTE → ADICIONE O BLOCO ABAIXO

> ⚠️ Gere o bloco abaixo ADICIONALMENTE, DEPOIS das seções comuns (Resumo para Esteira e Demanda Recente).
> ⚠️ Um anúncio independente é controlado por UM ÚNICO vendedor. A análise deve focar em SAÚDE DO ANÚNCIO, CONVERSÃO e OTIMIZAÇÃO.

# Template — Anúncio Independente

## 📋 Resumo do Diagnóstico

> Bloco executivo — leitura rápida para tomada de decisão.

- Produto: (nome completo do produto)
- URL do anúncio:
- Preço de venda: R$ (formato brasileiro)
- Faturamento total estimado: R$
- Vendas mensais:
- Taxa de conversão:
- Dias ativo:
- Dentro de catálogo? (Sim — este anúncio está linkado a um catálogo / Não — anúncio 100% independente)
- Saúde geral: 🟢 Saudável / 🟡 Atenção / 🔴 Crítico
- Principais gargalos: (1-3 frases resumindo os maiores problemas)

---

## 📦 Dados do Anúncio

- Nome do produto:
- URL:
- Categoria:
- Preço de venda: R$
- Frete: (valor e tipo — Grátis, Full, Flex, Correios)
- Loja / Vendedor:
- Reputação do vendedor (MercadoLíder, Platinum, Gold, etc.):
- Selos e destaques (MAIS VENDIDO, OFERTA DO DIA, etc.):
- Tipo de anúncio: (Clássico / Premium / ProdutoPro)
- Está vinculado a catálogo? (Sim — ID do catálogo: MLB-XXXX / Não)
  - Se SIM: mesmo sendo independente, há concorrência de outros sellers no mesmo catálogo?
  - Se SIM: quantos outros vendedores estão no catálogo?

---

## 📦 Características do Produto

### ⚙️ Especificações Técnicas

- Categoria / subcategoria:
- Material e composição:
- Dimensões e peso:
- Cores / tamanhos / modelos (e variações disponíveis):
- Compatibilidade: (quando aplicável)
- Especificações relevantes: (voltagem, conectividade, capacidade, etc.)
- Itens inclusos na embalagem:

### 📋 Compliance e Certificação

- Certificações exigidas no Brasil (Anatel, INMETRO, MAPA, etc.): possui ou não?
- Tamanho/peso adequado para envio? (Sim / Não — impacto no frete)
- Produto frágil? (Sim / Não — risco de avaria no transporte)
- Embalagem adequada ao transporte? (Sim / Não)

### ✈️ Viabilidade de Importação

- NCM provável:
- Alíquota de Imposto de Importação (II) estimada:
- Tamanho/peso para courier: (Ideal / Viável / Problemático)
- Risco alfandegário: (Baixo / Médio / Alto)
- Fornecedor: (Nacional / Internacional / Importado por terceiros)

### ⚠️ Sinais de Qualidade e Risco

- Histórico de defeitos: (cruzar com reclamações das avaliações)
- Material de reposição ou durável?
- Garantia informada? (Sim / Não)
- Política de troca/devolução informada? (Sim / Não)

### 🎯 Diferenciação e Oportunidade

- Variações que faltam no mercado:
- Acessórios / complementares para kits:
- O que os clientes pedem e não encontram:
- Ponto forte a reforçar vs. ponto fraco a corrigir:

---

## 📊 Métricas do AvantPro

| Métrica | Valor |
|---------|-------|
| Preço de venda | R$ |
| Frete | R$ |
| Data de criação do anúncio | dd/mm/aaaa |
| Dias ativo | X dias |
| Estoque disponível | X unidades |
| Total vendido (histórico) | X unidades |
| Vendas por dia | X |
| Vendas mensais | X/mês |
| Vendas estimadas | X |
| Visitas ao anúncio | X |
| Taxa de conversão | X% |
| Faturamento total | R$ |
| Imposto por venda | R$ X,XX (X%) |
| Comissão ML por venda | R$ X,XX (X%) |
| Valor líquido recebido por venda | R$ X,XX (X%) |
| Faixa de preço recomendada | R$ X,XX a R$ X,XX |

### 📈 Métricas do Vendedor (se disponíveis)

- Vendas totais do vendedor:
- Faturamento total do vendedor:
- Localização do vendedor:
- Ticket médio da loja:
- Tempo de mercado:

---

## 📝 Descrição do Anúncio

> A descrição é um dos fatores mais importantes para conversão. Analise o conteúdo da página do produto e extraia insights acionáveis.

### 🧠 Síntese da Descrição

> Antes de avaliar cada aspecto, SINTETIZE a descrição: leia o texto completo e produza um resumo fiel e condensado do que o anúncio comunica. NÃO copie o texto integral — extraia a essência.

- Resumo da descrição (3-5 tópicos objetivos):
  1.
  2.
  3.
- Proposta de valor central: (o principal benefício ou diferencial que a descrição vende)
- Público-alvo implícito: (para quem a descrição foi escrita)
- Mensagem principal: (frase-síntese que resume o apelo do anúncio)
- Tom e persona da descrição: (técnico / vendedor / institucional / informal — e a "voz" que o texto assume)

---

## 💰 Análise Financeira

### Demonstração por Unidade

| Item | Valor (R$) | % do Preço |
|------|-----------|------------|
| Preço de venda | R$ X,XX | 100% |
| (-) Comissão ML | R$ X,XX | X% |
| (-) Imposto | R$ X,XX | X% |
| (-) Frete (se arcado pelo vendedor) | R$ X,XX | X% |
| (=) Valor líquido recebido | R$ X,XX | X% |

### Projeção Mensal

| Indicador | Valor |
|-----------|-------|
| Vendas mensais | X |
| Receita bruta mensal (Vendas mensais × Preço) | R$ |
| (-) Comissão ML mensal | R$ |
| (-) Imposto mensal | R$ |
| (-) Frete mensal | R$ |
| (=) Receita líquida mensal estimada | R$ |

### Análise da Margem

- Margem líquida por unidade: X% — classifique como:
  - 🔴 **Crítica** (< 30%): margem muito apertada, qualquer oscilação de custo ou taxa inviabiliza
  - 🟡 **Atenção** (30–45%): margem ok, mas exige volume para compensar
  - 🟢 **Saudável** (45–60%): boa margem, espaço para reinvestimento
  - 🟢 **Excelente** (> 60%): margem confortável, permite escala agressiva
- Relação preço vs. faixa recomendada:
  - Se o preço está DENTRO da faixa recomendada pelo AvantPro → precificação adequada
  - Se o preço está ACIMA da faixa → 🚨 anúncio pode estar caro demais, perdendo vendas
  - Se o preço está ABAIXO da faixa → ⚠️ possível perda de margem desnecessária, aumente o preço

---

## 🏥 Saúde do Anúncio

### 📊 Análise de Conversão

A taxa de conversão é o indicador mais direto da qualidade do anúncio. Classifique:

- 🔴 **Muito Baixa** (< 5%): grave — o anúncio não convence. Possíveis causas: fotos ruins, título fraco, preço acima da concorrência, descrição incompleta, frete caro, reputação baixa
- 🟡 **Baixa** (5–8%): abaixo do esperado — há gargalos na página do produto que precisam ser corrigidos
- 🟢 **Média** (8–12%): desempenho OK, mas com espaço para melhorar
- 🟢 **Alta** (12–18%): bom desempenho — o anúncio é eficiente
- 🟢 **Muito Alta** (> 18%): excelente — anúncio muito bem otimizado, produto com forte apelo

> ⚠️ Atenção: conversão muito alta (> 25%) pode indicar tráfego extremamente qualificado (ex: só chega por busca direta). Verifique se o volume de visitas está saudável.

### ⏱️ Análise de Idade do Anúncio

Cruze a idade do anúncio com as Vendas mensais para avaliar maturidade:

- 🟢 **Anúncio jovem (< 30 dias) com alto volume de vendas** → produto em ASCENSÃO, timing excelente. Acompanhe de perto — tendência de crescimento acelerado
- 🟢 **Anúncio jovem (< 90 dias) com vendas consistentes** → validação inicial positiva, produto com demanda real
- 🟡 **Anúncio entre 90-180 dias** → em fase de consolidação. Se as vendas mensais estiverem estáveis ou crescendo, é positivo. Se estiverem caindo, investigue
- 🟡 **Anúncio entre 180-365 dias** → maduro. Verifique se as vendas mensais se mantêm ou se há sinais de fadiga
- 🔴 **Anúncio > 365 dias com vendas em queda** → possível saturação ou perda de relevância. Revisar estratégia

### 📦 Análise de Estoque

- Estoque atual: X unidades
- Relação estoque vs. vendas mensais: estoque cobre X meses de venda
  - 🔴 **Estoque < 1 mês de vendas** → risco de ruptura IMINENTE. Prioridade máxima: repor estoque
  - 🟡 **Estoque entre 1-2 meses** → atenção: planeje reposição já
  - 🟢 **Estoque > 2 meses** → saudável, sem urgência
- Se estoque está BAIXO e as vendas mensais são ALTAS → 🚨 oportunidade PERDENDO vendas por falta de produto

### 🔍 Qualidade do Tráfego

- Visitas totais: X
- Relação visitas vs. vendas: X visitas para cada venda
- Análise:
  - Se muitas visitas e poucas vendas → problema de CONVERSÃO (fotos, preço, descrição)
  - Se poucas visitas e boa conversão → problema de TRÁFEGO (SEO fraco, categoria errada, sem anúncios pagos)
  - Se muitas visitas e muitas vendas → 🟢 anúncio saudável, manter e escalar

---

## 💬 Perguntas e Respostas

> 📌 Esta seção é preenchida com o conteúdo de perguntas e respostas copiado pelo usuário ("PERGUNTAS E RESPOSTAS / OPINIÕES DOS CLIENTES (COPIADO PELO USUÁRIO)"). Se estiver presente no conteúdo da página, preencha esta seção OBRIGATORIAMENTE com base nele. Caso contrário, analise o que for possível extrair das perguntas visíveis na página.

- Principais dúvidas dos compradores:
- Qualidade das respostas do vendedor (ágeis, completas, evasivas):
- Tempo médio de resposta do vendedor:
- Perguntas sem resposta:
- Temas recorrentes nas perguntas (tamanho, material, compatibilidade, etc.):
- Oportunidades: informações que o vendedor NÃO está fornecendo e que você pode incluir no seu anúncio

## ⭐ Opiniões do Produto

> 📌 Esta seção é preenchida com as opiniões/avaliações dos clientes copiadas pelo usuário. Se estiverem presentes no conteúdo da página, preencha esta seção OBRIGATORIAMENTE. Caso contrário, analise o que for possível extrair das avaliações visíveis na página. As opiniões dos clientes são a FONTE MAIS RICA de pontos negativos e oportunidades de melhoria.

- Nota média (se disponível):
- Distribuição das avaliações (5⭐ / 4⭐ / 3⭐ / 2⭐ / 1⭐):
- Principais elogios (cite trechos literais):
- Principais reclamações (cite trechos literais):
- Problemas recorrentes (defeito, tamanho errado, atraso na entrega, produto diferente da foto):
- Potencial de recompra (clientes comprariam novamente?):
- Risco de devolução (qual % dos compradores relata problemas graves?):

## 🎯 Insights para Diferenciação

- O que os clientes AMAM no produto (reforce no seu anúncio):
- O que os clientes ODEIAM no produto (corrija ou alerte no seu anúncio):
- Funcionalidades ou variações que os clientes pedem e não encontram:
- Oportunidades de melhoria no produto: qualidade, embalagem, manual, acessórios
- Como o vendedor atual lida com reclamações (oportunidade de atendimento superior)

---

## 🚨 Pontos Negativos e Riscos

> ⚠️ Esta é a seção mais importante do relatório. Seja CRÍTICO e DIRETO. Liste TODO e QUALQUER ponto negativo identificado, por menor que pareça.

### 🔴 Pontos Críticos (ação imediata necessária)

Liste problemas que exigem correção urgente. Exemplos:

- **Estoque insuficiente**: risco de ruptura em X dias. Impacto direto: perda de vendas e perda de posicionamento no ranking
- **Margem negativa ou zerada**: custos maiores que o recebimento líquido — o anúncio dá PREJUÍZO
- **Conversão muito abaixo da média da categoria** (< 5%): anúncio não está performando, investimento em tráfego está sendo desperdiçado
- **Preço fora da faixa recomendada pelo AvantPro**: se acima, perde vendas; se muito abaixo, perde margem desnecessariamente
- **Frete caro ou inadequado**: frete acima de 15% do valor do produto reduz drasticamente a conversão
- **Reputação do vendedor comprometida**: avaliações negativas recentes, reclamações não respondidas, baixa qualidade de atendimento
- **Anúncio sem Full sendo que a concorrência usa**: desvantagem competitiva grave, especialmente se a categoria tem frete grátis como padrão
- **Sem avaliações suficientes**: menos de 10 avaliações em um anúncio com volume de vendas — compradores não confiam

### 🟡 Pontos de Atenção (corrigir no curto prazo)

Liste problemas que prejudicam o desempenho mas não são emergenciais. Exemplos:

- **Título mal otimizado**: sem palavras-chave relevantes, difícil de encontrar nas buscas
- **Fotos insuficientes ou de baixa qualidade**: menos de 5 fotos, baixa resolução, sem fotos de uso real
- **Descrição incompleta ou mal formatada**: sem bullet points, sem especificações técnicas, sem FAQ
- **Sem vídeo do produto**: vídeos aumentam significativamente a conversão
- **Ausência de variações (cor/tamanho/modelo)**: perde vendas para concorrentes que oferecem opções
- **Tempo de preparo/envio elevado**: prazo de entrega maior que a média da categoria
- **Sem garantia estendida ou política de troca clara**: gera insegurança no comprador
- **Preço psicológico mal aplicado**: ex: R$ 50,00 em vez de R$ 49,90 (gatilho mental de desconto)
- **Anúncio sem Product Ads**: sem investimento em tráfego pago, dependendo 100% do orgânico
- **Baixo volume de visitas** em relação ao ritmo de vendas da categoria

### ⚠️ Riscos Futuros

Antecipe problemas que podem surgir:

- **Dependência de um único produto/anúncio**: se este anúncio cair, toda a receita some
- **Sazonalidade**: se o produto é sazonal, planeje a baixa nos meses fracos
- **Aumento de concorrência**: se a categoria está atraindo novos vendedores, a margem tende a cair
- **Mudanças nas taxas do Mercado Livre**: impacto de possíveis reajustes de comissão
- **Risco de cópia do produto**: se é fácil de copiar, prepare diferenciação (marca, embalagem, kit)
- **Dependência de fornecedor único**: risco de desabastecimento ou aumento de custo

---

## 💡 Oportunidades de Melhoria

### 🎯 Ações Imediatas (0–7 dias)

Ações de alto impacto e baixo esforço:

1. **Precificação**: ajustar preço para a faixa recomendada pelo AvantPro (se aplicável)
2. **Frete**: ativar Frete Grátis ou Full (se disponível e viável financeiramente)
3. **Título**: reescrever com palavras-chave de alto volume de busca
4. **Preço psicológico**: ajustar para R$ X,99 ou R$ X,90
5. **Estoque**: repor urgentemente se abaixo de 1 mês de cobertura

### 📈 Ações de Curto Prazo (7–30 dias)

Ações que exigem planejamento ou investimento:

1. **Fotos profissionais**: contratar fotógrafo ou melhorar iluminação e enquadramento
2. **Vídeo do produto**: gravar unboxing, uso real, demonstração de funcionalidades
3. **Descrição rica**: adicionar tabela de especificações, FAQ, garantia, política de troca
4. **Variações**: cadastrar cores, tamanhos ou modelos adicionais
5. **Product Ads**: iniciar campanha patrocinada com orçamento controlado para teste
6. **Full**: enviar estoque para armazém do Mercado Livre

### 🚀 Ações de Médio Prazo (30–90 dias)

Ações estratégicas para crescimento:

1. **Marca própria**: criar identidade visual, embalagem personalizada, logotipo
2. **Kit/Combo**: criar variações com acessórios complementares para aumentar ticket médio
3. **Cross-sell**: configurar ofertas relacionadas (quem comprou X também comprou Y)
4. **Remarketing**: capturar dados de visitantes para ações de reengajamento
5. **Expansão de canal**: listar o produto em outros marketplaces (Shopee, Amazon, etc.)

---

## 📈 Score Final do Anúncio

Atribua notas de 0 a 10 para cada critério de saúde do anúncio:

| Critério | Nota | Justificativa |
|----------|------|---------------|
| Precificação | /10 | (está na faixa recomendada? margem saudável?) |
| Conversão | /10 | (taxa de conversão vs. média da categoria) |
| Qualidade do anúncio | /10 | (fotos, título, descrição, vídeo, variações) |
| Logística | /10 | (frete, prazo, Full, estoque) |
| Reputação | /10 | (avaliações, atendimento, garantia) |
| Potencial de escala | /10 | (dá para crescer ou está no teto?) |

**Score Final:** X/10 (média aritmética — DEVE ser igual ao valor informado no "Resumo para Esteira")

### Interpretação

| Nota | Diagnóstico | Ação Recomendada |
|------|-------------|------------------|
| 0–3 | 🔴 **Crítico** | Reestruturar completamente o anúncio ou considerar descontinuar |
| 4–5 | 🟡 **Frágil** | Corrigir pontos críticos com urgência antes de investir em tráfego |
| 6–7 | 🟡 **Regular** | Anúncio funcional, mas com vários pontos de melhoria — priorize os gargalos |
| 8–9 | 🟢 **Saudável** | Anúncio bem otimizado — manter e buscar escala |
| 10 | 🟢 **Excelente** | Anúncio modelo — referência na categoria |

---

## ✅ Conclusão e Recomendações

Resuma o diagnóstico em tópicos acionáveis:

### 🎯 Top 3 Prioridades

1. **Ação mais urgente:** (o que fazer primeiro e por quê)
2. **Maior oportunidade de ganho:** (o que trará mais resultado com menor esforço)
3. **Maior risco a mitigar:** (o que pode dar errado e como evitar)

### 📋 Checklist de Correções

- [ ] Ajustar preço (se fora da faixa recomendada)
- [ ] Melhorar fotos (quantidade e qualidade)
- [ ] Reescrever título com SEO
- [ ] Enriquecer descrição
- [ ] Adicionar vídeo
- [ ] Ativar Frete Grátis / Full
- [ ] Repor estoque (se crítico)
- [ ] Responder perguntas pendentes
- [ ] Iniciar Product Ads
- [ ] Criar kit/combo

### 🗓️ Plano de 30 Dias

| Semana | Foco | Ações |
|--------|------|-------|
| Semana 1 | Correções críticas | (listar ações) |
| Semana 2 | Otimização do anúncio | (listar ações) |
| Semana 3 | Tráfego e conversão | (listar ações) |
| Semana 4 | Análise e ajuste | (listar ações) |

### 🧠 Veredito Final

> Decisão: **[MANTER E OTIMIZAR / CORRIGIR COM URGÊNCIA / REPENSAR ESTRATÉGIA / DESCONTINUAR]**

(justificativa em 2-3 frases com base nos dados analisados)

---

# 📐 Regras de Formatação e Sintaxe Mermaid

> ⚠️ Reforçando as regras de sintaxe Mermaid. Gráficos são bem-vindos, mas a sintaxe deve ser EXATA.

## Aspas nos Gráficos

> 🚨 **ASPAS RETAS OBRIGATÓRIAS**: Use SEMPRE aspas retas \`\"\` (U+0022) nos títulos e labels dos gráficos Mermaid. NUNCA use aspas curvas \`\"\"\` (smart quotes) — elas quebram o parser do Mermaid v11 e causam erro de renderização. Exemplo correto: \`title \"Vendas Mensais\"\`, NUNCA \`title \"Vendas Mensais\"\`.

## Gráficos de Pizza (pie)

> 🚨 **SINTAXE CORRETA — Mermaid v11**: Use APENAS \`pie\` na primeira linha. NUNCA use \`pie showData\` (inválido no Mermaid v11).

\`\`\`mermaid
pie
    title "Distribuição"
    "Categoria A" : 45
    "Categoria B" : 30
    "Categoria C" : 25
\`\`\`

## Gráficos de Barras (xychart)

> 🚨 **X-AXIS SEM CARACTERES ESPECIAIS**: No \`x-axis\` do \`xychart\`, NUNCA use \`/\` (barra) ou \`-\` (hífen) nos labels. Use apenas texto simples. Exemplo CORRETO: \`x-axis [Jan, Fev, Mar, Abr]\`. Exemplo ERRADO: \`x-axis [Jan/26, Fev/26]\` — barras quebram o parser!
> 🚨 **LABELS COM ACENTO**: labels com acento ou espaços DEVEM estar entre aspas duplas (ex: \`x-axis ["Janeiro", "Março"]\`). Sem aspas, acentos quebram o parser do Mermaid (erro "Unrecognized text").

\`\`\`mermaid
xychart
    title "Vendas Mensais"
    x-axis [Jan, Fev, Mar, Abr, Mai, Jun]
    y-axis "Unidades" 0 --> 5000
    bar [1200, 980, 1100, 850, 1400, 2100]
\`\`\`

## Regras Gerais

- **NÃO use smart quotes** (aspas curvas) em nenhum lugar dos blocos Mermaid
- **NÃO use barras (/)** nem **hifens (-)** como parte de labels nos eixos
- **Mantenha percentuais como números inteiros** que somem exatamente 100% em pie charts
- **Prefira tabelas Markdown** a gráficos Mermaid — tabelas são mais confiáveis e nunca quebram`,
  },
]
