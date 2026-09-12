import { useEffect, useRef, useState } from "react"
import {
  DndContext,
  DragOverlay,
  closestCorners,
  PointerSensor,
  useSensor,
  useSensors,
  type DragStartEvent,
  type DragEndEvent,
  type DragOverEvent,
} from "@dnd-kit/core"
import { arrayMove } from "@dnd-kit/sortable"
import { useNavigate } from "react-router-dom"
import { ChevronDown, Check, Filter, X } from "lucide-react"
import { KanbanColumn } from "./KanbanColumn"
import { ProductCard } from "./ProductCard"
import { usePipelineStore } from "@/store/usePipelineStore"
import { useCategoryStore } from "@/store/useCategoryStore"
import type { PipelineProduct, PipelineStage } from "@/lib/api"

const STAGES: PipelineStage[] = ["triagem", "analise", "aprovado", "importando", "concluido"]

export const KanbanBoard = ({ onCompareClick }: { onCompareClick?: (stage: PipelineStage) => void }) => {
  const { products, moveProduct } = usePipelineStore()
  const { categories, selectedCategoryId, setFilter, fetchCategories } = useCategoryStore()
  const navigate = useNavigate()
  const [activeProduct, setActiveProduct] = useState<PipelineProduct | null>(null)
  const [filterOpen, setFilterOpen] = useState(false)
  const filterRef = useRef<HTMLDivElement | null>(null)

  const selectedCategory = categories.find(c => c._id === selectedCategoryId)

  useEffect(() => {
    fetchCategories()
  }, [fetchCategories])

  // Fecha o dropdown ao clicar fora
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (filterRef.current && !filterRef.current.contains(event.target as Node)) {
        setFilterOpen(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } })
  )

  const findProductStage = (id: string): PipelineStage | null => {
    for (const stage of STAGES) {
      if (products[stage].some(p => p._id === id)) return stage
    }
    return null
  }

  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event
    const stage = findProductStage(active.id as string)
    if (stage) {
      const product = products[stage].find(p => p._id === active.id)
      if (product) setActiveProduct(product)
    }
  }

  const handleDragOver = (_event: DragOverEvent) => {
    // Handled in dragEnd for simplicity
  }

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event
    setActiveProduct(null)

    if (!over) return

    const activeId = active.id as string
    const overId = over.id as string

    // Determinar stage destino
    let destStage: PipelineStage | null = null
    let destOrder = 0

    // Se soltou sobre uma coluna (id é o stage)
    if (STAGES.includes(overId as PipelineStage)) {
      destStage = overId as PipelineStage
      destOrder = products[destStage].length
    } else {
      // Soltou sobre outro card
      destStage = findProductStage(overId)
      if (destStage) {
        const idx = products[destStage].findIndex(p => p._id === overId)
        destOrder = idx >= 0 ? idx : products[destStage].length
      }
    }

    if (!destStage) return

    const sourceStage = findProductStage(activeId)
    if (!sourceStage) return

    // Se está na mesma coluna e mesma posição, ignora
    if (sourceStage === destStage) {
      const oldIdx = products[sourceStage].findIndex(p => p._id === activeId)
      if (oldIdx === destOrder) return
    }

    moveProduct(activeId, destStage, destOrder)
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragEnd={handleDragEnd}
    >
      <div className="h-full flex flex-col">
        {/* Filtro por categoria */}
        <div className="flex items-center gap-2 px-4 pt-3" ref={filterRef}>
          <Filter className="w-3.5 h-3.5 text-gray-500 shrink-0" />
          <div className="relative">
            <button
              onClick={() => setFilterOpen(!filterOpen)}
              className={`flex items-center gap-2 pl-3 pr-2 py-1.5 rounded-lg border text-xs transition-colors ${
                selectedCategoryId
                  ? "bg-blue-600/20 border-blue-600/50 text-blue-300"
                  : "bg-gray-800 border-gray-700 text-gray-200 hover:border-gray-600"
              }`}
            >
              <span
                className="w-2 h-2 rounded-full shrink-0"
                style={{ backgroundColor: selectedCategory?.color || "#6b7280" }}
              />
              <span className="truncate max-w-[220px]">
                {selectedCategory ? selectedCategory.name : "Todas as categorias"}
              </span>
              <ChevronDown className={`w-3.5 h-3.5 shrink-0 text-gray-500 transition-transform ${filterOpen ? "rotate-180" : ""}`} />
            </button>

            {filterOpen && (
              <div className="absolute left-0 top-full mt-1 w-80 bg-gray-800 border border-gray-700 rounded-lg shadow-xl z-20 overflow-hidden">
                <div className="max-h-72 overflow-y-auto py-1">
                  <button
                    onClick={() => { setFilter(null); setFilterOpen(false) }}
                    className={`w-full flex items-center gap-2 px-3 py-2 text-xs text-left transition-colors ${!selectedCategoryId ? "bg-blue-600/10 text-blue-300" : "text-gray-300 hover:bg-gray-700"}`}
                  >
                    <span className="w-2 h-2 rounded-full shrink-0 bg-gray-500" />
                    <span className="flex-1">Todas as categorias</span>
                    {!selectedCategoryId && <Check className="w-3.5 h-3.5 text-blue-400 shrink-0" />}
                  </button>

                  {categories.map(c => {
                    const isActive = c._id === selectedCategoryId
                    return (
                      <button
                        key={c._id}
                        onClick={() => { setFilter(c._id); setFilterOpen(false) }}
                        className={`w-full flex items-center gap-2 px-3 py-2 text-xs text-left transition-colors ${isActive ? "bg-blue-600/10 text-blue-300" : "text-gray-300 hover:bg-gray-700"}`}
                      >
                        <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: c.color }} />
                        <span className="flex-1 truncate">{c.name}</span>
                        {isActive && <Check className="w-3.5 h-3.5 text-blue-400 shrink-0" />}
                      </button>
                    )
                  })}
                </div>
              </div>
            )}
          </div>

          {selectedCategoryId && (
            <button
              onClick={() => setFilter(null)}
              title="Limpar filtro"
              className="p-1.5 text-gray-400 hover:text-white hover:bg-gray-700 rounded transition-colors"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        <div className="flex gap-4 overflow-x-auto p-4 h-full">
          {STAGES.map(stage => {
            const stageProducts = selectedCategoryId
              ? products[stage].filter(p => p.categoryId === selectedCategoryId)
              : products[stage]
            return (
              <KanbanColumn
                key={stage}
                stage={stage}
                products={stageProducts}
                onCardClick={(product) => navigate(`/pipeline/${product._id}`)}
                onCompareClick={(stage === "triagem" || stage === "analise") ? () => onCompareClick?.(stage) : undefined}
              />
            )
          })}
        </div>
      </div>

      <DragOverlay>
        {activeProduct && (
          <div className="rotate-3 opacity-90">
            <ProductCard product={activeProduct} onClick={() => {}} />
          </div>
        )}
      </DragOverlay>
    </DndContext>
  )
}
