# Copilot Instructions — BrowserMind AI

## Projeto

Webapp de automação de browser com Playwright + análise via IA. Integra extensões Chrome (AvantPro) para métricas do Mercado Livre.

## Stack

- **Server**: Express 4, Playwright, Axios, TypeScript (tsx watch)
- **Webapp**: React 18, Vite 5, TailwindCSS 3, Zustand 5, TypeScript
- **Node**: v22+, ES2022 target, ESNext modules

## Estrutura

```
server/src/index.ts              # Express app, rotas, AI proxy
server/src/playwright-manager.ts # Classe PlaywrightManager (singleton)
webapp/src/App.tsx               # Layout principal
webapp/src/store/useStore.ts     # Estado Zustand
webapp/src/lib/api.ts            # Cliente HTTP (fetch)
webapp/src/components/           # React components (NavigationBar, BrowserViewport, ChatPanel, ActionConsole, SettingsModal)
```

## Convenções de Código

- Linguagem do código: **inglês** (variáveis, funções, tipos)
- Linguagem de comentários e docs: **português**
- Respostas ao usuário: **português**
- Sem ponto-e-vírgula no final de linhas (exceto onde TypeScript exige)
- Aspas duplas em strings
- `type` em vez de `interface` quando possível
- Usar `async/await`, nunca `.then()` em código novo do server
- No webapp, usar `fetch` diretamente (sem axios)
- Estado global via Zustand (`useStore`) — não usar Context API
- CSS via TailwindCSS classes — não usar CSS modules nem styled-components

## Padrões do Server

- Rotas Express com try/catch retornando `{ success, ...data }` ou `{ error }`
- `playwrightManager` é singleton importado de `./playwright-manager.js`
- API keys armazenadas em memória (objeto `apiKeys`)
- Ações do browser tipadas como `BrowserAction` com `type`, `selector`, `value`, `description`
- Para React inputs usar `pressSequentially()` em vez de `page.fill()`
- Para `page.evaluate()` usar string, não function literal (evita problema com `__name` do tsx)

## Padrões do Webapp

- Componentes funcionais com arrow functions
- Props tipadas inline: `({ prop }: { prop: Type }) =>`
- Ícones via `lucide-react`
- Markdown renderizado com `react-markdown` + `remark-gfm`
- Proxy de rotas da API configurado em `webapp/vite.config.ts`

## Ao adicionar nova rota

1. Criar handler em `server/src/index.ts`
2. Adicionar proxy em `webapp/vite.config.ts`
3. Adicionar função no cliente `webapp/src/lib/api.ts`

## Portas

- Server: `3210`
- Webapp: `5180`

## Comandos

```bash
cd server && npm run dev    # Inicia server (tsx watch, porta 3210)
cd webapp && npm run dev    # Inicia webapp (Vite, porta 5180)
```

## Git

- **SEMPRE** criar uma nova branch antes de iniciar qualquer feature, fix ou correção
- Nunca commitar diretamente na `main`
- Padrão de nomes: `feature/descricao`, `fix/descricao`, `chore/descricao`
- Fazer commit e push ao final de cada tarefa
