'use server'

import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { prisma } from '@/lib/db'
import { canDelete, canMutate, getSession } from '@/lib/auth'
import { logActivity } from '@/lib/activity-log'
import { phaseColorAt } from '@/lib/schedule-colors'

export type ActionResult = { error?: string; id?: string }
export type ScheduleImportMode = 'replace' | 'append'

const DEFAULT_PHASE_DURATION_DAYS = 5
const TASK_STATUS_VALUES = ['PENDING', 'IN_PROGRESS', 'DONE'] as const

function addBusinessDays(start: Date, days: number) {
  const next = new Date(start)
  let added = 0
  while (added < Math.max(0, days - 1)) {
    next.setDate(next.getDate() + 1)
    const dow = next.getDay()
    if (dow !== 0 && dow !== 6) added++
  }
  return next
}

function asDate(value: string | Date | undefined | null, fallback: Date): Date {
  if (!value) return fallback
  const d = new Date(value)
  return isNaN(d.getTime()) ? fallback : d
}

function addDays(start: Date, days: number) {
  const next = new Date(start)
  next.setDate(next.getDate() + days)
  return next
}

function clampDate(date: Date, min: Date, max: Date) {
  if (date < min) return new Date(min)
  if (date > max) return new Date(max)
  return date
}

function distributeTaskDate(phaseStart: Date, phaseEnd: Date, index: number, total: number) {
  if (total <= 1) return { startDate: new Date(phaseStart), endDate: new Date(phaseEnd) }
  const days = Math.max(0, Math.round((phaseEnd.getTime() - phaseStart.getTime()) / 86400000))
  const startOffset = Math.floor((days * index) / total)
  const endOffset = Math.max(startOffset, Math.floor((days * (index + 1)) / total))
  return {
    startDate: clampDate(addDays(phaseStart, startOffset), phaseStart, phaseEnd),
    endDate: clampDate(addDays(phaseStart, endOffset), phaseStart, phaseEnd),
  }
}

function normalizeForJsonDate(date: Date | null | undefined) {
  return date ? date.toISOString().split('T')[0] : undefined
}

type QuoteScheduleSection = {
  section: { id: string; description: string }
  tasks: Array<{ id: string; description: string; sourceNote: string | null }>
}

function quoteItemsToScheduleSections(items: Array<{
  id: string
  itemType: string
  description: string
  sourceNote: string | null
}>): QuoteScheduleSection[] {
  const sections: QuoteScheduleSection[] = []
  let current: QuoteScheduleSection | null = null

  for (const item of items) {
    if (item.itemType === 'SECTION' && item.description.trim()) {
      current = { section: { id: item.id, description: item.description }, tasks: [] }
      sections.push(current)
      continue
    }

    if (item.itemType === 'ITEM' && item.description.trim()) {
      if (!current) {
        current = { section: { id: 'general', description: 'Attività generali' }, tasks: [] }
        sections.push(current)
      }
      current.tasks.push({ id: item.id, description: item.description, sourceNote: item.sourceNote })
    }
  }

  return sections
}

async function ensureScheduleRecord(projectId: string) {
  const existing = await prisma.projectSchedule.findUnique({ where: { projectId }, select: { id: true } })
  if (existing) return existing
  return prisma.projectSchedule.create({ data: { projectId }, select: { id: true } })
}

// ─── Ensure schedule exists ─────────────────────────────────────────────────

export async function ensureSchedule(projectId: string): Promise<ActionResult> {
  const session = await getSession()
  if (!session || !canMutate(session.role)) return { error: 'Non autorizzato' }

  const project = await prisma.project.findUnique({ where: { id: projectId }, select: { id: true } })
  if (!project) return { error: 'Opera non trovata' }

  const existing = await prisma.projectSchedule.findUnique({ where: { projectId }, select: { id: true } })
  if (existing) return { id: existing.id }

  const created = await prisma.projectSchedule.create({ data: { projectId }, select: { id: true } })
  await logActivity(session, 'CREATE', 'Cronograma', { entityId: created.id })
  revalidatePath(`/projects/${projectId}/schedule`)
  return { id: created.id }
}

// ─── Generate phases and tasks from a quote ─────────────────────────────────

export async function generateScheduleFromQuote(
  projectId: string,
  quoteId: string,
  startDate: string | undefined,
): Promise<ActionResult> {
  const session = await getSession()
  if (!session || !canMutate(session.role)) return { error: 'Non autorizzato' }

  const project = await prisma.project.findUnique({ where: { id: projectId }, select: { id: true, startDate: true } })
  if (!project) return { error: 'Opera non trovata' }

  const quote = await prisma.quote.findUnique({
    where: { id: quoteId },
    include: { items: { orderBy: { sortOrder: 'asc' } } },
  })
  if (!quote) return { error: 'Preventivo non trovato' }
  if (quote.projectId !== projectId) return { error: 'Il preventivo non appartiene a questa opera' }
  if (quote.status !== 'APPROVED' && quote.status !== 'INVOICED') {
    return { error: 'Usa un preventivo approvato per generare il cronograma' }
  }

  const sections = quoteItemsToScheduleSections(quote.items)
  if (sections.length === 0) return { error: 'Il preventivo non contiene sezioni o articoli; aggiungili o crea fasi manualmente' }

  const fallbackStart = new Date()
  fallbackStart.setHours(0, 0, 0, 0)
  const initialStart = asDate(startDate, asDate(project.startDate, fallbackStart))

  const existing = await prisma.projectSchedule.findUnique({ where: { projectId }, select: { id: true } })
  if (existing) await prisma.schedulePhase.deleteMany({ where: { scheduleId: existing.id } })

  const schedule = existing
    ? await prisma.projectSchedule.update({ where: { id: existing.id }, data: { updatedAt: new Date() }, select: { id: true } })
    : await prisma.projectSchedule.create({ data: { projectId }, select: { id: true } })

  let cursor = new Date(initialStart)
  let taskCount = 0
  for (const [idx, entry] of sections.entries()) {
    const start = new Date(cursor)
    const end = addBusinessDays(start, DEFAULT_PHASE_DURATION_DAYS)
    cursor = new Date(end)
    cursor.setDate(cursor.getDate() + 1)
    taskCount += entry.tasks.length

    await prisma.schedulePhase.create({
      data: {
        scheduleId: schedule.id,
        name: entry.section.description.replace(/^§\s*/, '').trim() || `Fase ${idx + 1}`,
        startDate: start,
        endDate: end,
        color: phaseColorAt(idx),
        sortOrder: idx,
        tasks: {
          create: entry.tasks.map((task, taskIdx) => {
            const dates = distributeTaskDate(start, end, taskIdx, entry.tasks.length)
            return {
              name: task.description,
              startDate: dates.startDate,
              endDate: dates.endDate,
              notes: task.sourceNote ?? undefined,
              sourceQuoteItemId: task.id,
              sortOrder: taskIdx,
              status: 'PENDING',
            }
          }),
        },
      },
    })
  }

  await logActivity(session, 'IMPORT', 'Cronograma', {
    entityId: schedule.id,
    details: { sourceQuoteId: quoteId, phaseCount: sections.length, taskCount },
  })

  revalidatePath(`/projects/${projectId}`)
  revalidatePath(`/projects/${projectId}/schedule`)
  return { id: schedule.id }
}

// ─── Phase CRUD ─────────────────────────────────────────────────────────────

const phaseUpdateSchema = z.object({
  name: z.string().min(1).optional(),
  startDate: z.preprocess((v) => (v ? new Date(v as string) : undefined), z.date().optional()),
  endDate: z.preprocess((v) => (v ? new Date(v as string) : undefined), z.date().optional()),
  color: z.string().nullable().optional(),
  notes: z.string().nullable().optional(),
})

type PhaseUpdateInput = {
  name?: string
  startDate?: string | Date
  endDate?: string | Date
  color?: string | null
  notes?: string | null
}

export async function updateSchedulePhase(phaseId: string, data: PhaseUpdateInput): Promise<ActionResult> {
  const session = await getSession()
  if (!session || !canMutate(session.role)) return { error: 'Non autorizzato' }
  const parsed = phaseUpdateSchema.safeParse(data)
  if (!parsed.success) return { error: 'Dati non validi' }

  const phase = await prisma.schedulePhase.findUnique({
    where: { id: phaseId },
    select: { schedule: { select: { projectId: true } } },
  })
  if (!phase) return { error: 'Fase non trovata' }

  if (parsed.data.startDate && parsed.data.endDate && parsed.data.endDate < parsed.data.startDate) {
    return { error: 'La data fine deve essere dopo la data inizio' }
  }

  await prisma.schedulePhase.update({ where: { id: phaseId }, data: parsed.data })
  revalidatePath(`/projects/${phase.schedule.projectId}/schedule`)
  return {}
}

export async function createSchedulePhase(
  scheduleId: string,
  data: { name: string; startDate: string; endDate: string; color?: string },
): Promise<ActionResult> {
  const session = await getSession()
  if (!session || !canMutate(session.role)) return { error: 'Non autorizzato' }
  if (!data.name?.trim()) return { error: 'Nome obbligatorio' }

  const schedule = await prisma.projectSchedule.findUnique({ where: { id: scheduleId }, select: { projectId: true } })
  if (!schedule) return { error: 'Cronograma non trovato' }

  const last = await prisma.schedulePhase.findFirst({
    where: { scheduleId },
    orderBy: { sortOrder: 'desc' },
    select: { sortOrder: true },
  })

  const start = new Date(data.startDate)
  const end = new Date(data.endDate)
  if (isNaN(start.getTime()) || isNaN(end.getTime()) || end < start) return { error: 'Date non valide' }

  const created = await prisma.schedulePhase.create({
    data: {
      scheduleId,
      name: data.name.trim(),
      startDate: start,
      endDate: end,
      color: data.color ?? undefined,
      sortOrder: (last?.sortOrder ?? -1) + 1,
    },
    select: { id: true },
  })

  revalidatePath(`/projects/${schedule.projectId}/schedule`)
  return { id: created.id }
}

export async function deleteSchedulePhase(phaseId: string): Promise<ActionResult> {
  const session = await getSession()
  if (!session || !canMutate(session.role)) return { error: 'Non autorizzato' }

  const phase = await prisma.schedulePhase.findUnique({
    where: { id: phaseId },
    select: { schedule: { select: { projectId: true } } },
  })
  if (!phase) return { error: 'Fase non trovata' }

  await prisma.schedulePhase.delete({ where: { id: phaseId } })
  revalidatePath(`/projects/${phase.schedule.projectId}/schedule`)
  return {}
}

export async function reorderSchedulePhase(phaseId: string, direction: 'up' | 'down'): Promise<ActionResult> {
  const session = await getSession()
  if (!session || !canMutate(session.role)) return { error: 'Non autorizzato' }

  const phase = await prisma.schedulePhase.findUnique({
    where: { id: phaseId },
    select: { id: true, scheduleId: true, sortOrder: true, schedule: { select: { projectId: true } } },
  })
  if (!phase) return { error: 'Fase non trovata' }

  const neighbours = await prisma.schedulePhase.findMany({
    where: { scheduleId: phase.scheduleId },
    orderBy: { sortOrder: 'asc' },
    select: { id: true, sortOrder: true },
  })
  const idx = neighbours.findIndex((n) => n.id === phaseId)
  const swap = direction === 'up' ? neighbours[idx - 1] : neighbours[idx + 1]
  if (!swap) return {}

  await prisma.$transaction([
    prisma.schedulePhase.update({ where: { id: phase.id }, data: { sortOrder: swap.sortOrder } }),
    prisma.schedulePhase.update({ where: { id: swap.id }, data: { sortOrder: phase.sortOrder } }),
  ])

  revalidatePath(`/projects/${phase.schedule.projectId}/schedule`)
  return {}
}

// ─── Task CRUD ──────────────────────────────────────────────────────────────

export async function updateScheduleNotes(scheduleId: string, notes: string | null): Promise<ActionResult> {
  const session = await getSession()
  if (!session || !canMutate(session.role)) return { error: 'Non autorizzato' }

  const schedule = await prisma.projectSchedule.findUnique({
    where: { id: scheduleId },
    select: { projectId: true },
  })
  if (!schedule) return { error: 'Cronograma non trovato' }

  await prisma.projectSchedule.update({
    where: { id: scheduleId },
    data: { notes: notes?.trim() || null },
  })

  revalidatePath(`/projects/${schedule.projectId}/schedule`)
  revalidatePath(`/projects/${schedule.projectId}/schedule/print`)
  return {}
}

const taskUpdateSchema = z.object({
  name: z.string().min(1).optional(),
  startDate: z.preprocess((v) => (v ? new Date(v as string) : undefined), z.date().optional().nullable()),
  endDate: z.preprocess((v) => (v ? new Date(v as string) : undefined), z.date().optional().nullable()),
  notes: z.string().nullable().optional(),
  status: z.enum(TASK_STATUS_VALUES).optional(),
})

type TaskUpdateInput = {
  name?: string
  startDate?: string | Date | null
  endDate?: string | Date | null
  notes?: string | null
  status?: typeof TASK_STATUS_VALUES[number]
}

export async function updateScheduleTask(taskId: string, data: TaskUpdateInput): Promise<ActionResult> {
  const session = await getSession()
  if (!session || !canMutate(session.role)) return { error: 'Non autorizzato' }
  const parsed = taskUpdateSchema.safeParse(data)
  if (!parsed.success) return { error: 'Dati non validi' }

  const task = await prisma.scheduleTask.findUnique({
    where: { id: taskId },
    select: { phase: { select: { schedule: { select: { projectId: true } } } } },
  })
  if (!task) return { error: 'Attività non trovata' }

  if (parsed.data.startDate && parsed.data.endDate && parsed.data.endDate < parsed.data.startDate) {
    return { error: 'La data fine deve essere dopo la data inizio' }
  }

  await prisma.scheduleTask.update({ where: { id: taskId }, data: parsed.data })
  revalidatePath(`/projects/${task.phase.schedule.projectId}/schedule`)
  return {}
}

export async function createScheduleTask(
  phaseId: string,
  data: { name: string; startDate?: string; endDate?: string; notes?: string },
): Promise<ActionResult> {
  const session = await getSession()
  if (!session || !canMutate(session.role)) return { error: 'Non autorizzato' }
  if (!data.name?.trim()) return { error: 'Nome obbligatorio' }

  const phase = await prisma.schedulePhase.findUnique({
    where: { id: phaseId },
    select: { startDate: true, endDate: true, schedule: { select: { projectId: true } } },
  })
  if (!phase) return { error: 'Fase non trovata' }

  const start = data.startDate ? new Date(data.startDate) : phase.startDate
  const end = data.endDate ? new Date(data.endDate) : start
  if (isNaN(start.getTime()) || isNaN(end.getTime()) || end < start) return { error: 'Date non valide' }

  const last = await prisma.scheduleTask.findFirst({
    where: { phaseId },
    orderBy: { sortOrder: 'desc' },
    select: { sortOrder: true },
  })

  const created = await prisma.scheduleTask.create({
    data: {
      phaseId,
      name: data.name.trim(),
      startDate: start,
      endDate: end,
      notes: data.notes || null,
      sortOrder: (last?.sortOrder ?? -1) + 1,
      status: 'PENDING',
    },
    select: { id: true },
  })

  revalidatePath(`/projects/${phase.schedule.projectId}/schedule`)
  return { id: created.id }
}

export async function deleteScheduleTask(taskId: string): Promise<ActionResult> {
  const session = await getSession()
  if (!session || !canMutate(session.role)) return { error: 'Non autorizzato' }

  const task = await prisma.scheduleTask.findUnique({
    where: { id: taskId },
    select: { phase: { select: { schedule: { select: { projectId: true } } } } },
  })
  if (!task) return { error: 'Attività non trovata' }

  await prisma.scheduleTask.delete({ where: { id: taskId } })
  revalidatePath(`/projects/${task.phase.schedule.projectId}/schedule`)
  return {}
}

export async function reorderScheduleTask(taskId: string, direction: 'up' | 'down'): Promise<ActionResult> {
  const session = await getSession()
  if (!session || !canMutate(session.role)) return { error: 'Non autorizzato' }

  const task = await prisma.scheduleTask.findUnique({
    where: { id: taskId },
    select: { id: true, phaseId: true, sortOrder: true, phase: { select: { schedule: { select: { projectId: true } } } } },
  })
  if (!task) return { error: 'Attività non trovata' }

  const neighbours = await prisma.scheduleTask.findMany({
    where: { phaseId: task.phaseId },
    orderBy: { sortOrder: 'asc' },
    select: { id: true, sortOrder: true },
  })
  const idx = neighbours.findIndex((n) => n.id === taskId)
  const swap = direction === 'up' ? neighbours[idx - 1] : neighbours[idx + 1]
  if (!swap) return {}

  await prisma.$transaction([
    prisma.scheduleTask.update({ where: { id: task.id }, data: { sortOrder: swap.sortOrder } }),
    prisma.scheduleTask.update({ where: { id: swap.id }, data: { sortOrder: task.sortOrder } }),
  ])

  revalidatePath(`/projects/${task.phase.schedule.projectId}/schedule`)
  return {}
}

// ─── AI export/import ───────────────────────────────────────────────────────

const importTaskSchema = z.object({
  name: z.string().min(1),
  startDate: z.string().optional().nullable(),
  endDate: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
  status: z.enum(TASK_STATUS_VALUES).optional(),
})

const importPhaseSchema = z.object({
  name: z.string().min(1),
  startDate: z.string().optional().nullable(),
  endDate: z.string().optional().nullable(),
  durationBusinessDays: z.coerce.number().min(1).optional(),
  color: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
  tasks: z.array(importTaskSchema).optional().default([]),
})

const scheduleImportSchema = z.object({
  kind: z.literal('project_schedule').optional(),
  notes: z.string().optional().nullable(),
  phases: z.array(importPhaseSchema).min(1),
})

export async function importScheduleFromJson(
  projectId: string,
  jsonText: string,
  mode: ScheduleImportMode,
): Promise<ActionResult> {
  const session = await getSession()
  if (!session || !canMutate(session.role)) return { error: 'Non autorizzato' }

  const project = await prisma.project.findUnique({ where: { id: projectId }, select: { id: true, startDate: true, name: true } })
  if (!project) return { error: 'Opera non trovata' }

  let raw: unknown
  try {
    raw = JSON.parse(jsonText)
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'JSON non valido'
    return { error: `JSON non valido: ${msg}` }
  }

  const parsed = scheduleImportSchema.safeParse(raw)
  if (!parsed.success) {
    const first = parsed.error.issues[0]
    return { error: `Schema non valido: ${first.path.join('.') || 'root'} - ${first.message}` }
  }

  const schedule = await ensureScheduleRecord(projectId)
  if (mode === 'replace') {
    await prisma.schedulePhase.deleteMany({ where: { scheduleId: schedule.id } })
  }

  const last = mode === 'append'
    ? await prisma.schedulePhase.findFirst({ where: { scheduleId: schedule.id }, orderBy: { sortOrder: 'desc' }, select: { sortOrder: true, endDate: true } })
    : null

  const fallbackStart = new Date()
  fallbackStart.setHours(0, 0, 0, 0)
  let cursor = last?.endDate ? addDays(last.endDate, 1) : asDate(project.startDate, fallbackStart)
  let taskCount = 0

  for (const [idx, phase] of parsed.data.phases.entries()) {
    const start = asDate(phase.startDate, cursor)
    const end = asDate(phase.endDate, addBusinessDays(start, phase.durationBusinessDays ?? DEFAULT_PHASE_DURATION_DAYS))
    if (end < start) return { error: `Date non valide per fase "${phase.name}"` }
    cursor = addDays(end, 1)
    taskCount += phase.tasks.length

    const finalSortOrder = (last?.sortOrder ?? -1) + idx + 1
    await prisma.schedulePhase.create({
      data: {
        scheduleId: schedule.id,
        name: phase.name.trim(),
        startDate: start,
        endDate: end,
        color: phase.color || phaseColorAt(finalSortOrder),
        notes: phase.notes || undefined,
        sortOrder: finalSortOrder,
        tasks: {
          create: phase.tasks.map((task, taskIdx) => {
            const distributed = distributeTaskDate(start, end, taskIdx, phase.tasks.length)
            const taskStart = asDate(task.startDate, distributed.startDate)
            const taskEnd = asDate(task.endDate, distributed.endDate)
            return {
              name: task.name.trim(),
              startDate: taskStart,
              endDate: taskEnd < taskStart ? taskStart : taskEnd,
              notes: task.notes || undefined,
              status: task.status ?? 'PENDING',
              sortOrder: taskIdx,
            }
          }),
        },
      },
    })
  }

  await prisma.projectSchedule.update({
    where: { id: schedule.id },
    data: { notes: parsed.data.notes || undefined },
  })

  await logActivity(session, 'IMPORT', 'Cronograma', {
    entityId: schedule.id,
    entityLabel: project.name,
    details: { source: 'ai-json', mode, phaseCount: parsed.data.phases.length, taskCount },
  })

  revalidatePath(`/projects/${projectId}`)
  revalidatePath(`/projects/${projectId}/schedule`)
  return { id: schedule.id }
}

// ─── Restore snapshot (session undo) ───────────────────────────────────────

const restoreTaskSchema = z.object({
  name: z.string().min(1),
  startDate: z.string().nullable().optional(),
  endDate: z.string().nullable().optional(),
  notes: z.string().nullable().optional(),
  status: z.enum(TASK_STATUS_VALUES),
  sortOrder: z.number(),
  sourceQuoteItemId: z.string().nullable().optional(),
})

const restorePhaseSchema = z.object({
  name: z.string().min(1),
  startDate: z.string(),
  endDate: z.string(),
  color: z.string().nullable().optional(),
  notes: z.string().nullable().optional(),
  sortOrder: z.number(),
  tasks: z.array(restoreTaskSchema),
})

const restoreSnapshotSchema = z.object({
  notes: z.string().nullable().optional(),
  phases: z.array(restorePhaseSchema),
})

export async function restoreScheduleSnapshot(
  scheduleId: string,
  snapshotJson: string,
): Promise<ActionResult> {
  const session = await getSession()
  if (!session || !canMutate(session.role)) return { error: 'Non autorizzato' }

  const schedule = await prisma.projectSchedule.findUnique({
    where: { id: scheduleId },
    select: { id: true, projectId: true },
  })
  if (!schedule) return { error: 'Cronograma non trovato' }

  let raw: unknown
  try {
    raw = JSON.parse(snapshotJson)
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'JSON non valido'
    return { error: `Snapshot non valido: ${msg}` }
  }

  const parsed = restoreSnapshotSchema.safeParse(raw)
  if (!parsed.success) {
    const first = parsed.error.issues[0]
    return { error: `Snapshot non valido: ${first.path.join('.') || 'root'} - ${first.message}` }
  }

  await prisma.$transaction([
    prisma.schedulePhase.deleteMany({ where: { scheduleId } }),
    prisma.projectSchedule.update({
      where: { id: scheduleId },
      data: { notes: parsed.data.notes ?? null, updatedAt: new Date() },
    }),
  ])

  for (const phase of parsed.data.phases) {
    await prisma.schedulePhase.create({
      data: {
        scheduleId,
        name: phase.name,
        startDate: new Date(phase.startDate),
        endDate: new Date(phase.endDate),
        color: phase.color ?? undefined,
        notes: phase.notes ?? undefined,
        sortOrder: phase.sortOrder,
        tasks: {
          create: phase.tasks.map((task) => ({
            name: task.name,
            startDate: task.startDate ? new Date(task.startDate) : null,
            endDate: task.endDate ? new Date(task.endDate) : null,
            notes: task.notes ?? undefined,
            status: task.status,
            sortOrder: task.sortOrder,
            sourceQuoteItemId: task.sourceQuoteItemId ?? undefined,
          })),
        },
      },
    })
  }

  await logActivity(session, 'UPDATE', 'Cronograma', {
    entityId: scheduleId,
    details: { source: 'session-restore', phaseCount: parsed.data.phases.length },
  })

  revalidatePath(`/projects/${schedule.projectId}`)
  revalidatePath(`/projects/${schedule.projectId}/schedule`)
  return { id: scheduleId }
}

export async function exportScheduleAiContext(projectId: string): Promise<{ data?: unknown; error?: string }> {
  const session = await getSession()
  if (!session || !canMutate(session.role)) return { error: 'Non autorizzato' }

  const project = await prisma.project.findUnique({
    where: { id: projectId },
    include: { client: { select: { name: true } } },
  })
  if (!project) return { error: 'Opera non trovata' }

  const [quotes, schedule] = await Promise.all([
    prisma.quote.findMany({
      where: { projectId, status: { in: ['APPROVED', 'INVOICED'] } },
      orderBy: [{ version: 'desc' }, { updatedAt: 'desc' }],
      include: { items: { orderBy: { sortOrder: 'asc' } } },
    }),
    prisma.projectSchedule.findUnique({
      where: { projectId },
      include: { phases: { orderBy: { sortOrder: 'asc' }, include: { tasks: { orderBy: { sortOrder: 'asc' } } } } },
    }),
  ])

  return {
    data: {
      kind: 'schedule_ai_context',
      instructions: 'Genera SOLO JSON valido con kind="project_schedule". Usa phases[].tasks[] per le attivita dentro ogni fase. Ogni fase e ogni task possono avere startDate/endDate in formato YYYY-MM-DD. Non inventare dati non presenti senza scriverlo in notes.',
      project: {
        id: project.id,
        name: project.name,
        address: project.address,
        startDate: normalizeForJsonDate(project.startDate),
        endDate: normalizeForJsonDate(project.endDate),
        clientName: project.client.name,
      },
      approvedQuotes: quotes.map((quote) => ({
        id: quote.id,
        quoteNumber: quote.quoteNumber,
        version: quote.version,
        total: quote.total,
        items: quote.items.map((item) => ({
          type: item.itemType,
          description: item.description,
          unit: item.unit,
          quantity: item.quantity,
          sourceNote: item.sourceNote,
        })),
      })),
      currentSchedule: schedule ? {
        notes: schedule.notes,
        phases: schedule.phases.map((phase) => ({
          name: phase.name,
          startDate: normalizeForJsonDate(phase.startDate),
          endDate: normalizeForJsonDate(phase.endDate),
          color: phase.color,
          notes: phase.notes,
          tasks: phase.tasks.map((task) => ({
            name: task.name,
            startDate: normalizeForJsonDate(task.startDate),
            endDate: normalizeForJsonDate(task.endDate),
            status: task.status,
            notes: task.notes,
          })),
        })),
      } : null,
      expectedOutputSchema: {
        kind: 'project_schedule',
        notes: 'string optional',
        phases: [{
          name: 'string',
          startDate: 'YYYY-MM-DD optional',
          endDate: 'YYYY-MM-DD optional',
          color: '#2563eb optional',
          notes: 'string optional',
          tasks: [{ name: 'string', startDate: 'YYYY-MM-DD optional', endDate: 'YYYY-MM-DD optional', notes: 'string optional' }],
        }],
      },
    },
  }
}

export async function deleteSchedule(scheduleId: string): Promise<ActionResult> {
  const session = await getSession()
  if (!session || !canDelete(session.role)) return { error: 'Non autorizzato' }

  const schedule = await prisma.projectSchedule.findUnique({ where: { id: scheduleId }, select: { projectId: true } })
  if (!schedule) return { error: 'Cronograma non trovato' }

  await prisma.projectSchedule.delete({ where: { id: scheduleId } })
  await logActivity(session, 'DELETE', 'Cronograma', { entityId: scheduleId })

  revalidatePath(`/projects/${schedule.projectId}`)
  revalidatePath(`/projects/${schedule.projectId}/schedule`)
  return {}
}
