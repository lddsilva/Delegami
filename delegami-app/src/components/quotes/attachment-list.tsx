'use client'

import { useRef, useState, useTransition } from 'react'
import { Paperclip, Upload, X, Loader2, FileText, ImageIcon, File } from 'lucide-react'
import { uploadQuoteAttachment, deleteDocument } from '@/modules/documents/actions'
import { isPreviewableImage } from '@/lib/document-preview'
import { PhotoLightbox } from '@/components/media/photo-lightbox'
import { useConfirm } from '@/components/ui/use-confirm'

interface Attachment {
  id: string
  name: string
  filePath: string
  fileType: string | null
  fileSize: number | null
  uploadedAt: Date
}

interface Props {
  quoteId: string
  projectId: string
  attachments: Attachment[]
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

export function AttachmentList({ quoteId, projectId, attachments, canEdit = true }: Props) {
  const { confirm, dialog } = useConfirm()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null)
  const imageAttachments = attachments.filter((a) => isPreviewableImage(a.fileType) && a.filePath)

  function openAttachment(att: Attachment, event: React.MouseEvent) {
    if (!att.filePath) return
    if (isPreviewableImage(att.fileType)) {
      event.preventDefault()
      const idx = imageAttachments.findIndex((a) => a.id === att.id)
      setLightboxIndex(idx >= 0 ? idx : 0)
    }
  }

  async function handleUpload(files: FileList | null) {
    if (!files || files.length === 0) return
    setError(null)

    for (const file of Array.from(files)) {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('quoteId', quoteId)
      formData.append('projectId', projectId)

      startTransition(async () => {
        const result = await uploadQuoteAttachment(formData)
        if (result?.error) setError(result.error)
      })
    }
  }

  async function handleDelete(id: string) {
    const ok = await confirm({
      title: 'Eliminare l’allegato?',
      description: 'Il file verrà rimosso definitivamente dal preventivo.',
      confirmLabel: 'Elimina',
      destructive: true,
    })
    if (!ok) return
    startTransition(async () => {
      const result = await deleteDocument(id, `/quotes/${quoteId}`)
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
            <span>Aggiungi allegato</span>
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf,.jpg,.jpeg,.png,.dwg,.dxf,.doc,.docx,.xls,.xlsx"
            multiple
            className="hidden"
            onChange={(e) => handleUpload(e.target.files)}
          />
        </div>
      )}

      {error && <p className="text-body text-negative mb-3">{error}</p>}

      {attachments.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-8 text-center text-ink-muted">
          <Paperclip className="w-8 h-8 mb-2 opacity-40" />
          <p className="text-body">Nessun allegato</p>
          <p className="text-label mt-0.5">Carica piante, elaborati tecnici, PDF</p>
        </div>
      ) : (
        <div className="space-y-2">
          {attachments.map((att) => (
            <div key={att.id} className="flex items-center gap-3 p-3 rounded-control border border-line hover:bg-surface-raised group">
              <FileIcon type={att.fileType} />
              <div className="flex-1 min-w-0">
                <a
                  href={att.filePath}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={(event) => openAttachment(att, event)}
                  className="text-body font-medium text-action hover:underline truncate block"
                >
                  {att.name}
                </a>
                <p className="text-label text-ink-muted">{formatSize(att.fileSize)}</p>
              </div>
              {canEdit && (
                <button
                  onClick={() => handleDelete(att.id)}
                  className="text-ink-subtle hover:text-negative transition-colors sm:opacity-0 sm:group-hover:opacity-100"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      {lightboxIndex !== null && imageAttachments.length > 0 && (
        <PhotoLightbox
          photos={imageAttachments.map((a) => ({ id: a.id, filePath: a.filePath, name: a.name, uploadedAt: a.uploadedAt }))}
          index={lightboxIndex}
          onClose={() => setLightboxIndex(null)}
          onIndexChange={setLightboxIndex}
          confirmDeleteMessage="Eliminare questo allegato?"
          onDelete={canEdit ? (photo) => {
            startTransition(async () => {
              const result = await deleteDocument(photo.id, `/quotes/${quoteId}`)
              if (result?.error) {
                setError(result.error)
                return
              }
              if (imageAttachments.length <= 1) setLightboxIndex(null)
              else setLightboxIndex((current) => {
                if (current === null) return null
                return current >= imageAttachments.length - 1 ? imageAttachments.length - 2 : current
              })
            })
          } : undefined}
        />
      )}
    </div>
    </>
  )
}
