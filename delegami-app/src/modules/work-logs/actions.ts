'use server'

import { revalidatePath } from 'next/cache'
import { put, del } from '@vercel/blob'
import { z } from 'zod'
import { prisma } from '@/lib/db'
import { getSession, canMutate, canDelete } from '@/lib/auth'
import type { SessionUser } from '@/lib/auth'
import { logActivity } from '@/lib/activity-log'

export type WorkLogFormState = {
  errors?: Record<string, string[]>
  message?: string
  createdId?: string
} | null

type WorkLogRow = { userId: string; status: string }

/** A worker may only edit their own log while it is still a DRAFT. Admin/manager may edit anything. */
function canEditLog(session: SessionUser, log: WorkLogRow) {
  if (canMutate(session.role)) return true
  return log.userId === session.id && log.status === 'DRAFT'
}

function parseHours(raw: FormDataEntryValue | null): number {
  if (raw == null) return 0
  const normalized = String(raw).replace(',', '.').trim()
  const value = Number(normalized)
  return Number.isFinite(value) ? value : NaN
}

function parseWorkDate(raw: FormDataEntryValue | null): Date | null {
  if (!raw) return null
  const str = String(raw)
  // Store at local noon to avoid any date rollover when rendered in Europe/Zurich.
  const date = new Date(`${str}T12:00:00`)
  return Number.isNaN(date.getTime()) ? null : date
}

const workLogFieldSchema = z.object({
  hours: z.number().min(0, 'Ore non valide').max(24, 'Massimo 24 ore al giorno'),
  location: z.string().optional(),
  description: z.string().optional(),
  projectId: z.string().optional(),
})

function revalidateAll() {
  revalidatePath('/rapportino')
  revalidatePath('/rapportini')
}

/** True if the worker already has a log on the same calendar day (one rapportino per day). */
async function hasDuplicateDate(userId: string, workDate: Date, excludeId?: string): Promise<boolean> {
  const start = new Date(workDate); start.setHours(0, 0, 0, 0)
  const end = new Date(workDate); end.setHours(23, 59, 59, 999)
  const existing = await prisma.workLog.findFirst({
    where: { userId, workDate: { gte: start, lte: end }, ...(excludeId ? { id: { not: excludeId } } : {}) },
    select: { id: true },
  })
  return Boolean(existing)
}

// ─── Create ─────────────────────────────────────────────────────────────────

export async function createWorkLog(
  _prevState: WorkLogFormState,
  formData: FormData,
): Promise<WorkLogFormState> {
  const session = await getSession()
  if (!session) return { message: 'Non autorizzato' }

  const isManager = canMutate(session.role)

  // Who the hours belong to: a worker can only log for themselves.
  let targetUserId = session.id
  let targetUserName = session.name
  if (isManager) {
    const requested = (formData.get('userId') as string) || ''
    if (requested && requested !== session.id) {
      const target = await prisma.user.findUnique({ where: { id: requested }, select: { id: true, name: true } })
      if (!target) return { errors: { userId: ['Operaio non trovato'] } }
      targetUserId = target.id
      targetUserName = target.name
    }
  }

  // Snapshot the worker's current rates onto the log (valid-from-forward).
  const targetUser = await prisma.user.findUnique({ where: { id: targetUserId }, select: { hourlyRate: true, costRate: true } })

  const workDate = parseWorkDate(formData.get('workDate'))
  if (!workDate) return { errors: { workDate: ['Data obbligatoria'] } }

  const hours = parseHours(formData.get('hours'))
  const parsed = workLogFieldSchema.safeParse({
    hours,
    location: (formData.get('location') as string) || undefined,
    description: (formData.get('description') as string) || undefined,
    projectId: (formData.get('projectId') as string) || undefined,
  })
  if (!parsed.success) return { errors: parsed.error.flatten().fieldErrors }

  const submit = formData.get('submit') === 'true'

  // Evidence required before sending for review (a draft may stay incomplete).
  if (submit) {
    const missing: Record<string, string[]> = {}
    if (!parsed.data.location?.trim()) missing.location = ['Obbligatorio per inviare']
    if (!parsed.data.description?.trim()) missing.description = ['Obbligatorio per inviare']
    if (Object.keys(missing).length) return { errors: missing }
  }

  // One rapportino per worker per day.
  if (await hasDuplicateDate(targetUserId, workDate)) {
    return { errors: { workDate: ['Esiste già un rapportino per questa data — modifica quello invece di crearne uno nuovo.'] } }
  }

  // Fixed-price day override — managers only.
  const overrideRaw = isManager ? (formData.get('amountOverride') as string) : ''
  const amountOverride = overrideRaw?.trim() ? Number(overrideRaw.replace(',', '.')) : null

  const created = await prisma.workLog.create({
    data: {
      userId: targetUserId,
      userName: targetUserName,
      projectId: parsed.data.projectId || null,
      workDate,
      hours: parsed.data.hours,
      hourlyRate: targetUser?.hourlyRate ?? null,
      costRate: targetUser?.costRate ?? null,
      amountOverride: amountOverride != null && Number.isFinite(amountOverride) ? amountOverride : null,
      location: parsed.data.location || null,
      description: parsed.data.description || null,
      status: submit ? 'SUBMITTED' : 'DRAFT',
      submittedAt: submit ? new Date() : null,
      createdById: session.id,
      createdByName: session.name,
    },
  })

  await logActivity(session, submit ? 'SUBMIT' : 'CREATE', 'Rapportino', {
    entityId: created.id,
    entityLabel: `${targetUserName} — ${workDate.toISOString().slice(0, 10)}`,
    details: { hours: parsed.data.hours, forUserId: targetUserId },
  })
  revalidateAll()
  return { createdId: created.id }
}

// ─── Update ─────────────────────────────────────────────────────────────────

export async function updateWorkLog(
  id: string,
  _prevState: WorkLogFormState,
  formData: FormData,
): Promise<WorkLogFormState> {
  const session = await getSession()
  if (!session) return { message: 'Non autorizzato' }

  const log = await prisma.workLog.findUnique({ where: { id }, select: { userId: true, userName: true, status: true } })
  if (!log) return { message: 'Rapportino non trovato' }
  if (!canEditLog(session, log)) return { message: 'Non autorizzato' }

  const workDate = parseWorkDate(formData.get('workDate'))
  if (!workDate) return { errors: { workDate: ['Data obbligatoria'] } }

  const hours = parseHours(formData.get('hours'))
  const parsed = workLogFieldSchema.safeParse({
    hours,
    location: (formData.get('location') as string) || undefined,
    description: (formData.get('description') as string) || undefined,
    projectId: (formData.get('projectId') as string) || undefined,
  })
  if (!parsed.success) return { errors: parsed.error.flatten().fieldErrors }

  // One rapportino per worker per day (ignore this same log).
  if (await hasDuplicateDate(log.userId, workDate, id)) {
    return { errors: { workDate: ['Esiste già un rapportino per questa data.'] } }
  }

  await prisma.workLog.update({
    where: { id },
    data: {
      workDate,
      hours: parsed.data.hours,
      location: parsed.data.location || null,
      description: parsed.data.description || null,
      projectId: parsed.data.projectId || null,
    },
  })

  await logActivity(session, 'UPDATE', 'Rapportino', {
    entityId: id,
    entityLabel: `${log.userName} — ${workDate.toISOString().slice(0, 10)}`,
  })
  revalidateAll()
  return { createdId: id }
}

// ─── Submit / reopen ─────────────────────────────────────────────────────────

export async function submitWorkLog(id: string): Promise<{ error?: string }> {
  const session = await getSession()
  if (!session) return { error: 'Non autorizzato' }

  const log = await prisma.workLog.findUnique({ where: { id }, select: { userId: true, userName: true, status: true } })
  if (!log) return { error: 'Rapportino non trovato' }
  // Worker can submit their own; admin/manager can submit anyone's.
  if (!canMutate(session.role) && log.userId !== session.id) return { error: 'Non autorizzato' }

  await prisma.workLog.update({ where: { id }, data: { status: 'SUBMITTED', submittedAt: new Date() } })
  await logActivity(session, 'SUBMIT', 'Rapportino', { entityId: id, entityLabel: log.userName })
  revalidateAll()
  return {}
}

/** Admin/manager unlocks a submitted or approved log back to DRAFT so it can be corrected. */
export async function reopenWorkLog(id: string): Promise<{ error?: string }> {
  const session = await getSession()
  if (!session || !canMutate(session.role)) return { error: 'Non autorizzato' }

  const log = await prisma.workLog.findUnique({ where: { id }, select: { userName: true } })
  if (!log) return { error: 'Rapportino non trovato' }

  await prisma.workLog.update({
    where: { id },
    data: { status: 'DRAFT', submittedAt: null, approvedAt: null, revisionRequestedAt: null, revisionReason: null },
  })
  await logActivity(session, 'REOPEN', 'Rapportino', { entityId: id, entityLabel: log.userName })
  revalidateAll()
  return {}
}

/**
 * Worker asks to edit a log that's already locked (SUBMITTED or APPROVED). This does not
 * unlock it — it flags the log so the admin/manager sees the request and can reopen it.
 */
export async function requestWorkLogRevision(id: string, reason?: string): Promise<{ error?: string }> {
  const session = await getSession()
  if (!session) return { error: 'Non autorizzato' }

  const log = await prisma.workLog.findUnique({ where: { id }, select: { userId: true, userName: true, status: true } })
  if (!log) return { error: 'Rapportino non trovato' }
  // The owner (or an admin/manager) can request a revision; only on locked logs.
  if (!canMutate(session.role) && log.userId !== session.id) return { error: 'Non autorizzato' }
  if (log.status === 'DRAFT') return { error: 'Il rapportino è già modificabile' }

  await prisma.workLog.update({
    where: { id },
    data: { revisionRequestedAt: new Date(), revisionReason: reason?.trim() || null },
  })
  await logActivity(session, 'REVISION_REQUEST', 'Rapportino', { entityId: id, entityLabel: log.userName, details: { reason: reason?.trim() || null } })
  revalidateAll()
  return {}
}

/**
 * Admin/manager verifies a submitted log and approves it — only from this point
 * does it count as compenso maturato for the worker.
 */
export async function approveWorkLog(id: string): Promise<{ error?: string }> {
  const session = await getSession()
  if (!session || !canMutate(session.role)) return { error: 'Non autorizzato' }

  const log = await prisma.workLog.findUnique({ where: { id }, select: { userName: true, status: true } })
  if (!log) return { error: 'Rapportino non trovato' }
  if (log.status !== 'SUBMITTED') return { error: 'Solo i rapportini inviati possono essere approvati' }

  await prisma.workLog.update({ where: { id }, data: { status: 'APPROVED', approvedAt: new Date(), revisionRequestedAt: null, revisionReason: null } })
  await logActivity(session, 'APPROVE', 'Rapportino', { entityId: id, entityLabel: log.userName })
  revalidateAll()
  return {}
}

// ─── Delete ──────────────────────────────────────────────────────────────────

export async function deleteWorkLog(id: string): Promise<{ error?: string }> {
  const session = await getSession()
  if (!session) return { error: 'Non autorizzato' }

  const log = await prisma.workLog.findUnique({
    where: { id },
    select: { userId: true, userName: true, status: true, photos: { select: { url: true } } },
  })
  if (!log) return { error: 'Rapportino non trovato' }

  // Admin can delete anything; a worker can delete only their own DRAFT.
  const allowed = canDelete(session.role) || (log.userId === session.id && log.status === 'DRAFT')
  if (!allowed) return { error: 'Non autorizzato' }

  for (const photo of log.photos) {
    try { await del(photo.url) } catch { /* blob may already be gone */ }
  }
  await prisma.workLog.delete({ where: { id } })

  await logActivity(session, 'DELETE', 'Rapportino', { entityId: id, entityLabel: log.userName })
  revalidateAll()
  return {}
}

// ─── Photos ──────────────────────────────────────────────────────────────────

export async function addWorkLogPhotos(workLogId: string, formData: FormData): Promise<{ error?: string; count?: number }> {
  const session = await getSession()
  if (!session) return { error: 'Non autorizzato' }

  const log = await prisma.workLog.findUnique({ where: { id: workLogId }, select: { userId: true, status: true } })
  if (!log) return { error: 'Rapportino non trovato' }
  if (!canEditLog(session, log)) return { error: 'Non autorizzato' }

  const files = formData.getAll('photos') as File[]
  if (!files.length || (files.length === 1 && files[0].size === 0)) {
    return { error: 'Nessuna foto selezionata' }
  }

  let count = 0
  for (let i = 0; i < files.length; i++) {
    const file = files[i]
    if (!file || file.size === 0) continue
    if (file.size > 15 * 1024 * 1024) return { error: `File "${file.name}" troppo grande (max 15 MB)` }

    const ext = file.name.split('.').pop() ?? 'jpg'
    const filename = `worklogs/${log.userId}/${Date.now()}-${i}.${ext}`
    const blob = await put(filename, file, { access: 'public' })
    await prisma.workLogPhoto.create({ data: { workLogId, url: blob.url } })
    count++
  }

  await logActivity(session, 'UPLOAD', 'Rapportino', { entityId: workLogId, details: { count } })
  revalidateAll()
  return { count }
}

export async function deleteWorkLogPhoto(photoId: string): Promise<{ error?: string }> {
  const session = await getSession()
  if (!session) return { error: 'Non autorizzato' }

  const photo = await prisma.workLogPhoto.findUnique({
    where: { id: photoId },
    select: { url: true, workLog: { select: { userId: true, status: true } } },
  })
  if (!photo) return { error: 'Foto non trovata' }
  if (!canEditLog(session, photo.workLog)) return { error: 'Non autorizzato' }

  try { await del(photo.url) } catch { /* blob may already be gone */ }
  await prisma.workLogPhoto.delete({ where: { id: photoId } })

  revalidateAll()
  return {}
}
