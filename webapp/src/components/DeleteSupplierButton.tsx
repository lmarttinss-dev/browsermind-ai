import { createPortal } from "react-dom"
import { useEffect, useRef, useState } from "react"
import { api } from "@/lib/api"

export function DeleteSupplierButton({ id, name, onDeleted }: { id: string; name: string; onDeleted: () => void }) {
  const dialog = useRef<HTMLDialogElement>(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState("")
  useEffect(() => () => { dialog.current?.close() }, [])
  return <>
    <button type="button" className="text-gray-500 hover:text-red-300" onClick={() => { setError(""); dialog.current?.showModal() }}>Excluir</button>
    {createPortal(<dialog ref={dialog} className="supplier-delete-dialog" aria-labelledby={"delete-title-" + id} aria-describedby={"delete-description-" + id} onCancel={event => { if (busy) event.preventDefault() }}>
      <h2 id={"delete-title-" + id}>Excluir fornecedor?</h2>
      <p id={"delete-description-" + id}>O cadastro de <strong>{name}</strong> e seus vínculos serão excluídos. Os produtos serão preservados.</p>
      {error && <p role="alert" className="text-red-400">{error}</p>}
      <div className="supplier-delete-actions">
        <button autoFocus type="button" disabled={busy} onClick={() => dialog.current?.close()}>Cancelar</button>
        <button type="button" disabled={busy} className="supplier-delete-confirm" onClick={async () => {
          setBusy(true); setError("")
          try { await api.deleteManualSupplier(id); dialog.current?.close(); onDeleted() }
          catch (err) { setError((err as Error).message) }
          finally { setBusy(false) }
        }}>{busy ? "Excluindo…" : "Confirmar exclusão"}</button>
      </div>
    </dialog>, document.body)}
  </>
}
