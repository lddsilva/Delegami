'use client'

import { useMemo, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Pencil, Send, Trash2, LockOpen, Lock, CheckCircle2, MapPin, ChevronDown, ChevronRight, MessageSquareWarning } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { PhotoLightbox, type LightboxPhoto } from '@/components/media/photo-lightbox'
import { formatDate, formatCurrency } from '@/lib/utils'
import {
  submitWorkLog,
  reopenWorkLog,
  approveWorkLog,
  deleteWorkLog,
  requestWorkLogRevision,
} from '@/modules/work-logs/actions'
import { WorkLogForm, type ProjectOption, type WorkerOption } from './work-log-form'
import { useConfirm } from '@/components/ui/use-confirm'
import { useToast } from '@/components/ui/use-toast'

/** What the worker earns for a single log: fixed override, else hours × snapshot rate. */
function workLogAmount(log: { hours: number; hourlyRate?: number | null; amountOverride?: number | null }) {
  if (log.amountOverride != null) return log.amountOverride
  return (log.hours ?? 0) * (log.hourlyRate ?? 0)
}

export interface WorkLogView {
  id: string
  userId: string
  userName: string
  workDate: string | Date
  hours: number
  hourlyRate?: number | null
  amountOverride?: number | null
  location?: string | null
  description?: string | null
  status: string
  projectId?: string | null
  project?: { id: string; name: string } | null
  photos: { id: string; url: string }[]
  revisionRequestedAt?: string | Date | null
  revisionReason?: string | null
}

type PaidState = 'PAID' | 'PARTIAL' | 'UNPAID'

interface Props {
  logs: WorkLogView[]
  projects: ProjectOption[]
  workers?: WorkerOption[]
  canManage: boolean
  currentUserId: string
  showWorker?: boolean
  showMoney?: boolean          // false → hide rate/value/paid badges (worker view)
  paidByLogId?: Record<string, PaidState>
}

const paidBadge: Record<PaidState, { label: string; variant: 'green' | 'amber' | 'gray' }> = {
  PAID: { label: 'Pagato', variant: 'green' },
  PARTIAL: { label: 'Parziale', variant: 'amber' },
  UNPAID: { label: 'Da pagare', variant: 'gray' },
}

function monthKey(d: string | Date) {
  const date = new Date(d)
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
}

const monthFmt = new Intl.DateTimeFormat('it-CH', { month: 'long', year: 'numeric', timeZone: 'Europe/Zurich' })

export function WorkLogList({ logs, projects, workers, canManage, currentUserId, showWorker, showMoney = true, paidByLogId }: Props) {
  const { toastError, toaster } = useToast()
  const { confirm, dialog } = useConfirm()
  const router = useRouter()
  const [editingId, setEditingId] = useState<string | null>(null)
  const [pending, startTransition] = useTransition()
  const [lightbox, setLightbox] = useState<{ photos: LightboxPhoto[]; index: number } | null>(null)
  const [revisionForId, setRevisionForId] = useState<string | null>(null)
  const [revisionReason, setRevisionReason] = useState('')

  // Group logs by month (they arrive newest-first, so groups stay in that order).
  const groups = useMemo(() => {
    const map = new Map<string, WorkLogView[]>()
    for (const log of logs) {
      const key = monthKey(log.workDate)
      const arr = map.get(key)
      if (arr) arr.push(log)
      else map.set(key, [log])
    }
    return Array.from(map.entries())
  }, [logs])

  // Expand the most recent month by default; collapse older ones.
  const [collapsed, setCollapsed] = useState<Set<string>>(() => new Set(groups.slice(1).map(([k]) => k)))

  function canEdit(log: WorkLogView) {
    return canManage || (log.userId === currentUserId && log.status === 'DRAFT')
  }

  function runAction(fn: () => Promise<{ error?: string }>) {
    startTransition(async () => {
      const res = await fn()
      if (res?.error) toastError(res.error)
      else router.refresh()
    })
  }

  function sendRevision(id: string) {
    const reason = revisionReason
    setRevisionForId(null)
    setRevisionReason('')
    runAction(() => requestWorkLogRevision(id, reason))
  }

  if (logs.length === 0) {
    return <p className="text-body text-ink-muted py-8 text-center">Nessun rapportino registrato.</p>
  }

  return (
    <>
      {toaster}
          <div className="space-y-4">
      {dialog}
      {groups.map(([key, monthLogs]) => {
        const isCollapsed = collapsed.has(key)
        const monthHours = monthLogs.reduce((s, l) => s + (l.hours ?? 0), 0)
        const monthValue = monthLogs.reduce((s, l) => s + workLogAmount(l), 0)
        const label = monthFmt.format(new Date(monthLogs[0].workDate))
        return (
          <div key={key}>
            <button
              type="button"
              onClick={() => setCollapsed((prev) => {
                const next = new Set(prev)
                if (next.has(key)) next.delete(key); else next.add(key)
                return next
              })}
              className="w-full flex items-center justify-between gap-2 py-2 px-1 text-left"
            >
              <span className="flex items-center gap-2">
                {isCollapsed ? <ChevronRight className="w-4 h-4 text-ink-muted" /> : <ChevronDown className="w-4 h-4 text-ink-muted" />}
                <span className="text-body font-semibold text-ink capitalize">{label}</span>
              </span>
              <span className="text-label text-ink-muted tabular-nums">
                {monthHours.toLocaleString('it-CH')} h{showMoney ? ` · ${formatCurrency(monthValue)}` : ''}
              </span>
            </button>

            {!isCollapsed && (
              <div className="space-y-3 mt-1">
                {monthLogs.map((log) => {
                  const isDraft = log.status === 'DRAFT'
                  const isSubmitted = log.status === 'SUBMITTED'
                  const isApproved = log.status === 'APPROVED'
                  const editable = canEdit(log)
                  const amount = workLogAmount(log)
                  const hasRevision = Boolean(log.revisionRequestedAt)
                  const isLocked = !isDraft
                  const canRequestRevision = !canManage && log.userId === currentUserId && isLocked && !hasRevision
                  return (
                    <div key={log.id} className="rounded-control border border-line bg-surface p-4">
                      {editingId === log.id ? (
                        <WorkLogForm
                          mode="edit"
                          projects={projects}
                          workers={canManage ? workers : undefined}
                          currentUserId={currentUserId}
                          canSetProject={canManage}
                          log={{
                            id: log.id,
                            userId: log.userId,
                            workDate: log.workDate,
                            hours: log.hours,
                            location: log.location,
                            description: log.description,
                            projectId: log.projectId,
                            status: log.status,
                            photos: log.photos,
                          }}
                          onDone={() => setEditingId(null)}
                          onCancel={() => setEditingId(null)}
                        />
                      ) : (
                        <>
                          <div className="flex items-start justify-between gap-3">
                            <div className="min-w-0">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="font-medium text-ink">{formatDate(log.workDate)}</span>
                                <span className="text-body text-ink-muted">{log.hours.toLocaleString('it-CH')} h</span>
                                {showMoney && log.hourlyRate != null && (
                                  <span className="text-label text-ink-muted">
                                    ({log.amountOverride != null ? `${formatCurrency(log.amountOverride)} fisso` : `${formatCurrency(log.hourlyRate)}/h`} · {formatCurrency(amount)})
                                  </span>
                                )}
                                {isDraft && <Badge variant="amber">Bozza</Badge>}
                                {isSubmitted && <Badge variant="blue">In verifica</Badge>}
                                {isApproved && <Badge variant="green">Approvato</Badge>}
                                {hasRevision && <Badge variant="red">Revisione richiesta</Badge>}
                                {showMoney && isApproved && paidByLogId?.[log.id] && (
                                  <Badge variant={paidBadge[paidByLogId[log.id]].variant}>{paidBadge[paidByLogId[log.id]].label}</Badge>
                                )}
                              </div>
                              {showWorker && <p className="text-body text-ink-muted mt-0.5">{log.userName}</p>}
                              {log.location && (
                                <p className="text-body text-ink font-medium mt-0.5 flex items-center gap-1">
                                  <MapPin className="w-3.5 h-3.5 text-ink-muted" /> {log.location}
                                </p>
                              )}
                              {log.project && <p className="text-body text-action mt-0.5">{log.project.name}</p>}
                              {log.description && (
                                <p className="text-body text-ink mt-1 whitespace-pre-wrap">{log.description}</p>
                              )}
                              {hasRevision && log.revisionReason && (
                                <p className="text-label text-negative mt-1">Motivo: {log.revisionReason}</p>
                              )}
                            </div>
                            <div className="flex items-center gap-0.5 shrink-0 -mr-1">
                              {editable && (
                                <button
                                  title="Modifica"
                                  aria-label="Modifica"
                                  onClick={() => setEditingId(log.id)}
                                  className="p-2.5 text-ink-muted hover:text-action active:bg-surface-raised rounded-control"
                                >
                                  <Pencil className="w-5 h-5" />
                                </button>
                              )}
                              {isDraft && editable && (
                                <button
                                  title="Invia"
                                  aria-label="Invia"
                                  disabled={pending}
                                  onClick={() => runAction(() => submitWorkLog(log.id))}
                                  className="p-2.5 text-ink-muted hover:text-positive active:bg-surface-raised rounded-control"
                                >
                                  <Send className="w-5 h-5" />
                                </button>
                              )}
                              {isSubmitted && canManage && (
                                <button
                                  title="Approva"
                                  aria-label="Approva"
                                  disabled={pending}
                                  onClick={() => runAction(() => approveWorkLog(log.id))}
                                  className="p-2.5 text-ink-muted hover:text-positive active:bg-surface-raised rounded-control"
                                >
                                  <CheckCircle2 className="w-5 h-5" />
                                </button>
                              )}
                              {canRequestRevision && (
                                <button
                                  title="Richiedi modifica"
                                  aria-label="Richiedi modifica"
                                  disabled={pending}
                                  onClick={() => { setRevisionForId(log.id); setRevisionReason('') }}
                                  className="p-2.5 text-ink-muted hover:text-attention active:bg-surface-raised rounded-control"
                                >
                                  <MessageSquareWarning className="w-5 h-5" />
                                </button>
                              )}
                              {!isDraft && canManage && (
                                <button
                                  title={hasRevision ? 'Sblocca per modifica (revisione richiesta)' : 'Riapri per modifica'}
                                  aria-label="Riapri per modifica"
                                  disabled={pending}
                                  onClick={() => runAction(() => reopenWorkLog(log.id))}
                                  className={`p-2.5 active:bg-surface-raised rounded-control ${hasRevision ? 'text-attention hover:text-attention' : 'text-ink-muted hover:text-attention'}`}
                                >
                                  <LockOpen className="w-5 h-5" />
                                </button>
                              )}
                              {!isDraft && !canManage && !canRequestRevision && (
                                <span className="p-2.5 text-ink-subtle" title="Bloccato"><Lock className="w-5 h-5" /></span>
                              )}
                              {(canManage || (log.userId === currentUserId && isDraft)) && (
                                <button
                                  title="Elimina"
                                  aria-label="Elimina"
                                  disabled={pending}
                                  onClick={() => {
                                    void confirm({
                                      title: 'Eliminare il rapportino?',
                                      description: 'Le ore registrate per questa giornata verranno rimosse.',
                                      confirmLabel: 'Elimina',
                                      destructive: true,
                                    }).then((ok) => { if (ok) runAction(() => deleteWorkLog(log.id)) })
                                  }}
                                  className="p-2.5 text-ink-muted hover:text-negative active:bg-surface-raised rounded-control"
                                >
                                  <Trash2 className="w-5 h-5" />
                                </button>
                              )}
                            </div>
                          </div>

                          {revisionForId === log.id && (
                            <div className="mt-3 rounded-control border border-attention-border bg-attention-surface p-3 space-y-2">
                              <p className="text-label text-attention">Spiega cosa vuoi correggere. L’amministratore riaprirà il rapportino.</p>
                              <Textarea
                                value={revisionReason}
                                onChange={(e) => setRevisionReason(e.target.value)}
                                rows={2}
                                placeholder="es. Ho sbagliato le ore, sono state 6 non 8"
                              />
                              <div className="flex justify-end gap-2">
                                <Button type="button" variant="secondary" size="sm" onClick={() => setRevisionForId(null)}>Annulla</Button>
                                <Button type="button" size="sm" disabled={pending} onClick={() => sendRevision(log.id)}>Invia richiesta</Button>
                              </div>
                            </div>
                          )}

                          {log.photos.length > 0 && (
                            <div className="mt-3 flex flex-wrap gap-2">
                              {log.photos.map((photo, i) => (
                                // eslint-disable-next-line @next/next/no-img-element
                                <img
                                  key={photo.id}
                                  src={photo.url}
                                  alt=""
                                  loading="lazy"
                                  decoding="async"
                                  onClick={() =>
                                    setLightbox({
                                      photos: log.photos.map((p) => ({ id: p.id, filePath: p.url })),
                                      index: i,
                                    })
                                  }
                                  className="w-20 h-20 object-cover rounded-control border border-line cursor-pointer hover:opacity-90"
                                />
                              ))}
                            </div>
                          )}
                        </>
                      )}
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        )
      })}

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
  )
}
