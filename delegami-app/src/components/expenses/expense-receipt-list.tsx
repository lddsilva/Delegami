'use client'

import { useRef, useState, useTransition } from 'react'
import { Receipt, Upload, X, Loader2, FileText, ImageIcon, File } from 'lucide-react'
import { uploadExpenseReceipt, deleteDocument } from '@/modules/documents/actions'
import { isPreviewableImage } from '@/lib/document-preview'
import { PhotoLightbox } from '@/components/media/photo-lightbox'
import { useConfirm } from '@/components/ui/use-confirm'

interface ReceiptDoc {
  id: string
  name: string
  filePath: string
  fileType: string | null
  fileSize: number | null
  uploadedAt: Date
}

interface Props {
  expenseId: string
  receipts: ReceiptDoc[]
  canEdit?: boolean
}

function FileIcon({ type }: { type: string | null }) {
  if (!type) return <File className="w-4 h-4 text-ink-muted" />
  if (type.startsWith('image/')) return <ImageIcon className="w-4 h-4 text-action" />
  if (type === 'application/pdf') return <FileText className="w-4 h-4 text-negative" />
  return <File className="w-4 h-4 text-ink-muted" />
}

function formatSize(bytes: number | null) {
  if (!bytes) return ''
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`
}

export function ExpenseReceiptList({ expenseId, receipts, canEdit = true }: Props) {
  const { confirm, dialog } = useConfirm()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null)
  const imageReceipts = receipts.filter((r) => isPreviewableImage(r.fileType) && r.filePath)

  function openReceipt(doc: ReceiptDoc, event: React.MouseEvent) {
    if (!doc.filePath) return
    if (isPreviewableImage(doc.fileType)) {
      event.preventDefault()
      const idx = imageReceipts.findIndex((r) => r.id === doc.id)
      setLightboxIndex(idx >= 0 ? idx : 0)
    }
  }

  async function handleUpload(files: FileList | null) {
    if (!files || files.length === 0) return
    setError(null)

    for (const file of Array.from(files)) {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('expenseId', expenseId)

      startTransition(async () => {
        const result = await uploadExpenseReceipt(formData)
        if (result?.error) setError(result.error)
      })
    }
  }

  async function handleDelete(id: string) {
    const ok = await confirm({
      title: 'Eliminare il documento?',
      description: 'La ricevuta verrà rimossa definitivamente dalla spesa.',
      confirmLabel: 'Elimina',
      destructive: true,
    })
    if (!ok) return
    startTransition(async () => {
      const result = await deleteDocument(id, `/expenses/${expenseId}`)
      if (result?.error) setError(result.error)
    })
  }

  return (
    <>
      {dialog}
      <div>
      {canEdit && (
        <div className="flex items-center justify-between mb-3">
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={isPending}
            className="flex items-center gap-2 px-3 py-2 rounded-control border border-line-strong bg-surface text-ink text-body font-medium hover:bg-surface-raised disabled:opacity-50 transition-colors"
          >
            {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
            <span>Aggiungi documento</span>
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf,.jpg,.jpeg,.png,.heic,.heif"
            multiple
            capture="environment"
            className="hidden"
            onChange={(e) => handleUpload(e.target.files)}
          />
        </div>
      )}

      {error && <p className="text-body text-negative mb-3">{error}</p>}

      {receipts.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-8 text-center text-ink-muted">
          <Receipt className="w-8 h-8 mb-2 opacity-40" />
          <p className="text-body">Nessun documento</p>
          <p className="text-label mt-0.5">Foto fattura, ricevuta, PDF</p>
        </div>
      ) : (
        <div className="space-y-2">
          {receipts.map((doc) => (
            <div key={doc.id} className="flex items-center gap-3 p-3 rounded-control border border-line hover:bg-surface-raised group">
              <FileIcon type={doc.fileType} />
              <div className="flex-1 min-w-0">
                <a
                  href={doc.filePath}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={(event) => openReceipt(doc, event)}
                  className="text-body font-medium text-action hover:underline truncate block"
                >
                  {doc.name}
                </a>
                <p className="text-label text-ink-muted">{formatSize(doc.fileSize)}</p>
              </div>
              {canEdit && (
                <button
                  onClick={() => handleDelete(doc.id)}
                  className="text-ink-subtle hover:text-negative transition-colors sm:opacity-0 sm:group-hover:opacity-100"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      {lightboxIndex !== null && imageReceipts.length > 0 && (
        <PhotoLightbox
          photos={imageReceipts.map((r) => ({ id: r.id, filePath: r.filePath, name: r.name, uploadedAt: r.uploadedAt }))}
          index={lightboxIndex}
          onClose={() => setLightboxIndex(null)}
          onIndexChange={setLightboxIndex}
          confirmDeleteMessage="Eliminare questo documento?"
          onDelete={canEdit ? (photo) => {
            startTransition(async () => {
              const result = await deleteDocument(photo.id, `/expenses/${expenseId}`)
              if (result?.error) {
                setError(result.error)
                return
              }
              if (imageReceipts.length <= 1) setLightboxIndex(null)
              else setLightboxIndex((current) => {
                if (current === null) return null
                return current >= imageReceipts.length - 1 ? imageReceipts.length - 2 : current
              })
            })
          } : undefined}
        />
      )}
    </div>
    </>
  )
}
