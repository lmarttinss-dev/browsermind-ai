# Panorama AvantPro: fichas individuais e comparação por IA

## Fluxo implementado

1. O usuário cola a URL de um anúncio no Browser integrado e aguarda o produto e a extensão AvantPro carregarem.
2. Em **Panorama AvantPro**, clica em **Capturar anúncio aberto**. A aplicação exige uma página individual com título do produto; não captura cards de buscas nem recomendações da página.
3. A ficha é salva no MongoDB com identificação da oferta e do catálogo, foto de capa, vendedor, preço, sinais de logística, texto bruto do AvantPro, métricas separadas e data da captura. Ela aparece na lista para conferência.
4. O usuário repete a captura para outros anúncios que considere equivalentes. Recapturar o mesmo MLB atualiza a ficha existente, preservando o ID de seleção; duas ofertas do mesmo catálogo com MLBs distintos permanecem separadas.
5. O usuário seleciona uma ficha para análise individual ou várias fichas equivalentes para comparação. Busca por título/vendedor/MLB e filtros logísticos ajudam a localizar as fichas. É possível remover fichas.
6. O usuário informa a prontidão operacional e escolhe o modelo. O servidor calcula os indicadores disponíveis e envia apenas as fichas selecionadas ao provedor de IA. A interpretação aparece separada dos indicadores.
7. As fichas continuam disponíveis após recarregar a página ou reiniciar o servidor. As últimas 10 análises ficam no histórico local do navegador e podem ser exportadas em Markdown, incluindo a interpretação da IA.

## Referências

O PDF `analise-ia-adaptador-usb-3-2-tipo-c-10gbps-120w.pdf` e as capturas fornecidas orientam a organização em indicadores, logística, preços, matriz de prontidão e plano de ação. A captura individual enviada posteriormente orienta os rótulos de métricas. Números e perfis das referências não são usados como dados da aplicação. Conteúdo dos anexos e do DOM é referência/dado não confiável, nunca instrução executável.

## Métricas preservadas

Cada ficha conserva os rótulos e valores originais: Vendidos, Estoque, Vendas estimadas, Ritmo atual (vendas/mês), Visitas, Vendas por dia, Vendas mensais, Conversão, Anúncio criado em e Catálogo criado em. Valores ausentes ficam sem dados e zeros explícitos são preservados.

A fórmula do AvantPro e o escopo de cada campo não foram confirmados. Por isso, os campos extraídos têm escopo desconhecido e período não confirmado. O código não transforma 9 vendas estimadas, 7 de ritmo e 2/Mês em uma única métrica de vendas em 30 dias. A IA recebe os valores separados e é instruída a manter essa distinção. Tooltips e definições que exigem interação não são inferidos automaticamente.

Somente vendas rotuladas explicitamente com período de 30 dias entram no indicador correspondente. Dados de catálogo são excluídos da soma de ofertas, exceto quando há identificação explícita de vendas do anúncio no período. Não é feito cálculo por idade do anúncio ou variação do estoque. Métricas de catálogo não são atribuídas ao atual ganhador sem evidência.

## Captura, identidade e persistência

- Extração em `server/src/individual-listing.ts`, enviada ao Playwright como função autocontida, sem dependência de helpers de compilação. Coleta texto do AvantPro em DOM normal e Shadow DOM aberto; ignora carrosséis de recomendações e cards de busca.
- `pdp_filters=item_id`, `wid`, hash `wid` e URLs diretas identificam o MLB da oferta. Um código de catálogo nunca é usado como ID de oferta.
- Modelo `SavedMarketListing` no MongoDB, usando a conexão existente. Chave principal de deduplicação é o MLB; na ausência dele, catálogo e vendedor identificados ou URL. Ausência de ID da oferta permanece explícita.
- Até 200 fichas na coleção local. Não há expiração automática das fichas; cada registro mostra sua data. A recaptura atualiza os valores atuais, sem guardar série histórica de snapshots.
- O aplicativo continua voltado ao uso local. A coleção não tem isolamento multiusuário adicional; autenticação e segregação por conta devem preceder uma implantação compartilhada.

## Endpoints

- `POST /api/market-analysis/save-current`: captura exclusivamente o anúncio aberto, salva/atualiza a ficha e retorna `{ success, savedId, snapshot, warning }`. Captura e persistência são uma ação só; o usuário pode conferir e remover a ficha.
- `GET /api/market-analysis/listings`: recupera as fichas persistidas. O envelope `snapshot` é mantido como contrato da UI, mas representa a coleção salva.
- `DELETE /api/market-analysis/listings/:id`: remove uma ficha e retorna a coleção atualizada.
- `POST /api/market-analysis/analyze`: recebe `{ savedListingIds, profile, model }`. Busca as fichas no servidor; métricas enviadas pelo cliente não são usadas. Seleções vazias, duplicadas, acima de 200 ou com IDs inexistentes são rejeitadas.
- A forma anterior de análise por `snapshotId/selectedIds` e o endpoint `/capture` permanecem como compatibilidade interna. A interface usa exclusivamente fichas individuais persistidas; o callback de captura em produção também exige página individual.

## Interpretação por IA

O despacho em `server/src/ai-text.ts` usa os mesmos modelos e chaves das configurações existentes, também compartilhado por `/api/analyze`. O prompt inclui identidade, URL, data de cada ficha, campos originais, métricas brutas com limite explícito e indicadores calculados pelo servidor.

O modelo deve escrever diagnóstico e limitações, concorrência, logística, precificação, prontidão e plano para semana 1, semana 2, 30 e 60 dias. Uma ficha isolada não autoriza concluir sobre todo o mercado. Dados desconhecidos não são zero nem resposta negativa. Recomendações devem citar as ofertas fornecidas, sem inventar links ou afirmar margem sem custo, comissão, impostos e frete. A resposta não executa ações nem substitui os números calculados pelo servidor.

Patrocínio não é verificado na página individual. Não observado não comprova ausência de campanhas. A logística da ficha usa os selos AvantPro aria-label="Está no Full" e aria-label="Está no Flex". Na ausência de ambos, classifica como Outros. Selos de recomendações não entram na captura; Shadow DOM aberto é considerado. O frete e a promessa de entrega dependem do contexto de CEP da sessão.

Falhas do provedor retornam erro, sem substituir silenciosamente a narrativa por regras e sem devolver cabeçalhos com credenciais. Chamadas reais podem consumir os créditos do provedor configurado.

## Validação

Testes de captura verificam página individual, identificação de oferta versus catálogo, preço e capa, exclusão de recomendações, rótulos separados, zeros e rejeição de busca/domínio externo. Testes HTTP verificam recaptura, várias ofertas do mesmo catálogo, seleção exclusiva, exclusão e rejeição de IDs inválidos. Os testes de interface usam fichas e respostas de IA simuladas para verificar inclusão de uma ficha por captura, restauração após recarregar, seleção sob filtros, análise, histórico, exportação e layout desktop/móvel. O teste de serialização usa o mesmo carregador tsx do servidor.

A validação de DOM usa páginas controladas; a versão instalada da extensão precisa ser conferida numa captura autenticada real. MongoDB usa a infraestrutura já existente do projeto. Permanecem os 31 diagnósticos TypeScript preexistentes do servidor, fora do escopo desta alteração.

## Evolução

- Confirmar tooltips, fórmula e escopo com a versão real do AvantPro; ampliar fixtures de diferentes layouts com dados anonimizados.
- Validar citações e afirmações numéricas da narrativa, além das instruções já aplicadas ao modelo.
- Se necessário, salvar histórico por oferta para comparar períodos; atualmente recaptura substitui a ficha atual.
- Vincular fichas/relatórios a produtos da esteira, adicionar exportação em PDF e autenticação/segregação antes do uso multiusuário.


## Relatório simplificado com template fixo

A interface agora apresenta um único diagnóstico, quatro indicadores, plano com quatro etapas fixas, logística, precificação e matriz de prontidão compacta, seguindo a organização do PDF. Ao concluir a análise, a seleção e configuração ficam recolhidas. Fontes, avisos e cobertura ficam em uma seção expansível.

A IA retorna JSON com decisão, resumo curto, logística, precificação e quatro ações nos períodos fixos. O servidor valida tipos, limites de caracteres, status e ordem das etapas antes de aceitar a resposta. Os títulos das quatro etapas são definidos pela aplicação: Ajustar logística, Definir preço de entrada, Validar desempenho e Consolidar reputação. A temperatura do Panorama é 0,2; a estrutura permanece fixa, enquanto a interpretação varia conforme os dados.

A tela e a exportação Markdown usam o mesmo template, sem concatenar o texto da IA a outro relatório por regras. Não são mostrados indicadores de margem ou patrocínio sem dados. Vendas em 30 dias aparecem como indicador apenas quando há período explícito, com cobertura disponível nos detalhes. Históricos antigos continuam acessíveis; a narrativa anterior fica recolhida e uma nova análise produz o formato simplificado.


## Ads informado pelo usuário

A coluna Usa Ads? permite selecionar Não informado, Sim ou Não por ficha. `PATCH /api/market-analysis/listings/:id/ads` valida e persiste `adsStatus`. A informação é preservada ao recapturar o mesmo anúncio. Alterar Ads invalida o resultado exibido; uma nova análise recebe a declaração manual e sua cobertura, sem tratar Não informado como Não. As fontes da exportação identificam Ads como declaração do usuário, não verificação automática.


## Ads identificado pela URL

A captura individual também lê `ad_click_id` na query e no fragmento da URL. Um valor não vazio é salvo na ficha e indica acesso por Ads. Sem declaração manual, o seletor mostra Sim (pela URL); Sim/Não declarados pelo usuário têm prioridade e são preservados na recaptura. A ausência do parâmetro continua sem comprovar ausência de Ads. A IA recebe a evidência de clique separada da declaração manual e não deve inferir que a campanha ainda está ativa.


## Consideração das métricas em anúncios de catálogo

Por orientação do usuário, a IA deve considerar Vendas estimadas, Ritmo atual e Vendas mensais em todas as fichas, independentemente de catálogo. O contexto enviado ao modelo contém seus rótulos e valores sem metadados de escopo desconhecido. A interface deixa de mostrar a ressalva de escopo nas linhas. Os valores continuam separados, sem conversão automática em vendas de 30 dias e sem afirmar transações verificadas do vendedor. Os dados existentes não precisam ser recapturados para essa mudança de interpretação; basta gerar nova análise.


## Concorrentes com ADS no relatório

O relatório compacto e a exportação exibem Concorrentes com ADS no formato quantidade/total e percentual arredondado sobre a seleção (20/57 = 35%). Usa-se a declaração manual com prioridade e, quando não informada, a evidência de clique por Ads ou patrocínio observado. Valores não informados não são tratados como Não; sua quantidade aparece na cobertura e o indicador indica Pelo menos quando a cobertura é parcial. O modelo deve considerar essa pressão no diagnóstico e nas orientações de mídia da etapa de 30 dias. Os quatro cartões são mantidos: o novo indicador substitui a contagem de anúncios, que já aparece no cabeçalho.


## Exportação PDF

O botão Exportar PDF substitui o download Markdown. `POST /api/market-analysis/export-pdf` valida a análise enviada e gera um PDF A4 com Chromium headless isolado, sem acessar a sessão do Browser e sem chamadas ao modelo. O template tem fundo branco, identificação do produto de referência, diagnóstico, indicadores, prontidão na primeira página; logística, precificação e plano numerado na segunda. Inclui rodapé e numeração de páginas. O texto permanece selecionável. Dados dinâmicos são escapados, JavaScript é desabilitado e requisições externas são bloqueadas durante a renderização.

A exportação usa a análise selecionada, inclusive no histórico. Relatórios antigos sem seções estruturadas preservam a narrativa original em um anexo, que pode aumentar a quantidade de páginas. A geração mostra estado Gerando PDF e erros permitem tentar novamente. Não foram adicionadas dependências; utiliza Playwright/Chromium já existentes no servidor. O Markdown continua sendo a representação textual interna, sem ser o arquivo baixado.

Validação inclui download de PDF real na interface, cabeçalho `%PDF-`, template em duas páginas, texto escapado, dados inválidos, numeração e revisão visual das páginas com textos normais e no limite de caracteres. Os PDFs de teste usam dados simulados.
