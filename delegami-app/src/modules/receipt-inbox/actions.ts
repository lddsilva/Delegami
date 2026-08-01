'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { put, del } from '@vercel/blob'
import { z } from 'zod'
import { prisma } from '@/lib/db'
import { getSession, canMutate, canDelete } from '@/lib/auth'
import { ExpenseType, PaymentStatus } from '@/generated/prisma/enums'
import { logActivity } from '@/lib/activity-log'
import { ensurePlaceholderProject } from '@/lib/placeholder-project'

const receiptAnalysisSchema = z.object({
  supplierName: z.string().nullable(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).nullable(),
  amount: z.number().positive().nullable(),
  currency: z.enum(['CHF', 'EUR']).nullable(),
  isItalianPurchase: z.boolean().nullable(),
  expenseType: z.nativeEnum(ExpenseType).nullable(),
  paymentStatus: z.nativeEnum(PaymentStatus).nullable(),
  description: z.string().nullable(),
  notes: z.string().nullable(),
  confidence: z.number().min(0).max(1),
})

export type ReceiptAnalysisSuggestion = z.infer<typeof receiptAnalysisSchema> & {
  supplierId: string | null
  matchedSupplierName: string | null
}

export type ReceiptAnalysisResult = {
  data?: ReceiptAnalysisSuggestion
  error?: string
}

function normalizeMatchText(value: string) {
  return value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()
}

function matchSupplier(
  supplierName: string | null,
  suppliers: { id: string; name: string }[],
) {
  if (!supplierName) return null
  const target = normalizeMatchText(supplierName)
  if (!target) return null

  let best: { supplier: { id: string; name: string }; score: number } | null = null
  for (const supplier of suppliers) {
    const candidate = normalizeMatchText(supplier.name)
    if (!candidate) continue

    let score = 0
    if (candidate === target) score = 1
    else if (candidate.includes(target) || target.includes(candidate)) score = 0.88
    else {
      const targetWords = target.split(' ').filter((word) => word.length >= 3)
      const candidateWords = new Set(candidate.split(' ').filter((word) => word.length >= 3))
      const matches = targetWords.filter((word) => candidateWords.has(word)).length
      score = targetWords.length > 0 ? matches / targetWords.length : 0
    }

    if (!best || score > best.score) best = { supplier, score }
  }

  return best && best.score >= 0.6 ? best.supplier : null
}

function isSupportedOpenAiImageUrl(url: string) {
  try {
    const pathname = new URL(url).pathname.toLowerCase()
    return /\.(png|jpe?g|webp|gif)$/.test(pathname)
  } catch {
    return false
  }
}

function extractResponseText(payload: unknown): string | null {
  if (!payload || typeof payload !== 'object') return null
  const body = payload as {
    output_text?: unknown
    output?: Array<{ content?: Array<{ text?: unknown; type?: unknown }> }>
  }
  if (typeof body.output_text === 'string') return body.output_text

  for (const item of body.output ?? []) {
    for (const content of item.content ?? []) {
      if (typeof content.text === 'string') return content.text
    }
  }

  return null
}

function openAiErrorMessage(status: number, body: string) {
  let code: string | null = null
  let type: string | null = null
  let message: string | null = null

  try {
    const parsed = JSON.parse(body) as {
      error?: { code?: string | null; type?: string | null; message?: string | null }
    }
    code = parsed.error?.code ?? null
    type = parsed.error?.type ?? null
    message = parsed.error?.message ?? null
  } catch {
    // Keep the generic fallback below for non-JSON responses.
  }

  if (code === 'insufficient_quota' || type === 'insufficient_quota') {
    return 'Credito OpenAI API insufficiente. Verifica Billing/Usage nella piattaforma OpenAI e aggiungi credito o aumenta il limite mensile.'
  }
  if (status === 401) {
    return 'Chiave OpenAI non valida o non autorizzata. Verifica OPENAI_API_KEY su Vercel.'
  }
  if (status === 403) {
    return 'La chiave OpenAI non ha permessi per questo modello o progetto.'
  }
  if (status === 429) {
    return 'Limite OpenAI raggiunto. Attendi qualche minuto o verifica i limiti del progetto OpenAI.'
  }
  if (status >= 500) {
    return 'Servizio OpenAI momentaneamente non disponibile. Riprova tra poco.'
  }

  return message ? `Analisi IA non riuscita: ${message}` : 'Analisi IA non riuscita. Riprova piu tardi.'
}

export async function analyzeReceiptForExpense(receiptId: string): Promise<ReceiptAnalysisResult> {
  const session = await getSession()
  if (!session || !canMutate(session.role)) return { error: 'Non autorizzato' }

  const apiKey = process.env.OPENAI_API_KEY
  if (!apiKey) return { error: 'Analisi IA non configurata: manca OPENAI_API_KEY.' }

  const receipt = await prisma.receiptInbox.findUnique({ where: { id: receiptId } })
  if (!receipt) return { error: 'Scontrino non trovato' }
  if (receipt.processedAt) return { error: 'Scontrino gia processato' }
  if (!isSupportedOpenAiImageUrl(receipt.photoUrl)) {
    return { error: 'Formato foto non supportato per l analisi. Ricarica lo scontrino: le nuove foto iPhone vengono convertite in JPEG.' }
  }

  const suppliers = await prisma.supplier.findMany({
    select: { id: true, name: true },
    orderBy: { name: 'asc' },
  })
  const supplierHints = suppliers.length > 0
    ? suppliers.map((supplier) => `- ${supplier.name}`).join('\n')
    : '- Nessun fornitore registrato'

  const response = await fetch('https://api.openai.com/v1/responses', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: process.env.OPENAI_RECEIPT_MODEL || 'gpt-4.1-mini',
      input: [
        {
          role: 'system',
          content: [
            {
              type: 'input_text',
              text: [
                'You extract expense data from construction purchase receipts.',
                'Return only fields that are visible or strongly implied by the receipt.',
                'Do not invent values. Use null when uncertain.',
                'The description must be short Italian text suitable for an expense record.',
              ].join(' '),
            },
          ],
        },
        {
          role: 'user',
          content: [
            {
              type: 'input_text',
              text: [
                'Analyze this receipt photo and extract the final paid total, merchant, date, currency, and expense type.',
                'Use CHF for Swiss receipts and EUR for Italian receipts.',
                'Use the final amount paid, not VAT, subtotal, discount, cash received, or change.',
                'If the merchant matches one of these registered suppliers, return that supplier name exactly:',
                supplierHints,
              ].join('\n'),
            },
            {
              type: 'input_image',
              image_url: receipt.photoUrl,
              detail: 'high',
            },
          ],
        },
      ],
      text: {
        format: {
          type: 'json_schema',
          name: 'receipt_expense_analysis',
          strict: true,
          schema: {
            type: 'object',
            additionalProperties: false,
            required: [
              'supplierName',
              'date',
              'amount',
              'currency',
              'isItalianPurchase',
              'expenseType',
              'paymentStatus',
              'description',
              'notes',
              'confidence',
            ],
            properties: {
              supplierName: { type: ['string', 'null'] },
              date: { type: ['string', 'null'], description: 'YYYY-MM-DD' },
              amount: { type: ['number', 'null'] },
              currency: { enum: ['CHF', 'EUR', null] },
              isItalianPurchase: { type: ['boolean', 'null'] },
              expenseType: { enum: ['MATERIAL', 'LABOR', 'TRANSPORT', 'EQUIPMENT', 'ADMIN', 'OTHER', null] },
              paymentStatus: { enum: ['PAID', 'PENDING', 'PARTIALLY_PAID', null] },
              description: { type: ['string', 'null'] },
              notes: { type: ['string', 'null'] },
              confidence: { type: 'number', minimum: 0, maximum: 1 },
            },
          },
        },
      },
      max_output_tokens: 700,
    }),
  })

  if (!response.ok) {
    const message = await response.text().catch(() => '')
    console.error('OpenAI receipt analysis failed', response.status, message.slice(0, 1000))
    return { error: openAiErrorMessage(response.status, message) }
  }

  const payload = await response.json()
  const text = extractResponseText(payload)
  if (!text) return { error: 'Analisi IA senza risultato leggibile.' }

  let raw: unknown
  try {
    raw = JSON.parse(text)
  } catch {
    return { error: 'Analisi IA non valida. Riprova.' }
  }

  const parsed = receiptAnalysisSchema.safeParse(raw)
  if (!parsed.success) return { error: 'Analisi IA incompleta. Riprova.' }

  const matchedSupplier = matchSupplier(parsed.data.supplierName, suppliers)
  const suggestion: ReceiptAnalysisSuggestion = {
    ...parsed.data,
    supplierName: parsed.data.supplierName?.trim() || null,
    description: parsed.data.description?.trim() || null,
    notes: parsed.data.notes?.trim() || null,
    supplierId: matchedSupplier?.id ?? null,
    matchedSupplierName: matchedSupplier?.name ?? null,
  }

  await logActivity(session, 'AI_ANALYZE', 'Scontrino', {
    entityId: receiptId,
    entityLabel: suggestion.description ?? suggestion.supplierName ?? undefined,
    details: { aiAnalysis: true, confidence: suggestion.confidence, supplierId: suggestion.supplierId },
  })

  return { data: suggestion }
}

// ─── Create receipts (one or more) ───────────────────────────────────────────

export type CreateReceiptsResult = { error?: string; count?: number }

export async function createReceiptInboxItems(formData: FormData): Promise<CreateReceiptsResult> {
  const session = await getSession()
  if (!session || !canMutate(session.role)) return { error: 'Non autorizzato' }

  const files = formData.getAll('photos') as File[]
  if (!files.length || (files.length === 1 && files[0].size === 0)) {
    return { error: 'Nessuna foto selezionata' }
  }

  const notes = formData.getAll('notes') as string[]
  const projectIds = formData.getAll('projectIds') as string[]

  for (let i = 0; i < files.length; i++) {
    const file = files[i]
    if (!file || file.size === 0) continue
    if (file.size > 15 * 1024 * 1024) {
      return { error: `File "${file.name}" troppo grande (max 15 MB)` }
    }

    const ext = file.name.split('.').pop() ?? 'jpg'
    const filename = `receipts/inbox/${Date.now()}-${i}.${ext}`
    const blob = await put(filename, file, { access: 'public' })

    await prisma.receiptInbox.create({
      data: {
        photoUrl: blob.url,
        note: notes[i] || null,
        suggestedProjectId: projectIds[i] || null,
        createdById: session.id,
      },
    })
  }

  await logActivity(session, 'UPLOAD', 'Scontrino', { details: { count: files.length, withProject: projectIds.filter(Boolean).length } })
  return { count: files.length }
}

// ─── Delete receipt ───────────────────────────────────────────────────────────

export async function deleteReceiptInboxItem(id: string): Promise<{ error?: string }> {
  const session = await getSession()
  if (!session || !canDelete(session.role)) return { error: 'Non autorizzato' }

  const receipt = await prisma.receiptInbox.findUnique({ where: { id } })
  if (!receipt) return { error: 'Scontrino non trovato' }

  try { await del(receipt.photoUrl) } catch { /* blob may already be gone */ }
  await prisma.receiptInbox.delete({ where: { id } })
  await logActivity(session, 'DELETE', 'Scontrino', { entityId: id, entityLabel: receipt.note ?? undefined })

  revalidatePath('/receipts')
  return {}
}

// ─── Bulk assign suggested project to one or more receipts ──────────────────

export async function assignProjectToReceipts(
  receiptIds: string[],
  projectId: string | null,
): Promise<{ error?: string; updated?: number }> {
  const session = await getSession()
  if (!session || !canMutate(session.role)) return { error: 'Non autorizzato' }
  if (receiptIds.length === 0) return { updated: 0 }

  if (projectId) {
    const project = await prisma.project.findUnique({ where: { id: projectId }, select: { id: true } })
    if (!project) return { error: 'Opera non trovata' }
  }

  const result = await prisma.receiptInbox.updateMany({
    where: { id: { in: receiptIds }, processedAt: null },
    data: { suggestedProjectId: projectId },
  })

  await logActivity(session, 'UPDATE', 'Scontrino', {
    details: { bulkSuggestProject: true, projectId, count: result.count },
  })

  revalidatePath('/receipts')
  return { updated: result.count }
}

// ─── Unarchive receipt (reset processedAt + expenseId) ───────────────────────

export async function unarchiveReceiptInboxItem(id: string): Promise<{ error?: string }> {
  const session = await getSession()
  if (!session || !canMutate(session.role)) return { error: 'Non autorizzato' }

  const receipt = await prisma.receiptInbox.findUnique({ where: { id } })
  if (!receipt) return { error: 'Scontrino non trovato' }

  await prisma.receiptInbox.update({
    where: { id },
    data: { expenseId: null, processedAt: null },
  })
  await logActivity(session, 'UNARCHIVE', 'Scontrino', { entityId: id, entityLabel: receipt.note ?? undefined })

  revalidatePath('/receipts')
  return {}
}

// ─── Process receipt into expense ────────────────────────────────────────────

const processSchema = z.object({
  projectId: z.string().optional().nullable(),
  supplierId: z.string().optional(),
  expenseType: z.nativeEnum(ExpenseType).default(ExpenseType.MATERIAL),
  paymentStatus: z.nativeEnum(PaymentStatus).default(PaymentStatus.PAID),
  description: z.string().min(1, 'Descrizione obbligatoria'),
  amount: z.coerce.number().min(0.01, 'Importo obbligatorio'),
  currency: z.string().default('CHF'),
  amountChf: z.coerce.number().optional().nullable(),
  exchangeRate: z.coerce.number().optional().nullable(),
  exchangeRateUpdatedAt: z.preprocess(
    (v) => (v === '' || v == null ? undefined : new Date(v as string)),
    z.date().optional(),
  ),
  isItalianPurchase: z.boolean().default(false),
  date: z.preprocess(
    (v) => (v === '' || v == null ? new Date() : new Date(v as string)),
    z.date(),
  ),
  notes: z.string().optional(),
})

export type ProcessReceiptState = { errors?: Record<string, string[]>; message?: string } | null

export async function processReceiptAsExpense(
  receiptId: string,
  prevState: ProcessReceiptState,
  formData: FormData,
): Promise<ProcessReceiptState> {
  const session = await getSession()
  if (!session || !canMutate(session.role)) return { message: 'Non autorizzato' }

  const receipt = await prisma.receiptInbox.findUnique({ where: { id: receiptId } })
  if (!receipt) return { message: 'Scontrino non trovato' }
  if (receipt.processedAt) return { message: 'Scontrino già processato' }

  const currency = (formData.get('currency') as string) || 'CHF'
  const isItalianPurchase = formData.get('isItalianPurchase') === 'on'
  const projectIdRaw = (formData.get('projectId') as string) || ''

  // If the user did not pick a project (and no suggestion was carried over),
  // fall back to the "Da classificare" sentinel so the spesa is never orphan.
  const projectId = projectIdRaw || receipt.suggestedProjectId || await ensurePlaceholderProject()

  const parsed = processSchema.safeParse({
    projectId,
    supplierId: (formData.get('supplierId') as string) || undefined,
    expenseType: formData.get('expenseType') as ExpenseType,
    paymentStatus: (formData.get('paymentStatus') as PaymentStatus) || PaymentStatus.PAID,
    description: formData.get('description') as string,
    amount: formData.get('amount') as string,
    currency: isItalianPurchase ? 'EUR' : currency,
    amountChf: formData.get('amountChf') ? Number(formData.get('amountChf')) : undefined,
    exchangeRate: formData.get('exchangeRate') ? Number(formData.get('exchangeRate')) : undefined,
    exchangeRateUpdatedAt: formData.get('exchangeRateUpdatedAt') as string || undefined,
    isItalianPurchase,
    date: formData.get('date') as string,
    notes: (formData.get('notes') as string) || undefined,
  })

  if (!parsed.success) return { errors: parsed.error.flatten().fieldErrors }

  const expense = await prisma.expense.create({ data: parsed.data })

  // Link receipt to expense and mark as processed
  await prisma.receiptInbox.update({
    where: { id: receiptId },
    data: {
      expenseId: expense.id,
      processedAt: new Date(),
    },
  })

  // Also attach photo as document on the expense
  await prisma.document.create({
    data: {
      name: `Scontrino ${new Date().toLocaleDateString('it-CH')}`,
      filePath: receipt.photoUrl,
      fileType: 'image/jpeg',
      documentType: 'RECEIPT',
      expenseId: expense.id,
      projectId: parsed.data.projectId ?? undefined,
    },
  })

  await logActivity(session, 'PROCESS', 'Scontrino', { entityId: receiptId, entityLabel: parsed.data.description, details: { expenseId: expense.id } })
  revalidatePath('/receipts')
  revalidatePath('/expenses')
  if (parsed.data.projectId) revalidatePath(`/projects/${parsed.data.projectId}`)

  redirect('/receipts')
}
