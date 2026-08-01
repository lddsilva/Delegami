'use client'

import { useEffect, useRef } from 'react'
import { ChevronLeft, ChevronRight, Download, Trash2, X } from 'lucide-react'
import { useConfirm } from '@/components/ui/use-confirm'

export interface LightboxPhoto {
  id: string
  filePath: string
  name?: string
  uploadedAt?: Date | string
}

interface Props {
  photos: LightboxPhoto[]
  index: number
  onClose: () => void
  onIndexChange: (next: number) => void
  onDelete?: (photo: LightboxPhoto) => void
  confirmDeleteMessage?: string
}

export function PhotoLightbox({ photos, index, onClose, onIndexChange, onDelete, confirmDeleteMessage }: Props) {
  const { confirm, dialog } = useConfirm()
  const stripRef = useRef<HTMLDivElement>(null)
  const safeIndex = Math.min(Math.max(0, index), Math.max(0, photos.length - 1))
  const current = photos[safeIndex]

  // Keyboard navigation
  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        event.preventDefault()
        onClose()
        return
      }
      if (event.key === 'ArrowLeft') {
        event.preventDefault()
        onIndexChange(safeIndex > 0 ? safeIndex - 1 : photos.length - 1)
        return
      }
      if (event.key === 'ArrowRight') {
        event.preventDefault()
        onIndexChange(safeIndex < photos.length - 1 ? safeIndex + 1 : 0)
        return
      }
      if (event.key === 'Home') {
        event.preventDefault()
        onIndexChange(0)
        return
      }
      if (event.key === 'End') {
        event.preventDefault()
        onIndexChange(photos.length - 1)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [safeIndex, photos.length, onClose, onIndexChange])

  // Lock body scroll while open
  useEffect(() => {
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = previousOverflow }
  }, [])

  // Keep selected thumbnail in view
  useEffect(() => {
    const container = stripRef.current
    if (!container) return
    const child = container.querySelector<HTMLElement>(`[data-thumb-index="${safeIndex}"]`)
    if (child) child.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' })
  }, [safeIndex])

  if (!current) return null

  const prevIndex = safeIndex > 0 ? safeIndex - 1 : photos.length - 1
  const nextIndex = safeIndex < photos.length - 1 ? safeIndex + 1 : 0

  return (
    <div
      className="fixed inset-0 z-50 flex flex-col bg-black/95"
      onClick={onClose}
    >
      {dialog}
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 text-ink-inverse" onClick={(e) => e.stopPropagation()}>
        <div className="text-body text-ink-inverse/80">
          {safeIndex + 1} / {photos.length}
          {current.name && <span className="ml-3 text-ink-inverse/50 truncate inline-block max-w-[40vw] align-middle">{current.name}</span>}
        </div>
        <div className="flex items-center gap-2">
          <a
            href={current.filePath}
            target="_blank"
            rel="noopener noreferrer"
            download={current.name ?? undefined}
            className="flex h-9 w-9 items-center justify-center rounded-full bg-surface/10 text-ink-inverse hover:bg-surface/20"
            aria-label="Scarica"
          >
            <Download className="h-4 w-4" />
          </a>
          {onDelete && (
            <button
              type="button"
              onClick={async () => {
                const message = confirmDeleteMessage ?? 'Eliminare questa foto?'
                const ok = await confirm({
                  title: 'Eliminare la foto?',
                  description: message,
                  confirmLabel: 'Elimina',
                  destructive: true,
                })
                if (!ok) return
                onDelete(current)
              }}
              className="flex h-9 w-9 items-center justify-center rounded-full bg-red-500/20 text-red-200 hover:bg-red-500/40 hover:text-ink-inverse"
              title="Elimina"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          )}
          <button
            type="button"
            onClick={onClose}
            className="flex h-9 w-9 items-center justify-center rounded-full bg-surface/10 text-ink-inverse hover:bg-surface/20"
            aria-label="Chiudi (Esc)"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
      </div>

      {/* Main image area */}
      <div className="relative flex-1 min-h-0" onClick={(e) => e.stopPropagation()}>
        {photos.length > 1 && (
          <button
            type="button"
            onClick={() => onIndexChange(prevIndex)}
            className="absolute left-2 top-1/2 z-10 -translate-y-1/2 flex h-12 w-12 items-center justify-center rounded-full bg-surface/10 text-ink-inverse hover:bg-surface/20"
            title="Precedente (←)"
          >
            <ChevronLeft className="h-6 w-6" />
          </button>
        )}
        <div className="absolute inset-0 flex items-center justify-center p-4">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            key={current.id}
            src={current.filePath}
            alt={current.name ?? 'Foto'}
            className="max-h-full max-w-full object-contain"
          />
        </div>
        {photos.length > 1 && (
          <button
            type="button"
            onClick={() => onIndexChange(nextIndex)}
            className="absolute right-2 top-1/2 z-10 -translate-y-1/2 flex h-12 w-12 items-center justify-center rounded-full bg-surface/10 text-ink-inverse hover:bg-surface/20"
            title="Successiva (→)"
          >
            <ChevronRight className="h-6 w-6" />
          </button>
        )}

        {/* Preload adjacent images for instant navigation */}
        {photos.length > 1 && (
          <div className="hidden">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={photos[prevIndex].filePath} alt="" />
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={photos[nextIndex].filePath} alt="" />
          </div>
        )}
      </div>

      {/* Thumbnails strip */}
      {photos.length > 1 && (
        <div
          ref={stripRef}
          className="flex gap-2 overflow-x-auto bg-black/70 px-3 py-3"
          onClick={(e) => e.stopPropagation()}
        >
          {photos.map((photo, i) => {
            const selected = i === safeIndex
            return (
              <button
                key={photo.id}
                type="button"
                data-thumb-index={i}
                onClick={() => onIndexChange(i)}
                className={`shrink-0 overflow-hidden rounded border-2 transition ${selected ? 'border-white' : 'border-transparent opacity-60 hover:opacity-100'}`}
                style={{ width: 72, height: 72 }}
                title={photo.name ?? `Foto ${i + 1}`}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={photo.filePath} alt="" loading="lazy" decoding="async" className="h-full w-full object-cover" />
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}
