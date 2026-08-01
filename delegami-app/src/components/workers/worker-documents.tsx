'use client'

import { useRef, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Trash2, Upload, FileText, Loader2 } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { PhotoLightbox, type LightboxPhoto } from '@/components/media/photo-lightbox'
import { formatDate } from '@/lib/utils'
import { isImageUrl, isPreviewableImage } from '@/lib/document-preview'
import { normalizeImageFile, isImageFile } from '@/lib/image-normalize'
import { addWorkerDocuments, deleteWorkerDocument } from '@/modules/workers/actions'
import { useConfirm } from '@/components/ui/use-confirm'
import { useToast } from '@/components/ui/use-toast'

export interface WorkerDocView {
  id: string
  name: string
  url: string
  fileType?: string | null
  category: string
  note?: string | null
  uploadedAt: string | Date
}

interface Props {
  userId: string
  documents: WorkerDocView[]
  canManage: boolean
  canDelete: boolean
  allowSelfUpload?: boolean   // worker uploading their own docs (capped)
  maxDocuments?: number       // cap applied to self-uploads
}

const CATEGORIES = [
  { value: 'CONTRACT', label: 'Contratto' },
  { value: 'ID', label: "Documento d'identità" },
  { value: 'PERMIT', label: 'Permesso' },
  { value: 'PHOTO', label: 'Foto' },
  { value: 'OTHER', label: 'Altro' },
]
const categoryLabel = (v: string) => CATEGORIES.find((c) => c.value === v)?.label ?? v

export function WorkerDocuments({ userId, documents, canManage, canDelete, allowSelfUpload, maxDocuments }: Props) {
  const { toastError, toaster } = useToast()
  const { confirm, dialog } = useConfirm()
  const router = useRouter()
  const fileRef = useRef<HTMLInputElement>(null)
  const [category, setCategory] = useState('CONTRACT')
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [pending, startTransition] = useTransition()
  const [lightbox, setLightbox] = useState<{ photos: LightboxPhoto[]; index: number } | null>(null)

  const canUpload = canManage || Boolean(allowSelfUpload)
  const capped = !canManage && maxDocuments != null
  const remaining = maxDocuments != null ? maxDocuments - documents.length : Infinity
  const atLimit = capped && remaining <= 0

  async function handleFiles(files: FileList | null) {
    if (!files?.length) return
    if (capped && files.length > remaining) {
      setError(`Puoi caricare al massimo ${maxDocuments} documenti (${remaining > 0 ? `ancora ${remaining}` : 'limite raggiunto'}).`)
      if (fileRef.current) fileRef.current.value = ''
      return
    }
    setError(null)
    setUploading(true)
    try {
      const fd = new FormData()
      fd.set('category', category)
      for (const file of Array.from(files)) {
        const prepared = isImageFile(file) ? await normalizeImageFile(file) : file
        fd.append('files', prepared)
      }
      const res = await addWorkerDocuments(userId, fd)
      if (res?.error) setError(res.error)
      else router.refresh()
    } catch {
      setError('Caricamento non riuscito.')
    } finally {
      setUploading(false)
      if (fileRef.current) fileRef.current.value = ''
    }
  }

  async function handleDelete(id: string) {
    const ok = await confirm({
      title: 'Eliminare il documento?',
      description: 'Il file verrà rimosso definitivamente dal dossier dell’operaio.',
      confirmLabel: 'Elimina',
      destructive: true,
    })
    if (!ok) return
    startTransition(async () => {
      const res = await deleteWorkerDocument(id)
      if (res?.error) toastError(res.error)
      else router.refresh()
    })
  }

  const imageDocs = documents.filter((d) => isPreviewableImage(d.fileType) || isImageUrl(d.url))

  return (
    <>
      {toaster}
          <>
      {dialog}
      <div className="space-y-4">
      {canUpload && (
        <div className="space-y-2">
          <div className="flex flex-col sm:flex-row sm:items-end gap-3">
            <label className="flex flex-col gap-1 text-body">
              <span className="text-ink-muted">Categoria</span>
              <select value={category} onChange={(e) => setCategory(e.target.value)} className="rounded-control border border-line-strong px-3 py-2 text-body">
                {CATEGORIES.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
              </select>
            </label>
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              disabled={uploading || atLimit}
              className="inline-flex items-center justify-center gap-2 rounded-control bg-action text-ink-inverse px-4 py-2 text-body font-medium hover:bg-action-hover disabled:opacity-50"
            >
              {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
              Carica foto o PDF
            </button>
            <input ref={fileRef} type="file" accept="image/*,application/pdf" multiple className="hidden" onChange={(e) => handleFiles(e.target.files)} />
          </div>
          {capped && (
            <p className={`text-label ${atLimit ? 'text-attention' : 'text-ink-muted'}`}>
              {atLimit
                ? `Hai raggiunto il limite di ${maxDocuments} documenti. Chiedi all’ufficio di rimuoverne uno per caricarne altri.`
                : `${documents.length}/${maxDocuments} documenti caricati`}
            </p>
          )}
        </div>
      )}
      {error && <p className="text-body text-negative">{error}</p>}

      {documents.length === 0 ? (
        <p className="text-body text-ink-muted">Nessun documento.</p>
      ) : (
        <div className="divide-y divide-line">
          {documents.map((doc) => {
            const isImg = isPreviewableImage(doc.fileType) || isImageUrl(doc.url)
            return (
              <div key={doc.id} className="flex items-center gap-3 py-2.5">
                {isImg ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={doc.url}
                    alt=""
                    loading="lazy"
                    onClick={() =>
                      setLightbox({
                        photos: imageDocs.map((d) => ({ id: d.id, filePath: d.url, name: d.name })),
                        index: Math.max(0, imageDocs.findIndex((d) => d.id === doc.id)),
                      })
                    }
                    className="w-12 h-12 object-cover rounded-control border border-line cursor-pointer shrink-0"
                  />
                ) : (
                  <a href={doc.url} target="_blank" rel="noopener noreferrer" className="w-12 h-12 rounded-control border border-line flex items-center justify-center text-ink-muted shrink-0">
                    <FileText className="w-5 h-5" />
                  </a>
                )}
                <div className="min-w-0 flex-1">
                  <a href={doc.url} target="_blank" rel="noopener noreferrer" className="text-body font-medium text-ink hover:text-action truncate block">{doc.name}</a>
                  <div className="flex items-center gap-2 mt-0.5">
                    <Badge variant="blue">{categoryLabel(doc.category)}</Badge>
                    <span className="text-label text-ink-muted">{formatDate(doc.uploadedAt)}</span>
                  </div>
                  {doc.note && <p className="text-label text-ink-muted mt-0.5">{doc.note}</p>}
                </div>
                {canDelete && (
                  <button onClick={() => handleDelete(doc.id)} disabled={pending} className="p-2.5 text-ink-muted hover:text-negative shrink-0" title="Elimina">
                    <Trash2 className="w-5 h-5" />
                  </button>
                )}
              </div>
            )
          })}
        </div>
      )}

      {lightbox && (
        <PhotoLightbox
          photos={lightbox.photos}
          index={lightbox.index}
          onClose={() => setLightbox(null)}
          onIndexChange={(next) => setLightbox((lb) => (lb ? { ...lb, index: next } : lb))}
        />
      )}
    </div>
    </>
    </>
  )
}
