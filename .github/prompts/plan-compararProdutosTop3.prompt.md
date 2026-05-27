# Plano: Comparação de Produtos Top 3 na Esteira

**TL;DR**: Adicionar feature de comparação na coluna "Triagem" — a IA analisa todos os produtos acumulados, gera ranking comparativo e sugere os 3 melhores para avançar. Usuário vê modal com tabela comparativa e confirma quais mover para "Em Análise".

---

## Steps

### Fase 1: Server — Endpoint de Comparação

1. **Criar rota `POST /api/pipeline/compare`** em `server/src/routes/pipeline.ts`
   - Recebe `{ model: string }` no body
   - Busca todos os produtos com `stage: "triagem"` do MongoDB
   - Valida que existem ≥3 produtos (senão retorna erro 400)
   - Monta prompt com dados de cada produto (título, preço, score, vendas, concorrência, margem, categoria)
   - Chama a IA via lógica existente de proxy
   - Retorna `{ success, comparison: { ranking: [{ productId, position, reason }], report } }`

2. **Criar prompt template "comparacao-produtos"** em `webapp/src/lib/prompt-templates.ts` e `src/constants/prompt-templates.ts`
   - Instruções para IA comparar N produtos e retornar JSON com ranking + relatório markdown
   - Critérios sugeridos: score, vendas, concorrência baixa, margem, categoria promissora

3. **Registrar rota** — verificar que já está montada em `server/src/index.ts`

### Fase 2: Webapp — Store e API Client (paralelo)

4. **Adicionar `comparePipelineProducts(model)`** em `webapp/src/lib/api.ts` + tipo `ComparisonResult`

5. **Adicionar estado de comparação** no `webapp/src/store/usePipelineStore.ts`
   - `comparison`, `isComparing`, ações `compareProducts()`, `clearComparison()`, `confirmTopProducts(ids[])`

### Fase 3: Webapp — Interface

6. **Botão "Comparar"** no header da coluna Triagem em `webapp/src/components/pipeline/KanbanColumn.tsx`
   - Aparece somente quando há ≥3 produtos na triagem
   - Ícone de balança/chart (lucide)

7. **Criar `ComparisonModal.tsx`** (novo) em `webapp/src/components/pipeline/`
   - Selector de modelo AI + botão "Analisar"
   - Tabela comparativa (colunas = produtos, linhas = métricas)
   - Ranking top 3 com 🥇🥈🥉 + motivo
   - Relatório markdown completo da IA
   - Checkboxes pré-selecionados + botão "Mover para Análise"

8. **Integrar modal** na `webapp/src/pages/PipelinePage.tsx`

### Fase 4: Proxy

9. **Verificar proxy** em `webapp/vite.config.ts` — `/api/pipeline/compare` provavelmente já coberto pelo proxy existente de `/api/pipeline`

---

## Relevant Files

| Arquivo | O que fazer |
|---------|-------------|
| `server/src/routes/pipeline.ts` | Nova rota `POST /compare` |
| `server/src/index.ts` | Referência para `callAI()` / proxy AI |
| `webapp/src/lib/api.ts` | Nova função + tipo `ComparisonResult` |
| `webapp/src/lib/prompt-templates.ts` | Novo template |
| `webapp/src/store/usePipelineStore.ts` | Estado + ações de comparação |
| `webapp/src/components/pipeline/KanbanColumn.tsx` | Botão condicional |
| `webapp/src/components/pipeline/ComparisonModal.tsx` | **Novo** — componente principal |
| `webapp/src/pages/PipelinePage.tsx` | Renderizar modal |

---

## Verification

1. Unit test: construção do prompt com N produtos mock
2. Unit test: parsing da resposta da IA (extrair ranking JSON)
3. Integration test: `POST /api/pipeline/compare` com 3+ produtos
4. Manual: 5+ produtos → Comparar → IA retorna ranking coerente
5. Manual: Confirmar top 3 → verificar no Kanban que moveram para "Em Análise"
6. Edge case: <3 produtos → botão oculto + erro 400 se chamado direto

---

## Further Considerations

1. **Parsing da resposta**: A IA pode não retornar JSON perfeito. Recomendo usar delimitadores claros (` ```json ... ``` `) e regex para extrair, com fallback para exibir apenas o relatório se o parsing falhar.
2. **Limite de produtos**: Se houver >15 na triagem, enviar só os 15 mais recentes/melhores para não estourar tokens.
3. **Cache**: Não implementar agora — cada clique refaz a análise. Cachear futuramente se necessário.
