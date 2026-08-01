'use client'

import { useRef, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Camera, Upload, X, Loader2, ImageOff } from 'lucide-react'
import { uploadProjectPhoto, deleteDocument } from '@/modules/documents/actions'
import { normalizeImageFile } from '@/lib/image-normalize'
import { PhotoLightbox } from '@/components/media/photo-lightbox'
import { useConfirm } from '@/components/ui/use-confirm'

interface Photo {
  id: string
  name: string
  filePath: string
  uploadedAt: Date
}

interface Props {
  projectId: string
  photos: Photo[]
  canEdit?: boolean
}

const PAGE_SIZE = 10

export function PhotoGallery({ projectId, photos, canEdit = true }: Props) {
  const { confirm, dialog } = useConfirm()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const cameraInputRef = useRef<HTMLInputElement>(null)
  const router = useRouter()
  const [isDeleting, startDeleteTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [uploadFailures, setUploadFailures] = useState<string[]>([])
  const [progress, setProgress] = useState<{ current: number; total: number; name: string } | null>(null)
  const [visible, setVisible] = useState(PAGE_SIZE)
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null)

  const visiblePhotos = photos.slice(0, visible)
  const hasMore = photos.length > visible

  async function handleUpload(files: FileList | null) {
    if (!files || files.length === 0) return
    setError(null)
    setUploadFailures([])
    const list = Array.from(files)
    const failures: string[] = []
    setProgress({ current: 0, total: list.length, name: '' })

    for (let i = 0; i < list.length; i++) {
      const original = list[i]
      setProgress({ current: i, total: list.length, name: original.name })
      try {
        const normalized = original.type.startsWith('image/') || /\.(heic|heif)$/i.test(original.name)
          ? await normalizeImageFile(original)
          : original
        const formData = new FormData()
        formData.append('file', normalized)
        formData.append('projectId', projectId)
        const result = await uploadProjectPhoto(formData)
        if (result?.error) failures.push(`${original.name}: ${result.error}`)
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Errore sconosciuto'
        failures.push(`${original.name}: ${msg}`)
      }
    }

    setProgress(null)
    setUploadFailures(failures)
    if (failures.length === 0) setError(null)
    else setError(`${failures.length} foto su ${list.length} non caricate.`)
    router.refresh()
  }

  async function handleDelete(id: string) {
    const ok = await confirm({
      title: 'Eliminare la foto?',
      description: 'La foto verrà rimossa definitivamente dal cantiere.',
      confirmLabel: 'Elimina',
      destructive: true,
    })
    if (!ok) return
    startDeleteTransition(async () => {
      const result = await deleteDocument(id, `/projects/${projectId}`)
      if (result?.error) setError(result.error)
      else router.refresh()
    })
  }

  const progressPercent = progress && progress.total > 0
    ? Math.round((progress.current / progress.total) * 100)
    : 0
  const uploading = progress !== null

  return (
    <div>
      {dialog}
      {canEdit && (
        <div className="flex gap-2 mb-4">
          <button
            onClick={() => cameraInputRef.current?.click()}
            disabled={uploading}
            className="flex items-center gap-2 px-3 py-2 rounded-control bg-action text-ink-inverse text-body font-medium hover:bg-action-hover disabled:opacity-50 transition-colors"
          >
            {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Camera className="w-4 h-4" />}
            <span>Scatta foto</span>
          </button>
          <input
            ref={cameraInputRef}
            type="file"
            accept="image/*"
            capture="environment"
            className="hidden"
            onChange={(e) => { void handleUpload(e.target.files); e.target.value = '' }}
          />

          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className="flex items-center gap-2 px-3 py-2 rounded-control border border-line-strong bg-surface text-ink text-body font-medium hover:bg-surface-raised disabled:opacity-50 transition-colors"
          >
            <Upload className="w-4 h-4" />
            <span>Carica file</span>
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*,.heic,.heif"
            multiple
            className="hidden"
            onChange={(e) => { void handleUpload(e.target.files); e.target.value = '' }}
          />
        </div>
      )}

      {progress && (
        <div className="mb-3 rounded-control border border-action-border bg-action-surface px-3 py-2.5">
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
        <p className="text-body text-negative mb-3">{error}</p>
      )}
      {uploadFailures.length > 0 && (
        <details className="mb-3 rounded-control border border-negative-border bg-negative-surface px-3 py-2 text-label text-negative">
          <summary className="cursor-pointer font-medium">Dettagli errori ({uploadFailures.length})</summary>
          <ul className="mt-2 space-y-1">
            {uploadFailures.map((message, i) => (
              <li key={i} className="truncate">- {message}</li>
            ))}
          </ul>
        </details>
      )}

      {photos.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-10 text-center text-ink-muted">
          <ImageOff className="w-10 h-10 mb-2 opacity-40" />
          <p className="text-body">Nessuna foto ancora</p>
          <p className="text-label mt-0.5">Scatta o carica la prima foto del cantiere</p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
            {visiblePhotos.map((photo, i) => (
              <div key={photo.id} className="relative group aspect-square">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={photo.filePath}
                  alt={photo.name}
                  loading="lazy"
                  decoding="async"
                  className="w-full h-full object-cover rounded-control cursor-pointer hover:opacity-90 transition-opacity"
                  onClick={() => setLightboxIndex(i)}
                />
                {canEdit && (
                  <button
                    onClick={() => handleDelete(photo.id)}
                    disabled={isDeleting}
                    className="absolute top-1 right-1 w-6 h-6 rounded-full bg-black/60 text-ink-inverse flex items-center justify-center opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity hover:bg-negative disabled:opacity-100"
                  >
                    {isDeleting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <X className="w-3.5 h-3.5" />}
                  </button>
                )}
              </div>
            ))}
          </div>

          {hasMore && (
            <div className="mt-4 flex flex-col items-center gap-2">
              <p className="text-label text-ink-muted">
                Mostrate {visible} di {photos.length}
              </p>
              <button
                type="button"
                onClick={() => setVisible((v) => Math.min(v + PAGE_SIZE, photos.length))}
                className="px-4 py-2 rounded-control border border-line bg-surface text-body text-ink hover:border-action hover:text-action hover:bg-action-surface transition-colors"
              >
                Carica altre {Math.min(PAGE_SIZE, photos.length - visible)}
              </button>
            </div>
          )}
        </>
      )}

      {lightboxIndex !== null && (
        <PhotoLightbox
          photos={photos.map((p) => ({ id: p.id, filePath: p.filePath, name: p.name, uploadedAt: p.uploadedAt }))}
          index={lightboxIndex}
          onClose={() => setLightboxIndex(null)}
          onIndexChange={(next) => setLightboxIndex(next)}
          onDelete={canEdit ? (photo) => {
            startDeleteTransition(async () => {
              const result = await deleteDocument(photo.id, `/projects/${projectId}`)
              if (result?.error) {
                setError(result.error)
                return
              }
              if (photos.length <= 1) {
                setLightboxIndex(null)
              } else {
                setLightboxIndex((current) => {
                  if (current === null) return null
                  return current >= photos.length - 1 ? photos.length - 2 : current
                })
              }
              router.refresh()
            })
          } : undefined}
        />
      )}
    </div>
  )
}
