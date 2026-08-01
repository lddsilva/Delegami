'use client'

import { useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Clock, FolderOpen, CheckSquare, Square, Loader2 } from 'lucide-react'
import { assignProjectToReceipts } from '@/modules/receipt-inbox/actions'
import { Badge } from '@/components/ui/badge'
import { DeleteReceiptButton } from '@/components/receipt-inbox/receipt-upload-modal'

interface ProjectOption {
  id: string
  name: string
  isPlaceholder: boolean
}

interface PendingReceipt {
  id: string
  photoUrl: string
  capturedAt: string
  note: string | null
  suggestedProjectId: string | null
}

interface Props {
  receipts: PendingReceipt[]
  projects: ProjectOption[]
  suggestedProjects: Record<string, { id: string; name: string }>
  canEdit: boolean
  canDelete: boolean
}

function formatCapturedAt(date: string): string {
  return new Intl.DateTimeFormat('it-CH', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'Europe/Zurich',
  }).format(new Date(date))
}

export function ReceiptBulkAssign({ receipts, projects, suggestedProjects, canEdit, canDelete }: Props) {
  const router = useRouter()
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [projectId, setProjectId] = useState<string>('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)

  const allSelected = selected.size === receipts.length && receipts.length > 0
  const someSelected = selected.size > 0 && !allSelected

  const placeholderId = useMemo(() => projects.find((p) => p.isPlaceholder)?.id ?? null, [projects])

  function toggle(id: string) {
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  function toggleAll() {
    if (allSelected) setSelected(new Set())
    else setSelected(new Set(receipts.map((r) => r.id)))
  }

  async function applyAssignment(targetProjectId: string | null) {
    if (selected.size === 0) return
    setLoading(true)
    setError(null)
    setSuccessMessage(null)
    const result = await assignProjectToReceipts(Array.from(selected), targetProjectId)
    setLoading(false)
    if (result.error) {
      setError(result.error)
      return
    }
    setSuccessMessage(`Assegnati ${result.updated ?? 0} scontrini`)
    setSelected(new Set())
    setProjectId('')
    router.refresh()
  }

  return (
    <div>
      {canEdit && receipts.length > 0 && (
        <div className="mb-4 flex flex-col gap-2 rounded-control border border-line bg-surface p-3 sm:flex-row sm:items-center">
          <button
            type="button"
            onClick={toggleAll}
            className="flex items-center gap-2 text-body text-ink-muted hover:text-ink"
          >
            {allSelected ? <CheckSquare className="h-4 w-4 text-action" /> : <Square className={`h-4 w-4 ${someSelected ? 'text-action' : 'text-ink-subtle'}`} />}
            {selected.size === 0 ? 'Seleziona tutti' : `${selected.size} selezionati`}
          </button>

          <div className="flex flex-1 min-w-0 flex-col gap-2 sm:flex-row sm:items-center">
            <select
              value={projectId}
              onChange={(e) => setProjectId(e.target.value)}
              disabled={selected.size === 0 || loading}
              className="w-full min-w-0 sm:flex-1 rounded-control border border-line px-2 py-1.5 text-body disabled:bg-surface-raised"
            >
              <option value="">— Scegli opera —</option>
              {projects.map((p) => (
                <option key={p.id} value={p.id}>{p.isPlaceholder ? '🗂 ' : ''}{p.name}</option>
              ))}
            </select>
            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                disabled={selected.size === 0 || !projectId || loading}
                onClick={() => applyAssignment(projectId)}
                className="flex-1 sm:flex-none rounded-control bg-action px-3 py-1.5 text-body font-medium text-ink-inverse hover:bg-action-hover disabled:opacity-50"
              >
                {loading ? <Loader2 className="h-4 w-4 animate-spin mx-auto" /> : 'Assegna'}
              </button>
              {placeholderId && (
                <button
                  type="button"
                  disabled={selected.size === 0 || loading}
                  onClick={() => applyAssignment(placeholderId)}
                  className="flex-1 sm:flex-none rounded-control border border-line px-3 py-1.5 text-body text-ink hover:bg-surface-raised disabled:opacity-50 whitespace-nowrap"
                  title="Assegna a 'Da classificare' (placeholder)"
                >
                  Da classificare
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {error && <p className="mb-3 text-body text-negative">{error}</p>}
      {successMessage && <p className="mb-3 text-body text-positive">{successMessage}</p>}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {receipts.map((receipt) => {
          const isSelected = selected.has(receipt.id)
          const suggested = receipt.suggestedProjectId ? suggestedProjects[receipt.suggestedProjectId] : null
          return (
            <div
              key={receipt.id}
              className={`bg-surface rounded-surface border ${isSelected ? 'border-action ring-2 ring-action' : 'border-line'} shadow-sm overflow-hidden flex flex-col hover:shadow-md transition-shadow`}
            >
              <div className="relative aspect-[4/3] bg-surface-raised">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={receipt.photoUrl}
                  alt=""
                  loading="lazy"
                  decoding="async"
                  className="w-full h-full object-cover"
                />
                <div className="absolute top-2 right-2">
                  <Badge variant="amber" className="text-label">Da processare</Badge>
                </div>
                {canEdit && (
                  <button
                    type="button"
                    onClick={() => toggle(receipt.id)}
                    className={`absolute top-2 left-2 h-7 w-7 rounded-full flex items-center justify-center transition-colors ${isSelected ? 'bg-action text-ink-inverse' : 'bg-surface/85 text-ink-muted hover:bg-surface'}`}
                    title={isSelected ? 'Deseleziona' : 'Seleziona'}
                  >
                    {isSelected ? <CheckSquare className="h-4 w-4" /> : <Square className="h-4 w-4" />}
                  </button>
                )}
              </div>
              <div className="p-3 flex-1 flex flex-col gap-2">
                <div className="flex items-center gap-1 text-label text-ink-muted">
                  <Clock className="w-3.5 h-3.5" />
                  {formatCapturedAt(receipt.capturedAt)}
                </div>
                {receipt.note && (
                  <p className="text-body text-ink line-clamp-2">{receipt.note}</p>
                )}
                {suggested && (
                  <div className="flex items-center gap-1 text-label text-action bg-action-surface rounded px-1.5 py-0.5 self-start max-w-full">
                    <FolderOpen className="w-3 h-3 shrink-0" />
                    <span className="truncate">{suggested.name}</span>
                  </div>
                )}
                <div className="flex items-center gap-2 mt-auto pt-1">
                  {canEdit && (
                    <Link
                      href={`/receipts/${receipt.id}/process`}
                      className="flex-1 text-center px-3 py-1.5 rounded-control bg-action text-ink-inverse text-label font-medium hover:bg-action-hover transition-colors"
                    >
                      Registra spesa
                    </Link>
                  )}
                  {canDelete && <DeleteReceiptButton id={receipt.id} />}
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
