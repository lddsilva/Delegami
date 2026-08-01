'use server'

import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { prisma } from '@/lib/db'
import { reserveNextDocumentNumber } from '@/lib/numbering'
import { QuoteType, QuoteStatus, ItemType, InvoiceStatus } from '@/generated/prisma/enums'
import { getSession, canMutate, canDelete } from '@/lib/auth'
import { logActivity } from '@/lib/activity-log'

// ─── Item schema ─────────────────────────────────────────────────────────────

const quoteItemSchema = z.object({
  id: z.string().optional(),
  priceItemId: z.string().optional(),
  itemType: z.nativeEnum(ItemType).default(ItemType.ITEM),
  section: z.string().optional(),
  sortOrder: z.coerce.number().default(0),
  description: z.string().default(''),
  unit: z.string().optional(),
  quantity: z.coerce.number().optional(),
  unitCost: z.coerce.number().optional(),
  unitPrice: z.coerce.number().optional(),
  marginPercent: z.coerce.number().optional(),
  directPrice: z.boolean().optional(),
  hiddenFromClient: z.boolean().optional(),
  sourceUrl: z.string().optional(),
  sourceNote: z.string().optional(),
})

type QuoteItemInput = z.infer<typeof quoteItemSchema>

// ─── Quote schema ─────────────────────────────────────────────────────────────

const quoteSchema = z.object({
  projectId: z.string().min(1, 'Progetto obbligatorio'),
  type: z.nativeEnum(QuoteType).default(QuoteType.DETAILED),
  status: z.nativeEnum(QuoteStatus).default(QuoteStatus.DRAFT),
  marginPercent: z.coerce.number().min(0).max(100).default(0),
  taxRate: z.coerce.number().default(8.1),
  validUntil: z.preprocess(
    (v) => (v === '' || v == null ? undefined : new Date(v as string)),
    z.date().optional(),
  ),
  internalNotes: z.string().optional(),
  clientNotes: z.string().optional(),
  paymentTerms: z.string().optional(),
})

export type QuoteFormState = {
  errors?: Record<string, string[]>
  message?: string
} | null

// ─── Calculation helpers ──────────────────────────────────────────────────────

function calculateItemTotals(item: QuoteItemInput) {
  const qty = item.quantity ?? 0
  const totalCost = item.unitCost != null ? qty * item.unitCost : undefined
  const totalPrice = item.unitPrice != null ? qty * item.unitPrice : undefined
  return { totalCost, totalPrice }
}

function calculateQuoteTotals(items: QuoteItemInput[], marginPercent: number, taxRate: number) {
  const lineItems = items.filter((i) => i.itemType === ItemType.ITEM)
  // subtotalCost counts all items (internal included — for internal margin tracking)
  const subtotalCost = lineItems.reduce((sum, i) => {
    const { totalCost } = calculateItemTotals(i)
    return sum + (totalCost ?? 0)
  }, 0)
  // subtotalClient excludes items hidden from client
  const subtotalClient = lineItems
    .filter((i) => !i.hiddenFromClient)
    .reduce((sum, i) => {
      const { totalPrice } = calculateItemTotals(i)
      return sum + (totalPrice ?? 0)
    }, 0)
  const taxAmount = subtotalClient * (taxRate / 100)
  const total = subtotalClient + taxAmount
  return { subtotalCost, subtotalClient, taxAmount, total }
}

function quoteItemCreateData(item: QuoteItemInput, idx: number) {
  const { totalCost, totalPrice } = calculateItemTotals(item)
  return {
    itemType: item.itemType,
    section: item.section,
    sortOrder: item.sortOrder ?? idx,
    description: item.description,
    unit: item.unit,
    quantity: item.quantity,
    unitCost: item.unitCost,
    unitPrice: item.unitPrice,
    marginPercent: item.marginPercent,
    directPrice: item.directPrice ?? false,
    hiddenFromClient: item.hiddenFromClient ?? false,
    priceItemId: item.priceItemId,
    sourceUrl: item.sourceUrl,
    sourceNote: item.sourceNote,
    totalCost,
    totalPrice,
  }
}

// ─── Actions ─────────────────────────────────────────────────────────────────

function parseQuoteForm(formData: FormData) {
  const itemsJson = formData.get('itemsJson') as string
  const parsedItems = itemsJson ? JSON.parse(itemsJson) : []
  if (!Array.isArray(parsedItems)) throw new Error('INVALID_ITEMS')
  const items: QuoteItemInput[] = parsedItems

  return {
    fields: {
      projectId: formData.get('projectId') as string,
      type: QuoteType.DETAILED,
      status: formData.get('status') as QuoteStatus,
      marginPercent: formData.get('marginPercent') || '0',
      taxRate: formData.get('taxRate') || '8.1',
      validUntil: formData.get('validUntil') || undefined,
      internalNotes: formData.get('internalNotes') as string || undefined,
      clientNotes: formData.get('clientNotes') as string || undefined,
      paymentTerms: formData.get('paymentTerms') as string || undefined,
    },
    items,
  }
}

export async function createQuote(
  prevState: QuoteFormState,
  formData: FormData,
): Promise<QuoteFormState> {
  const session = await getSession()
  if (!session || !canMutate(session.role)) return { message: 'Non autorizzato' }

  let form
  try {
    form = parseQuoteForm(formData)
  } catch {
    return { message: 'Errore nei dati degli articoli' }
  }
  const { fields, items } = form
  const parsed = quoteSchema.safeParse(fields)
  if (!parsed.success) return { errors: parsed.error.flatten().fieldErrors }

  const itemsParsed = items.map((i) => quoteItemSchema.safeParse(i))
  const itemErrors = itemsParsed.filter((r) => !r.success)
  if (itemErrors.length > 0) return { message: 'Errore nei dati degli articoli' }

  const validItems = itemsParsed
    .map((r) => (r as { success: true; data: QuoteItemInput }).data)
    .filter((i) => i.itemType !== ItemType.ITEM || i.description.trim() !== '')
  const { marginPercent, taxRate, ...quoteData } = parsed.data

  // Pre-fill clientNotes from company default if not provided by the form
  if (!quoteData.clientNotes) {
    const companyCfg = await prisma.companySettings.findFirst({ select: { defaultQuoteNotes: true } })
    if (companyCfg?.defaultQuoteNotes) {
      quoteData.clientNotes = companyCfg.defaultQuoteNotes
    }
  }

  const { subtotalCost, subtotalClient, taxAmount, total } = calculateQuoteTotals(
    validItems,
    marginPercent,
    taxRate,
  )

  const quote = await prisma.$transaction(async (tx) => {
    const quoteNumber = await reserveNextDocumentNumber(tx, 'QUOTE')
    return tx.quote.create({
      data: {
        ...quoteData,
        quoteNumber,
        marginPercent,
        taxRate,
        subtotalCost,
        subtotalClient,
        taxAmount,
        total,
        items: {
          create: validItems.map(quoteItemCreateData),
        },
      },
    })
  })

  await logActivity(session, 'CREATE', 'Preventivo', { entityId: quote.id, entityLabel: `PRE-${quote.quoteNumber} v${quote.version}` })
  revalidatePath('/quotes')
  revalidatePath(`/projects/${quoteData.projectId}`)
  redirect(`/quotes/${quote.id}`)
}

export async function updateQuote(
  id: string,
  prevState: QuoteFormState,
  formData: FormData,
): Promise<QuoteFormState> {
  const session = await getSession()
  if (!session || !canMutate(session.role)) return { message: 'Non autorizzato' }

  let form
  try {
    form = parseQuoteForm(formData)
  } catch {
    return { message: 'Errore nei dati degli articoli' }
  }
  const { fields, items } = form
  const parsed = quoteSchema.safeParse(fields)
  if (!parsed.success) return { errors: parsed.error.flatten().fieldErrors }

  const itemsParsed = items.map((i) => quoteItemSchema.safeParse(i))
  const itemErrors = itemsParsed.filter((r) => !r.success)
  if (itemErrors.length > 0) return { message: 'Errore nei dati degli articoli' }
  const validItems = itemsParsed
    .filter((r) => r.success)
    .map((r) => (r as { success: true; data: QuoteItemInput }).data)

  const { marginPercent, taxRate, ...quoteData } = parsed.data
  const { subtotalCost, subtotalClient, taxAmount, total } = calculateQuoteTotals(
    validItems,
    marginPercent,
    taxRate,
  )

  await prisma.quote.update({
    where: { id },
    data: {
      ...quoteData,
      marginPercent,
      taxRate,
      subtotalCost,
      subtotalClient,
      taxAmount,
      total,
      items: {
        deleteMany: {},
        create: validItems.map(quoteItemCreateData),
      },
    },
  })

  const updated = await prisma.quote.findUnique({ where: { id }, select: { quoteNumber: true, version: true } })
  await logActivity(session, 'UPDATE', 'Preventivo', { entityId: id, entityLabel: updated ? `PRE-${updated.quoteNumber} v${updated.version}` : id })
  revalidatePath('/quotes')
  revalidatePath(`/quotes/${id}`)
  redirect(`/quotes/${id}`)
}

// ─── Import from AI-generated JSON ───────────────────────────────────────────

const importItemSchema = z.object({
  type: z.enum(['HEADER', 'SECTION', 'ITEM', 'NOTE', 'SUBTOTAL']).default('ITEM'),
  description: z.string().default(''),
  unit: z.string().optional(),
  qty: z.coerce.number().optional(),
  quantity: z.coerce.number().optional(),
  unitCost: z.coerce.number().optional(),
  unitPrice: z.coerce.number().optional(),
  marginPercent: z.coerce.number().optional(),
  directPrice: z.boolean().optional(),
  hiddenFromClient: z.boolean().optional(),
  sourceUrl: z.string().optional(),
  sourceNote: z.string().optional(),
})

const quoteImportSchema = z.object({
  kind: z.literal('quote').optional(),
  marginPercent: z.coerce.number().min(0).max(100).default(25),
  taxRate: z.coerce.number().default(8.1),
  validityDays: z.coerce.number().int().positive().optional(),
  internalNotes: z.string().optional(),
  clientNotes: z.string().optional(),
  paymentTerms: z.string().optional(),
  items: z.array(importItemSchema).min(1, 'Almeno una voce richiesta'),
})

export type QuoteImportResult = { quoteId?: string; error?: string }

export async function importQuoteFromJson(projectId: string, jsonText: string): Promise<QuoteImportResult> {
  const session = await getSession()
  if (!session || !canMutate(session.role)) return { error: 'Non autorizzato' }
  if (!projectId) return { error: 'Seleziona un\'opera di destinazione' }

  let raw: unknown
  try {
    raw = JSON.parse(jsonText)
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'JSON non valido'
    return { error: `JSON non valido: ${msg}` }
  }

  const parsed = quoteImportSchema.safeParse(raw)
  if (!parsed.success) {
    const first = parsed.error.issues[0]
    return { error: `Schema non valido: ${first.path.join('.') || 'root'} — ${first.message}` }
  }

  const project = await prisma.project.findUnique({ where: { id: projectId }, select: { id: true } })
  if (!project) return { error: 'Opera non trovata' }

  const data = parsed.data
  const validItems: QuoteItemInput[] = data.items.map((item, idx) => ({
    itemType: item.type as ItemType,
    sortOrder: idx,
    description: item.description ?? '',
    unit: item.unit,
    quantity: item.qty ?? item.quantity,
    unitCost: item.unitCost,
    unitPrice: item.unitPrice,
    marginPercent: item.marginPercent,
    directPrice: item.directPrice,
    hiddenFromClient: item.hiddenFromClient,
    sourceUrl: item.sourceUrl,
    sourceNote: item.sourceNote,
  })).filter((i) => i.itemType !== ItemType.ITEM || i.description.trim() !== '')

  if (validItems.length === 0) return { error: 'Nessuna voce valida nel JSON' }

  // Merge company-wide defaults when the JSON omits them — matches createQuote behaviour.
  const companyCfg = await prisma.companySettings.findFirst({
    select: { defaultQuoteNotes: true, defaultQuoteValidityDays: true, paymentTerms: true },
  })
  const effectiveClientNotes = data.clientNotes?.trim()
    ? data.clientNotes
    : (companyCfg?.defaultQuoteNotes ?? undefined)
  const effectivePaymentTerms = data.paymentTerms?.trim()
    ? data.paymentTerms
    : (companyCfg?.paymentTerms ?? undefined)
  const effectiveValidityDays = data.validityDays ?? companyCfg?.defaultQuoteValidityDays ?? undefined
  const validUntil = effectiveValidityDays
    ? new Date(Date.now() + effectiveValidityDays * 24 * 60 * 60 * 1000)
    : undefined

  const { subtotalCost, subtotalClient, taxAmount, total } = calculateQuoteTotals(
    validItems,
    data.marginPercent,
    data.taxRate,
  )

  try {
    const quote = await prisma.$transaction(async (tx) => {
      const quoteNumber = await reserveNextDocumentNumber(tx, 'QUOTE')
      return tx.quote.create({
        data: {
          projectId,
          type: QuoteType.DETAILED,
          status: QuoteStatus.DRAFT,
          quoteNumber,
          marginPercent: data.marginPercent,
          taxRate: data.taxRate,
          validUntil,
          internalNotes: data.internalNotes,
          clientNotes: effectiveClientNotes,
          paymentTerms: effectivePaymentTerms,
          subtotalCost,
          subtotalClient,
          taxAmount,
          total,
          items: { create: validItems.map(quoteItemCreateData) },
        },
      })
    })

    await logActivity(session, 'IMPORT', 'Preventivo', {
      entityId: quote.id,
      entityLabel: `PRE-${quote.quoteNumber} v${quote.version}`,
      details: { source: 'json-import', itemCount: validItems.length },
    })
    revalidatePath('/quotes')
    revalidatePath(`/projects/${projectId}`)
    return { quoteId: quote.id }
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Errore sconosciuto'
    return { error: `Creazione preventivo fallita: ${msg}` }
  }
}

// ─── Export current quote as JSON (for AI iteration loops) ────────────────────

export type QuoteJsonExport = {
  kind: 'quote'
  quoteNumber: string
  version: number
  marginPercent: number
  taxRate: number
  validityDays?: number
  clientNotes?: string
  internalNotes?: string
  paymentTerms?: string
  items: Array<{
    type: 'HEADER' | 'SECTION' | 'ITEM' | 'NOTE' | 'SUBTOTAL'
    description: string
    unit?: string
    qty?: number
    unitCost?: number
    unitPrice?: number
    marginPercent?: number
    directPrice?: boolean
    hiddenFromClient?: boolean
    sourceUrl?: string
    sourceNote?: string
  }>
}

export async function exportQuoteAsJson(id: string): Promise<{ data?: QuoteJsonExport; error?: string }> {
  const session = await getSession()
  if (!session || !canMutate(session.role)) return { error: 'Non autorizzato' }

  const quote = await prisma.quote.findUnique({
    where: { id },
    include: { items: { orderBy: { sortOrder: 'asc' } } },
  })
  if (!quote) return { error: 'Preventivo non trovato' }

  const validityDays = quote.validUntil
    ? Math.max(0, Math.round((quote.validUntil.getTime() - Date.now()) / (1000 * 60 * 60 * 24)))
    : undefined

  const data: QuoteJsonExport = {
    kind: 'quote',
    quoteNumber: quote.quoteNumber,
    version: quote.version,
    marginPercent: quote.marginPercent,
    taxRate: quote.taxRate,
    validityDays: validityDays || undefined,
    clientNotes: quote.clientNotes ?? undefined,
    internalNotes: quote.internalNotes ?? undefined,
    paymentTerms: quote.paymentTerms ?? undefined,
    items: quote.items.map((item) => ({
      type: item.itemType as QuoteJsonExport['items'][number]['type'],
      description: item.description,
      unit: item.unit ?? undefined,
      qty: item.quantity ?? undefined,
      unitCost: item.unitCost ?? undefined,
      unitPrice: item.unitPrice ?? undefined,
      marginPercent: item.marginPercent ?? undefined,
      directPrice: item.directPrice || undefined,
      hiddenFromClient: item.hiddenFromClient || undefined,
      sourceUrl: item.sourceUrl ?? undefined,
      sourceNote: item.sourceNote ?? undefined,
    })),
  }

  return { data }
}

// ─── Update existing quote from JSON (replace-in-place OR new version) ────────

export type ImportQuoteMode = 'replace-in-place' | 'new-version'
export type QuoteUpdateImportResult = { quoteId?: string; error?: string }

export async function importQuoteUpdateFromJson(
  quoteId: string,
  jsonText: string,
  mode: ImportQuoteMode,
): Promise<QuoteUpdateImportResult> {
  const session = await getSession()
  if (!session || !canMutate(session.role)) return { error: 'Non autorizzato' }

  const original = await prisma.quote.findUnique({
    where: { id: quoteId },
    select: { id: true, projectId: true, status: true, quoteNumber: true, version: true, parentQuoteId: true },
  })
  if (!original) return { error: 'Preventivo non trovato' }

  if (mode === 'replace-in-place' && original.status !== QuoteStatus.DRAFT) {
    return { error: 'Solo i preventivi in stato Bozza possono essere aggiornati in-place. Usa "Crea nuova versione".' }
  }

  let raw: unknown
  try {
    raw = JSON.parse(jsonText)
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'JSON non valido'
    return { error: `JSON non valido: ${msg}` }
  }

  const parsed = quoteImportSchema.safeParse(raw)
  if (!parsed.success) {
    const first = parsed.error.issues[0]
    return { error: `Schema non valido: ${first.path.join('.') || 'root'} — ${first.message}` }
  }

  const data = parsed.data
  const validItems: QuoteItemInput[] = data.items.map((item, idx) => ({
    itemType: item.type as ItemType,
    sortOrder: idx,
    description: item.description ?? '',
    unit: item.unit,
    quantity: item.qty ?? item.quantity,
    unitCost: item.unitCost,
    unitPrice: item.unitPrice,
    marginPercent: item.marginPercent,
    directPrice: item.directPrice,
    hiddenFromClient: item.hiddenFromClient,
    sourceUrl: item.sourceUrl,
    sourceNote: item.sourceNote,
  })).filter((i) => i.itemType !== ItemType.ITEM || i.description.trim() !== '')

  if (validItems.length === 0) return { error: 'Nessuna voce valida nel JSON' }

  const companyCfg = await prisma.companySettings.findFirst({
    select: { defaultQuoteNotes: true, defaultQuoteValidityDays: true, paymentTerms: true },
  })
  const effectiveClientNotes = data.clientNotes?.trim()
    ? data.clientNotes
    : (companyCfg?.defaultQuoteNotes ?? undefined)
  const effectivePaymentTerms = data.paymentTerms?.trim()
    ? data.paymentTerms
    : (companyCfg?.paymentTerms ?? undefined)
  const effectiveValidityDays = data.validityDays ?? companyCfg?.defaultQuoteValidityDays ?? undefined
  const validUntil = effectiveValidityDays
    ? new Date(Date.now() + effectiveValidityDays * 24 * 60 * 60 * 1000)
    : undefined

  const { subtotalCost, subtotalClient, taxAmount, total } = calculateQuoteTotals(
    validItems,
    data.marginPercent,
    data.taxRate,
  )

  try {
    if (mode === 'replace-in-place') {
      // Snapshot the prior state so we can audit/restore.
      const priorSnapshot = await prisma.quote.findUnique({
        where: { id: quoteId },
        include: { items: { orderBy: { sortOrder: 'asc' } } },
      })
      const snapshotJson = priorSnapshot ? JSON.stringify({
        clientNotes: priorSnapshot.clientNotes,
        paymentTerms: priorSnapshot.paymentTerms,
        validUntil: priorSnapshot.validUntil,
        marginPercent: priorSnapshot.marginPercent,
        taxRate: priorSnapshot.taxRate,
        items: priorSnapshot.items.map((i) => ({
          itemType: i.itemType, description: i.description, unit: i.unit,
          quantity: i.quantity, unitCost: i.unitCost, unitPrice: i.unitPrice,
          marginPercent: i.marginPercent, directPrice: i.directPrice,
          hiddenFromClient: i.hiddenFromClient, sourceUrl: i.sourceUrl, sourceNote: i.sourceNote,
        })),
      }) : null

      await prisma.quote.update({
        where: { id: quoteId },
        data: {
          marginPercent: data.marginPercent,
          taxRate: data.taxRate,
          validUntil,
          internalNotes: data.internalNotes ?? undefined,
          clientNotes: effectiveClientNotes,
          paymentTerms: effectivePaymentTerms,
          subtotalCost,
          subtotalClient,
          taxAmount,
          total,
          items: {
            deleteMany: {},
            create: validItems.map(quoteItemCreateData),
          },
        },
      })

      await logActivity(session, 'UPDATE', 'Preventivo', {
        entityId: quoteId,
        entityLabel: `PRE-${original.quoteNumber} v${original.version}`,
        details: {
          source: 'json-import',
          mode: 'replace-in-place',
          itemCount: validItems.length,
          previousSnapshot: snapshotJson,
        },
      })
      revalidatePath('/quotes')
      revalidatePath(`/quotes/${quoteId}`)
      revalidatePath(`/projects/${original.projectId}`)
      return { quoteId }
    }

    // new-version: create a new Quote in the same version chain
    const rootId = original.parentQuoteId ?? original.id
    const created = await prisma.$transaction(async (tx) => {
      const versions = await tx.quote.findMany({
        where: { OR: [{ id: rootId }, { parentQuoteId: rootId }] },
        select: { version: true },
      })
      const newVersion = Math.max(...versions.map((v) => v.version), original.version) + 1

      const created = await tx.quote.create({
        data: {
          quoteNumber: original.quoteNumber,
          projectId: original.projectId,
          type: QuoteType.DETAILED,
          status: QuoteStatus.DRAFT,
          version: newVersion,
          parentQuoteId: rootId,
          marginPercent: data.marginPercent,
          taxRate: data.taxRate,
          validUntil,
          internalNotes: data.internalNotes ?? undefined,
          clientNotes: effectiveClientNotes,
          paymentTerms: effectivePaymentTerms,
          subtotalCost,
          subtotalClient,
          taxAmount,
          total,
          items: { create: validItems.map(quoteItemCreateData) },
        },
      })

      // Same carry-forward as cloneQuote() — keep existing invoices attached to whichever
      // version is current, so their payments aren't orphaned on a superseded version.
      await tx.invoice.updateMany({
        where: { quoteId: original.id, status: { not: InvoiceStatus.CANCELLED } },
        data: { quoteId: created.id },
      })

      return created
    })

    await logActivity(session, 'IMPORT', 'Preventivo', {
      entityId: created.id,
      entityLabel: `PRE-${created.quoteNumber} v${created.version}`,
      details: { source: 'json-import', mode: 'new-version', fromQuoteId: quoteId, itemCount: validItems.length },
    })
    revalidatePath('/quotes')
    revalidatePath(`/quotes/${quoteId}`)
    revalidatePath(`/projects/${original.projectId}`)
    return { quoteId: created.id }
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Errore sconosciuto'
    return { error: `Operazione fallita: ${msg}` }
  }
}

export async function deleteQuote(id: string) {
  const session = await getSession()
  if (!session || !canDelete(session.role)) return

  const quote = await prisma.quote.findUnique({ where: { id }, select: { projectId: true, quoteNumber: true, version: true } })
  await prisma.quote.delete({ where: { id } })
  await logActivity(session, 'DELETE', 'Preventivo', { entityId: id, entityLabel: quote ? `PRE-${quote.quoteNumber} v${quote.version}` : id })
  revalidatePath('/quotes')
  if (quote) revalidatePath(`/projects/${quote.projectId}`)
  redirect('/quotes')
}

export async function updateQuoteStatus(id: string, status: QuoteStatus) {
  const session = await getSession()
  if (!session || !canMutate(session.role)) return

  const data: Record<string, unknown> = { status }
  if (status === QuoteStatus.SENT) data.sentAt = new Date()
  if (status === QuoteStatus.APPROVED) data.approvedAt = new Date()

  const quote = await prisma.quote.findUnique({ where: { id }, select: { quoteNumber: true, version: true } })
  await prisma.quote.update({ where: { id }, data })
  await logActivity(session, 'STATUS_CHANGE', 'Preventivo', { entityId: id, entityLabel: quote ? `PRE-${quote.quoteNumber} v${quote.version}` : id, details: { status } })
  revalidatePath(`/quotes/${id}`)
  revalidatePath('/quotes')
}

export async function cloneQuote(id: string) {
  const session = await getSession()
  if (!session || !canMutate(session.role)) return { error: 'Non autorizzato' }

  const original = await prisma.quote.findUnique({
    where: { id },
    include: { items: { orderBy: [{ sortOrder: 'asc' }] } },
  })
  if (!original) return { error: 'Preventivo non trovato' }

  // Root quote ID for version chain: use parentQuoteId if already a clone, otherwise use own ID
  const rootId = original.parentQuoteId ?? original.id
  // Keep the same quoteNumber — unique constraint is now on (quoteNumber, version)
  const quoteNumber = original.quoteNumber

  const newQuote = await prisma.$transaction(async (tx) => {
    const versions = await tx.quote.findMany({
      where: { OR: [{ id: rootId }, { parentQuoteId: rootId }] },
      select: { version: true },
    })
    const newVersion = Math.max(...versions.map((v) => v.version), original.version) + 1

    const created = await tx.quote.create({
      data: {
        quoteNumber,
        projectId: original.projectId,
        type: original.type,
        status: QuoteStatus.DRAFT,
        version: newVersion,
        parentQuoteId: rootId,
        marginPercent: original.marginPercent,
        taxRate: original.taxRate,
        subtotalCost: original.subtotalCost,
        subtotalClient: original.subtotalClient,
        taxAmount: original.taxAmount,
        total: original.total,
        validUntil: original.validUntil,
        clientNotes: original.clientNotes,
        internalNotes: original.internalNotes,
        paymentTerms: original.paymentTerms,
        items: {
          create: original.items.map((item) => ({
            itemType: item.itemType,
            section: item.section,
            sortOrder: item.sortOrder,
            description: item.description,
            unit: item.unit,
            quantity: item.quantity,
            unitCost: item.unitCost,
            unitPrice: item.unitPrice,
            marginPercent: item.marginPercent,
            directPrice: item.directPrice,
            hiddenFromClient: item.hiddenFromClient,
            priceItemId: item.priceItemId,
            sourceUrl: item.sourceUrl,
            sourceNote: item.sourceNote,
            totalCost: item.totalCost,
            totalPrice: item.totalPrice,
          })),
        },
      },
    })

    // Carry forward any invoices already issued against the version being superseded —
    // otherwise their payments become invisible to the new version's "Fatture collegate"
    // tracking and remaining-balance math, even though the underlying work/payment is the same.
    await tx.invoice.updateMany({
      where: { quoteId: original.id, status: { not: InvoiceStatus.CANCELLED } },
      data: { quoteId: created.id },
    })

    return created
  })

  await logActivity(session, 'CLONE', 'Preventivo', { entityId: newQuote.id, entityLabel: `PRE-${newQuote.quoteNumber} v${newQuote.version}`, details: { fromId: id } })
  revalidatePath('/quotes')
  revalidatePath(`/quotes/${id}`)
  redirect(`/quotes/${newQuote.id}`)
}

// ─── Update signatories (metadata — allowed even when quote is SENT/APPROVED) ──

export async function updateQuoteSignatories(
  id: string,
  signatories: string,
): Promise<{ success?: boolean; message?: string }> {
  const session = await getSession()
  if (!session || !canMutate(session.role)) return { message: 'Non autorizzato' }

  const quote = await prisma.quote.findUnique({ where: { id }, select: { quoteNumber: true, version: true } })
  await prisma.quote.update({ where: { id }, data: { signatories: signatories.trim() || null } })
  await logActivity(session, 'UPDATE_SIGNATORIES', 'Preventivo', { entityId: id, entityLabel: quote ? `PRE-${quote.quoteNumber} v${quote.version}` : id })

  revalidatePath(`/quotes/${id}`)
  revalidatePath(`/quotes/${id}/preview`)
  return { success: true }
}

export async function setQuoteShowClientNotes(
  id: string,
  show: boolean,
): Promise<{ success?: boolean; message?: string }> {
  const session = await getSession()
  if (!session || !canMutate(session.role)) return { message: 'Non autorizzato' }

  const quote = await prisma.quote.findUnique({ where: { id }, select: { quoteNumber: true, version: true } })
  await prisma.quote.update({ where: { id }, data: { showClientNotes: show } })
  await logActivity(session, 'UPDATE', 'Preventivo', {
    entityId: id,
    entityLabel: quote ? `PRE-${quote.quoteNumber} v${quote.version}` : id,
    details: { showClientNotes: show },
  })

  revalidatePath(`/quotes/${id}`)
  revalidatePath(`/quotes/${id}/preview`)
  return { success: true }
}
