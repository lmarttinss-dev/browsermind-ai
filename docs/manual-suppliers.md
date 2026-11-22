# Cadastro manual de fornecedores

Acesse **Fornecedores** na navegação ou a aba de fornecedores de um produto.
O cadastro permite criar, consultar, editar e excluir fornecedores com nome,
contatos, país, URL, status, preço/moeda, MOQ, prazo, pagamento e observações.
Nome e origem da compra são obrigatórios nos novos cadastros. A busca considera nome, contato, país e produto;
os filtros permitem selecionar status e presença de vínculo.

Cada cadastro pode ficar sem vínculo ou ser associado a um produto da esteira.
Edite o campo Produto para trocar ou remover o vínculo. Excluir um fornecedor
preserva o produto; excluir o produto preserva o cadastro do fornecedor.

## Compatibilidade

Os registros novos usam a coleção SupplierRecord e IDs estáveis. Os fornecedores
antigos, suas cotações e relatórios permanecem na seção de formato anterior do
produto. Não há migração automática nem deduplicação entre os dois formatos.
A calculadora continua consumindo as cotações do formato anterior; condições do
cadastro novo são referências manuais e não alimentam automaticamente cálculos.

## API

GET/POST /api/suppliers
GET/PATCH/DELETE /api/suppliers/:id

PATCH aceita alterações parciais. productId aceita ID existente ou null.
URLs aceitam apenas HTTP/HTTPS. Nome vazio, campos inválidos e referências
inexistentes retornam 400; fornecedor inexistente retorna 404.

## Verificação

Em server: npm test -- src/__tests__/suppliers-crud.test.ts
Em webapp: npm run build

Melhorias futuras: múltiplos produtos por fornecedor com cotações próprias,
histórico de preços estruturados por moeda e integração com a calculadora.

## Páginas do cadastro

- /suppliers: listagem, busca e filtros.
- /suppliers/new: novo fornecedor; productId na query pré-seleciona o produto.
- /suppliers/:id: consulta completa do cadastro.
- /suppliers/:id/edit: edição e vínculo.
- /suppliers/:id/delete: confirmação de exclusão.

Salvar redireciona aos detalhes. Cancelar volta sem alterar o cadastro.
A exclusão só ocorre ao clicar em Confirmar exclusão.

## Origem da compra

Compra nacional e importação direta são independentes do país do fornecedor.
Novos cadastros exigem a escolha da origem. Registros antigos permanecem como
Não informado; ao editar pela interface, o usuário escolhe a classificação.

Nacional: razão social, CNPJ (texto informado, sem validação cadastral),
estado, cidade, nota fiscal e condições do frete. Moeda fixada em BRL.
Importação: país da mercadoria, canal, condição comercial, modal e amostra.
Campos específicos ficam preservados ao mudar de origem, mas são exibidos
somente no contexto correspondente.

priceAmount é numérico, opcional e não negativo; currency é obrigatória quando
há preço (BRL/USD/EUR/CNY). unitPrice mantém o texto legado, sem conversão
automática. Não há conversão cambial nem cálculo automático do custo entregue.
