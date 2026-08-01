'use client'

import { useMemo, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { PhotoLightbox } from '@/components/media/photo-lightbox'
import { deleteDocument } from '@/modules/documents/actions'
import { useToast } from '@/components/ui/use-toast'

interface Doc {
  id: string
  name: string
  filePath: string
  fileType?: string | null
  uploadedAt: Date
}

interface Props {
  docs: Doc[]
  canDelete?: boolean
}

const PAGE_SIZE = 10

function isImageDoc(doc: Doc) {
  return doc.fileType?.startsWith('image/') || /\.(jpg|jpeg|png|gif|webp|heic)$/i.test(doc.filePath)
}

export function MediaGallery({ docs, canDelete = false }: Props) {
  const { toastError, toaster } = useToast()
  const router = useRouter()
  const [visible, setVisible] = useState(PAGE_SIZE)
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null)
  const [, startTransition] = useTransition()

  const visibleDocs = docs.slice(0, visible)
  const hasMore = docs.length > visible

  // Lightbox navigates ALL image docs, not just the visible page.
  const imageDocs = useMemo(() => docs.filter(isImageDoc), [docs])
  const imageIndexById = useMemo(() => {
    const map = new Map<string, number>()
    imageDocs.forEach((doc, i) => map.set(doc.id, i))
    return map
  }, [imageDocs])

  return (
    <>
      {toaster}
      <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-6 gap-2">
        {visibleDocs.map((doc) => {
          const isImage = isImageDoc(doc)
          const imgIndex = imageIndexById.get(doc.id)
          return (
            <div
              key={doc.id}
              className="aspect-square rounded-control overflow-hidden border border-line cursor-pointer hover:opacity-90 transition-opacity"
              onClick={() => {
                if (isImage && imgIndex !== undefined) setLightboxIndex(imgIndex)
                else window.open(doc.filePath, '_blank')
              }}
              title={doc.name}
            >
              {isImage ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={doc.filePath}
                  alt={doc.name}
                  loading="lazy"
                  decoding="async"
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full bg-surface-raised flex items-center justify-center text-label text-ink-muted p-2 text-center">
                  {doc.name}
                </div>
              )}
            </div>
          )
        })}
      </div>

      {hasMore && (
        <div className="mt-3 flex flex-col items-center gap-1.5">
          <p className="text-label text-ink-muted">Mostrate {visible} di {docs.length}</p>
          <button
            type="button"
            onClick={() => setVisible((v) => Math.min(v + PAGE_SIZE, docs.length))}
            className="px-4 py-1.5 rounded-control border border-line bg-surface text-label text-ink hover:border-action hover:text-action hover:bg-action-surface transition-colors"
          >
            Carica altre {Math.min(PAGE_SIZE, docs.length - visible)}
          </button>
        </div>
      )}

      {lightboxIndex !== null && (
        <PhotoLightbox
          photos={imageDocs.map((doc) => ({ id: doc.id, filePath: doc.filePath, name: doc.name, uploadedAt: doc.uploadedAt }))}
          index={lightboxIndex}
          onClose={() => setLightboxIndex(null)}
          onIndexChange={(next) => setLightboxIndex(next)}
          confirmDeleteMessage="Eliminare definitivamente questa foto?"
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
