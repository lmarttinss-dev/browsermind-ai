## Plano: Cotações de Fornecedores + Status de Negociação

**TL;DR**: Adicionar ao tipo `Supplier` existente a capacidade de registrar cotações/respostas (preço, MOQ, frete, prazo, pagamento — colados manualmente) e um indicador visual do status da negociação. Exibição com badges coloridos e histórico de cotações no card do fornecedor.

---

### Fase 1: Model & Database

1. Criar tipo `NegotiationStatus` em `server/src/models/product.ts`:
   - `"aguardando_resposta"` | `"cotacao_recebida"` | `"negociando"` | `"acordo_fechado"` | `"rejeitado"` | `"sem_resposta"`
2. Criar tipo `SupplierQuote` com: `unitPrice`, `moq`, `shippingCost`, `deliveryTime`, `paymentTerms`, `notes` (textarea livre), `quotedAt`
3. Estender tipo `Supplier` com: `negotiationStatus`, `quotes[]`, `negotiationStartedAt?`, `lastContactAt?`

### Fase 2: API (3 novos endpoints)

4. `PATCH /api/pipeline/:id/suppliers/:index/status` — mudar status
5. `POST /api/pipeline/:id/suppliers/:index/quotes` — registrar cotação (auto-muda status para `cotacao_recebida` se estava `aguardando_resposta`)
6. `DELETE /api/pipeline/:id/suppliers/:index/quotes/:quoteIndex` — remover cotação

### Fase 3: Webapp Client

7. Adicionar tipos e funções em `webapp/src/lib/api.ts`

### Fase 4: UI — Badge de Status

8. Adicionar badge colorido por fornecedor no `SuppliersSection.tsx`:
   - 🕐 Aguardando resposta (cinza)
   - 📩 Cotação recebida (azul)
   - 💬 Negociando (amarelo)
   - ✅ Acordo fechado (verde)
   - ❌ Rejeitado (vermelho)
   - ⚠️ Sem resposta (cinza escuro)
9. Dropdown para mudar status diretamente no card

### Fase 5: UI — Registro de Cotações

10. Modal/formulário para adicionar cotação (campos: preço, MOQ, frete, prazo, pagamento, notas/texto colado)
11. Exibição do histórico de cotações no card expandido (lista cronológica, destaque na mais recente)

---

### Verificação

1. Fluxo completo: fornecedor → mudar status → registrar cotação → ver histórico
2. Badge correto por status
3. Auto-mudança `aguardando → cotacao_recebida` ao registrar
4. `cd server && npx vitest run` sem regressões

### Ideias Extras

1. **Mini-indicador no Kanban**: mostrar "2/3 cotados" no `ProductCard` da pipeline para visão rápida de progresso
2. **Filtro por status**: quando houver vários fornecedores, filtrar por "só os que responderam"
3. **Deadline de resposta**: campo opcional de data-limite com destaque visual quando vencido (futuro)
