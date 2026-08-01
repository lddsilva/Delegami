'use client'

import { useMemo, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { CalendarDays, CheckCircle2, Clock3 } from 'lucide-react'
import { PHASE_COLOR_PALETTE } from '@/lib/schedule-colors'
import { updateScheduleTask } from '@/modules/schedules/actions'
import { formatDate } from '@/lib/utils'
import { useToast } from '@/components/ui/use-toast'

type Task = {
  id: string
  name: string
  startDate: string | null
  endDate: string | null
  notes: string | null
  status: string
}

type Phase = {
  id: string
  name: string
  startDate: string
  endDate: string
  color: string | null
  notes: string | null
  tasks: Task[]
}

interface Props {
  phases: Phase[]
  notes: string | null
  canEdit: boolean
}

// The Gantt palette lives in one place; three copies of the same ten
// hex values meant a recolour that only landed on two of the three views.
const COLORS = PHASE_COLOR_PALETTE

const TASK_STATUS_VALUES = ['PENDING', 'IN_PROGRESS', 'DONE'] as const
const STATUS_LABEL: Record<string, string> = {
  PENDING: 'Da fare',
  IN_PROGRESS: 'In corso',
  DONE: 'Fatto',
}
const STATUS_COLOR: Record<string, string> = {
  PENDING: 'border-line bg-surface-raised text-ink',
  IN_PROGRESS: 'border-attention-border bg-attention-surface text-attention',
  DONE: 'border-positive-border bg-positive-surface text-positive',
}

function dateOnly(value: string | Date) {
  const date = new Date(value)
  date.setHours(0, 0, 0, 0)
  return date
}

function dayDiff(a: string | Date, b: string | Date) {
  return Math.round((dateOnly(b).getTime() - dateOnly(a).getTime()) / 86400000)
}

function addDays(value: string | Date, days: number) {
  const date = dateOnly(value)
  date.setDate(date.getDate() + days)
  return date
}

function shortDate(value: string | Date) {
  return new Intl.DateTimeFormat('de-CH', { day: '2-digit', month: '2-digit', timeZone: 'Europe/Zurich' }).format(new Date(value))
}

export function ScheduleViewer({ phases, notes, canEdit }: Props) {
  const { toastError, toaster } = useToast()
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  const timeline = useMemo(() => {
    if (phases.length === 0) return null
    const starts = phases.map((phase) => dateOnly(phase.startDate).getTime())
    const ends = phases.map((phase) => dateOnly(phase.endDate).getTime())
    const min = new Date(Math.min(...starts))
    const max = new Date(Math.max(...ends))
    const totalDays = Math.max(1, dayDiff(min, max) + 1)
    const tickEvery = totalDays <= 14 ? 1 : totalDays <= 45 ? 7 : 14
    const ticks = Array.from({ length: Math.ceil(totalDays / tickEvery) + 1 }, (_, index) => {
      const offset = Math.min(index * tickEvery, totalDays - 1)
      return { offset, date: addDays(min, offset) }
    })
    return { min, max, totalDays, ticks }
  }, [phases])

  const taskCount = phases.reduce((sum, phase) => sum + phase.tasks.length, 0)
  const doneCount = phases.reduce((sum, phase) => sum + phase.tasks.filter((task) => task.status === 'DONE').length, 0)

  function patchStatus(taskId: string, status: typeof TASK_STATUS_VALUES[number]) {
    startTransition(async () => {
      const result = await updateScheduleTask(taskId, { status })
      if (result?.error) toastError(result.error)
      else router.refresh()
    })
  }

  return (
    <div className="space-y-4">
      {toaster}
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        <Summary label="Fasi" value={phases.length.toString()} />
        <Summary label="Attivita" value={taskCount.toString()} />
        <Summary label="Fatte" value={`${doneCount}/${taskCount}`} />
        <Summary label="Periodo" value={timeline ? `${shortDate(timeline.min)} - ${shortDate(timeline.max)}` : '-'} />
      </div>

      {timeline && (
        <section className="rounded-control border border-line bg-surface">
          <div className="flex items-center gap-2 border-b border-line px-4 py-2 text-body font-medium text-ink">
            <CalendarDays className="h-4 w-4 text-action" />
            Timeline
          </div>
          <div className="overflow-x-auto p-3">
            <div className="space-y-2" style={{ minWidth: Math.max(720, timeline.totalDays * 18 + 220) }}>
              <div className="grid grid-cols-[190px_1fr] gap-3 text-label text-ink-muted">
                <div className="sticky left-0 z-10 bg-surface" />
                <div className="relative h-7 border-b border-line">
                  {timeline.ticks.map((tick) => (
                    <div
                      key={`${tick.offset}-${tick.date.toISOString()}`}
                      className="absolute top-0 h-7 border-l border-line pl-1"
                      style={{ left: `${(tick.offset / Math.max(1, timeline.totalDays - 1)) * 100}%` }}
                    >
                      {shortDate(tick.date)}
                    </div>
                  ))}
                </div>
              </div>
              {phases.map((phase, index) => {
                const offset = Math.max(0, dayDiff(timeline.min, phase.startDate))
                const duration = Math.max(1, dayDiff(phase.startDate, phase.endDate) + 1)
                const color = phase.color || COLORS[index % COLORS.length]
                return (
                  <div key={phase.id} className="grid grid-cols-[190px_1fr] items-center gap-3">
                    <div className="sticky left-0 z-10 truncate bg-surface pr-2 text-body text-ink">{phase.name}</div>
                    <div className="relative h-7 rounded bg-surface-raised">
                      <div
                        className="absolute top-1 h-5 rounded"
                        style={{
                          left: `${(offset / timeline.totalDays) * 100}%`,
                          width: `${Math.max(2, (duration / timeline.totalDays) * 100)}%`,
                          backgroundColor: color,
                        }}
                      />
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </section>
      )}

      {phases.length === 0 ? (
        <div className="rounded-control border border-dashed border-line bg-surface p-8 text-center text-body text-ink-muted">
          Nessuna fase registrata.
        </div>
      ) : (
        <div className="space-y-3">
          {phases.map((phase, index) => {
            const color = phase.color || COLORS[index % COLORS.length]
            const done = phase.tasks.filter((task) => task.status === 'DONE').length
            return (
              <section key={phase.id} className="rounded-control border border-line bg-surface p-3 sm:p-4">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-start gap-2">
                      <span className="mt-1 h-4 w-4 shrink-0 rounded-full" style={{ backgroundColor: color }} />
                      <div className="min-w-0">
                        <h2 className="whitespace-pre-wrap break-words text-body font-semibold text-ink">{phase.name}</h2>
                        <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-label text-ink-muted">
                          <span>{formatDate(phase.startDate)} - {formatDate(phase.endDate)}</span>
                          <span>{Math.max(1, dayDiff(phase.startDate, phase.endDate) + 1)} giorni</span>
                          <span>{done}/{phase.tasks.length} attivita fatte</span>
                        </div>
                        {phase.notes && <p className="mt-1 whitespace-pre-wrap break-words text-label text-ink-muted">{phase.notes}</p>}
                      </div>
                    </div>
                  </div>
                </div>

                {phase.tasks.length > 0 ? (
                  <div className="mt-3 space-y-2 border-t border-line pt-3">
                    {phase.tasks.map((task) => (
                      <article key={task.id} className="rounded-control border border-line bg-surface-raised/70 p-2">
                        <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                          <div className="min-w-0 flex-1">
                            <div className="flex items-start gap-2">
                              <span className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border ${task.status === 'DONE' ? 'border-positive bg-positive text-ink-inverse' : task.status === 'IN_PROGRESS' ? 'border-attention bg-attention-surface text-attention' : 'border-line-strong bg-surface text-ink-muted'}`}>
                                {task.status === 'DONE' ? <CheckCircle2 className="h-3.5 w-3.5" /> : <Clock3 className="h-3.5 w-3.5" />}
                              </span>
                              <div className="min-w-0">
                                <h3 className="whitespace-pre-wrap break-words text-body font-medium text-ink">{task.name}</h3>
                                <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-label text-ink-muted">
                                  {(task.startDate || task.endDate) && (
                                    <span>{task.startDate ? formatDate(task.startDate) : '-'} - {task.endDate ? formatDate(task.endDate) : '-'}</span>
                                  )}
                                  {task.notes && <span className="whitespace-pre-wrap break-words">{task.notes}</span>}
                                </div>
                              </div>
                            </div>
                          </div>
                          <select
                            value={task.status}
                            disabled={!canEdit || isPending}
                            onChange={(event) => patchStatus(task.id, event.target.value as typeof TASK_STATUS_VALUES[number])}
                            className={`w-full rounded-control border px-2 py-1.5 text-label sm:w-auto ${STATUS_COLOR[task.status] ?? STATUS_COLOR.PENDING}`}
                          >
                            {TASK_STATUS_VALUES.map((status) => (
                              <option key={status} value={status}>{STATUS_LABEL[status]}</option>
                            ))}
                          </select>
                        </div>
                      </article>
                    ))}
                  </div>
                ) : (
                  <p className="mt-3 rounded-control bg-surface-raised px-3 py-2 text-label text-ink-muted">Nessuna attivita in questa fase.</p>
                )}
              </section>
            )
          })}
        </div>
      )}

      {notes && (
        <section className="rounded-control border border-line bg-surface p-4">
          <h2 className="text-body font-semibold text-ink">Note generali</h2>
          <p className="mt-2 whitespace-pre-wrap break-words text-body text-ink-muted">{notes}</p>
        </section>
      )}
    </div>
  )
}

function Summary({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-control border border-line bg-surface px-3 py-2">
      <p className="text-label text-ink-muted">{label}</p>
      <p className="mt-0.5 truncate text-body font-semibold text-ink">{value}</p>
    </div>
  )
}
