# Integração AvantPro ML

## O que é

O [AvantPro](https://avantprocloud.com.br) é uma extensão do Chrome que injeta métricas de vendas, estoque, visitas, conversão e faturamento em páginas de produtos do Mercado Livre.

O BrowserMind AI carrega a extensão AvantPro dentro do browser Playwright, autentica via API e extrai os dados injetados no DOM para análise com IA.

## Como funciona

### Fluxo de autenticação

```
1. Usuário informa email → POST /avantpro/auth
2. Server chama POST https://prod-ml.avantprocloud.com.br/auth/login
3. API retorna { token, user: { planCode, email, globalUserId } }
4. Server injeta token no chrome.storage.local da extensão via service worker:
   chrome.storage.local.set({
     avantpro_auth: {
       version: 2,
       accessToken: "uuid-token",
       loginAt: timestamp,
       productCode: "avantpro-ml",
       plan: "ultra",
       email: "user@email.com",
       globalUserId: "uuid"
     }
   })
5. Extensão reconhece a autenticação ao carregar qualquer página de produto
```

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
/mnt/c/Users/Leandro Martins/AppData/Local/Google/Chrome/User Data/Default/Extensions/jdefnfmbnchmnjkcknaadaddgjbgephh/7.0.3_0
```

Para alterar, edite o `extensionPaths` em `webapp/src/store/useStore.ts` ou configure via Settings na webapp.

### Requisitos

- Extensão AvantPro instalada no Chrome do Windows
- WSLg ou display X11 configurado (extensões requerem modo headed)
- Email cadastrado no AvantPro com conta ativa

### Perfil do browser

O perfil é salvo em `~/.browsermind-profile` e contém:

- `chrome.storage.local` — token de autenticação AvantPro
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

O token foi injetado sem os campos `plan` e `productCode`. Reautentique via Settings ou use o endpoint `/avantpro/auth`.

### "Vincular Conta" aparece mas dados não carregam

Isso é normal na homepage do ML. Navegue para uma **página de produto específico** para ver os dados.

### Extensão não aparece na página

Verifique:
1. O browser foi iniciado com `extensionPaths` correto
2. A variável `DISPLAY` está definida (WSLg)
3. O caminho da extensão existe e tem o `manifest.json`

### Token expirado

Tokens do AvantPro podem expirar. Reautentique em Settings → AvantPro ML → digitar email → Autenticar.

## Configuração do servidor

Constantes em `server/src/index.ts`:

```typescript
const AVANTPRO_CONFIG = {
  extensionId: "jdefnfmbnchmnjkcknaadaddgjbgephh",
  apiBase: "https://prod-ml.avantprocloud.com.br",
  productCode: "avantpro-ml",
};
```
