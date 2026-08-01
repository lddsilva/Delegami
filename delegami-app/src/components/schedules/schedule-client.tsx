'use client'

import { useMemo, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowDown, ArrowUp, CalendarDays, Loader2, Plus, RotateCcw, Trash2 } from 'lucide-react'
import { PHASE_COLOR_PALETTE } from '@/lib/schedule-colors'
import {
  createScheduleTask,
  createSchedulePhase,
  deleteScheduleTask,
  deleteSchedulePhase,
  reorderScheduleTask,
  reorderSchedulePhase,
  restoreScheduleSnapshot,
  updateScheduleTask,
  updateScheduleNotes,
  updateSchedulePhase,
} from '@/modules/schedules/actions'
import { Button } from '@/components/ui/button'
import { formatDate, formatDateInput } from '@/lib/utils'
import { useConfirm } from '@/components/ui/use-confirm'
import { useToast } from '@/components/ui/use-toast'

type Phase = {
  id: string
  name: string
  startDate: string
  endDate: string
  color: string | null
  notes: string | null
  tasks: Task[]
}

type Task = {
  id: string
  name: string
  startDate: string | null
  endDate: string | null
  notes: string | null
  status: string
}

interface Props {
  scheduleId: string
  phases: Phase[]
  notes: string | null
  canEdit: boolean
}

// The Gantt palette lives in one place; three copies of the same ten
// hex values meant a recolour that only landed on two of the three views.
const COLORS = PHASE_COLOR_PALETTE

function dateOnly(value: string | Date) {
  const d = new Date(value)
  d.setHours(0, 0, 0, 0)
  return d
}

function dayDiff(a: string | Date, b: string | Date) {
  return Math.round((dateOnly(b).getTime() - dateOnly(a).getTime()) / 86400000)
}

function addDays(value: string | Date, days: number) {
  const d = dateOnly(value)
  d.setDate(d.getDate() + days)
  return d
}

function defaultEndDate(start: string) {
  return formatDateInput(addDays(start, 4))
}

function buildSnapshotJson(phases: Phase[], notes: string | null) {
  const payload = {
    notes: notes ?? null,
    phases: phases.map((phase, index) => ({
      name: phase.name,
      startDate: phase.startDate,
      endDate: phase.endDate,
      color: phase.color,
      notes: phase.notes,
      sortOrder: index,
      tasks: phase.tasks.map((task, taskIndex) => ({
        name: task.name,
        startDate: task.startDate,
        endDate: task.endDate,
        notes: task.notes,
        status: task.status,
        sortOrder: taskIndex,
      })),
    })),
  }
  return JSON.stringify(payload)
}

export function ScheduleClient({ scheduleId, phases, notes, canEdit }: Props) {
  const { toastError, toaster } = useToast()
  const { confirm, dialog } = useConfirm()
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [adding, setAdding] = useState(false)
  const [notesDraft, setNotesDraft] = useState(notes ?? '')
  const [initialSnapshot] = useState(() => buildSnapshotJson(phases, notes))
  const currentSnapshot = buildSnapshotJson(phases, notes)
  const hasUnsavedSessionChanges = currentSnapshot !== initialSnapshot

  async function restoreInitial() {
    const ok = await confirm({
      title: 'Ripristinare il cronograma?',
      description: 'Tutte le modifiche fatte in questa sessione verranno annullate.',
      confirmLabel: 'Ripristina',
      destructive: true,
    })
    if (!ok) return
    startTransition(async () => {
      const result = await restoreScheduleSnapshot(scheduleId, initialSnapshot)
      if (result?.error) toastError(result.error)
      else router.refresh()
    })
  }
  const [newName, setNewName] = useState('')
  const [newStart, setNewStart] = useState(() => {
    const last = phases[phases.length - 1]
    return last ? formatDateInput(addDays(last.endDate, 1)) : formatDateInput(new Date())
  })
  const [newEnd, setNewEnd] = useState(() => defaultEndDate(newStart))
  const [newColor, setNewColor] = useState(COLORS[0])

  const timeline = useMemo(() => {
    if (phases.length === 0) return null
    const starts = phases.map((phase) => dateOnly(phase.startDate).getTime())
    const ends = phases.map((phase) => dateOnly(phase.endDate).getTime())
    const min = new Date(Math.min(...starts))
    const max = new Date(Math.max(...ends))
    const totalDays = Math.max(1, dayDiff(min, max) + 1)
    const tickEvery = Math.max(1, Math.ceil(totalDays / 8))
    const ticks = Array.from({ length: Math.ceil(totalDays / tickEvery) + 1 }, (_, index) => {
      const offset = Math.min(index * tickEvery, totalDays - 1)
      return { offset, date: addDays(min, offset) }
    })
    return { min, max, totalDays, tickEvery, ticks }
  }, [phases])

  function refresh() {
    router.refresh()
  }

  function patch(phaseId: string, data: Parameters<typeof updateSchedulePhase>[1]) {
    startTransition(async () => {
      const result = await updateSchedulePhase(phaseId, data)
      if (result?.error) toastError(result.error)
      else refresh()
    })
  }

  function addPhase() {
    if (!newName.trim()) return
    startTransition(async () => {
      const result = await createSchedulePhase(scheduleId, {
        name: newName,
        startDate: newStart,
        endDate: newEnd,
        color: newColor,
      })
      if (result?.error) {
        toastError(result.error)
        return
      }
      const nextStart = formatDateInput(addDays(newEnd, 1))
      setNewName('')
      setNewStart(nextStart)
      setNewEnd(defaultEndDate(nextStart))
      setNewColor(COLORS[0])
      setAdding(false)
      refresh()
    })
  }

  async function removePhase(phaseId: string) {
    const ok = await confirm({
      title: 'Eliminare la fase?',
      description: 'Le attività contenute nella fase verranno eliminate con essa.',
      confirmLabel: 'Elimina',
      destructive: true,
    })
    if (!ok) return
    startTransition(async () => {
      const result = await deleteSchedulePhase(phaseId)
      if (result?.error) toastError(result.error)
      else refresh()
    })
  }

  function reorder(phaseId: string, direction: 'up' | 'down') {
    startTransition(async () => {
      const result = await reorderSchedulePhase(phaseId, direction)
      if (result?.error) toastError(result.error)
      else refresh()
    })
  }

  function addTask(phaseId: string, data: { name: string; startDate?: string; endDate?: string; notes?: string }) {
    startTransition(async () => {
      const result = await createScheduleTask(phaseId, data)
      if (result?.error) toastError(result.error)
      else refresh()
    })
  }

  function patchTask(taskId: string, data: Parameters<typeof updateScheduleTask>[1]) {
    startTransition(async () => {
      const result = await updateScheduleTask(taskId, data)
      if (result?.error) toastError(result.error)
      else refresh()
    })
  }

  function saveNotes() {
    startTransition(async () => {
      const result = await updateScheduleNotes(scheduleId, notesDraft)
      if (result?.error) toastError(result.error)
      else refresh()
    })
  }

  async function removeTask(taskId: string) {
    const ok = await confirm({
      title: 'Eliminare l’attività?',
      confirmLabel: 'Elimina',
      destructive: true,
    })
    if (!ok) return
    startTransition(async () => {
      const result = await deleteScheduleTask(taskId)
      if (result?.error) toastError(result.error)
      else refresh()
    })
  }

  function reorderTask(taskId: string, direction: 'up' | 'down') {
    startTransition(async () => {
      const result = await reorderScheduleTask(taskId, direction)
      if (result?.error) toastError(result.error)
      else refresh()
    })
  }

  return (
    <div className="space-y-5">
      {toaster}
      {dialog}
      {canEdit && hasUnsavedSessionChanges && (
        <div className="flex flex-col gap-2 rounded-control border border-attention-border bg-attention-surface px-3 py-2 text-body text-attention sm:flex-row sm:items-center sm:justify-between">
          <span>Hai modificato il cronograma in questa sessione. Le modifiche sono già salvate.</span>
          <button
            type="button"
            onClick={restoreInitial}
            disabled={isPending}
            className="inline-flex items-center gap-1.5 rounded-control border border-attention bg-surface px-2.5 py-1 text-label font-medium text-attention hover:bg-attention-surface disabled:opacity-50"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            Ripristina stato iniziale
          </button>
        </div>
      )}

      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
        <div className="flex items-center gap-2 text-body text-ink-muted">
          <CalendarDays className="h-4 w-4" />
          <span>{phases.length} fasi</span>
          {timeline && (
            <span>
              {formatDate(timeline.min)} - {formatDate(timeline.max)}
            </span>
          )}
        </div>
        <div className="flex-1" />
        {canEdit && !adding && (
          <Button type="button" variant="secondary" size="sm" onClick={() => setAdding(true)}>
            <Plus className="h-4 w-4" />
            Aggiungi fase
          </Button>
        )}
      </div>

      {adding && canEdit && (
        <div className="rounded-control border border-action-border bg-action-surface/40 p-3">
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-12">
            <input
              autoFocus
              type="text"
              value={newName}
              onChange={(event) => setNewName(event.target.value)}
              placeholder="Nome fase"
              className="rounded-control border border-line px-2 py-1.5 text-body sm:col-span-5"
            />
            <input
              type="date"
              value={newStart}
              onChange={(event) => {
                setNewStart(event.target.value)
                if (newEnd < event.target.value) setNewEnd(defaultEndDate(event.target.value))
              }}
              className="rounded-control border border-line px-2 py-1.5 text-body sm:col-span-2"
            />
            <input
              type="date"
              value={newEnd}
              onChange={(event) => setNewEnd(event.target.value)}
              className="rounded-control border border-line px-2 py-1.5 text-body sm:col-span-2"
            />
            <ColorPicker value={newColor} onChange={setNewColor} className="sm:col-span-3" />
          </div>
          <div className="mt-2 flex justify-end gap-2">
            <Button type="button" variant="ghost" size="sm" onClick={() => setAdding(false)}>
              Annulla
            </Button>
            <Button type="button" size="sm" onClick={addPhase} disabled={isPending || !newName.trim()}>
              {isPending && <Loader2 className="h-4 w-4 animate-spin" />}
              Aggiungi
            </Button>
          </div>
        </div>
      )}

      {phases.length === 0 ? (
        <div className="rounded-control border border-dashed border-line bg-surface p-8 text-center text-body text-ink-muted">
          Nessuna fase ancora.
        </div>
      ) : (
        <>
          <div className="space-y-2">
            {phases.map((phase, index) => (
              <PhaseRow
                key={phase.id}
                phase={phase}
                color={phase.color || COLORS[index % COLORS.length]}
                canEdit={canEdit}
                isPending={isPending}
                onPatch={(data) => patch(phase.id, data)}
                onMoveUp={() => reorder(phase.id, 'up')}
                onMoveDown={() => reorder(phase.id, 'down')}
                onDelete={() => removePhase(phase.id)}
                onAddTask={(data) => addTask(phase.id, data)}
                onPatchTask={patchTask}
                onDeleteTask={removeTask}
                onMoveTask={reorderTask}
              />
            ))}
          </div>

          {timeline && (
            <div className="rounded-control border border-line bg-surface">
              <div className="border-b border-line px-4 py-2 text-body font-medium text-ink">
                Timeline
              </div>
              <div className="overflow-x-auto p-3">
                <div
                  className="space-y-2"
                  style={{ minWidth: Math.max(680, timeline.totalDays * 22 + 240) }}
                >
                  <div className="grid grid-cols-[220px_1fr] gap-3 text-label text-ink-muted">
                    <div className="sticky left-0 z-10 bg-surface" />
                    <div className="relative h-7 border-b border-line">
                      {timeline.ticks.map((tick) => (
                        <div
                          key={tick.offset}
                          className="absolute top-0 h-7 border-l border-line pl-1"
                          style={{ left: `${(tick.offset / Math.max(1, timeline.totalDays - 1)) * 100}%` }}
                        >
                          {formatDate(tick.date)}
                        </div>
                      ))}
                    </div>
                  </div>
                  {phases.map((phase, index) => {
                    const startOffset = Math.max(0, dayDiff(timeline.min, phase.startDate))
                    const duration = Math.max(1, dayDiff(phase.startDate, phase.endDate) + 1)
                    const color = phase.color || COLORS[index % COLORS.length]
                    return (
                      <div key={phase.id} className="grid grid-cols-[220px_1fr] items-center gap-3">
                        <div className="sticky left-0 z-10 truncate bg-surface pr-2 text-body text-ink">{phase.name}</div>
                        <div className="relative h-7 rounded bg-surface-raised">
                          <div
                            className="absolute top-1 h-5 rounded"
                            style={{
                              left: `${(startOffset / timeline.totalDays) * 100}%`,
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
            </div>
          )}
        </>
      )}

      {canEdit && (
        <section className="rounded-control border border-line bg-surface p-3 sm:p-4">
          <label className="block text-body font-medium text-ink">
            Note generali
            <textarea
              value={notesDraft}
              onChange={(event) => setNotesDraft(event.target.value)}
              rows={4}
              placeholder="Note libere da stampare alla fine del PDF del cronograma"
              className="mt-2 w-full rounded-control border border-line px-3 py-2 text-body leading-relaxed outline-none focus:border-action focus:ring-1 focus:ring-action"
            />
          </label>
          <div className="mt-2 flex justify-end">
            <Button type="button" size="sm" onClick={saveNotes} disabled={isPending || notesDraft === (notes ?? '')}>
              {isPending && <Loader2 className="h-4 w-4 animate-spin" />}
              Salva note
            </Button>
          </div>
        </section>
      )}
    </div>
  )
}

function PhaseRow({
  phase,
  color,
  canEdit,
  isPending,
  onPatch,
  onMoveUp,
  onMoveDown,
  onDelete,
  onAddTask,
  onPatchTask,
  onDeleteTask,
  onMoveTask,
}: {
  phase: Phase
  color: string
  canEdit: boolean
  isPending: boolean
  onPatch: (data: Parameters<typeof updateSchedulePhase>[1]) => void
  onMoveUp: () => void
  onMoveDown: () => void
  onDelete: () => void
  onAddTask: (data: { name: string; startDate?: string; endDate?: string; notes?: string }) => void
  onPatchTask: (taskId: string, data: Parameters<typeof updateScheduleTask>[1]) => void
  onDeleteTask: (taskId: string) => void
  onMoveTask: (taskId: string, direction: 'up' | 'down') => void
}) {
  const [expanded, setExpanded] = useState(Boolean(phase.notes))
  const [addingTask, setAddingTask] = useState(false)
  const [taskName, setTaskName] = useState('')
  const [taskStart, setTaskStart] = useState(formatDateInput(phase.startDate))
  const [taskEnd, setTaskEnd] = useState(formatDateInput(phase.startDate))

  function submitTask() {
    if (!taskName.trim()) return
    onAddTask({ name: taskName, startDate: taskStart, endDate: taskEnd })
    setTaskName('')
    setTaskStart(formatDateInput(phase.startDate))
    setTaskEnd(formatDateInput(phase.startDate))
    setAddingTask(false)
  }

  return (
    <div className="rounded-control border border-line bg-surface p-3">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start">
        <div className="flex min-w-0 flex-1 gap-3">
          <span className="mt-1 h-4 w-4 shrink-0 rounded-full" style={{ backgroundColor: color }} />
          <div className="min-w-0 flex-1">
            {canEdit ? (
              <InlineText value={phase.name} onChange={(value) => onPatch({ name: value })} />
            ) : (
              <p className="text-body font-medium text-ink">{phase.name}</p>
            )}
            <div className="mt-2 grid grid-cols-2 gap-2 sm:max-w-sm">
              <label className="text-label text-ink-muted">
                Inizio
                <DateInput
                  value={formatDateInput(phase.startDate)}
                  disabled={!canEdit}
                  onCommit={(value) => onPatch({ startDate: value })}
                />
              </label>
              <label className="text-label text-ink-muted">
                Fine
                <DateInput
                  value={formatDateInput(phase.endDate)}
                  disabled={!canEdit}
                  onCommit={(value) => onPatch({ endDate: value })}
                />
              </label>
            </div>
            {canEdit && (
              <div className="mt-2">
                <p className="mb-1 text-label text-ink-muted">Colore</p>
                <ColorPicker value={phase.color || color} onChange={(value) => onPatch({ color: value })} />
              </div>
            )}

            {expanded && canEdit && (
              <div className="mt-3 space-y-2">
                <textarea
                  rows={2}
                  defaultValue={phase.notes ?? ''}
                  onBlur={(event) => {
                    const next = event.target.value
                    if (next !== (phase.notes ?? '')) onPatch({ notes: next || null })
                  }}
                  placeholder="Note"
                  className="w-full rounded-control border border-line px-2 py-1.5 text-body"
                />
              </div>
            )}

            <div className="mt-3 border-t border-line pt-3">
              <div className="mb-2 flex items-center justify-between gap-2">
                <p className="text-label font-medium uppercase tracking-wide text-ink-muted">
                  Attività ({phase.tasks.length})
                </p>
                {canEdit && !addingTask && (
                  <button
                    type="button"
                    onClick={() => setAddingTask(true)}
                    className="inline-flex items-center gap-1 rounded-control px-2 py-1 text-label text-action hover:bg-action-surface"
                  >
                    <Plus className="h-3.5 w-3.5" />
                    Aggiungi
                  </button>
                )}
              </div>

              {addingTask && canEdit && (
                <div className="mb-2 rounded-control border border-action-border bg-action-surface/50 p-2">
                  <div className="grid grid-cols-1 gap-2 sm:grid-cols-12">
                    <input
                      autoFocus
                      type="text"
                      value={taskName}
                      onChange={(event) => setTaskName(event.target.value)}
                      placeholder="Nome attività"
                      className="rounded-control border border-line px-2 py-1.5 text-body sm:col-span-6"
                    />
                    <input
                      type="date"
                      value={taskStart}
                      onChange={(event) => {
                        setTaskStart(event.target.value)
                        if (taskEnd < event.target.value) setTaskEnd(event.target.value)
                      }}
                      className="rounded-control border border-line px-2 py-1.5 text-body sm:col-span-3"
                    />
                    <input
                      type="date"
                      value={taskEnd}
                      onChange={(event) => setTaskEnd(event.target.value)}
                      className="rounded-control border border-line px-2 py-1.5 text-body sm:col-span-3"
                    />
                  </div>
                  <div className="mt-2 flex justify-end gap-2">
                    <button type="button" onClick={() => setAddingTask(false)} className="rounded-control px-2 py-1 text-label text-ink-muted hover:bg-surface-raised">
                      Annulla
                    </button>
                    <button type="button" onClick={submitTask} disabled={!taskName.trim() || isPending} className="rounded-control bg-action px-2 py-1 text-label font-medium text-ink-inverse disabled:opacity-50">
                      Aggiungi
                    </button>
                  </div>
                </div>
              )}

              {phase.tasks.length === 0 ? (
                <p className="rounded-control bg-surface-raised px-3 py-2 text-label text-ink-muted">Nessuna attività in questa fase.</p>
              ) : (
                <div className="space-y-1.5">
                  {phase.tasks.map((task) => (
                    <TaskRow
                      key={task.id}
                      task={task}
                      phaseStart={phase.startDate}
                      phaseEnd={phase.endDate}
                      canEdit={canEdit}
                      isPending={isPending}
                      onPatch={(data) => onPatchTask(task.id, data)}
                      onMoveUp={() => onMoveTask(task.id, 'up')}
                      onMoveDown={() => onMoveTask(task.id, 'down')}
                      onDelete={() => onDeleteTask(task.id)}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {canEdit && (
          <div className="flex shrink-0 items-center justify-end gap-1">
            <button type="button" onClick={onMoveUp} disabled={isPending} className="rounded p-1 text-ink-muted hover:bg-surface-raised hover:text-ink" aria-label="Sposta su">
              <ArrowUp className="h-3.5 w-3.5" />
            </button>
            <button type="button" onClick={onMoveDown} disabled={isPending} className="rounded p-1 text-ink-muted hover:bg-surface-raised hover:text-ink" aria-label="Sposta giu">
              <ArrowDown className="h-3.5 w-3.5" />
            </button>
            <button type="button" onClick={() => setExpanded((value) => !value)} className="rounded px-2 py-1 text-label text-ink-muted hover:bg-surface-raised hover:text-ink">
              {expanded ? '-' : '+'}
            </button>
            <button type="button" onClick={onDelete} disabled={isPending} className="rounded p-1 text-ink-muted hover:bg-negative-surface hover:text-negative" aria-label="Elimina">
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

function TaskRow({
  task,
  phaseStart,
  phaseEnd,
  canEdit,
  isPending,
  onPatch,
  onMoveUp,
  onMoveDown,
  onDelete,
}: {
  task: Task
  phaseStart: string
  phaseEnd: string
  canEdit: boolean
  isPending: boolean
  onPatch: (data: Parameters<typeof updateScheduleTask>[1]) => void
  onMoveUp: () => void
  onMoveDown: () => void
  onDelete: () => void
}) {
  const [expanded, setExpanded] = useState(Boolean(task.notes))
  const startsOutside = task.startDate ? dayDiff(phaseStart, task.startDate) < 0 : false
  const endsOutside = task.endDate ? dayDiff(task.endDate, phaseEnd) < 0 : false
  const outside = startsOutside || endsOutside

  return (
    <div className={`rounded-control border px-2 py-2 ${outside ? 'border-attention-border bg-attention-surface/40' : 'border-line bg-surface-raised/70'}`}>
      <div className="flex flex-col gap-2 sm:flex-row sm:items-start">
        <div className="min-w-0 flex-1">
          {canEdit ? (
            <InlineText value={task.name} onChange={(value) => onPatch({ name: value })} />
          ) : (
            <p className="text-body font-medium text-ink">{task.name}</p>
          )}
          <div className="mt-1 grid grid-cols-2 gap-2 sm:max-w-sm">
            <label className="text-label text-ink-muted">
              Inizio
              <DateInput
                value={formatDateInput(task.startDate)}
                disabled={!canEdit}
                onCommit={(value) => onPatch({ startDate: value || null })}
                white
              />
            </label>
            <label className="text-label text-ink-muted">
              Fine
              <DateInput
                value={formatDateInput(task.endDate)}
                disabled={!canEdit}
                onCommit={(value) => onPatch({ endDate: value || null })}
                white
              />
            </label>
          </div>
          {outside && (
            <p className="mt-1 text-label text-attention">Data fuori dall&apos;intervallo della fase.</p>
          )}
          {expanded && canEdit && (
            <div className="mt-2 grid grid-cols-1 gap-2 sm:grid-cols-[160px_1fr]">
              <select
                value={task.status}
                onChange={(event) => onPatch({ status: event.target.value as 'PENDING' | 'IN_PROGRESS' | 'DONE' })}
                className="rounded-control border border-line bg-surface px-2 py-1 text-body"
              >
                <option value="PENDING">Da fare</option>
                <option value="IN_PROGRESS">In corso</option>
                <option value="DONE">Fatto</option>
              </select>
              <textarea
                rows={2}
                defaultValue={task.notes ?? ''}
                onBlur={(event) => {
                  const next = event.target.value
                  if (next !== (task.notes ?? '')) onPatch({ notes: next || null })
                }}
                placeholder="Note attività"
                className="rounded-control border border-line bg-surface px-2 py-1.5 text-body"
              />
            </div>
          )}
        </div>

        {canEdit && (
          <div className="flex shrink-0 items-center justify-end gap-1">
            <button type="button" onClick={onMoveUp} disabled={isPending} className="rounded p-1 text-ink-muted hover:bg-surface hover:text-ink" aria-label="Sposta su">
              <ArrowUp className="h-3.5 w-3.5" />
            </button>
            <button type="button" onClick={onMoveDown} disabled={isPending} className="rounded p-1 text-ink-muted hover:bg-surface hover:text-ink" aria-label="Sposta giu">
              <ArrowDown className="h-3.5 w-3.5" />
            </button>
            <button type="button" onClick={() => setExpanded((value) => !value)} className="rounded px-2 py-1 text-label text-ink-muted hover:bg-surface hover:text-ink">
              {expanded ? '-' : '+'}
            </button>
            <button type="button" onClick={onDelete} disabled={isPending} className="rounded p-1 text-ink-muted hover:bg-negative-surface hover:text-negative" aria-label="Elimina">
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

function InlineText({ value, onChange }: { value: string; onChange: (value: string) => void }) {
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(value)

  function save() {
    const next = draft.trim()
    setEditing(false)
    if (next && next !== value) onChange(next)
  }

  if (!editing) {
    return (
      <button
        type="button"
        onClick={() => {
          setDraft(value)
          setEditing(true)
        }}
        className="block max-w-full whitespace-pre-wrap break-words text-left text-body font-medium text-ink"
      >
        {value}
      </button>
    )
  }

  return (
    <div className="space-y-2">
      <textarea
        autoFocus
        value={draft}
        rows={3}
        onChange={(event) => setDraft(event.target.value)}
        onKeyDown={(event) => {
          if (event.key === 'Enter' && (event.ctrlKey || event.metaKey)) save()
          if (event.key === 'Escape') {
            setDraft(value)
            setEditing(false)
          }
        }}
        className="w-full rounded-control border border-action px-2 py-1.5 text-body font-medium leading-relaxed outline-none"
      />
      <div className="flex justify-end gap-2">
        <button
          type="button"
          onClick={() => {
            setDraft(value)
            setEditing(false)
          }}
          className="rounded-control px-2 py-1 text-label text-ink-muted hover:bg-surface-raised"
        >
          Annulla
        </button>
        <button
          type="button"
          onClick={save}
          disabled={!draft.trim()}
          className="rounded-control bg-action px-2 py-1 text-label font-medium text-ink-inverse disabled:opacity-50"
        >
          Salva
        </button>
      </div>
    </div>
  )
}

function DateInput({
  value,
  disabled,
  onCommit,
  white,
}: {
  value: string
  disabled?: boolean
  onCommit: (value: string) => void
  white?: boolean
}) {
  const [draft, setDraft] = useState(value)
  const [lastExternal, setLastExternal] = useState(value)

  if (lastExternal !== value) {
    setLastExternal(value)
    setDraft(value)
  }

  return (
    <input
      type="date"
      value={draft}
      disabled={disabled}
      onChange={(event) => setDraft(event.target.value)}
      onBlur={() => {
        if (draft !== value) onCommit(draft)
      }}
      onKeyDown={(event) => {
        if (event.key === 'Enter') {
          event.preventDefault()
          ;(event.target as HTMLInputElement).blur()
        }
        if (event.key === 'Escape') {
          setDraft(value)
          ;(event.target as HTMLInputElement).blur()
        }
      }}
      className={`mt-0.5 w-full rounded-control border border-line px-2 py-1 text-body text-ink ${white ? 'bg-surface' : ''}`}
    />
  )
}

function ColorPicker({
  value,
  onChange,
  className,
}: {
  value: string
  onChange: (value: string) => void
  className?: string
}) {
  return (
    <div className={`flex flex-wrap items-center gap-1.5 ${className ?? ''}`}>
      {COLORS.map((color) => (
        <button
          key={color}
          type="button"
          onClick={() => onChange(color)}
          className={`h-7 w-7 rounded-full border-2 ${value === color ? 'border-ink' : 'border-white'} shadow-sm ring-1 ring-line`}
          style={{ backgroundColor: color }}
          title={color}
        />
      ))}
    </div>
  )
}
