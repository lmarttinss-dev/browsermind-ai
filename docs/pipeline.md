# Esteira de Produtos (Pipeline)

Sistema de triagem e acompanhamento de produtos no estilo Kanban (Trello/Monday) com persistência em MongoDB.

## Visão Geral

Quando a IA analisa um produto e identifica dados de viabilidade (score, vendas, concorrência, margem), o produto é **automaticamente inserido** na esteira de triagem. A partir daí, o usuário pode movê-lo entre as colunas conforme avança no processo de avaliação e importação.

## Colunas

| Coluna | Descrição |
|--------|-----------|
| **Triagem** | Produto recém-analisado, aguardando avaliação inicial |
| **Em Análise** | Produto sendo investigado mais a fundo (fornecedores, margem real) |
| **Aprovado** | Produto validado como viável para importação/venda |
| **Importando** | Pedido em andamento com fornecedor |
| **Concluído** | Produto já em estoque ou processo finalizado |

## Fluxo de Inserção Automática

```
Usuário faz análise de viabilidade (prompt + IA)
        ↓
IA retorna relatório com dados estruturados
        ↓
Server detecta dados de viabilidade na resposta:
  - Score, demanda, concorrência, margem, vendas mensais
        ↓
Extrai automaticamente:
  - Título, preço, URL, imagem (og:image)
  - Score, vendas mensais, nível de concorrência
  - Margem potencial, categoria
  - Relatório completo (markdown)
        ↓
Produto inserido na coluna "Triagem" com order auto-incrementado
```

## Card do Produto

Cada card no Kanban exibe:

- **Foto** do produto (extraída via `og:image` da página)
- **Título** do anúncio (até 200 caracteres)
- **Preço** em R$
- **Score** de demanda (0-10) com ícone estrela
- **Vendas mensais** estimadas com ícone de tendência
- **Nível de concorrência** — badge colorido:
  - 🟢 Baixa — verde
  - 🟡 Média — amarelo
  - 🟠 Alta — laranja
  - 🔴 Saturado — vermelho
- **Categoria** do Mercado Livre
- **Link externo** para o anúncio original

## Interações

| Ação | Descrição |
|------|-----------|
| **Drag-and-drop** | Arraste cards entre colunas para atualizar o status |
| **Clique no card** | Abre modal com o relatório completo da análise (markdown renderizado) |
| **Excluir** | Remove produto da esteira (botão no modal de detalhes) |
| **Link externo** | Abre o anúncio no Mercado Livre em nova aba |
| **Atualizar** | Botão para recarregar dados do servidor |

## API Endpoints

| Método | Rota | Descrição |
|--------|------|-----------|
| `GET` | `/api/pipeline` | Lista todos os produtos agrupados por stage |
| `POST` | `/api/pipeline` | Cria produto na esteira (stage: triagem) |
| `PATCH` | `/api/pipeline/:id` | Atualiza campos do produto |
| `PATCH` | `/api/pipeline/:id/move` | Move produto para outra coluna (stage + order) |
| `DELETE` | `/api/pipeline/:id` | Remove produto da esteira |

### Exemplo: Criar produto

```bash
curl -X POST http://localhost:3210/api/pipeline \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Película Galaxy S24 Ultra",
    "url": "https://www.mercadolivre.com.br/pelicula-s24/p/MLB123",
    "price": 29.90,
    "score": 8,
    "monthlySales": 1200,
    "competitionLevel": "Baixa",
    "category": "Celulares > Películas"
  }'
```

### Exemplo: Mover produto

```bash
curl -X PATCH http://localhost:3210/api/pipeline/PRODUCT_ID/move \
  -H "Content-Type: application/json" \
  -d '{ "stage": "analise", "order": 0 }'
```

## Schema do Produto (MongoDB)

```typescript
{
  title: string              // Título do produto (obrigatório)
  url: string                // URL do anúncio no ML (obrigatório)
  imageUrl: string           // URL da imagem (og:image)
  price: number              // Preço em R$
  category: string           // Categoria do ML
  stage: PipelineStage       // "triagem" | "analise" | "aprovado" | "importando" | "concluido"
  score: number              // Score de demanda (0-10)
  monthlySales: number       // Vendas mensais estimadas
  competitionLevel: string   // "Baixa" | "Média" | "Alta" | "Saturado"
  potentialMargin: string    // Margem potencial (texto livre)
  analysisReport: string     // Relatório completo em markdown
  analyzedAt: Date           // Data da análise
  order: number              // Posição na coluna (para ordenação)
  createdAt: Date            // Auto-gerado
  updatedAt: Date            // Auto-gerado
}
```

## Pré-requisitos

### MongoDB

O MongoDB deve estar rodando na porta 27017. Para iniciar com Docker:

```bash
docker compose up -d
```

O container `browsermind-mongo` será criado com volume persistente `mongo_data`.

### Variáveis de Ambiente

| Variável | Padrão | Descrição |
|----------|--------|-----------|
| `MONGODB_URI` | `mongodb://localhost:27017/browsermind` | URI de conexão com o MongoDB |

## Arquitetura

```
webapp/src/
├── pages/PipelinePage.tsx                    # Página principal da esteira
├── components/pipeline/
│   ├── KanbanBoard.tsx                       # DndContext + layout das colunas
│   ├── KanbanColumn.tsx                      # Coluna droppable com header e cards
│   ├── ProductCard.tsx                       # Card draggable com dados resumidos
│   └── ProductDetailModal.tsx                # Modal com relatório markdown
├── store/usePipelineStore.ts                 # Zustand store (fetch, move, delete)
└── lib/api.ts                                # Funções de API da pipeline

server/src/
├── db.ts                                     # Conexão MongoDB (mongoose)
├── models/product.ts                         # Schema e model do produto
└── routes/pipeline.ts                        # Handlers CRUD das rotas
```

## Testes

```bash
# Todos os testes do server (unit + integration + E2E)
cd server && npm test

# Testes do webapp (store)
cd webapp && npm test
```

Os testes usam `mongodb-memory-server` e `supertest` — não dependem de MongoDB real rodando.

### Cobertura de testes

| Tipo | Arquivo | Testes |
|------|---------|--------|
| Unit | `server/src/__tests__/pipeline.test.ts` | Regexes de parsing, constantes, extração de dados |
| Integration | `server/src/__tests__/pipeline-integration.test.ts` | CRUD do model, queries, movimentação |
| E2E | `server/src/__tests__/pipeline-e2e.test.ts` | Rotas HTTP completas com supertest |
| Unit | `webapp/src/store/__tests__/usePipelineStore.test.ts` | Store actions, loading, errors |

## Como Acessar

1. Na barra de navegação superior, clique no botão **"Esteira"**
2. Ou acesse diretamente: `http://localhost:5180/pipeline`
3. Para voltar à view principal do browser, clique em **"Browser"**
