# Guia de Desenvolvimento

## Pré-requisitos

- Node.js 22+
- npm 10+
- WSL2 com WSLg (para extensões Chrome em modo headed)
- Chrome instalado no Windows (para obter extensões)

## Instalação

```bash
# Clonar e instalar dependências
cd ~/Workspace/browsermind-ai

# Server
cd server && npm install

# Webapp
cd ../webapp && npm install
```

## Executando

### Iniciar o server

```bash
cd server
npm run dev
# Inicia com tsx watch na porta 3210
```

### Iniciar a webapp

```bash
cd webapp
npm run dev
# Inicia Vite na porta 5180
```

Acesse `http://localhost:5180` no browser.

## Estrutura do Projeto

```
browsermind-ai/
├── docs/                         # Documentação
│   ├── arquitetura.md            # Diagrama e fluxos
│   ├── api-reference.md          # Referência completa da API
│   ├── avantpro.md               # Integração AvantPro
│   └── development.md            # Este guia
├── server/
│   ├── src/
│   │   ├── index.ts              # Express app, rotas, AI proxy
│   │   └── playwright-manager.ts # Classe de gerenciamento do Chromium
│   ├── package.json
│   └── tsconfig.json
├── webapp/
│   ├── src/
│   │   ├── App.tsx               # Layout principal
│   │   ├── store/
│   │   │   └── useStore.ts       # Estado Zustand
│   │   ├── lib/
│   │   │   └── api.ts            # Cliente HTTP
│   │   └── components/
│   │       ├── NavigationBar.tsx  # Barra de navegação
│   │       ├── BrowserViewport.tsx# Visualização de screenshots
│   │       ├── ChatPanel.tsx     # Chat IA
│   │       ├── ActionConsole.tsx # Logs de ações
│   │       └── SettingsModal.tsx # Configurações
│   ├── vite.config.ts            # Proxy e build config
│   ├── tailwind.config.js
│   └── package.json
└── README.md
```

## Adicionando uma Nova Rota no Server

1. Adicione o handler em `server/src/index.ts`:

```typescript
app.post("/minha-rota", async (req, res) => {
  try {
    const { param } = req.body;
    // lógica...
    res.json({ success: true, data: resultado });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});
```

2. Adicione o proxy no `webapp/vite.config.ts`:

```typescript
"/minha-rota": {
  target: "http://localhost:3210",
  changeOrigin: true,
},
```

3. Adicione a função no cliente `webapp/src/lib/api.ts`:

```typescript
minhaRota: async (param: string) => {
  const res = await fetch("/minha-rota", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ param }),
  });
  return res.json();
},
```

## Adicionando um Novo Modelo de IA

1. Em `server/src/index.ts`, adicione a chave no objeto `apiKeys`:

```typescript
const apiKeys: Record<string, string> = {
  gemini: "", openai: "", anthropic: "", deepseek: "",
  novoModelo: "",  // ← adicione aqui
};
```

2. Adicione o roteamento no handler de `/api/analyze`:

```typescript
case "novo-modelo":
  if (!apiKeys.novoModelo) throw new Error("API key do novoModelo não configurada");
  // chamar API...
  break;
```

3. Adicione o modelo em `webapp/src/lib/api.ts`:

```typescript
export const MODELS = [
  // modelos existentes...
  { id: "novo-modelo", name: "Novo Modelo", provider: "provider" },
];
```

## Adicionando uma Nova Ação do Playwright

1. Em `server/src/playwright-manager.ts`, no método `executeAction()`, adicione o case:

```typescript
case "minhaAcao":
  // lógica Playwright...
  return { success: true, action, detail: "Descrição" };
```

2. Adicione o tipo em `webapp/src/lib/api.ts`:

```typescript
export type BrowserAction = {
  type: "click" | "type" | ... | "minhaAcao";
  // ...
};
```

## Debugging

### Server (tsx watch)

O server reinicia automaticamente ao salvar. Logs são exibidos no terminal.

Para debugar chamadas da API AvantPro:

```bash
curl -X POST http://localhost:3210/avantpro/auth \
  -H "Content-Type: application/json" \
  -d '{"email":"user@email.com"}'
```

### Webapp

O Vite tem HMR — alterações no código são refletidas imediatamente.

Para verificar se o proxy está funcionando:

```bash
# Deve retornar { "status": "ok" }
curl http://localhost:5180/health
```

### Playwright

Para debugar ações no browser:

1. Certifique-se de que `headless: false` está ativo
2. Abra DevTools no Chromium lançado pelo Playwright (Ctrl+Shift+I)
3. Use `/extension/eval` para inspecionar o estado de extensões

### Problemas comuns

| Problema | Causa | Solução |
|----------|-------|---------|
| `page.fill()` não funciona em React | React não detecta eventos sintéticos | Usar `pressSequentially()` |
| `__name` decorator em `page.evaluate()` | tsx adiciona wrappers em funções | Usar string em vez de function literal |
| 404 no webapp | Falta proxy no Vite | Adicionar rota em `vite.config.ts` |
| DISPLAY not set | WSLg não configurado | Verificar com `echo $DISPLAY` |
| Extensão não carrega | Caminho incorreto ou headless | Verificar path e usar `headless: false` |
