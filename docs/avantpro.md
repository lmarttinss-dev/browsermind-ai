# Integração AvantPro ML

## O que é

O [AvantPro](https://avantprocloud.com.br) é uma extensão do Chrome que injeta métricas de vendas, estoque, visitas, conversão e faturamento em páginas de produtos do Mercado Livre.

O BrowserMind AI carrega a extensão AvantPro dentro do browser Playwright, abre o formulário oficial de autenticação da extensão e extrai os dados injetados no DOM para análise com IA.

## Como funciona

### Fluxo de autenticação

A versão 7.38.6 usa OAuth com PKCE e formulário oficial (Google ou código por e-mail).
O antigo endpoint de login por e-mail com injeção de token não é mais usado.

1. Inicie o browser com a extensão carregada.
2. Em Configurações → AvantPro ML, clique em **Abrir login**.
3. O servidor abre o `login-panel.html` da extensão em uma aba e aciona
   `AUTH_HYDRA_RETRY` para iniciar o fluxo oficial. Isso evita depender da abertura
   do painel lateral pelo botão ENTRAR da extensão.
4. Conclua a autenticação no formulário oficial.
5. Clique em **Verificar login**. O servidor consulta `AUTH_STATUS` da extensão,
   sem considerar metadados ou um token antigo como prova de sessão válida.

A extensão gerencia os tokens e a renovação da sessão. O BrowserMind não sobrescreve
`avantpro_auth` e não solicita senha nem código de verificação.

### Fluxo de extração de dados

```
1. Browser navega para página de produto do ML
2. Extensão AvantPro injeta elementos DOM com classe "avantpro-*"
3. Usuário clica em "Informações Avantpro" no overlay da extensão
4. Server extrai todo o texto visível da página (incluindo dados da extensão)
5. Conteúdo é enviado para modelo de IA para análise
```

## Configuração

### Extensão

A extensão AvantPro já vem pré-configurada no webapp. O caminho padrão é:

```
/mnt/c/Users/Leandro Martins/AppData/Local/Google/Chrome/User Data/Default/Extensions/jdefnfmbnchmnjkcknaadaddgjbgephh/7.38.6_0
```

Para alterar, edite o `extensionPaths` em `webapp/src/store/useStore.ts` ou configure via Settings na webapp.

### Requisitos

- Extensão AvantPro instalada no Chrome do Windows
- WSLg ou display X11 configurado (extensões requerem modo headed)
- Email cadastrado no AvantPro com conta ativa

### Perfil do browser

O perfil é salvo em `~/.browsermind-profile` e contém:

- Armazenamento da extensão — sessão e metadados AvantPro
- Cookies e dados de sessão
- Configurações da extensão

Isso permite que a autenticação persista entre reinicializações do browser.

## Dados extraídos

Quando autenticado e em uma página de produto do ML, o AvantPro mostra:

| Métrica | Exemplo |
|---------|---------|
| Vendidos | 10.000 |
| Estoque | 50 |
| Visitas | 317.225 |
| Vendas por dia | 45 |
| Vendas mensais | 1.363/Mês |
| Conversão | 3,15% |
| Imposto | R$ 3,48 (7,00%) |
| Recebe (líquido) | R$ 33,28 (66,93%) |
| Comissão ML | R$ 12,96 (26,07%) |
| Faturamento | R$ 497.200,00 |
| Vendedor | Nome do vendedor |
| Vendas do vendedor | 257.299 |
| Localização | Cidade |
| Data de criação | dd/mm/aaaa |

## Troubleshooting

### Extensão mostra "Grátis" em vez do plano correto

O token foi injetado sem os campos `plan` e `productCode`. Use Configurações → AvantPro ML → Abrir login para autenticar pelo formulário oficial.

### "Vincular Conta" aparece mas dados não carregam

Isso é normal na homepage do ML. Navegue para uma **página de produto específico** para ver os dados.

### Extensão não aparece na página

Verifique:
1. O browser foi iniciado com `extensionPaths` correto
2. A variável `DISPLAY` está definida (WSLg)
3. O caminho da extensão existe e tem o `manifest.json`

### Token expirado

Tokens do AvantPro podem expirar. Use Configurações → AvantPro ML → Abrir login e depois Verificar login.

## Configuração do servidor

Constantes em `server/src/index.ts`:

```typescript
const AVANTPRO_CONFIG = {
  extensionId: "jdefnfmbnchmnjkcknaadaddgjbgephh",
};
```

## Fichas individuais e comparação por IA

Em `/market-analysis`, capture o anúncio individual aberto no Browser. Repita para outros concorrentes equivalentes e selecione as fichas salvas no MongoDB para análise pelo modelo escolhido. Vendas estimadas, Ritmo atual e Vendas mensais permanecem separados, com escopo/período desconhecidos quando não confirmados. A interpretação exige a chave do provedor nas configurações. Veja o [plano atualizado](./plano-panorama-avantpro.md).

### Frete no relatório de oferta, demanda e concorrência

Antes de enviar os dados ao modelo, o Playwright lê exclusivamente a linha **Frete**
(.avantpro-product-info-row) de cada anúncio no AvantPro, inclusive em Shadow DOM.
O custo fica associado à oferta e ao vendedor; ofertas repetidas são deduplicadas por ID.
O campo representa o custo de envio do vendedor informado pelo AvantPro, não o preço
cobrado do comprador. Selos e valores de frete do Mercado Livre não completam esse dado.

A seção de frete do prompt analise-oferta-demanda-concorrencia recebe os valores
por oferta, cobertura, mínimo, máximo, média e moda. Valores ausentes ou carregando
ficam como **Não informado**, sem serem tratados como zero. R$ 0,00 explícito participa
das estatísticas. O relatório usa custo zero, custo positivo e não informado na distribuição.

### Botão Abrir login não abre o formulário

Se a extensão retornar "Ação não suportada: AUTH_HYDRA_RETRY", o processo carregado
pode estar desatualizado em relação aos arquivos instalados. Feche e inicie o Browser
no webapp, preservando o mesmo perfil persistente, e tente **Abrir login** novamente.
A abertura do painel não depende de um service worker já ativo; o painel pode despertá-lo.

## Análise completa em HTML e PDF

O template **Análise de Oferta, Demanda e Concorrência** usa um contrato JSON validado
com 17 seções fixas. O prompt descreve a análise; o modelo não escreve HTML, Markdown
ou Mermaid. A aplicação calcula indicadores, idades, distribuição de preços e fretes,
e renderiza cards, tabelas e gráficos SVG. Métricas agregadas do cabeçalho AvantPro
são capturadas separadamente das métricas de cada anúncio.

A aba **Mercado** e a prévia da análise exibem o HTML com **Exportar PDF**. O PDF usa
o mesmo documento, com estilos de impressão A4, cabeçalho das tabelas repetido e paginação.
O documento estruturado é salvo junto ao conteúdo de compatibilidade no produto;
respostas incompletas da IA são rejeitadas antes do salvamento. Relatórios anteriores
continuam acessíveis e exportáveis sem reanálise ou alteração do conteúdo salvo.

Rotas: GET /api/pipeline/:id/market-report/html, GET /api/pipeline/:id/market-report/pdf
e POST /api/pipeline/market-report/export-pdf para a prévia ainda não salva.

### Captura obrigatória e logística

A análise completa aguarda todos os cards da listagem pública e os contadores do AvantPro,
carrega os cards fora da área visível e exige campos e conteúdo estáveis antes de chamar o modelo.
Campos ainda carregando ou cards sem dados bloqueiam a geração; ausências explicitamente
informadas pela extensão são preservadas como ausências, sem conversão para zero.
Os campos estruturados, selos e texto completo das fichas AvantPro seguem para o modelo
selecionado no webapp. O documento registra a conclusão e a cobertura da captura.

O Perfil Logístico usa prioritariamente os contadores FULL, Flex, Correios, Coleta,
Places e Outros do AvantPro. Seu denominador é a soma desses contadores, distinta do
número de anúncios deduplicados. Contadores agregados não são atribuídos a vendedores individuais.

### Salvamento da análise vinculada

O produto selecionado segue no pedido de geração. Após validar o relatório completo,
o servidor grava marketDocument e marketReport antes de confirmar savedProductId.
O salvamento não depende mais de um efeito React ao terminar o carregamento. Falhas de
persistência preservam a análise na tela e exibem uma mensagem e opção de salvar novamente.
A captura aciona os botões "Carregar dados Avantpro" dos cards e usa rolagem imediata
para não falhar enquanto a extensão altera o tamanho dos anúncios.

### Formato da resposta e recuperação

A análise estruturada solicita o modo JSON nativo do DeepSeek, sem alterar as demais
análises em texto livre. Uma resposta que não passa no contrato recebe uma tentativa
adicional de correção usando a mesma captura completa. JSON truncado não é concatenado
com outro objeto de continuação. As 17 seções, limites de tamanho e notas continuam
obrigatórios; nenhum campo ausente é inventado para fazer a validação passar.
Se a correção também falhar, o documento salvo permanece intacto.

Para relatórios JSON, o DeepSeek mantém o modelo selecionado, usa reasoning_effort=low
e max_tokens=32768. O orçamento maior permite concluir o objeto sem depender de
continuações de texto; é um teto, não uma meta de consumo. A narrativa tem alvos curtos
por seção porque tabelas e gráficos já são preparados pelo sistema. As demais chamadas
em texto livre preservam a configuração anterior.

### Consumo de tokens

O transporte ao modelo usa colunas únicas por oferta, um dicionário dos rótulos dos
campos e um dicionário das linhas do texto bruto. Todos os anúncios, valores, status,
metadados adicionais e selos são mantidos. O texto bruto pode ser reconstruído sem
perdas pelos índices; não há corte da amostra nem de campos desconhecidos.
Os detalhes de frete que repetiam ID, título e vendedor passam a compartilhar a linha
da oferta. O template HTML continua recebendo as evidências originais.

Cada relatório estruturado faz uma chamada normal e, apenas se a resposta não passar
no contrato, no máximo uma correção. Não há repetição automática de POST após falha
de rede nesse fluxo, pois a primeira requisição pode já ter sido processada e cobrada.
marketUsage informa chamadas, tokens de entrada/saída/cache/raciocínio retornados pelo
provedor e tamanho das evidências antes/depois da compactação. O tamanho em caracteres
não deve ser apresentado como uma medição exata da redução de tokens.

### Catálogo

Os contadores Em Catálogo e Fora Catálogo do AvantPro têm prioridade na seção de
conta e catálogo. A base dos percentuais é a soma desses contadores, e não o número
de ofertas deduplicadas. Na ausência dos contadores, a classificação por oferta usa
os campos dos módulos AvantPro; ausência de sinal permanece Não informado.
Links /up/MLBU representam identidade de produto do vendedor, preservada separadamente
como userProductId, e não confirmam participação em catálogo. catalogId não classifica
sozinho uma oferta. Contadores ausentes ou conflitantes não viram zero nem geram um
gráfico percentual parcial. Relatórios anteriores podem ter a seção reparada com os
contadores armazenados na própria captura, sem enviar nova requisição ao modelo.
