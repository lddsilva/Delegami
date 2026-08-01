'use client'

import { useState, useTransition, type ReactNode } from 'react'
import { useRouter } from 'next/navigation'
import { Download, FileText } from 'lucide-react'
import { isImageUrl, isPreviewableImage } from '@/lib/document-preview'
import { PhotoLightbox } from '@/components/media/photo-lightbox'
import { deleteDocument } from '@/modules/documents/actions'
import { useToast } from '@/components/ui/use-toast'

export interface MediaDocItem {
  id: string
  name: string
  filePath: string
  fileType: string | null
  uploadedAt: Date
  meta?: ReactNode
  trailing?: ReactNode
}

interface Props {
  docs: MediaDocItem[]
  showDownload?: boolean
  canDelete?: boolean
}

function isPreviewable(doc: MediaDocItem): boolean {
  return isPreviewableImage(doc.fileType) || isImageUrl(doc.filePath)
}

function Thumbnail({ doc }: { doc: MediaDocItem }) {
  if (isPreviewable(doc)) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={doc.filePath}
        alt={doc.name}
        loading="lazy"
        decoding="async"
        className="w-10 h-10 object-cover rounded-control shrink-0 border border-line"
      />
    )
  }
  return (
    <div className="w-10 h-10 rounded-control bg-surface-raised flex items-center justify-center shrink-0">
      <FileText className="w-5 h-5 text-ink-muted" />
    </div>
  )
}

export function MediaDocList({ docs, showDownload = true, canDelete = false }: Props) {
  const { toastError, toaster } = useToast()
  const router = useRouter()
  const imageDocs = docs.filter(isPreviewable)
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null)
  const [, startTransition] = useTransition()

  function openDoc(doc: MediaDocItem) {
    if (isPreviewable(doc)) {
      const idx = imageDocs.findIndex((d) => d.id === doc.id)
      setLightboxIndex(idx >= 0 ? idx : 0)
      return
    }
    window.open(doc.filePath, '_blank', 'noopener,noreferrer')
  }

  return (
    <>
      {toaster}
      <div className="divide-y divide-line">
        {docs.map((doc) => (
          <div key={doc.id} className="flex items-center gap-3 px-4 py-3 hover:bg-surface-raised transition-colors">
            <button
              type="button"
              onClick={() => openDoc(doc)}
              className="shrink-0"
              title="Apri anteprima"
            >
              <Thumbnail doc={doc} />
            </button>
            <button
              type="button"
              onClick={() => openDoc(doc)}
              className="flex-1 min-w-0 text-left"
              title="Apri anteprima"
            >
              <p className="text-body font-medium text-ink truncate">{doc.name}</p>
              {doc.meta && <div className="mt-0.5">{doc.meta}</div>}
            </button>
            <div className="flex items-center gap-2 shrink-0">
              {showDownload && (
                <a
                  href={doc.filePath}
                  target="_blank"
                  rel="noopener noreferrer"
                  download={doc.name}
                  onClick={(event) => event.stopPropagation()}
                  className="flex items-center gap-1 text-label text-ink-muted hover:text-action transition-colors"
                  title="Scarica"
                >
                  <Download className="w-3.5 h-3.5" />
                </a>
              )}
              {doc.trailing}
            </div>
          </div>
        ))}
      </div>

      {lightboxIndex !== null && imageDocs.length > 0 && (
        <PhotoLightbox
          photos={imageDocs.map((d) => ({ id: d.id, filePath: d.filePath, name: d.name, uploadedAt: d.uploadedAt }))}
          index={lightboxIndex}
          onClose={() => setLightboxIndex(null)}
          onIndexChange={setLightboxIndex}
          confirmDeleteMessage="Eliminare definitivamente questo documento?"
          onDelete={canDelete ? (photo) => {
            startTransition(async () => {
              const result = await deleteDocument(photo.id, '/media')
              if (result?.error) {
                toastError(result.error)
                return
              }
              if (imageDocs.length <= 1) setLightboxIndex(null)
              else setLightboxIndex((current) => {
                if (current === null) return null
                return current >= imageDocs.length - 1 ? imageDocs.length - 2 : current
              })
              router.refresh()
            })
          } : undefined}
        />
      )}
    </>
  )
}
