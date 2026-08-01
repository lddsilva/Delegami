'use client'

import { useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2, ImagePlus, X } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { normalizeImageFile } from '@/lib/image-normalize'
import { formatDateInput } from '@/lib/utils'
import {
  createWorkLog,
  updateWorkLog,
  addWorkLogPhotos,
  deleteWorkLogPhoto,
  type WorkLogFormState,
} from '@/modules/work-logs/actions'

export interface ProjectOption {
  id: string
  name: string
  client?: { name: string }
}

export interface WorkerOption {
  id: string
  name: string
  role: string
}

interface ExistingLog {
  id: string
  userId: string
  workDate: string | Date
  hours: number
  location?: string | null
  description?: string | null
  projectId?: string | null
  status: string
  photos?: { id: string; url: string }[]
}

interface Props {
  mode: 'create' | 'edit'
  projects: ProjectOption[]
  workers?: WorkerOption[]      // present only in admin mode → shows worker selector
  currentUserId: string
  log?: ExistingLog
  onDone?: () => void
  onCancel?: () => void
  canSetProject?: boolean       // false for a worker logging/editing their own entry — opera is assigned later by admin/manager
}

interface PendingPhoto {
  file: File
  preview: string
}

export function WorkLogForm({ mode, projects, workers, currentUserId, log, onDone, onCancel, canSetProject = true }: Props) {
  const router = useRouter()
  const fileRef = useRef<HTMLInputElement>(null)

  const [workDate, setWorkDate] = useState(
    log ? formatDateInput(log.workDate) : formatDateInput(new Date()),
  )
  const [hours, setHours] = useState(log ? String(log.hours) : '')
  const [location, setLocation] = useState(log?.location ?? '')
  const [projectId, setProjectId] = useState(log?.projectId ?? '')
  const [description, setDescription] = useState(log?.description ?? '')
  const [workerId, setWorkerId] = useState(log?.userId ?? currentUserId)
  const [photos, setPhotos] = useState<PendingPhoto[]>([])
  const [existingPhotos, setExistingPhotos] = useState(log?.photos ?? [])
  const [deletingPhotoId, setDeletingPhotoId] = useState<string | null>(null)
  const [pending, setPending] = useState(false)
  const [preparing, setPreparing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({})

  async function handleFiles(files: FileList | null) {
    if (!files?.length) return
    setError(null)
    setPreparing(true)
    const added: PendingPhoto[] = []
    try {
      for (const file of Array.from(files)) {
        if (file.size > 15 * 1024 * 1024) {
          setError(`File "${file.name}" troppo grande (max 15 MB)`)
          return
        }
        const normalized = await normalizeImageFile(file)
        added.push({ file: normalized, preview: URL.createObjectURL(normalized) })
      }
      setPhotos((prev) => [...prev, ...added])
    } catch {
      setError('Conversione foto non riuscita. Prova a selezionare un JPEG.')
    } finally {
      setPreparing(false)
      if (fileRef.current) fileRef.current.value = ''
    }
  }

  function removePhoto(index: number) {
    setPhotos((prev) => {
      URL.revokeObjectURL(prev[index].preview)
      return prev.filter((_, i) => i !== index)
    })
  }

  async function removeExistingPhoto(photoId: string) {
    setDeletingPhotoId(photoId)
    try {
      const res = await deleteWorkLogPhoto(photoId)
      if (res?.error) { setError(res.error); return }
      setExistingPhotos((prev) => prev.filter((p) => p.id !== photoId))
    } finally {
      setDeletingPhotoId(null)
    }
  }

  function buildFieldsFormData() {
    const fd = new FormData()
    fd.set('workDate', workDate)
    fd.set('hours', hours)
    fd.set('projectId', projectId)
    fd.set('location', location)
    fd.set('description', description)
    if (workers) fd.set('userId', workerId)
    return fd
  }

  async function uploadPhotos(logId: string) {
    if (!photos.length) return
    const fd = new FormData()
    for (const p of photos) fd.append('photos', p.file)
    await addWorkLogPhotos(logId, fd)
  }

  async function handleSubmit(submit: boolean) {
    setPending(true)
    setError(null)
    setFieldErrors({})
    try {
      const fd = buildFieldsFormData()
      let res: WorkLogFormState
      if (mode === 'edit' && log) {
        res = await updateWorkLog(log.id, null, fd)
      } else {
        fd.set('submit', String(submit))
        res = await createWorkLog(null, fd)
      }
      if (res?.errors) { setFieldErrors(res.errors); return }
      if (res?.message) { setError(res.message); return }

      const logId = res?.createdId ?? log?.id
      if (logId) await uploadPhotos(logId)

      photos.forEach((p) => URL.revokeObjectURL(p.preview))
      setPhotos([])
      if (mode === 'create') {
        setHours('')
        setProjectId('')
        setLocation('')
        setDescription('')
      }
      onDone?.()
      router.refresh()
    } catch {
      setError('Errore durante il salvataggio. Riprova.')
    } finally {
      setPending(false)
    }
  }

  const busy = pending || preparing
  const canSubmit = location.trim().length > 0 && description.trim().length > 0

  return (
    <div className="space-y-4">
      {workers && (
        <Select
          label="Operaio"
          value={workerId}
          onChange={(e) => setWorkerId(e.target.value)}
          options={workers.map((w) => ({ value: w.id, label: w.name }))}
          error={fieldErrors.userId?.[0]}
        />
      )}

      {/* One column on a phone. Two 170px cells cannot hold the date control
          iOS renders, and this is the form an operaio fills on site. */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <Input
          label="Data"
          type="date"
          className="min-w-0"
          value={workDate}
          onChange={(e) => setWorkDate(e.target.value)}
          required
          error={fieldErrors.workDate?.[0]}
        />
        <Input
          label="Ore lavorate"
          type="text"
          inputMode="decimal"
          className="min-w-0"
          placeholder="es. 7,5"
          value={hours}
          onChange={(e) => setHours(e.target.value)}
          required
          error={fieldErrors.hours?.[0]}
        />
      </div>

      <Input
        label="Luogo di lavoro"
        type="text"
        value={location}
        onChange={(e) => setLocation(e.target.value)}
        placeholder="es. Lugano, Grancia..."
        error={fieldErrors.location?.[0]}
      />

      {canSetProject ? (
        <Select
          label="Opera (opzionale)"
          value={projectId}
          onChange={(e) => setProjectId(e.target.value)}
          options={[
            { value: '', label: '— Nessuna opera —' },
            ...projects.map((p) => ({ value: p.id, label: p.client ? `${p.name} · ${p.client.name}` : p.name })),
          ]}
        />
      ) : (
        <p className="text-label text-ink-muted -mt-2">L&apos;opera verrà assegnata dall&apos;amministratore in fase di verifica.</p>
      )}

      <Textarea
        label="Descrizione del lavoro svolto"
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        placeholder="Cosa è stato fatto oggi..."
        rows={3}
      />

      {/* Photos */}
      <div>
        <label className="text-body font-medium text-ink">Foto del lavoro</label>
        <p className="text-label text-ink-muted mb-1">Puoi selezionare più foto insieme dalla galleria</p>
        <div className="mt-1 flex flex-wrap gap-2">
          {existingPhotos.map((p) => (
            <div key={p.id} className="relative w-24 h-24 rounded-control overflow-hidden border border-line">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={p.url} alt="" className="w-full h-full object-cover" />
              <button
                type="button"
                onClick={() => removeExistingPhoto(p.id)}
                disabled={deletingPhotoId === p.id}
                aria-label="Rimuovi foto"
                className="absolute top-1 right-1 bg-black/60 text-ink-inverse rounded-full p-1.5 disabled:opacity-50"
              >
                {deletingPhotoId === p.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <X className="w-4 h-4" />}
              </button>
            </div>
          ))}
          {photos.map((p, i) => (
            <div key={p.preview} className="relative w-24 h-24 rounded-control overflow-hidden border border-line">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={p.preview} alt="" className="w-full h-full object-cover" />
              <button
                type="button"
                onClick={() => removePhoto(i)}
                aria-label="Rimuovi foto"
                className="absolute top-1 right-1 bg-black/60 text-ink-inverse rounded-full p-1.5"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          ))}
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            disabled={busy}
            className="w-24 h-24 rounded-control border-2 border-dashed border-line-strong flex flex-col items-center justify-center gap-1 text-ink-muted hover:border-action hover:text-action active:bg-surface-raised disabled:opacity-50"
          >
            {preparing ? <Loader2 className="w-6 h-6 animate-spin" /> : <ImagePlus className="w-6 h-6" />}
            <span className="text-[10px] font-medium">Foto</span>
          </button>
        </div>
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          onChange={(e) => handleFiles(e.target.files)}
        />
      </div>

      {error && <p className="text-body text-negative">{error}</p>}

      {mode === 'create' && !canSubmit && (
        <p className="text-label text-attention">Compila <strong>luogo</strong> e <strong>descrizione</strong> per inviare. Puoi comunque salvare come bozza.</p>
      )}

      <div className="flex flex-col-reverse sm:flex-row sm:flex-wrap sm:justify-end gap-2 pt-1">
        {onCancel && (
          <Button type="button" variant="secondary" size="lg" onClick={onCancel} disabled={busy} className="w-full sm:w-auto">Annulla</Button>
        )}
        {mode === 'edit' ? (
          <Button type="button" size="lg" onClick={() => handleSubmit(false)} loading={pending} disabled={busy} className="w-full sm:w-auto">
            Salva modifiche
          </Button>
        ) : (
          <>
            <Button type="button" variant="secondary" size="lg" onClick={() => handleSubmit(false)} disabled={busy} className="w-full sm:w-auto">
              Salva bozza
            </Button>
            <Button type="button" size="lg" onClick={() => handleSubmit(true)} loading={pending} disabled={busy || !canSubmit} className="w-full sm:w-auto">
              Invia
            </Button>
          </>
        )}
      </div>
    </div>
  )
}
