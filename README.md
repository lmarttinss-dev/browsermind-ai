# BrowserMind AI

Aplicativo web de automação de browser com IA integrada. Usa Playwright para controlar um navegador Chromium, carrega extensões do Chrome (como AvantPro) e analisa páginas com modelos de IA (Gemini, GPT-4, Claude, DeepSeek).

## Arquitetura

```
webapp/          → Frontend React (Vite + TailwindCSS + Zustand)  → porta 5180
server/          → Backend Express + Playwright                    → porta 3210
```

- **Webapp** — Interface split-view com viewport do browser (screenshots), chat de IA, console de ações e configurações
- **Server** — Gerencia instância Playwright, proxy de APIs de IA, endpoints de automação e integração AvantPro

## Pré-requisitos

- **Node.js** >= 18 (testado com v22)
- **npm** >= 8
- **Docker** e **Docker Compose** (para MongoDB)
- **WSLg** ou display X11 configurado (necessário para modo headed com extensões)
  - No WSL2, verificar: `echo $DISPLAY` deve retornar `:0` ou similar

## Instalação

```bash
# 1. Clonar o repositório
git clone <repo-url>
cd browsermind-ai

# 2. Subir o MongoDB via Docker Compose
docker compose up -d

# 3. Instalar dependências do servidor
cd server
npm install

# 4. Instalar o Chromium do Playwright
npm run install:browsers

# 5. Instalar dependências do webapp
cd ../webapp
npm install
```

## Subindo o aplicativo

### 1. MongoDB (porta 27017)

Certifique-se de que o container esteja rodando:

```bash
docker compose up -d
```

O servidor conecta automaticamente em `mongodb://localhost:27017/browsermind`. Para usar outra URI, defina a variável de ambiente `MONGODB_URI`.

### 2. Servidor (porta 3210)

```bash
cd server
npm run dev
```

Saída esperada:
```
✅ MongoDB conectado: mongodb://localhost:27017/browsermind
🧠 BrowserMind Playwright Server running at http://localhost:3210
```

### 3. Webapp (porta 5180)

```bash
cd webapp
npm run dev
```

Saída esperada:
```
VITE v5.4.21  ready in 500 ms
➜  Local:   http://localhost:5180/
```

Acesse **http://localhost:5180** no navegador.

> 💡 O server funciona sem MongoDB, mas as rotas de pipeline (`/api/pipeline`) não estarão disponíveis.

## Configuração

### API Keys (obrigatório para análise com IA)

1. Clique no ícone **⚙ Settings** no canto superior direito
2. Insira pelo menos uma chave de API:
   - **Google Gemini** — para Gemini Flash 2.5 e Gemini Pro
   - **OpenAI** — para GPT-4.1
   - **Anthropic** — para Claude Sonnet
   - **DeepSeek** — para DeepSeek
3. Clique **Salvar Chaves**

> ⚠️ As chaves ficam apenas na memória do servidor. Ao reiniciar o servidor, será necessário reconfigurá-las.

### AvantPro ML (opcional)

Para extrair métricas de produtos do Mercado Livre via extensão AvantPro:

1. A extensão AvantPro já vem pré-configurada no caminho padrão
2. Clique **Iniciar Browser** na webapp
3. Vá em **Settings** → seção **AvantPro ML**
4. Digite seu email cadastrado no AvantPro
5. Clique **Autenticar**

O status mudará para ✅ com seu plano exibido.

> O perfil do browser é salvo em `~/.browsermind-profile` e persiste entre reinicializações.

## Uso

### Navegação

1. Clique **Iniciar Browser** — abre uma instância Chromium com extensões
2. Digite uma URL na barra de endereços e pressione Enter
3. O screenshot da página será exibido no viewport
4. Use os botões ← → 🔄 para navegar

### Análise com IA

1. Navegue até a página desejada
2. No painel de chat (lado direito), selecione o modelo de IA
3. Digite seu prompt e envie
4. A IA recebe automaticamente todo o conteúdo da página (incluindo dados de extensões)
5. Se a IA sugerir ações, clique **Executar Ações** para aplicá-las

### Exemplo de prompt para AvantPro

```
Analise este produto do Mercado Livre. Extraia todos os dados do AvantPro 
disponíveis na página, incluindo: vendas, estoque, visitas, conversão, 
faturamento, comissão e informações do vendedor. Organize em uma tabela.
```

## Endpoints da API

| Método | Rota | Descrição |
|--------|------|-----------|
| GET | `/health` | Health check |
| GET | `/status` | Status do browser |
| POST | `/launch` | Iniciar browser |
| POST | `/close` | Fechar browser |
| POST | `/navigate` | Navegar para URL |
| GET | `/screenshot` | Capturar screenshot |
| GET | `/extract` | Extrair conteúdo da página |
| POST | `/action` | Executar ação única |
| POST | `/actions` | Executar múltiplas ações |
| GET | `/pages` | Listar abas abertas |
| POST | `/pages/switch` | Trocar de aba |
| POST | `/extension/eval` | Executar JS no service worker |
| POST | `/avantpro/auth` | Autenticar AvantPro |
| GET | `/avantpro/status` | Status da autenticação |
| POST | `/api/keys` | Configurar API keys |
| GET | `/api/keys` | Listar keys configuradas |
| POST | `/api/analyze` | Analisar página com IA |
| GET | `/api/pipeline` | Listar produtos por estágio |
| POST | `/api/pipeline` | Criar produto na esteira |
| GET | `/api/pipeline/:id` | Detalhes de um produto |
| PATCH | `/api/pipeline/:id` | Atualizar produto |
| PATCH | `/api/pipeline/:id/move` | Mover produto de estágio |
| DELETE | `/api/pipeline/:id` | Remover produto |

## Stack

- **Frontend:** React 18, Vite 5, TailwindCSS 3, Zustand 5, React Router, dnd-kit, Lucide Icons
- **Backend:** Express 4, Playwright, Mongoose, Axios, tsx
- **Banco de dados:** MongoDB 7 (via Docker Compose)
- **Testes:** Vitest
- **IA:** Gemini Flash 2.5, Gemini Pro, GPT-4.1, Claude Sonnet, DeepSeek

## Testes

```bash
# Testes do server
cd server
npm test

# Testes do webapp
cd webapp
npm test
```
