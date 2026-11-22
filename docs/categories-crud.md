# Categorias

A listagem em /categories segue o diretório de fornecedores, com busca por nome ou descrição, paginação de dez registros e ações para editar ou remover.

- /categories/new: cadastro de nome, descrição e URL opcional.
- /categories/:id: visualização do nome, descrição e URL cadastrada, com ações para editar e excluir.
- /categories/:id/edit: edição dos dados, preservados quando ocorre erro no salvamento.

A API /api/categories oferece GET e POST na coleção, e GET, PATCH e DELETE por identificador. O nome deve ter até 200 caracteres e gerar um slug com letras ou números. Nomes equivalentes por acentuação ou caixa retornam 409. Descrições e URLs têm limite de 2000 caracteres; a cor aceita hexadecimal de seis dígitos e a URL aceita HTTP ou HTTPS. IDs ou dados inválidos retornam 400; categorias inexistentes retornam 404.

Ao renomear uma categoria, o nome dos produtos vinculados é sincronizado. Ao excluir, os produtos são preservados e seus campos categoryId e category são limpos. A URL é apenas um dado de cadastro; nenhuma consulta ao Mercado Livre é realizada por este CRUD.

A interface não exibe nem permite editar cores de categorias. No detalhe do produto, a categoria aparece somente como texto. A exclusão na listagem e nos detalhes usa o mesmo diálogo de confirmação de fornecedores e limpa o filtro da categoria excluída.
