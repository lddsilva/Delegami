'use server'

import { revalidatePath } from 'next/cache'
import { put, del } from '@vercel/blob'
import { z } from 'zod'
import { prisma } from '@/lib/db'
import { getSession, canMutate, canDelete } from '@/lib/auth'
import { logActivity } from '@/lib/activity-log'

export type WorkerFormState = {
  errors?: Record<string, string[]>
  message?: string
  ok?: boolean
} | null

function revalidateWorker(userId: string) {
  revalidatePath('/rapportini')
  revalidatePath(`/rapportini/${userId}`)
  revalidatePath('/rapportino')
}

function parseAmount(raw: FormDataEntryValue | null): number {
  if (raw == null) return NaN
  return Number(String(raw).replace(',', '.').trim())
}

// ─── Profile (anagrafica) ─────────────────────────────────────────────────────

const profileSchema = z.object({
  phone: z.string().optional(),
  address: z.string().optional(),
  hourlyRate: z.number().min(0).optional(),
  employmentType: z.enum(['DIRECT', 'AGENCY']).optional(),
  agencySupplierId: z.string().optional(),
  costRate: z.number().min(0).optional(),
  contractStart: z.string().optional(),
  contractType: z.string().optional(),
  identityNumber: z.string().optional(),
  notes: z.string().optional(),
})

export async function updateWorkerProfile(
  userId: string,
  _prevState: WorkerFormState,
  formData: FormData,
): Promise<WorkerFormState> {
  const session = await getSession()
  if (!session || !canMutate(session.role)) return { message: 'Non autorizzato' }

  const rateRaw = (formData.get('hourlyRate') as string) || ''
  const costRaw = (formData.get('costRate') as string) || ''
  const parsed = profileSchema.safeParse({
    phone: (formData.get('phone') as string) || undefined,
    address: (formData.get('address') as string) || undefined,
    hourlyRate: rateRaw.trim() ? Number(rateRaw.replace(',', '.')) : undefined,
    employmentType: (formData.get('employmentType') as string) || undefined,
    agencySupplierId: (formData.get('agencySupplierId') as string) || undefined,
    costRate: costRaw.trim() ? Number(costRaw.replace(',', '.')) : undefined,
    contractStart: (formData.get('contractStart') as string) || undefined,
    contractType: (formData.get('contractType') as string) || undefined,
    identityNumber: (formData.get('identityNumber') as string) || undefined,
    notes: (formData.get('notes') as string) || undefined,
  })
  if (!parsed.success) return { errors: parsed.error.flatten().fieldErrors }

  const target = await prisma.user.findUnique({ where: { id: userId }, select: { name: true } })
  if (!target) return { message: 'Operaio non trovato' }

  const isAgency = parsed.data.employmentType === 'AGENCY'
  await prisma.user.update({
    where: { id: userId },
    data: {
      phone: parsed.data.phone || null,
      address: parsed.data.address || null,
      hourlyRate: parsed.data.hourlyRate ?? null,
      employmentType: parsed.data.employmentType ?? 'DIRECT',
      agencySupplierId: isAgency ? (parsed.data.agencySupplierId || null) : null,
      costRate: isAgency ? (parsed.data.costRate ?? null) : null,
      contractStart: parsed.data.contractStart?.trim() ? new Date(`${parsed.data.contractStart}T12:00:00`) : null,
      contractType: parsed.data.contractType?.trim() || null,
      identityNumber: parsed.data.identityNumber?.trim() || null,
      notes: parsed.data.notes || null,
    },
  })

  await logActivity(session, 'UPDATE', 'Operaio', { entityId: userId, entityLabel: target.name })
  revalidateWorker(userId)
  return { ok: true }
}

// ─── Payments (compenso) ──────────────────────────────────────────────────────

export async function addWorkerPayment(
  userId: string,
  _prevState: WorkerFormState,
  formData: FormData,
): Promise<WorkerFormState> {
  const session = await getSession()
  if (!session || !canMutate(session.role)) return { message: 'Non autorizzato' }

  const target = await prisma.user.findUnique({ where: { id: userId }, select: { name: true } })
  if (!target) return { message: 'Operaio non trovato' }

  const amount = parseAmount(formData.get('amount'))
  if (!Number.isFinite(amount) || amount <= 0) return { errors: { amount: ['Importo non valido'] } }

  const paidAtRaw = (formData.get('paidAt') as string) || ''
  const paidAt = paidAtRaw ? new Date(`${paidAtRaw}T12:00:00`) : new Date()

  // Optional receipt upload (image or PDF).
  let receiptUrl: string | null = null
  const receipt = formData.get('receipt') as File | null
  if (receipt && receipt.size > 0) {
    if (receipt.size > 15 * 1024 * 1024) return { errors: { receipt: ['File troppo grande (max 15 MB)'] } }
    const ext = receipt.name.split('.').pop() ?? 'jpg'
    const blob = await put(`worker-payments/${userId}/${Date.now()}.${ext}`, receipt, { access: 'public' })
    receiptUrl = blob.url
  }

  const payment = await prisma.workerPayment.create({
    data: {
      userId,
      userName: target.name,
      amount,
      paidAt,
      method: (formData.get('method') as string) || null,
      note: (formData.get('note') as string) || null,
      receiptUrl,
      createdById: session.id,
    },
  })

  await logActivity(session, 'ADD_PAYMENT', 'Operaio', {
    entityId: userId,
    entityLabel: target.name,
    details: { paymentId: payment.id, amount },
  })
  revalidateWorker(userId)
  return { ok: true }
}

export async function uploadWorkerPaymentReceipt(paymentId: string, formData: FormData): Promise<{ error?: string }> {
  const session = await getSession()
  if (!session || !canMutate(session.role)) return { error: 'Non autorizzato' }

  const payment = await prisma.workerPayment.findUnique({ where: { id: paymentId }, select: { userId: true, receiptUrl: true } })
  if (!payment) return { error: 'Pagamento non trovato' }

  const receipt = formData.get('receipt') as File | null
  if (!receipt || receipt.size === 0) return { error: 'Nessun file selezionato' }
  if (receipt.size > 15 * 1024 * 1024) return { error: 'File troppo grande (max 15 MB)' }

  const ext = receipt.name.split('.').pop() ?? 'jpg'
  const blob = await put(`worker-payments/${payment.userId}/${Date.now()}.${ext}`, receipt, { access: 'public' })
  if (payment.receiptUrl) { try { await del(payment.receiptUrl) } catch { /* gone */ } }
  await prisma.workerPayment.update({ where: { id: paymentId }, data: { receiptUrl: blob.url } })

  revalidateWorker(payment.userId)
  return {}
}

export async function deleteWorkerPayment(id: string): Promise<{ error?: string }> {
  const session = await getSession()
  if (!session || !canDelete(session.role)) return { error: 'Non autorizzato' }

  const payment = await prisma.workerPayment.findUnique({ where: { id }, select: { userId: true, receiptUrl: true, userName: true } })
  if (!payment) return { error: 'Pagamento non trovato' }

  if (payment.receiptUrl) { try { await del(payment.receiptUrl) } catch { /* gone */ } }
  await prisma.workerPayment.delete({ where: { id } })

  await logActivity(session, 'DELETE', 'Operaio', { entityId: payment.userId, entityLabel: payment.userName, details: { paymentId: id } })
  revalidateWorker(payment.userId)
  return {}
}

// ─── Documents ────────────────────────────────────────────────────────────────

const SELF_DOCUMENT_LIMIT = 10

export async function addWorkerDocuments(userId: string, formData: FormData): Promise<{ error?: string; count?: number }> {
  const session = await getSession()
  if (!session) return { error: 'Non autorizzato' }
  // Admin/manager can upload for anyone; a worker can upload their own docs (capped).
  const isManager = canMutate(session.role)
  const isSelf = session.id === userId
  if (!isManager && !isSelf) return { error: 'Non autorizzato' }

  const target = await prisma.user.findUnique({ where: { id: userId }, select: { name: true } })
  if (!target) return { error: 'Operaio non trovato' }

  const files = formData.getAll('files') as File[]
  if (!files.length || (files.length === 1 && files[0].size === 0)) return { error: 'Nessun file selezionato' }

  // Cap self-uploads (workers) to keep storage sane; managers are not limited.
  if (!isManager) {
    const incoming = files.filter((f) => f && f.size > 0).length
    const existing = await prisma.workerDocument.count({ where: { userId } })
    if (existing + incoming > SELF_DOCUMENT_LIMIT) {
      return { error: `Limite di ${SELF_DOCUMENT_LIMIT} documenti raggiunto (ne hai ${existing}).` }
    }
  }

  const category = (formData.get('category') as string) || 'OTHER'
  const note = (formData.get('note') as string) || null

  let count = 0
  for (let i = 0; i < files.length; i++) {
    const file = files[i]
    if (!file || file.size === 0) continue
    if (file.size > 15 * 1024 * 1024) return { error: `File "${file.name}" troppo grande (max 15 MB)` }
    const ext = file.name.split('.').pop() ?? 'bin'
    const blob = await put(`worker-docs/${userId}/${Date.now()}-${i}.${ext}`, file, { access: 'public' })
    await prisma.workerDocument.create({
      data: { userId, name: file.name, url: blob.url, fileType: file.type || null, category, note },
    })
    count++
  }

  await logActivity(session, 'UPLOAD', 'Operaio', { entityId: userId, entityLabel: target.name, details: { count, category } })
  revalidateWorker(userId)
  return { count }
}

export async function deleteWorkerDocument(id: string): Promise<{ error?: string }> {
  const session = await getSession()
  if (!session || !canDelete(session.role)) return { error: 'Non autorizzato' }

  const doc = await prisma.workerDocument.findUnique({ where: { id }, select: { userId: true, url: true, name: true } })
  if (!doc) return { error: 'Documento non trovato' }

  try { await del(doc.url) } catch { /* gone */ }
  await prisma.workerDocument.delete({ where: { id } })

  await logActivity(session, 'DELETE', 'Operaio', { entityId: doc.userId, entityLabel: doc.name })
  revalidateWorker(doc.userId)
  return {}
}
