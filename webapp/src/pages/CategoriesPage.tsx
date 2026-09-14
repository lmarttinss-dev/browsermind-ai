import { useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"
import { Plus, Pencil, Trash2, Loader2, Tag, X, Layers } from "lucide-react"
import { useCategoryStore } from "@/store/useCategoryStore"
import type { Category } from "@/lib/api"

type CategoryForm = {
  name: string
  color: string
  description: string
  mlCategoryUrl: string
}

const EMPTY_FORM: CategoryForm = {
  name: "",
  color: "#3b82f6",
  description: "",
  mlCategoryUrl: "",
}

export const CategoriesPage = () => {
  const navigate = useNavigate()
  const { categories, isLoading, error, fetchCategories, createCategory, updateCategory, deleteCategory } = useCategoryStore()
  const [showModal, setShowModal] = useState(false)
  const [editing, setEditing] = useState<Category | null>(null)
  const [form, setForm] = useState<CategoryForm>(EMPTY_FORM)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    fetchCategories()
  }, [fetchCategories])

  const openCreate = () => {
    setEditing(null)
    setForm(EMPTY_FORM)
    setShowModal(true)
  }

  const openEdit = (category: Category) => {
    setEditing(category)
    setForm({
      name: category.name,
      color: category.color,
      description: category.description,
      mlCategoryUrl: category.mlCategoryUrl,
    })
    setShowModal(true)
  }

  const handleSave = async () => {
    if (!form.name.trim()) return
    setSaving(true)
    if (editing) {
      await updateCategory(editing._id, form)
    } else {
      await createCategory(form)
    }
    setSaving(false)
    setShowModal(false)
  }

  const handleDelete = async (category: Category) => {
    if (confirm(`Remover a categoria "${category.name}"? Os produtos vinculados ficarão sem categoria.`)) {
      await deleteCategory(category._id)
    }
  }

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-700">
        <div>
          <h1 className="text-lg font-semibold text-gray-100">Categorias</h1>
          <p className="text-xs text-gray-500">Agrupe e organize produtos por nicho de mercado</p>
        </div>
        <button
          onClick={openCreate}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
        >
          <Plus className="w-3.5 h-3.5" />
          Nova categoria
        </button>
      </div>

      {/* Erro */}
      {error && (
        <div className="mx-4 mt-3 px-3 py-2 bg-red-900/30 border border-red-800 rounded-lg text-xs text-red-400">
          {error}
        </div>
      )}

      {/* Lista */}
      <div className="flex-1 overflow-y-auto p-4">
        {isLoading ? (
          <div className="flex items-center justify-center h-32">
            <Loader2 className="w-6 h-6 text-blue-500 animate-spin" />
          </div>
        ) : categories.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 text-gray-600">
            <Layers className="w-12 h-12 mb-3" />
            <p className="text-sm">Nenhuma categoria criada ainda.</p>
            <p className="text-xs mt-1">Crie uma categoria para agrupar produtos na esteira.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {categories.map(category => (
              <div
                key={category._id}
                className="bg-gray-800 rounded-lg border border-gray-700 p-4 hover:border-gray-600 transition-colors"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <span
                      className="w-3 h-3 rounded-full shrink-0"
                      style={{ backgroundColor: category.color }}
                    />
                    <button
                      onClick={() => navigate(`/categories/${category._id}`)}
                      className="text-sm font-semibold text-gray-100 truncate hover:text-blue-400 transition-colors text-left"
                    >
                      {category.name}
                    </button>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      onClick={() => openEdit(category)}
                      className="p-1.5 text-gray-400 hover:text-blue-400 hover:bg-blue-900/30 rounded transition-colors"
                      title="Editar"
                    >
                      <Pencil className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleDelete(category)}
                      className="p-1.5 text-gray-400 hover:text-red-400 hover:bg-red-900/30 rounded transition-colors"
                      title="Remover"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {category.description && (
                  <p className="text-xs text-gray-400 mt-2 line-clamp-2">{category.description}</p>
                )}

                <div className="flex items-center justify-between mt-3 text-xs text-gray-500">
                  <span className="flex items-center gap-1">
                    <Tag className="w-3 h-3" />
                    {category.productCount || 0} produto{(category.productCount || 0) === 1 ? "" : "s"}
                  </span>
                  {category.mlCategoryUrl && (
                    <a
                      href={category.mlCategoryUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={(e) => e.stopPropagation()}
                      className="text-blue-400 hover:text-blue-300"
                    >
                      Ver no ML
                    </a>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-800 rounded-xl border border-gray-700 w-full max-w-md p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-semibold text-gray-100">
                {editing ? "Editar categoria" : "Nova categoria"}
              </h2>
              <button
                onClick={() => setShowModal(false)}
                className="p-1 text-gray-400 hover:text-white rounded transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-xs text-gray-400 mb-1">Nome *</label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="Ex: Películas para Celular"
                  className="w-full bg-gray-900 border border-gray-700 rounded-md px-3 py-2 text-sm text-gray-100 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs text-gray-400 mb-1">Cor</label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={form.color}
                    onChange={(e) => setForm({ ...form, color: e.target.value })}
                    className="w-10 h-9 rounded-md bg-gray-900 border border-gray-700 cursor-pointer"
                  />
                  <span className="text-xs text-gray-500">{form.color}</span>
                </div>
              </div>

              <div>
                <label className="block text-xs text-gray-400 mb-1">Descrição</label>
                <textarea
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  rows={2}
                  placeholder="Descrição curta do nicho"
                  className="w-full bg-gray-900 border border-gray-700 rounded-md px-3 py-2 text-sm text-gray-100 focus:outline-none focus:border-blue-500 resize-none"
                />
              </div>

              <div>
                <label className="block text-xs text-gray-400 mb-1">URL da categoria no ML</label>
                <input
                  type="text"
                  value={form.mlCategoryUrl}
                  onChange={(e) => setForm({ ...form, mlCategoryUrl: e.target.value })}
                  placeholder="https://lista.mercadolivre.com.br/..."
                  className="w-full bg-gray-900 border border-gray-700 rounded-md px-3 py-2 text-sm text-gray-100 focus:outline-none focus:border-blue-500"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 mt-5">
              <button
                onClick={() => setShowModal(false)}
                className="px-3 py-1.5 text-xs bg-gray-700 hover:bg-gray-600 text-gray-300 rounded-lg transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleSave}
                disabled={saving || !form.name.trim()}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-lg transition-colors"
              >
                {saving && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                Salvar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
