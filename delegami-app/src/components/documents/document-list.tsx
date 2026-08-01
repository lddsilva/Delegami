'use client'

import { useRef, useState, useTransition } from 'react'
import { Upload, X, Loader2, FileText, ImageIcon, File, Camera, Download, Trash2, Paperclip } from 'lucide-react'
import { deleteDocument } from '@/modules/documents/actions'
import { isImageFile, normalizeImageFile } from '@/lib/image-normalize'
import { isPreviewableImage } from '@/lib/document-preview'
import { PhotoLightbox } from '@/components/media/photo-lightbox'

export interface DocumentItem {
  id: string
  name: string
  filePath: string
  fileType: string | null
  fileSize: number | null
  documentType: string
  uploadedAt: Date
}

interface Props {
  documents: DocumentItem[]
  uploadAction: (formData: FormData) => Promise<{ error?: string }>
  uploadFieldName: string       // e.g. 'invoiceId', 'projectId'
  uploadFieldValue: string      // e.g. the invoice id
  uploadDocumentType?: string   // e.g. 'ATTACHMENT', 'RECEIPT'
  revalidatePath: string        // e.g. '/invoices/[id]'
  canEdit?: boolean
  emptyLabel?: string
  acceptCamera?: boolean        // show camera button on mobile
  cameraLabel?: string          // label for the camera button (default: "Scatta foto")
  maxSizeMb?: number
}

function FileIcon({ type }: { type: string | null }) {
  if (!type) return <File className="w-4 h-4 text-ink-muted" />
  if (type.startsWith('image/')) return <ImageIcon className="w-4 h-4 text-action" />
  if (type === 'application/pdf') return <FileText className="w-4 h-4 text-negative" />
  return <Paperclip className="w-4 h-4 text-ink-muted" />
}

function formatSize(bytes: number | null) {
  if (!bytes) return ''
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`
}

function formatDate(d: Date) {
  return new Intl.DateTimeFormat('de-CH', { day: '2-digit', month: '2-digit', year: '2-digit', hour: '2-digit', minute: '2-digit' }).format(new Date(d))
}

export function DocumentList({
  documents,
  uploadAction,
  uploadFieldName,
  uploadFieldValue,
  uploadDocumentType = 'ATTACHMENT',
  revalidatePath: revalPath,
  canEdit = true,
  emptyLabel = 'Nessun documento allegato',
  acceptCamera = true,
  cameraLabel = 'Scatta foto',
  maxSizeMb = 20,
}: Props) {
  const fileRef = useRef<HTMLInputElement>(null)
  const cameraRef = useRef<HTMLInputElement>(null)
  const [progress, setProgress] = useState<{ current: number; total: number; name: string } | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [uploadFailures, setUploadFailures] = useState<string[]>([])
  const [deleting, startDeleteTransition] = useTransition()
  const [localDocs, setLocalDocs] = useState<DocumentItem[]>(documents)

  const uploading = progress !== null
  const progressPercent = progress && progress.total > 0
    ? Math.round((progress.current / progress.total) * 100)
    : 0

  const imageDocs = localDocs.filter((d) => isPreviewableImage(d.fileType) && d.filePath)
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null)

  function openDoc(doc: DocumentItem) {
    if (!doc.filePath) return
    if (isPreviewableImage(doc.fileType)) {
      const idx = imageDocs.findIndex((d) => d.id === doc.id)
      setLightboxIndex(idx >= 0 ? idx : 0)
      return
    }
    window.open(doc.filePath, '_blank', 'noopener,noreferrer')
  }

  async function handleUpload(fileList: FileList) {
    const files = Array.from(fileList)
    for (const file of files) {
      if (file.size > maxSizeMb * 1024 * 1024) {
        setError(`File "${file.name}" troppo grande (max ${maxSizeMb} MB)`)
        return
      }
    }
    setError(null)
    setUploadFailures([])
    setProgress({ current: 0, total: files.length, name: '' })
    const failures: string[] = []

    for (let i = 0; i < files.length; i++) {
      const original = files[i]
      setProgress({ current: i, total: files.length, name: original.name })
      try {
        const file = isImageFile(original) ? await normalizeImageFile(original) : original
        const fd = new FormData()
        fd.append('file', file)
        fd.append(uploadFieldName, uploadFieldValue)
        if (uploadDocumentType) fd.append('documentType', uploadDocumentType)
        const result = await uploadAction(fd)
        if (result?.error) {
          failures.push(`${original.name}: ${result.error}`)
          continue
        }
        setLocalDocs((prev) => [
          {
            id: `temp-${Date.now()}-${file.name}`,
            name: file.name,
            filePath: '',
            fileType: file.type,
            fileSize: file.size,
            documentType: uploadDocumentType,
            uploadedAt: new Date(),
          },
          ...prev,
        ])
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Errore sconosciuto'
        failures.push(`${original.name}: ${msg}`)
      }
    }

    setProgress(null)
    setUploadFailures(failures)
    if (failures.length > 0) setError(`${failures.length} file su ${files.length} non caricati.`)
    setTimeout(() => window.location.reload(), 500)
  }

  function handleDelete(id: string) {
    startDeleteTransition(async () => {
      const result = await deleteDocument(id, revalPath)
      if (result?.error) {
        setError(result.error)
      } else {
        setLocalDocs((prev) => prev.filter((d) => d.id !== id))
      }
    })
  }

  return (
    <div className="space-y-3">
      {/* Upload buttons */}
      {canEdit && (
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            disabled={uploading}
            className="flex items-center gap-2 px-3 py-2 rounded-control border border-line bg-surface text-body text-ink hover:border-action hover:text-action hover:bg-action-surface transition-colors disabled:opacity-50"
          >
            {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
            {uploading ? `Caricamento ${progress!.current + 1}/${progress!.total}` : 'Carica file'}
          </button>
          {acceptCamera && (
            <button
              type="button"
              onClick={() => cameraRef.current?.click()}
              disabled={uploading}
              className="flex items-center gap-2 px-3 py-2 rounded-control border border-line bg-surface text-body text-ink hover:border-action hover:text-action hover:bg-action-surface transition-colors disabled:opacity-50"
            >
              <Camera className="w-4 h-4" /> {cameraLabel}
            </button>
          )}
          <input
            ref={fileRef}
            type="file"
            accept=".pdf,.jpg,.jpeg,.png,.heic,.webp,.doc,.docx,.xls,.xlsx,.txt"
            multiple
            className="hidden"
            onChange={(e) => { if (e.target.files?.length) handleUpload(e.target.files); e.target.value = '' }}
          />
          <input
            ref={cameraRef}
            type="file"
            accept="image/*"
            capture="environment"
            className="hidden"
            onChange={(e) => { if (e.target.files?.length) handleUpload(e.target.files); e.target.value = '' }}
          />
        </div>
      )}

      {progress && (
        <div className="rounded-control border border-action-border bg-action-surface px-3 py-2.5">
          <div className="flex items-center justify-between text-body text-action">
            <span>Caricamento {progress.current + 1} / {progress.total}</span>
            <span className="text-label text-action truncate ml-3">{progress.name}</span>
          </div>
          <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-action-surface">
            <div className="h-full bg-action transition-all" style={{ width: `${progressPercent}%` }} />
          </div>
        </div>
      )}

      {error && (
        <div className="flex items-center gap-2 px-3 py-2 bg-negative-surface border border-negative-border rounded-control text-body text-negative">
          <X className="w-4 h-4 shrink-0" />
          {error}
          <button type="button" onClick={() => setError(null)} className="ml-auto"><X className="w-3.5 h-3.5" /></button>
        </div>
      )}
      {uploadFailures.length > 0 && (
        <details className="rounded-control border border-negative-border bg-negative-surface px-3 py-2 text-label text-negative">
          <summary className="cursor-pointer font-medium">Dettagli errori ({uploadFailures.length})</summary>
          <ul className="mt-2 space-y-1">
            {uploadFailures.map((message, i) => (
              <li key={i} className="truncate">- {message}</li>
            ))}
          </ul>
        </details>
      )}

      {/* Document list */}
      {localDocs.length === 0 ? (
        <p className="text-body text-ink-muted py-2">{emptyLabel}</p>
      ) : (
        <div className="space-y-1.5">
          {localDocs.map((doc) => (
            <div key={doc.id} className="flex items-center gap-3 p-2.5 rounded-control border border-line bg-surface hover:bg-surface-raised group transition-colors">
              <FileIcon type={doc.fileType} />
              <button
                type="button"
                onClick={() => openDoc(doc)}
                disabled={!doc.filePath}
                className="flex-1 min-w-0 text-left disabled:cursor-not-allowed"
                title={doc.filePath ? 'Apri anteprima' : 'In caricamento'}
              >
                <p className="text-body font-medium text-ink truncate">{doc.name}</p>
                <p className="text-label text-ink-muted">
                  {formatSize(doc.fileSize)}{doc.fileSize ? ' · ' : ''}{formatDate(doc.uploadedAt)}
                  {doc.documentType === 'RECEIPT' && <span className="ml-1 text-positive font-medium">· Comprovante</span>}
                </p>
              </button>
              <div className="flex items-center gap-1 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                {doc.filePath && (
                  <a
                    href={doc.filePath}
                    target="_blank"
                    rel="noopener noreferrer"
                    download={doc.name}
                    className="p-1.5 rounded-control text-ink-muted hover:text-action hover:bg-action-surface transition-colors"
                    aria-label="Scarica"
                  >
                    <Download className="w-4 h-4" />
                  </a>
                )}
                {canEdit && (
                  <button
                    type="button"
                    onClick={() => handleDelete(doc.id)}
                    disabled={deleting}
                    className="p-1.5 rounded-control text-ink-muted hover:text-negative hover:bg-negative-surface transition-colors"
                    title="Elimina"
                  >
                    {deleting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {lightboxIndex !== null && imageDocs.length > 0 && (
        <PhotoLightbox
          photos={imageDocs.map((d) => ({ id: d.id, filePath: d.filePath, name: d.name, uploadedAt: d.uploadedAt }))}
          index={lightboxIndex}
          onClose={() => setLightboxIndex(null)}
          onIndexChange={setLightboxIndex}
          confirmDeleteMessage="Eliminare questo documento?"
          onDelete={canEdit ? (photo) => {
            startDeleteTransition(async () => {
              const result = await deleteDocument(photo.id, revalPath)
              if (result?.error) {
                setError(result.error)
                return
              }
              setLocalDocs((prev) => prev.filter((d) => d.id !== photo.id))
              if (imageDocs.length <= 1) setLightboxIndex(null)
              else setLightboxIndex((current) => {
                if (current === null) return null
                return current >= imageDocs.length - 1 ? imageDocs.length - 2 : current
              })
            })
          } : undefined}
        />
      )}
    </div>
  )
}
