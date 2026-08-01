'use client'

import { useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Camera, FolderOpen, Upload, X, Loader2, CheckCircle } from 'lucide-react'
import { createReceiptInboxItems } from '@/modules/receipt-inbox/actions'
import { normalizeImageFile } from '@/lib/image-normalize'
import { useConfirm } from '@/components/ui/use-confirm'

export interface ProjectOption {
  id: string
  name: string
  isPlaceholder: boolean
}

interface PendingPhoto {
  file: File
  preview: string
  note: string
  projectId: string  // '' means inherit from batch / "Da classificare"
}

interface Props {
  onClose: () => void
  onSuccess: () => void
  projects?: ProjectOption[]
}

export function ReceiptUploadModal({ onClose, onSuccess, projects = [] }: Props) {
  const placeholderProjectId = projects.find((p) => p.isPlaceholder)?.id ?? ''
  const [batchProjectId, setBatchProjectId] = useState<string>('')
  const fileRef = useRef<HTMLInputElement>(null)
  const [photos, setPhotos] = useState<PendingPhoto[]>([])
  const [isPending, setIsPending] = useState(false)
  const [isPreparing, setIsPreparing] = useState(false)
  const [progress, setProgress] = useState(0)
  const [error, setError] = useState<string | null>(null)

  async function handleFiles(files: FileList | null) {
    if (!files?.length) return
    const newPhotos: PendingPhoto[] = []
    setError(null)
    setIsPreparing(true)
    try {
      for (const file of Array.from(files)) {
        if (file.size > 15 * 1024 * 1024) {
          newPhotos.forEach((photo) => URL.revokeObjectURL(photo.preview))
          setError(`File "${file.name}" troppo grande (max 15 MB)`)
          return
        }
        const normalized = await normalizeImageFile(file)
        if (normalized.size > 15 * 1024 * 1024) {
          newPhotos.forEach((photo) => URL.revokeObjectURL(photo.preview))
          setError(`File "${file.name}" troppo grande dopo la conversione (max 15 MB)`)
          return
        }
        newPhotos.push({ file: normalized, preview: URL.createObjectURL(normalized), note: '', projectId: batchProjectId })
      }
      setPhotos((prev) => [...prev, ...newPhotos])
    } catch {
      newPhotos.forEach((photo) => URL.revokeObjectURL(photo.preview))
      setError('Conversione foto non riuscita. Prova a selezionare un JPEG.')
    } finally {
      setIsPreparing(false)
    }
  }

  function removePhoto(index: number) {
    setPhotos((prev) => {
      URL.revokeObjectURL(prev[index].preview)
      return prev.filter((_, i) => i !== index)
    })
  }

  function setNote(index: number, note: string) {
    setPhotos((prev) => prev.map((p, i) => (i === index ? { ...p, note } : p)))
  }

  function setPhotoProject(index: number, projectId: string) {
    setPhotos((prev) => prev.map((p, i) => (i === index ? { ...p, projectId } : p)))
  }

  function changeBatchProject(next: string) {
    setBatchProjectId(next)
    // Apply to all photos that still have the old batch project (or empty).
    setPhotos((prev) => prev.map((p) => (p.projectId === batchProjectId || p.projectId === '' ? { ...p, projectId: next } : p)))
  }

  async function handleSubmit() {
    if (!photos.length || isPending) return
    setError(null)
    setIsPending(true)
    setProgress(0)
    let uploaded = 0
    try {
      for (let i = 0; i < photos.length; i++) {
        const p = photos[i]
        const fd = new FormData()
        fd.append('photos', p.file)
        fd.append('notes', p.note)
        fd.append('projectIds', p.projectId || '')
        const result = await createReceiptInboxItems(fd)
        if (result.error) {
          setError(result.error)
          setIsPending(false)
          return
        }
        uploaded++
        setProgress(i + 1)
      }
      photos.forEach((p) => { try { URL.revokeObjectURL(p.preview) } catch { /* ignore */ } })
      try { onSuccess() } catch { /* ignore navigation errors — modal is closing */ }
    } catch {
      if (uploaded === photos.length) {
        // All photos uploaded — only navigation/cleanup failed (iOS Safari quirk). Treat as success.
        photos.forEach((p) => { try { URL.revokeObjectURL(p.preview) } catch { /* ignore */ } })
        try { onSuccess() } catch { /* ignore */ }
      } else {
        setError('Errore durante il caricamento. Riprova.')
        setIsPending(false)
      }
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-surface rounded-surface shadow-xl w-full max-w-2xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-line">
          <div>
            <h2 className="text-body font-semibold text-ink">Carica scontrini</h2>
            <p className="text-label text-ink-muted mt-0.5">Seleziona una o più foto — aggiungi una nota per ognuna</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-control text-ink-muted hover:text-ink-muted hover:bg-surface-raised transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
          {/* Batch project picker */}
          {projects.length > 0 && (
            <div className="rounded-surface border border-action-border bg-action-surface/60 px-3 py-2.5">
              <label className="block text-label font-medium text-action mb-1.5 flex items-center gap-1">
                <FolderOpen className="h-3.5 w-3.5" />
                Opera per tutte le foto
              </label>
              <select
                value={batchProjectId}
                onChange={(e) => changeBatchProject(e.target.value)}
                disabled={isPending}
                className="w-full rounded-control border border-action-border bg-surface px-2 py-1.5 text-body"
              >
                <option value="">
                  {placeholderProjectId ? '🗂 Da classificare (default)' : '— Da classificare (default) —'}
                </option>
                {projects.filter((p) => !p.isPlaceholder).map((p) => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
              <p className="mt-1 text-[11px] text-action">
                Puoi cambiarla per ogni singola foto qui sotto.
              </p>
            </div>
          )}

          {/* Add more photos button */}
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            disabled={isPreparing || isPending}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-surface border-2 border-dashed border-line text-body text-ink-muted hover:border-action hover:text-action hover:bg-action-surface transition-colors"
          >
            <Camera className="w-5 h-5" />
            {isPreparing ? 'Preparazione foto...' : photos.length === 0 ? 'Seleziona foto dalla galleria' : 'Aggiungi altre foto'}
          </button>
          <input
            ref={fileRef}
            type="file"
            accept="image/*,.heic,.heif"
            multiple
            className="hidden"
            onChange={(e) => { void handleFiles(e.target.files); e.target.value = '' }}
          />

          {/* Preview grid */}
          {photos.length > 0 && (
            <div className="space-y-3">
              {photos.map((photo, index) => (
                <div key={index} className="flex gap-3 p-3 bg-surface-raised rounded-surface border border-line">
                  {/* Thumbnail */}
                  <div className="shrink-0">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={photo.preview}
                      alt=""
                      className="w-20 h-20 object-cover rounded-control border border-line"
                    />
                  </div>
                  {/* Note + remove */}
                  <div className="flex-1 min-w-0 flex flex-col gap-2">
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-label text-ink-muted truncate">{photo.file.name}</p>
                      <button
                        type="button"
                        onClick={() => removePhoto(index)}
                        className="shrink-0 p-1 rounded text-ink-muted hover:text-negative hover:bg-negative-surface transition-colors"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                    <textarea
                      value={photo.note}
                      onChange={(e) => setNote(index, e.target.value)}
                      placeholder="Nota (facoltativa) — es. Bauhaus, Malta, Tondini..."
                      rows={2}
                      className="w-full text-body border border-line rounded-control px-3 py-2 resize-none outline-none focus:border-action placeholder:text-ink-subtle bg-surface"
                    />
                    {projects.length > 0 && (
                      <select
                        value={photo.projectId}
                        onChange={(e) => setPhotoProject(index, e.target.value)}
                        disabled={isPending}
                        className="w-full rounded-control border border-line bg-surface px-2 py-1 text-label text-ink"
                      >
                        <option value="">🗂 Da classificare</option>
                        {projects.filter((p) => !p.isPlaceholder).map((p) => (
                          <option key={p.id} value={p.id}>{p.name}</option>
                        ))}
                      </select>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          {error && (
            <div className="flex items-center gap-2 px-3 py-2.5 bg-negative-surface border border-negative-border rounded-control text-body text-negative">
              <X className="w-4 h-4 shrink-0" />
              {error}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-line flex items-center justify-between gap-3">
          <span className="text-body text-ink-muted">
            {photos.length === 0 ? 'Nessuna foto selezionata' : `${photos.length} foto selezionat${photos.length === 1 ? 'a' : 'e'}`}
          </span>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              disabled={isPending}
              className="px-4 py-2 rounded-control text-body text-ink-muted hover:bg-surface-raised transition-colors disabled:opacity-50"
            >
              Annulla
            </button>
            <button
              type="button"
              onClick={handleSubmit}
              disabled={isPending || isPreparing || photos.length === 0}
              className="flex items-center gap-2 px-4 min-h-11 rounded-control bg-action text-ink-inverse text-body font-medium hover:bg-action-hover transition-colors disabled:opacity-50"
            >
              {isPending ? (
                <><Loader2 className="w-4 h-4 animate-spin" />{progress}/{photos.length}...</>
              ) : (
                <><Upload className="w-4 h-4" />Salva {photos.length > 0 ? `${photos.length} ` : ''}scontrin{photos.length === 1 ? 'o' : 'i'}</>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

// ── Wrapper with open/close state ──────────────────────────────────────────────

interface ReceiptUploadButtonProps {
  label?: string
  className?: string
  redirectAfter?: string
  projects?: ProjectOption[]
}

export function ReceiptUploadButton({
  label = 'Carica scontrini',
  className = 'flex items-center gap-2 px-4 min-h-11 rounded-control bg-action text-ink-inverse text-body font-medium hover:bg-action-hover transition-colors',
  redirectAfter,
  projects = [],
}: ReceiptUploadButtonProps) {
  const [open, setOpen] = useState(false)
  const router = useRouter()

  function handleSuccess() {
    setOpen(false)
    if (redirectAfter) {
      router.push(redirectAfter)
    } else {
      router.refresh()
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={className}
      >
        <Camera className="w-4 h-4" />
        {label}
      </button>
      {open && <ReceiptUploadModal onClose={() => setOpen(false)} onSuccess={handleSuccess} projects={projects} />}
    </>
  )
}

// ── Delete button ──────────────────────────────────────────────────────────────

import { deleteReceiptInboxItem, unarchiveReceiptInboxItem } from '@/modules/receipt-inbox/actions'

export function DeleteReceiptButton({ id, onDeleted }: { id: string; onDeleted?: () => void }) {
  const { confirm, dialog } = useConfirm()
  const [isPending, setIsPending] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  async function handleDelete() {
    const ok = await confirm({
      title: 'Eliminare lo scontrino?',
      description: 'La foto verrà rimossa definitivamente.',
      confirmLabel: 'Elimina',
      destructive: true,
    })
    if (!ok) return
    setIsPending(true)
    const result = await deleteReceiptInboxItem(id)
    setIsPending(false)
    if (result.error) setError(result.error)
    else if (onDeleted) onDeleted()
    else router.refresh()
  }

  return (
    <>
      {dialog}
      <button
        type="button"
        onClick={handleDelete}
        disabled={isPending}
        aria-label="Elimina scontrino"
        className="tap-target inline-flex items-center justify-center rounded-control text-ink-muted transition-colors duration-state hover:bg-negative-surface hover:text-negative disabled:opacity-50"
        title="Elimina scontrino"
      >
        {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <X className="w-4 h-4" />}
      </button>
      {error && <span className="text-label text-negative ml-1">{error}</span>}
    </>
  )
}

// ── Unarchive button ────────────────────────────────────────────────────────────

import { RotateCcw } from 'lucide-react'

export function UnarchiveReceiptButton({ id }: { id: string }) {
  const { confirm, dialog } = useConfirm()
  const [isPending, setIsPending] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  async function handleUnarchive() {
    const ok = await confirm({
      title: 'Ripristinare lo scontrino?',
      description: 'Tornerà nella lista "Da processare".',
      confirmLabel: 'Ripristina',
    })
    if (!ok) return
    setIsPending(true)
    const result = await unarchiveReceiptInboxItem(id)
    setIsPending(false)
    if (result.error) setError(result.error)
    else router.refresh()
  }

  return (
    <>
      {dialog}
      <button
        type="button"
        onClick={handleUnarchive}
        disabled={isPending}
        className="inline-flex min-h-11 items-center gap-1.5 rounded-control border border-attention-border px-3 text-body text-attention transition-colors duration-state hover:bg-attention-surface disabled:opacity-50"
        title="Ripristina scontrino"
      >
        {isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RotateCcw className="w-3.5 h-3.5" />}
        Ripristina
      </button>
      {error && <span className="text-label text-negative ml-1">{error}</span>}
    </>
  )
}

// ── Archived toggle ─────────────────────────────────────────────────────────────

import { ChevronDown, ChevronRight } from 'lucide-react'

export function ArchivedToggle({ children, count }: { children: React.ReactNode; count: number }) {
  const [open, setOpen] = useState(false)

  return (
    <div>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-2 text-body font-medium text-ink-muted hover:text-ink transition-colors mb-3"
      >
        {open ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
        Archiviati ({count})
      </button>
      {open && children}
    </div>
  )
}

// Quiet success banner when uploading from dashboard
export function ReceiptUploadSuccess({ count }: { count: number }) {
  return (
    <div className="flex items-center gap-2 px-3 py-2 bg-positive-surface border border-positive-border rounded-control text-body text-positive">
      <CheckCircle className="w-4 h-4 shrink-0" />
      {count} scontrin{count === 1 ? 'o caricato' : 'i caricati'} con successo
    </div>
  )
}
