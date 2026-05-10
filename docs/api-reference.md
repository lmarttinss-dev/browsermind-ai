# Referência da API

Base URL: `http://localhost:3210`

---

## Health & Status

### `GET /health`

Verifica se o servidor está rodando.

**Resposta:**
```json
{ "status": "ok", "service": "browsermind-playwright" }
```

### `GET /status`

Retorna o estado atual do browser.

**Resposta:**
```json
{
  "active": true,
  "url": "https://www.mercadolivre.com.br/...",
  "title": "Produto | Mercado Livre"
}
```

---

## Controle do Browser

### `POST /launch`

Inicia uma instância do Chromium.

**Body:**
```json
{
  "headless": false,
  "extensionPaths": ["/path/to/extension"],
  "userDataDir": "~/.browsermind-profile"
}
```

| Campo | Tipo | Default | Descrição |
|-------|------|---------|-----------|
| `headless` | boolean | `false` | Modo sem interface gráfica |
| `extensionPaths` | string[] | `[]` | Caminhos de extensões Chrome. Força `headless: false` |
| `userDataDir` | string | `~/.browsermind-profile` | Diretório do perfil do browser |

**Resposta:**
```json
{ "success": true, "message": "Browser launched (with extensions)" }
```

### `POST /close`

Fecha o browser.

**Resposta:**
```json
{ "success": true, "message": "Browser closed" }
```

### `POST /navigate`

Navega para uma URL.

**Body:**
```json
{ "url": "https://www.mercadolivre.com.br" }
```

**Resposta:**
```json
{
  "success": true,
  "url": "https://www.mercadolivre.com.br/",
  "title": "Mercado Livre Brasil"
}
```

### `GET /screenshot`

Captura screenshot da página atual.

**Resposta:**
```json
{
  "success": true,
  "screenshot": "<base64 PNG>"
}
```

### `GET /extract`

Extrai conteúdo estruturado da página (incluindo dados de extensões injetados no DOM).

**Resposta:**
```json
{
  "success": true,
  "data": {
    "url": "https://...",
    "title": "...",
    "visibleText": "Texto visível da página...",
    "headings": ["H1: Título", "H2: Subtítulo"],
    "links": [{ "text": "Link", "href": "https://..." }],
    "metaTags": { "description": "..." }
  }
}
```

---

## Ações

### `POST /action`

Executa uma única ação no browser.

**Body:**
```json
{
  "type": "click",
  "selector": "#botao-comprar",
  "value": "",
  "description": "Clica no botão comprar"
}
```

#### Tipos de Ação

| Tipo | Selector | Value | Descrição |
|------|----------|-------|-----------|
| `click` | CSS ou texto | — | Clica no elemento. Detecta popup/nova aba |
| `type` | CSS, placeholder ou label | Texto a digitar | Digita com `pressSequentially` (compatível com React) |
| `scroll` | CSS (opcional) | Pixels (default: 500) | Scroll vertical ou até um elemento |
| `navigate` | — | URL | Navega para URL |
| `select` | CSS do `<select>` | Valor da option | Seleciona opção em dropdown |
| `wait` | CSS (opcional) | Milissegundos (max: 30000) | Aguarda elemento ou tempo |
| `extract` | CSS ou expressão JS | — | Extrai texto de um elemento |
| `screenshot` | — | — | Captura screenshot |
| `hover` | CSS ou texto | — | Hover sobre elemento |
| `goBack` | — | — | Volta uma página |
| `goForward` | — | — | Avança uma página |
| `evaluate` | — | Expressão JS | Executa JavaScript na página |

**Resposta:**
```json
{
  "success": true,
  "action": { "type": "click", "selector": "#btn", "description": "..." },
  "detail": "Clicou em: #btn",
  "extractedData": "...",
  "screenshot": "<base64>"
}
```

#### Lógica de Seletores

O handler de `click` detecta automaticamente se o seletor é CSS ou texto:

- **CSS** (contém `.`, `#`, `[`, `>`, espaço): usa `page.locator()` primeiro, fallback para `getByText()`
- **Texto**: usa `getByText()` primeiro, fallback para `page.click()` e `getByRole("button")`

O handler de `type` usa `pressSequentially()` com delay de 50ms para compatibilidade com formulários React que não reconhecem `fill()`.

### `POST /actions`

Executa múltiplas ações sequencialmente (para na primeira falha).

**Body:**
```json
{
  "actions": [
    { "type": "click", "selector": "#email", "description": "Foca no campo" },
    { "type": "type", "selector": "#email", "value": "user@email.com", "description": "Digita email" },
    { "type": "click", "selector": "button[type=submit]", "description": "Envia" }
  ]
}
```

**Resposta:**
```json
{
  "success": true,
  "results": [
    { "success": true, "action": {...}, "detail": "..." },
    { "success": true, "action": {...}, "detail": "..." },
    { "success": true, "action": {...}, "detail": "..." }
  ]
}
```

---

## Abas

### `GET /pages`

Lista todas as abas abertas.

**Resposta:**
```json
{
  "success": true,
  "pages": [
    { "index": 0, "url": "https://...", "title": "Página 1" },
    { "index": 1, "url": "https://...", "title": "Página 2" }
  ]
}
```

### `POST /pages/switch`

Troca para uma aba específica.

**Body:**
```json
{ "index": 1 }
```

---

## Extensões

### `POST /extension/eval`

Executa JavaScript no service worker de uma extensão.

**Body:**
```json
{
  "extensionId": "jdefnfmbnchmnjkcknaadaddgjbgephh",
  "expression": "chrome.storage.local.get(null).then(d => JSON.stringify(d))"
}
```

**Resposta:**
```json
{
  "success": true,
  "result": "{\"key\": \"value\"}"
}
```

---

## AvantPro

### `POST /avantpro/auth`

Autentica no AvantPro e injeta token na extensão.

**Body:**
```json
{ "email": "usuario@email.com" }
```

**Resposta (sucesso):**
```json
{
  "success": true,
  "user": { "email": "usuario@email.com", "plan": "ultra" },
  "message": "Autenticado como usuario@email.com (plano: ultra)"
}
```

**Resposta (erro):**
```json
{
  "success": false,
  "error": "Request failed with status code 401"
}
```

### `GET /avantpro/status`

Verifica status da autenticação AvantPro.

**Resposta (autenticado):**
```json
{
  "success": true,
  "authenticated": true,
  "email": "usuario@email.com",
  "plan": "ultra"
}
```

**Resposta (não autenticado):**
```json
{
  "success": true,
  "authenticated": false
}
```

---

## AI Proxy

### `POST /api/keys`

Configura chaves de API (armazenadas em memória).

**Body:**
```json
{
  "keys": {
    "gemini": "AIza...",
    "openai": "sk-...",
    "anthropic": "sk-ant-...",
    "deepseek": "sk-..."
  }
}
```

**Resposta:**
```json
{ "success": true, "configured": ["gemini", "openai"] }
```

### `GET /api/keys`

Retorna quais provedores têm chave configurada.

**Resposta:**
```json
{ "configured": ["gemini"] }
```

### `POST /api/analyze`

Analisa a página atual com IA.

**Body:**
```json
{
  "prompt": "Analise este produto e extraia métricas de vendas",
  "model": "gemini-flash-2.5",
  "pageContent": "",
  "screenshot": ""
}
```

| Campo | Tipo | Descrição |
|-------|------|-----------|
| `prompt` | string | Pergunta ou instrução do usuário |
| `model` | string | `gemini-flash-2.5`, `gemini-pro`, `gpt-4.1`, `claude-sonnet`, `deepseek` |
| `pageContent` | string? | Conteúdo da página (se vazio, extrai automaticamente) |
| `screenshot` | string? | Screenshot base64 (para modelos com visão) |

**Resposta:**
```json
{
  "success": true,
  "response": "## Análise do Produto\n\n| Métrica | Valor |\n...",
  "actions": [
    { "type": "click", "selector": ".ver-mais", "description": "Ver mais detalhes" }
  ]
}
```

O campo `actions` é opcional — a IA pode sugerir ações que o usuário pode executar com um clique.
