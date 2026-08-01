'use server'

import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { prisma } from '@/lib/db'
import { reserveNextDocumentNumber } from '@/lib/numbering'
import { InvoiceStatus, QuoteStatus } from '@/generated/prisma/enums'
import type { Prisma } from '@/generated/prisma/client'
import { getSession, canMutate, canDelete } from '@/lib/auth'
import { logActivity } from '@/lib/activity-log'

const MONEY_EPSILON = 0.01

const invoiceItemSchema = z.object({
  quoteItemId: z.preprocess((v) => (v === '' || v == null ? undefined : v), z.string().optional()),
  description: z.string().trim().min(1, 'Descrizione obbligatoria'),
  unit: z.preprocess((v) => (v === '' || v == null ? undefined : v), z.string().optional()),
  quantity: z.coerce.number().min(0, 'Quantita non valida').default(1),
  unitPrice: z.coerce.number().min(0, 'Prezzo non valido'),
})
type InvoiceItemInput = z.infer<typeof invoiceItemSchema>
type InvoiceTx = Pick<Prisma.TransactionClient, 'invoice' | 'invoiceItem' | 'quote' | 'quoteItem' | 'invoicePayment' | 'documentSequence' | 'companySettings' | 'quoteTemplate'>
type BillingMode = 'ITEMS' | 'PERCENTAGE' | 'MANUAL'

const invoiceSchema = z.object({
  projectId: z.string().min(1, 'Progetto obbligatorio'),
  quoteId: z.preprocess((v) => (v === '' || v == null ? undefined : v), z.string().optional()),
  status: z.nativeEnum(InvoiceStatus).default(InvoiceStatus.DRAFT),
  issueDate: z.preprocess(
    (v) => (v === '' || v == null ? new Date() : new Date(v as string)),
    z.date(),
  ),
  dueDate: z.preprocess(
    (v) => (v === '' || v == null ? undefined : new Date(v as string)),
    z.date().optional(),
  ),
  taxRate: z.coerce.number().min(0).default(8.1),
  notes: z.string().optional(),
})

const quoteInvoiceSelectionSchema = z.object({
  quoteItemId: z.string().min(1),
  description: z.string().trim().min(1).optional(),
  quantity: z.coerce.number().positive(),
})

const percentageInvoiceSchema = z.object({
  billingLabel: z.enum(['Acconto', 'SAL', 'Saldo']).default('Acconto'),
  percent: z.coerce.number().positive().max(100),
  notes: z.string().optional(),
})

export type InvoiceFormState = { errors?: Record<string, string[]>; message?: string } | null

function optionalString(value: FormDataEntryValue | null) {
  if (typeof value !== 'string') return undefined
  const trimmed = value.trim()
  return trimmed ? trimmed : undefined
}

function parseForm(formData: FormData) {
  const itemsJson = formData.get('itemsJson')
  const parsedItems = typeof itemsJson === 'string' && itemsJson ? JSON.parse(itemsJson) : []
  if (!Array.isArray(parsedItems)) throw new Error('INVALID_ITEMS')

  return {
    fields: {
      projectId: formData.get('projectId') as string,
      quoteId: optionalString(formData.get('quoteId')),
      status: formData.get('status') as InvoiceStatus,
      issueDate: formData.get('issueDate') || undefined,
      dueDate: formData.get('dueDate') || undefined,
      taxRate: formData.get('taxRate') || '8.1',
      notes: optionalString(formData.get('notes')),
    },
    items: parsedItems,
    saveAsTemplate: formData.get('saveAsTemplate') === 'on',
    templateName: optionalString(formData.get('templateName')),
  }
}

function parseInvoiceItems(items: unknown[]): InvoiceItemInput[] | null {
  const nonEmptyItems = items.filter((item) => {
    if (typeof item !== 'object' || item == null || !('description' in item)) return false
    return String(item.description ?? '').trim() !== ''
  })
  if (nonEmptyItems.length === 0) return null

  const parsed = nonEmptyItems.map((item) => invoiceItemSchema.safeParse(item))
  if (parsed.some((item) => !item.success)) return null

  return parsed.map((item) => {
    if (!item.success) throw new Error('INVALID_ITEMS')
    return item.data
  })
}

function calcTotals(items: InvoiceItemInput[], taxRate: number) {
  const subtotal = items.reduce((s, i) => s + i.quantity * i.unitPrice, 0)
  const taxAmount = subtotal * (taxRate / 100)
  return { subtotal, taxAmount, total: subtotal + taxAmount }
}

function itemCreateData(item: InvoiceItemInput) {
  return {
    quoteItemId: item.quoteItemId,
    description: item.description,
    unit: item.unit,
    quantity: item.quantity,
    unitPrice: item.unitPrice,
    total: item.quantity * item.unitPrice,
  }
}

function totalPaid(payments: Array<{ amount: number }>) {
  return payments.reduce((sum, payment) => sum + payment.amount, 0)
}

function addDays(date: Date, days: number) {
  const next = new Date(date)
  next.setDate(next.getDate() + days)
  return next
}

async function defaultDueDate(tx: InvoiceTx, issueDate: Date, dueDate?: Date) {
  if (dueDate) return dueDate
  const settings = await tx.companySettings.findFirst({
    select: { defaultInvoiceDueDays: true },
    orderBy: { createdAt: 'asc' },
  })
  return addDays(issueDate, settings?.defaultInvoiceDueDays ?? 5)
}

function formatPercent(percent: number) {
  return Number.isInteger(percent) ? String(percent) : percent.toFixed(2).replace(/0+$/, '').replace(/\.$/, '')
}

function existingQuoteBillingMode(invoices: Array<{
  billingMode: string | null
  items: Array<{ quoteItemId: string | null }>
}>): BillingMode | null {
  for (const invoice of invoices) {
    if (invoice.billingMode === 'PERCENTAGE') return 'PERCENTAGE'
  }
  for (const invoice of invoices) {
    if (invoice.billingMode === 'ITEMS' || invoice.items.some((item) => item.quoteItemId)) return 'ITEMS'
  }
  return invoices.length > 0 ? 'MANUAL' : null
}

async function updateQuoteInvoiceStatus(tx: InvoiceTx, quoteId: string) {
  const quote = await tx.quote.findUnique({
    where: { id: quoteId },
    select: {
      status: true,
      items: {
        where: { itemType: 'ITEM', hiddenFromClient: false },
        select: { id: true, quantity: true },
      },
      invoices: {
        where: { status: { not: InvoiceStatus.CANCELLED } },
        select: {
          billingMode: true,
          billingPercent: true,
          subtotal: true,
          items: { select: { quoteItemId: true, quantity: true } },
        },
      },
      subtotalClient: true,
    },
  })
  if (!quote) return
  if (quote.status !== QuoteStatus.APPROVED && quote.status !== QuoteStatus.INVOICED) return

  if (quote.invoices.some((invoice) => invoice.billingMode === 'PERCENTAGE')) {
    const billedPercent = quote.invoices.reduce((sum, invoice) => {
      if (invoice.billingMode !== 'PERCENTAGE') return sum
      if (invoice.billingPercent != null) return sum + invoice.billingPercent
      if (quote.subtotalClient <= MONEY_EPSILON) return sum
      return sum + (invoice.subtotal / quote.subtotalClient) * 100
    }, 0)
    await tx.quote.update({
      where: { id: quoteId },
      data: { status: billedPercent + MONEY_EPSILON >= 100 ? QuoteStatus.INVOICED : QuoteStatus.APPROVED },
    })
    return
  }

  const invoicedByItem = new Map<string, number>()
  for (const invoice of quote.invoices) {
    for (const item of invoice.items) {
      if (!item.quoteItemId) continue
      invoicedByItem.set(item.quoteItemId, (invoicedByItem.get(item.quoteItemId) ?? 0) + item.quantity)
    }
  }

  const billableItems = quote.items.filter((item) => (item.quantity ?? 1) > MONEY_EPSILON)
  const fullyInvoiced = billableItems.length > 0 && billableItems.every((item) => {
    const expected = item.quantity ?? 1
    return (invoicedByItem.get(item.id) ?? 0) + MONEY_EPSILON >= expected
  })

  await tx.quote.update({
    where: { id: quoteId },
    data: { status: fullyInvoiced ? QuoteStatus.INVOICED : QuoteStatus.APPROVED },
  })
}

function actionErrorMessage(error: unknown) {
  if (typeof error === 'object' && error != null && 'code' in error && error.code === 'P2002') {
    return 'Questo preventivo ha gia una fattura collegata'
  }
  if (!(error instanceof Error)) return 'Operazione non riuscita'

  switch (error.message) {
    case 'INVALID_ITEMS':
      return 'Errore nei dati degli articoli'
    case 'NO_ITEMS':
      return 'Inserisci almeno un articolo'
    case 'QUOTE_NOT_FOUND':
      return 'Preventivo non trovato'
    case 'QUOTE_NOT_APPROVED':
      return 'Solo un preventivo approvato puo generare una fattura'
    case 'QUOTE_ALREADY_INVOICED':
      return 'Questo preventivo ha gia una fattura collegata'
    case 'QUOTE_PROJECT_MISMATCH':
      return 'Il preventivo selezionato non appartiene a questa opera'
    case 'QUOTE_BILLING_MODE_LOCKED_ITEMS':
      return 'Questo preventivo e gia stato fatturato per articoli. Continua con articoli residui.'
    case 'QUOTE_BILLING_MODE_LOCKED_PERCENTAGE':
      return 'Questo preventivo e gia stato fatturato per acconti/SAL percentuali. Continua con percentuali.'
    case 'PERCENT_TOO_HIGH':
      return 'La percentuale supera il residuo fatturabile del preventivo'
    case 'NO_REMAINING_ITEMS':
      return 'Tutti gli articoli fatturabili sono gia stati inclusi in una fattura'
    case 'QUANTITY_TOO_HIGH':
      return 'La quantita selezionata supera il residuo da fatturare'
    case 'INVOICE_NOT_FOUND':
      return 'Fattura non trovata'
    case 'INVOICE_CANCELLED':
      return 'Una fattura annullata non puo ricevere pagamenti'
    case 'PAYMENT_TOO_HIGH':
      return 'Il pagamento supera il residuo della fattura'
    case 'PAYMENT_NOT_FOUND':
      return 'Pagamento non trovato'
    default:
      return 'Operazione non riuscita'
  }
}

// ─── Import from AI-generated JSON ───────────────────────────────────────────

const invoiceImportItemSchema = z.object({
  description: z.string().min(1, 'Descrizione obbligatoria'),
  unit: z.string().optional(),
  qty: z.coerce.number().optional(),
  quantity: z.coerce.number().optional(),
  unitPrice: z.coerce.number().min(0, 'Prezzo non valido'),
})

const invoiceImportSchema = z.object({
  kind: z.literal('invoice').optional(),
  issueDate: z.string().optional(),
  dueDate: z.string().optional(),
  taxRate: z.coerce.number().default(8.1),
  notes: z.string().optional(),
  items: z.array(invoiceImportItemSchema).min(1, 'Almeno una voce richiesta'),
})

export type InvoiceImportResult = { invoiceId?: string; error?: string }

export async function importInvoiceFromJson(projectId: string, jsonText: string): Promise<InvoiceImportResult> {
  const session = await getSession()
  if (!session || !canMutate(session.role)) return { error: 'Non autorizzato' }
  if (!projectId) return { error: "Seleziona un'opera di destinazione" }

  let raw: unknown
  try {
    raw = JSON.parse(jsonText)
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'JSON non valido'
    return { error: `JSON non valido: ${msg}` }
  }

  const parsed = invoiceImportSchema.safeParse(raw)
  if (!parsed.success) {
    const first = parsed.error.issues[0]
    return { error: `Schema non valido: ${first.path.join('.') || 'root'} — ${first.message}` }
  }

  const project = await prisma.project.findUnique({ where: { id: projectId }, select: { id: true } })
  if (!project) return { error: 'Opera non trovata' }

  const data = parsed.data
  const validItems: InvoiceItemInput[] = data.items.map((item) => ({
    description: item.description.trim(),
    unit: item.unit,
    quantity: item.qty ?? item.quantity ?? 1,
    unitPrice: item.unitPrice,
  }))

  const { subtotal, taxAmount, total } = calcTotals(validItems, data.taxRate)
  const issueDate = data.issueDate ? new Date(data.issueDate) : new Date()

  try {
    const invoice = await prisma.$transaction(async (tx) => {
      const invoiceNumber = await reserveNextDocumentNumber(tx, 'INVOICE')
      const dueDate = await defaultDueDate(tx, issueDate, data.dueDate ? new Date(data.dueDate) : undefined)
      return tx.invoice.create({
        data: {
          projectId,
          invoiceNumber,
          status: InvoiceStatus.DRAFT,
          issueDate,
          dueDate,
          taxRate: data.taxRate,
          subtotal,
          taxAmount,
          total,
          notes: data.notes,
          billingMode: 'MANUAL',
          items: { create: validItems.map(itemCreateData) },
        },
      })
    })

    await logActivity(session, 'IMPORT', 'Fattura', {
      entityId: invoice.id,
      entityLabel: `FAT-${invoice.invoiceNumber}`,
      details: { source: 'json-import', itemCount: validItems.length },
    })
    revalidatePath('/invoices')
    revalidatePath(`/projects/${projectId}`)
    return { invoiceId: invoice.id }
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Errore sconosciuto'
    return { error: `Creazione fattura fallita: ${msg}` }
  }
}

export async function createInvoice(prevState: InvoiceFormState, formData: FormData): Promise<InvoiceFormState> {
  const session = await getSession()
  if (!session || !canMutate(session.role)) return { message: 'Non autorizzato' }

  let form: ReturnType<typeof parseForm>
  try {
    form = parseForm(formData)
  } catch {
    return { message: 'Errore nei dati degli articoli' }
  }

  const parsed = invoiceSchema.safeParse(form.fields)
  if (!parsed.success) return { errors: parsed.error.flatten().fieldErrors }

  const validItems = parseInvoiceItems(form.items)
  if (!validItems) return { message: 'Inserisci almeno un articolo valido' }

  const { taxRate, ...invoiceData } = parsed.data
  const { subtotal, taxAmount, total } = calcTotals(validItems, taxRate)

  let invoice: { id: string; projectId: string; invoiceNumber: string }
  try {
    invoice = await prisma.$transaction(async (tx) => {
      let projectId = invoiceData.projectId
      let billingMode: BillingMode | null = null
      let quoteBaseTotal: number | null = null

      if (invoiceData.quoteId) {
        const quote = await tx.quote.findUnique({
          where: { id: invoiceData.quoteId },
          include: {
            invoices: {
              where: { status: { not: InvoiceStatus.CANCELLED } },
              include: { items: true },
            },
          },
        })
        if (!quote) throw new Error('QUOTE_NOT_FOUND')
        if (quote.status !== QuoteStatus.APPROVED && quote.status !== QuoteStatus.INVOICED) throw new Error('QUOTE_NOT_APPROVED')
        if (quote.projectId !== invoiceData.projectId) throw new Error('QUOTE_PROJECT_MISMATCH')
        projectId = quote.projectId
        billingMode = validItems.some((item) => item.quoteItemId) ? 'ITEMS' : 'MANUAL'
        quoteBaseTotal = quote.total
        const existingMode = existingQuoteBillingMode(quote.invoices)
        if (existingMode === 'PERCENTAGE') throw new Error('QUOTE_BILLING_MODE_LOCKED_PERCENTAGE')
        if (existingMode === 'ITEMS' && billingMode !== 'ITEMS') throw new Error('QUOTE_BILLING_MODE_LOCKED_ITEMS')
      }

      const invoiceNumber = await reserveNextDocumentNumber(tx, 'INVOICE')
      const paidAt = invoiceData.status === InvoiceStatus.PAID ? new Date() : undefined
      const dueDate = await defaultDueDate(tx, invoiceData.issueDate, invoiceData.dueDate)
      const created = await tx.invoice.create({
        data: {
          ...invoiceData,
          projectId,
          invoiceNumber,
          dueDate,
          taxRate,
          subtotal,
          taxAmount,
          total,
          billingMode,
          quoteBaseTotal,
          paidAt,
          items: { create: validItems.map(itemCreateData) },
          payments: invoiceData.status === InvoiceStatus.PAID
            ? { create: { amount: total, paidAt: paidAt ?? new Date(), notes: 'Saldo registrato alla creazione' } }
            : undefined,
        },
      })

      if (form.saveAsTemplate) {
        await tx.quoteTemplate.create({
          data: {
            name: form.templateName ?? `Fattura ${invoiceNumber}`,
            description: `Creato dalla fattura ${invoiceNumber}`,
            category: 'Fattura',
            emoji: '🧾',
            templateType: 'INVOICE',
            qualityLevel: 'STANDARD',
            scopeLevel: 'SERVICE',
            templateGroupKey: `invoice-${invoiceNumber.toLowerCase()}`,
            version: 1,
            itemsJson: JSON.stringify(validItems.map((item, sortOrder) => ({
              description: item.description,
              unit: item.unit,
              quantity: item.quantity,
              unitPrice: item.unitPrice,
              sortOrder,
            }))),
            isActive: true,
          },
        })
      }

      if (invoiceData.quoteId) {
        await updateQuoteInvoiceStatus(tx, invoiceData.quoteId)
      }

      return created
    })
  } catch (error) {
    return { message: actionErrorMessage(error) }
  }

  await logActivity(session, 'CREATE', 'Fattura', { entityId: invoice.id, entityLabel: `FAT-${invoice.invoiceNumber}` })
  revalidatePath('/invoices')
  revalidatePath('/quotes')
  if (form.saveAsTemplate) revalidatePath('/settings/templates')
  revalidatePath(`/projects/${invoice.projectId}`)
  redirect(`/invoices/${invoice.id}`)
}

export async function updateInvoice(
  id: string,
  prevState: InvoiceFormState,
  formData: FormData,
): Promise<InvoiceFormState> {
  const session = await getSession()
  if (!session || !canMutate(session.role)) return { message: 'Non autorizzato' }

  let form: ReturnType<typeof parseForm>
  try {
    form = parseForm(formData)
  } catch {
    return { message: 'Errore nei dati degli articoli' }
  }

  const parsed = invoiceSchema.safeParse(form.fields)
  if (!parsed.success) return { errors: parsed.error.flatten().fieldErrors }

  const validItems = parseInvoiceItems(form.items)
  if (!validItems) return { message: 'Inserisci almeno un articolo valido' }

  const { taxRate, ...invoiceData } = parsed.data
  const { subtotal, taxAmount, total } = calcTotals(validItems, taxRate)

  let projectId = invoiceData.projectId
  try {
    await prisma.$transaction(async (tx) => {
      const current = await tx.invoice.findUnique({
        where: { id },
        select: {
          projectId: true,
          quoteId: true,
          billingMode: true,
          payments: { select: { amount: true, paidAt: true } },
        },
      })
      if (!current) throw new Error('INVOICE_NOT_FOUND')

      const quoteId = invoiceData.quoteId
      projectId = invoiceData.projectId
      let billingMode: BillingMode | null = null
      let quoteBaseTotal: number | null = null
      if (quoteId) {
        const quote = await tx.quote.findUnique({
          where: { id: quoteId },
          include: {
            invoices: {
              where: { status: { not: InvoiceStatus.CANCELLED }, id: { not: id } },
              include: { items: true },
            },
          },
        })
        if (!quote) throw new Error('QUOTE_NOT_FOUND')
        if (quote.status !== QuoteStatus.APPROVED && quote.status !== QuoteStatus.INVOICED && quote.id !== current.quoteId) {
          throw new Error('QUOTE_NOT_APPROVED')
        }
        if (quote.projectId !== invoiceData.projectId) throw new Error('QUOTE_PROJECT_MISMATCH')
        projectId = quote.projectId
        billingMode = validItems.some((item) => item.quoteItemId) ? 'ITEMS' : 'MANUAL'
        quoteBaseTotal = quote.total
        const existingMode = existingQuoteBillingMode(quote.invoices)
        if (existingMode === 'PERCENTAGE') throw new Error('QUOTE_BILLING_MODE_LOCKED_PERCENTAGE')
        if (existingMode === 'ITEMS' && billingMode !== 'ITEMS') throw new Error('QUOTE_BILLING_MODE_LOCKED_ITEMS')
      }

      const alreadyPaid = totalPaid(current.payments)
      let status = invoiceData.status
      let paidAt: Date | null | undefined = undefined
      const paymentsToCreate: Array<{ amount: number; paidAt: Date; notes: string }> = []

      if (status === InvoiceStatus.PAID && alreadyPaid + MONEY_EPSILON < total) {
        const now = new Date()
        paymentsToCreate.push({ amount: total - alreadyPaid, paidAt: now, notes: 'Saldo registrato da stato fattura' })
        paidAt = now
      } else if (alreadyPaid + MONEY_EPSILON >= total && total > 0) {
        status = InvoiceStatus.PAID
        paidAt = current.payments.at(-1)?.paidAt ?? new Date()
      } else if (status === InvoiceStatus.PAID) {
        status = InvoiceStatus.SENT
        paidAt = null
      } else if (status !== InvoiceStatus.CANCELLED) {
        paidAt = null
      }

      await tx.invoice.update({
        where: { id },
        data: {
          ...invoiceData,
          quoteId,
          projectId,
          status,
          paidAt,
          dueDate: await defaultDueDate(tx, invoiceData.issueDate, invoiceData.dueDate),
          taxRate,
          subtotal,
          taxAmount,
          total,
          billingMode,
          billingPercent: null,
          quoteBaseTotal,
          items: {
            deleteMany: {},
            create: validItems.map(itemCreateData),
          },
          payments: paymentsToCreate.length > 0 ? { create: paymentsToCreate } : undefined,
        },
      })

      if (current.quoteId && current.quoteId !== quoteId) {
        await updateQuoteInvoiceStatus(tx, current.quoteId)
      }
      if (quoteId) {
        await updateQuoteInvoiceStatus(tx, quoteId)
      }
    })
  } catch (error) {
    return { message: actionErrorMessage(error) }
  }

  const updatedInvoice = await prisma.invoice.findUnique({ where: { id }, select: { invoiceNumber: true } })
  await logActivity(session, 'UPDATE', 'Fattura', { entityId: id, entityLabel: updatedInvoice ? `FAT-${updatedInvoice.invoiceNumber}` : id })
  revalidatePath('/invoices')
  revalidatePath('/quotes')
  revalidatePath(`/invoices/${id}`)
  revalidatePath(`/projects/${projectId}`)
  redirect(`/invoices/${id}`)
}

export async function deleteInvoice(id: string) {
  const session = await getSession()
  if (!session || !canDelete(session.role)) return

  const invoice = await prisma.$transaction(async (tx) => {
    const existing = await tx.invoice.findUnique({
      where: { id },
      select: { projectId: true, quoteId: true, invoiceNumber: true },
    })
    if (!existing) return null

    await tx.invoice.delete({ where: { id } })
    if (existing.quoteId) {
      await updateQuoteInvoiceStatus(tx, existing.quoteId)
    }

    return existing
  })

  if (invoice) await logActivity(session, 'DELETE', 'Fattura', { entityId: id, entityLabel: `FAT-${invoice.invoiceNumber}` })
  revalidatePath('/invoices')
  revalidatePath('/quotes')
  if (invoice) revalidatePath(`/projects/${invoice.projectId}`)
  redirect('/invoices')
}

export async function markInvoicePaid(id: string): Promise<{ error?: string }> {
  const session = await getSession()
  if (!session || !canMutate(session.role)) return { error: 'Non autorizzato' }
  const invoiceForLog = await prisma.invoice.findUnique({ where: { id }, select: { invoiceNumber: true } })

  try {
    await prisma.$transaction(async (tx) => {
      const invoice = await tx.invoice.findUnique({
        where: { id },
        select: { total: true, status: true, payments: { select: { amount: true } } },
      })
      if (!invoice) throw new Error('INVOICE_NOT_FOUND')
      if (invoice.status === InvoiceStatus.CANCELLED) throw new Error('INVOICE_CANCELLED')

      const paid = totalPaid(invoice.payments)
      const remaining = invoice.total - paid
      const paidAt = new Date()
      if (remaining > MONEY_EPSILON) {
        await tx.invoicePayment.create({
          data: { invoiceId: id, amount: remaining, paidAt, notes: 'Saldo finale' },
        })
      }
      await tx.invoice.update({
        where: { id },
        data: { status: InvoiceStatus.PAID, paidAt },
      })
    })
  } catch (error) {
    return { error: actionErrorMessage(error) }
  }

  await logActivity(session, 'STATUS_CHANGE', 'Fattura', { entityId: id, entityLabel: invoiceForLog ? `FAT-${invoiceForLog.invoiceNumber}` : id, details: { status: 'PAID' } })
  revalidatePath(`/invoices/${id}`)
  revalidatePath('/invoices')
  return {}
}

/** Create invoice pre-filled from an approved quote */
export async function createInvoiceFromQuote(quoteId: string): Promise<{ error?: string } | void> {
  const session = await getSession()
  if (!session || !canMutate(session.role)) return { error: 'Non autorizzato' }

  let invoice: { id: string; projectId: string; invoiceNumber: string }
  try {
    invoice = await prisma.$transaction(async (tx) => {
      const quote = await tx.quote.findUnique({
        where: { id: quoteId },
        include: {
          invoices: {
            where: { status: { not: InvoiceStatus.CANCELLED } },
            include: { items: true },
          },
          items: {
            where: { itemType: 'ITEM', hiddenFromClient: false },
            orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }],
          },
        },
      })
      if (!quote) throw new Error('QUOTE_NOT_FOUND')
      if (quote.status !== QuoteStatus.APPROVED && quote.status !== QuoteStatus.INVOICED) throw new Error('QUOTE_NOT_APPROVED')
      const existingMode = existingQuoteBillingMode(quote.invoices)
      if (existingMode === 'PERCENTAGE') throw new Error('QUOTE_BILLING_MODE_LOCKED_PERCENTAGE')

      const invoicedByItem = new Map<string, number>()
      for (const existingInvoice of quote.invoices) {
        for (const item of existingInvoice.items) {
          if (!item.quoteItemId) continue
          invoicedByItem.set(item.quoteItemId, (invoicedByItem.get(item.quoteItemId) ?? 0) + item.quantity)
        }
      }

      const invoiceItems = quote.items
        .map((item) => {
          const quotedQuantity = item.quantity ?? 1
          const remaining = quotedQuantity - (invoicedByItem.get(item.id) ?? 0)
          return {
            quoteItemId: item.id,
            description: item.description,
            unit: item.unit ?? undefined,
            quantity: Math.max(0, remaining),
            unitPrice: item.unitPrice ?? 0,
            total: Math.max(0, remaining) * (item.unitPrice ?? 0),
          }
        })
        .filter((item) => item.quantity > MONEY_EPSILON)

      if (invoiceItems.length === 0) throw new Error('NO_REMAINING_ITEMS')

      const invoiceNumber = await reserveNextDocumentNumber(tx, 'INVOICE')
      const subtotal = invoiceItems.reduce((sum, item) => sum + item.total, 0)
      const taxAmount = subtotal * (quote.taxRate / 100)
      const issueDate = new Date()
      const created = await tx.invoice.create({
        data: {
          invoiceNumber,
          projectId: quote.projectId,
          quoteId: quote.id,
          status: InvoiceStatus.DRAFT,
          issueDate,
          dueDate: await defaultDueDate(tx, issueDate),
          subtotal,
          taxRate: quote.taxRate,
          taxAmount,
          total: subtotal + taxAmount,
          billingMode: 'ITEMS',
          quoteBaseTotal: quote.total,
          items: { create: invoiceItems },
        },
      })

      await updateQuoteInvoiceStatus(tx, quoteId)

      return created
    })
  } catch (error) {
    return { error: actionErrorMessage(error) }
  }

  await logActivity(session, 'CREATE', 'Fattura', { entityId: invoice.id, entityLabel: `FAT-${invoice.invoiceNumber}`, details: { fromQuote: quoteId } })
  revalidatePath('/invoices')
  revalidatePath('/quotes')
  revalidatePath(`/projects/${invoice.projectId}`)
  redirect(`/invoices/${invoice.id}`)
}

export async function createInvoiceFromQuoteSelection(
  quoteId: string,
  _prevState: InvoiceFormState,
  formData: FormData,
): Promise<InvoiceFormState> {
  const session = await getSession()
  if (!session || !canMutate(session.role)) return { message: 'Non autorizzato' }

  let selected: Array<z.infer<typeof quoteInvoiceSelectionSchema>>
  try {
    const raw = formData.get('itemsJson')
    const parsed = typeof raw === 'string' && raw ? JSON.parse(raw) : []
    if (!Array.isArray(parsed)) throw new Error('INVALID_ITEMS')
    selected = parsed
      .map((item) => quoteInvoiceSelectionSchema.safeParse(item))
      .filter((result) => result.success)
      .map((result) => result.data)
  } catch {
    return { message: 'Errore nei dati degli articoli' }
  }
  if (selected.length === 0) return { message: 'Seleziona almeno un articolo da fatturare' }

  const notes = optionalString(formData.get('notes'))

  let invoice: { id: string; projectId: string; invoiceNumber: string }
  try {
    invoice = await prisma.$transaction(async (tx) => {
      const quote = await tx.quote.findUnique({
        where: { id: quoteId },
        include: {
          invoices: {
            where: { status: { not: InvoiceStatus.CANCELLED } },
            include: { items: true },
          },
          items: {
            where: { itemType: 'ITEM', hiddenFromClient: false },
            orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }],
          },
        },
      })
      if (!quote) throw new Error('QUOTE_NOT_FOUND')
      if (quote.status !== QuoteStatus.APPROVED && quote.status !== QuoteStatus.INVOICED) throw new Error('QUOTE_NOT_APPROVED')
      const existingMode = existingQuoteBillingMode(quote.invoices)
      if (existingMode === 'PERCENTAGE') throw new Error('QUOTE_BILLING_MODE_LOCKED_PERCENTAGE')

      const invoicedByItem = new Map<string, number>()
      for (const existingInvoice of quote.invoices) {
        for (const item of existingInvoice.items) {
          if (!item.quoteItemId) continue
          invoicedByItem.set(item.quoteItemId, (invoicedByItem.get(item.quoteItemId) ?? 0) + item.quantity)
        }
      }

      const quoteItems = new Map(quote.items.map((item) => [item.id, item]))
      const invoiceItems = selected.map((selection) => {
        const quoteItem = quoteItems.get(selection.quoteItemId)
        if (!quoteItem) throw new Error('INVALID_ITEMS')
        const quotedQuantity = quoteItem.quantity ?? 1
        const remaining = quotedQuantity - (invoicedByItem.get(quoteItem.id) ?? 0)
        if (selection.quantity > remaining + MONEY_EPSILON) throw new Error('QUANTITY_TOO_HIGH')
        return {
          quoteItemId: quoteItem.id,
          description: selection.description?.trim() || quoteItem.description,
          unit: quoteItem.unit ?? undefined,
          quantity: selection.quantity,
          unitPrice: quoteItem.unitPrice ?? 0,
          total: selection.quantity * (quoteItem.unitPrice ?? 0),
        }
      })
      if (invoiceItems.length === 0) throw new Error('NO_ITEMS')

      const subtotal = invoiceItems.reduce((sum, item) => sum + item.total, 0)
      const taxAmount = subtotal * (quote.taxRate / 100)
      const invoiceNumber = await reserveNextDocumentNumber(tx, 'INVOICE')
      const issueDate = new Date()

      const created = await tx.invoice.create({
        data: {
          invoiceNumber,
          projectId: quote.projectId,
          quoteId: quote.id,
          status: InvoiceStatus.DRAFT,
          issueDate,
          dueDate: await defaultDueDate(tx, issueDate),
          subtotal,
          taxRate: quote.taxRate,
          taxAmount,
          total: subtotal + taxAmount,
          billingMode: 'ITEMS',
          quoteBaseTotal: quote.total,
          notes,
          items: { create: invoiceItems },
        },
      })

      await updateQuoteInvoiceStatus(tx, quoteId)
      return created
    })
  } catch (error) {
    return { message: actionErrorMessage(error) }
  }

  await logActivity(session, 'CREATE', 'Fattura', { entityId: invoice.id, entityLabel: `FAT-${invoice.invoiceNumber}`, details: { fromQuote: quoteId, mode: 'ITEMS' } })
  revalidatePath('/invoices')
  revalidatePath('/quotes')
  revalidatePath(`/quotes/${quoteId}`)
  revalidatePath(`/projects/${invoice.projectId}`)
  redirect(`/invoices/${invoice.id}`)
}

export async function createPercentageInvoiceFromQuote(
  quoteId: string,
  _prevState: InvoiceFormState,
  formData: FormData,
): Promise<InvoiceFormState> {
  const session = await getSession()
  if (!session || !canMutate(session.role)) return { message: 'Non autorizzato' }

  const parsed = percentageInvoiceSchema.safeParse({
    billingLabel: formData.get('billingLabel') || 'Acconto',
    percent: formData.get('percent') || '0',
    notes: optionalString(formData.get('notes')),
  })
  if (!parsed.success) return { errors: parsed.error.flatten().fieldErrors }

  let invoice: { id: string; projectId: string; invoiceNumber: string }
  try {
    invoice = await prisma.$transaction(async (tx) => {
      const quote = await tx.quote.findUnique({
        where: { id: quoteId },
        include: {
          invoices: {
            where: { status: { not: InvoiceStatus.CANCELLED } },
            include: { items: true },
          },
        },
      })
      if (!quote) throw new Error('QUOTE_NOT_FOUND')
      if (quote.status !== QuoteStatus.APPROVED && quote.status !== QuoteStatus.INVOICED) throw new Error('QUOTE_NOT_APPROVED')

      const existingMode = existingQuoteBillingMode(quote.invoices)
      if (existingMode === 'ITEMS') throw new Error('QUOTE_BILLING_MODE_LOCKED_ITEMS')
      if (existingMode === 'MANUAL') throw new Error('QUOTE_BILLING_MODE_LOCKED_ITEMS')

      const alreadyPercent = quote.invoices.reduce((sum, invoice) => {
        if (invoice.billingMode !== 'PERCENTAGE') return sum
        if (invoice.billingPercent != null) return sum + invoice.billingPercent
        if (quote.subtotalClient <= MONEY_EPSILON) return sum
        return sum + (invoice.subtotal / quote.subtotalClient) * 100
      }, 0)
      const remainingPercent = Math.max(0, 100 - alreadyPercent)
      if (parsed.data.percent > remainingPercent + MONEY_EPSILON) throw new Error('PERCENT_TOO_HIGH')

      const subtotal = quote.subtotalClient * (parsed.data.percent / 100)
      const taxAmount = subtotal * (quote.taxRate / 100)
      const invoiceNumber = await reserveNextDocumentNumber(tx, 'INVOICE')
      const issueDate = new Date()
      const label = `${parsed.data.billingLabel} ${formatPercent(parsed.data.percent)}% come da preventivo ${quote.quoteNumber} v${quote.version}`

      const created = await tx.invoice.create({
        data: {
          invoiceNumber,
          projectId: quote.projectId,
          quoteId: quote.id,
          status: InvoiceStatus.DRAFT,
          issueDate,
          dueDate: await defaultDueDate(tx, issueDate),
          subtotal,
          taxRate: quote.taxRate,
          taxAmount,
          total: subtotal + taxAmount,
          billingMode: 'PERCENTAGE',
          billingPercent: parsed.data.percent,
          quoteBaseTotal: quote.total,
          notes: parsed.data.notes,
          items: {
            create: [{
              description: label,
              unit: '%',
              quantity: parsed.data.percent,
              unitPrice: quote.subtotalClient / 100,
              total: subtotal,
            }],
          },
        },
      })

      await updateQuoteInvoiceStatus(tx, quoteId)
      return created
    })
  } catch (error) {
    return { message: actionErrorMessage(error) }
  }

  await logActivity(session, 'CREATE', 'Fattura', { entityId: invoice.id, entityLabel: `FAT-${invoice.invoiceNumber}`, details: { fromQuote: quoteId, mode: 'PERCENTAGE' } })
  revalidatePath('/invoices')
  revalidatePath('/quotes')
  revalidatePath(`/quotes/${quoteId}`)
  revalidatePath(`/projects/${invoice.projectId}`)
  redirect(`/invoices/${invoice.id}`)
}

export async function markInvoiceSent(id: string): Promise<{ error?: string }> {
  const session = await getSession()
  if (!session || !canMutate(session.role)) return { error: 'Non autorizzato' }
  const invoiceForLog = await prisma.invoice.findUnique({ where: { id }, select: { invoiceNumber: true } })

  try {
    await prisma.invoice.update({
      where: { id },
      data: { status: InvoiceStatus.SENT, paidAt: null },
    })
  } catch {
    return { error: 'Fattura non trovata' }
  }

  await logActivity(session, 'STATUS_CHANGE', 'Fattura', { entityId: id, entityLabel: invoiceForLog ? `FAT-${invoiceForLog.invoiceNumber}` : id, details: { status: 'SENT' } })
  revalidatePath(`/invoices/${id}`)
  revalidatePath('/invoices')
  return {}
}

export async function addInvoicePayment(
  invoiceId: string,
  amount: number,
  paidAt: Date,
  notes?: string,
): Promise<{ paymentId?: string; error?: string }> {
  const session = await getSession()
  if (!session || !canMutate(session.role)) return { error: 'Non autorizzato' }
  if (amount <= 0 || Number.isNaN(amount)) return { error: 'Importo non valido' }
  if (Number.isNaN(paidAt.getTime())) return { error: 'Data pagamento non valida' }

  let paymentId: string | undefined
  try {
    paymentId = await prisma.$transaction(async (tx) => {
      const invoice = await tx.invoice.findUnique({
        where: { id: invoiceId },
        select: { total: true, status: true, payments: { select: { amount: true } } },
      })
      if (!invoice) throw new Error('INVOICE_NOT_FOUND')
      if (invoice.status === InvoiceStatus.CANCELLED) throw new Error('INVOICE_CANCELLED')

      const paid = totalPaid(invoice.payments)
      const remaining = invoice.total - paid
      if (amount > remaining + MONEY_EPSILON) throw new Error('PAYMENT_TOO_HIGH')

      const payment = await tx.invoicePayment.create({ data: { invoiceId, amount, paidAt, notes } })

      const nextPaid = paid + amount
      await tx.invoice.update({
        where: { id: invoiceId },
        data: nextPaid + MONEY_EPSILON >= invoice.total
          ? { status: InvoiceStatus.PAID, paidAt }
          : { status: invoice.status === InvoiceStatus.DRAFT ? InvoiceStatus.SENT : invoice.status, paidAt: null },
      })
      return payment.id
    })
  } catch (error) {
    return { error: actionErrorMessage(error) }
  }

  const invoiceForLog = await prisma.invoice.findUnique({ where: { id: invoiceId }, select: { invoiceNumber: true } })
  await logActivity(session, 'ADD_PAYMENT', 'Fattura', { entityId: invoiceId, entityLabel: invoiceForLog ? `FAT-${invoiceForLog.invoiceNumber}` : invoiceId, details: { amount, paidAt } })
  revalidatePath(`/invoices/${invoiceId}`)
  revalidatePath('/invoices')
  return { paymentId }
}

export async function deleteInvoicePayment(id: string, _invoiceId?: string): Promise<{ error?: string }> {
  const session = await getSession()
  if (!session || !canMutate(session.role)) return { error: 'Non autorizzato' }

  let invoiceId = _invoiceId
  try {
    invoiceId = await prisma.$transaction(async (tx) => {
      const payment = await tx.invoicePayment.findUnique({
        where: { id },
        select: { invoiceId: true },
      })
      if (!payment) throw new Error('PAYMENT_NOT_FOUND')

      await tx.invoicePayment.delete({ where: { id } })
      const invoice = await tx.invoice.findUnique({
        where: { id: payment.invoiceId },
        select: { total: true, status: true, payments: { select: { amount: true } } },
      })
      if (!invoice) throw new Error('INVOICE_NOT_FOUND')

      const paid = totalPaid(invoice.payments)
      if (invoice.status !== InvoiceStatus.CANCELLED) {
        await tx.invoice.update({
          where: { id: payment.invoiceId },
          data: paid + MONEY_EPSILON >= invoice.total && invoice.total > 0
            ? { status: InvoiceStatus.PAID }
            : { status: InvoiceStatus.SENT, paidAt: null },
        })
      }

      return payment.invoiceId
    })
  } catch (error) {
    return { error: actionErrorMessage(error) }
  }

  if (invoiceId) revalidatePath(`/invoices/${invoiceId}`)
  revalidatePath('/invoices')
  return {}
}

export async function cloneInvoice(id: string) {
  void id
  const session = await getSession()
  if (!session || !canMutate(session.role)) return { error: 'Non autorizzato' }
  return { error: 'Il versionamento delle fatture e disabilitato: crea una nuova fattura separata.' }
}
