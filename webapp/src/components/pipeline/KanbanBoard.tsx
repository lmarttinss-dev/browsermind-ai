import { useState } from "react"
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
import { KanbanColumn } from "./KanbanColumn"
import { ProductCard } from "./ProductCard"
import { usePipelineStore } from "@/store/usePipelineStore"
import type { PipelineProduct, PipelineStage } from "@/lib/api"

const STAGES: PipelineStage[] = ["triagem", "analise", "aprovado", "importando", "concluido"]

export const KanbanBoard = () => {
  const { products, moveProduct } = usePipelineStore()
  const navigate = useNavigate()
  const [activeProduct, setActiveProduct] = useState<PipelineProduct | null>(null)

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
      <div className="flex gap-4 overflow-x-auto p-4 h-full">
        {STAGES.map(stage => (
          <KanbanColumn
            key={stage}
            stage={stage}
            products={products[stage]}
            onCardClick={(product) => navigate(`/pipeline/${product._id}`)}
          />
        ))}
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
