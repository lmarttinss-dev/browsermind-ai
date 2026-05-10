# Arquitetura do BrowserMind AI

## Visão Geral

O BrowserMind AI é composto por dois serviços independentes que se comunicam via HTTP:

```
┌─────────────────────────────────────────────────────────────┐
│                      USUÁRIO (Browser)                      │
│                    http://localhost:5180                     │
└────────────────────────────┬────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────┐
│                    WEBAPP (Frontend)                         │
│  React 18 + Vite 5 + TailwindCSS 3 + Zustand 5             │
│  Porta: 5180                                                │
│                                                             │
│  ┌──────────┐ ┌──────────────┐ ┌──────────┐ ┌───────────┐  │
│  │Navigation│ │BrowserViewport│ │ChatPanel │ │ActionConsole│ │
│  │   Bar    │ │ (Screenshots) │ │  (IA)    │ │  (Logs)   │  │
│  └──────────┘ └──────────────┘ └──────────┘ └───────────┘  │
│  ┌──────────────────────────────────────────────────────┐   │
│  │              SettingsModal (API Keys + AvantPro)      │   │
│  └──────────────────────────────────────────────────────┘   │
└────────────────────────────┬────────────────────────────────┘
                             │ Vite Proxy
                             ▼
┌─────────────────────────────────────────────────────────────┐
│                    SERVER (Backend)                          │
│  Express 4 + Playwright + Axios + tsx                       │
│  Porta: 3210                                                │
│                                                             │
│  ┌────────────────────┐  ┌──────────────────────────────┐   │
│  │  PlaywrightManager │  │       AI Proxy               │   │
│  │  - launch/close    │  │  - Gemini Flash / Pro        │   │
│  │  - navigate        │  │  - GPT-4.1                   │   │
│  │  - screenshot      │  │  - Claude Sonnet             │   │
│  │  - extractContent  │  │  - DeepSeek                  │   │
│  │  - executeAction   │  └──────────────────────────────┘   │
│  │  - evalInSW        │  ┌──────────────────────────────┐   │
│  └────────────────────┘  │    AvantPro Integration      │   │
│                          │  - /avantpro/auth             │   │
│  ┌────────────────────┐  │  - /avantpro/status           │   │
│  │  Chromium Browser  │  └──────────────────────────────┘   │
│  │  + Extensões       │                                     │
│  └────────────────────┘                                     │
└─────────────────────────────────────────────────────────────┘
```

## Componentes

### Server (`server/`)

| Arquivo | Responsabilidade |
|---------|-----------------|
| `src/index.ts` | Express app, rotas HTTP, proxy de IA, integração AvantPro |
| `src/playwright-manager.ts` | Classe singleton que gerencia o Chromium via Playwright |

#### PlaywrightManager

Classe central do backend. Gerencia uma instância do Chromium com dois modos de operação:

- **Modo padrão** — `chromium.launch()` → headless ou headed, sem extensões
- **Modo persistente** — `chromium.launchPersistentContext()` → headed, com extensões, perfil salvo em disco

Métodos principais:

| Método | Descrição |
|--------|-----------|
| `launch(headless, extensionPaths, userDataDir)` | Inicia o browser |
| `close()` | Fecha o browser e limpa referências |
| `navigate(url)` | Navega para uma URL |
| `takeScreenshot()` | Captura screenshot em base64 |
| `extractPageContent()` | Extrai texto, headings, links e meta tags do DOM |
| `executeAction(action)` | Executa uma ação (click, type, scroll, etc.) |
| `executeActions(actions)` | Executa lista de ações sequencialmente |
| `evaluateInServiceWorker(extId, expr)` | Executa JS no service worker de uma extensão |
| `listPages()` | Lista todas as abas abertas |
| `switchToPage(index)` | Troca para uma aba específica |

#### AI Proxy

O servidor atua como proxy para APIs de IA, mantendo as chaves em memória:

1. Usuário envia prompt via `/api/analyze`
2. Servidor extrai conteúdo da página automaticamente (com 2s de espera para extensões)
3. Roteia para o modelo escolhido (Gemini, OpenAI, Anthropic, DeepSeek)
4. Retorna resposta + ações sugeridas pela IA

### Webapp (`webapp/`)

| Arquivo | Responsabilidade |
|---------|-----------------|
| `src/App.tsx` | Layout principal, polling de status |
| `src/store/useStore.ts` | Estado global Zustand |
| `src/lib/api.ts` | Cliente HTTP para o backend |
| `src/components/NavigationBar.tsx` | Barra de URL, botões de navegação, iniciar/fechar browser |
| `src/components/BrowserViewport.tsx` | Exibe screenshots do browser |
| `src/components/ChatPanel.tsx` | Chat de IA, histórico, execução de ações |
| `src/components/ActionConsole.tsx` | Log de ações executadas |
| `src/components/SettingsModal.tsx` | API keys, extensões, AvantPro auth |

#### Zustand Store

Estado centralizado com ações assíncronas:

- **Browser** — `browserActive`, `browserUrl`, `screenshot`, `extensionPaths`, `userDataDir`
- **IA** — `prompt`, `selectedModel`, `response`, `pendingActions`
- **AvantPro** — `avantproAuthenticated`, `avantproEmail`, `avantproPlan`
- **Dados** — `history`, `actionLogs`, `configuredKeys`

## Fluxo de Dados

### Navegação e Screenshot

```
Usuário digita URL → NavigationBar → api.navigate() → Server → Playwright
                                                                    │
Usuário vê screenshot ← BrowserViewport ← api.screenshot() ← ─────┘
```

### Análise com IA

```
Usuário envia prompt → ChatPanel → api.analyze() → Server
                                                      │
                                   ┌──────────────────┘
                                   ▼
                          extractPageContent() ← Playwright (DOM + extensões)
                                   │
                                   ▼
                            API do modelo IA
                                   │
                                   ▼
                    Resposta + ações sugeridas → ChatPanel
                                                     │
                      Usuário clica "Executar" ──────┘
                                   │
                                   ▼
                          api.executeActions() → Server → Playwright
```

### Autenticação AvantPro

```
Usuário informa email → SettingsModal → api.avantproAuth(email)
                                              │
                                              ▼
                                     POST /auth/login (AvantPro API)
                                              │
                                              ▼
                                     Token retornado
                                              │
                                              ▼
                              evaluateInServiceWorker()
                              chrome.storage.local.set({ avantpro_auth: {...} })
                                              │
                                              ▼
                              Extensão reconhece autenticação
```

## Portas e Comunicação

| Serviço | Porta | Protocolo |
|---------|-------|-----------|
| Webapp (Vite dev) | 5180 | HTTP |
| Server (Express) | 3210 | HTTP |
| Vite → Server | Proxy | `/api/*`, `/avantpro/*`, `/health`, etc. |

O Vite proxy encaminha todas as rotas da API para `localhost:3210`, eliminando problemas de CORS em desenvolvimento.

## Persistência

| Dado | Armazenamento | Persistência |
|------|---------------|--------------|
| API Keys | Memória do server | Perdidas ao reiniciar server |
| Perfil do browser | `~/.browsermind-profile` | Persiste entre reboots |
| Token AvantPro | `chrome.storage.local` (no perfil) | Persiste enquanto perfil existir |
| Estado da webapp | Zustand (memória) | Perdido ao recarregar página |
| Histórico de chat | Zustand (memória) | Perdido ao recarregar página |
