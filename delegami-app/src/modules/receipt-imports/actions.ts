'use server'

import { revalidatePath } from 'next/cache'
import { put, del } from '@vercel/blob'
import { z } from 'zod'
import { prisma } from '@/lib/db'
import { getSession, canMutate } from '@/lib/auth'
import { ExpenseType, PaymentStatus } from '@/generated/prisma/enums'
import { defaultSupplierTagsForCategory, normalizeSupplierCategory } from '@/lib/supplier-taxonomy'
import { logActivity } from '@/lib/activity-log'

const currencySchema = z.enum(['CHF', 'EUR'])
const supplierModeSchema = z.enum(['existing', 'create', 'none'])

const manifestItemSchema = z.object({
  receiptInboxId: z.string().optional().nullable(),
  imageFile: z.string().min(1),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  supplierName: z.string().optional().nullable(),
  supplierAddress: z.string().optional().nullable(),
  supplierVatNumber: z.string().optional().nullable(),
  description: z.string().min(1),
  items: z.array(z.object({
    description: z.string().optional().nullable(),
    quantity: z.string().optional().nullable(),
    amount: z.number().optional().nullable(),
  })).optional().default([]),
  amount: z.number().positive(),
  currency: currencySchema,
  expenseType: z.nativeEnum(ExpenseType),
  paymentStatus: z.nativeEnum(PaymentStatus).default(PaymentStatus.PAID),
  isItalianPurchase: z.boolean().optional().nullable(),
  notes: z.string().optional().nullable(),
  confidence: z.number().min(0).max(1).optional().nullable(),
})

const reviewedItemSchema = manifestItemSchema.extend({
  projectId: z.string().optional().nullable(),
  projectLabel: z.string().optional().nullable(),
  supplierMode: supplierModeSchema,
  supplierId: z.string().optional().nullable(),
  createSupplierName: z.string().optional().nullable(),
  createSupplierCategory: z.string().optional().nullable(),
  allowDuplicate: z.boolean().default(false),
  skip: z.boolean().default(false),
  skipReason: z.string().optional().nullable(),
})

const previewRowSchema = z.object({
  rowKey: z.string(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  amount: z.number().positive(),
  currency: currencySchema,
  supplierId: z.string().optional().nullable(),
})

export type ReceiptImportReviewedItem = z.infer<typeof reviewedItemSchema>
export type ReceiptImportActionResult = {
  status?: 'CREATED' | 'SKIPPED' | 'ERROR'
  expenseId?: string
  receiptInboxId?: string
  duplicateExpenseId?: string
  message?: string
  error?: string
}

function parseDateOnly(value: string) {
  return new Date(`${value}T12:00:00.000Z`)
}

function safePathPart(value: string) {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9._-]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80) || 'receipt'
}

function normalizeText(value: string) {
  return value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()
}

function supplierCategoryForExpense(type: ExpenseType, fallback?: string | null) {
  if (fallback) return normalizeSupplierCategory(fallback) ?? 'Altro'
  if (type === ExpenseType.EQUIPMENT) return 'Noleggio attrezzature'
  if (type === ExpenseType.TRANSPORT) return 'Trasporto e smaltimento'
  if (type === ExpenseType.ADMIN) return 'Servizi professionali'
  return 'Materiali edili e ferramenta'
}

function buildExpenseNotes(item: ReceiptImportReviewedItem, supplierName: string) {
  const parts = [
    item.notes?.trim(),
    item.supplierName?.trim() && item.supplierName.trim() !== supplierName
      ? `Fornitore letto sullo scontrino: ${item.supplierName.trim()}`
      : null,
    item.items.length > 0
      ? `Dettaglio scontrino: ${item.items
        .map((entry) => [entry.description, entry.quantity, entry.amount != null ? `${item.currency} ${entry.amount}` : null].filter(Boolean).join(' - '))
        .filter(Boolean)
        .join('; ')}`
      : null,
    item.confidence != null ? `Confidenza lettura: ${Math.round(item.confidence * 100)}%` : null,
  ].filter(Boolean)

  return parts.length > 0 ? parts.join('\n') : undefined
}

async function findDuplicateExpense(input: {
  date: string
  amount: number
  currency: 'CHF' | 'EUR'
  supplierId?: string | null
}) {
  const start = new Date(`${input.date}T00:00:00.000Z`)
  const end = new Date(`${input.date}T23:59:59.999Z`)
  return prisma.expense.findFirst({
    where: {
      date: { gte: start, lte: end },
      amount: input.amount,
      currency: input.currency,
      supplierId: input.supplierId ?? null,
    },
    select: { id: true },
  })
}

export async function checkReceiptImportDuplicates(
  rows: Array<z.infer<typeof previewRowSchema>>,
): Promise<{ duplicates?: Record<string, string>; error?: string }> {
  const session = await getSession()
  if (!session || !canMutate(session.role)) return { error: 'Non autorizzato' }

  const parsed = z.array(previewRowSchema).safeParse(rows)
  if (!parsed.success) return { error: 'Dati anteprima non validi' }

  const duplicates: Record<string, string> = {}
  for (const row of parsed.data) {
    const duplicate = await findDuplicateExpense(row)
    if (duplicate) duplicates[row.rowKey] = duplicate.id
  }
  return { duplicates }
}

export async function createReceiptImportBatch(input: {
  fileName: string
  defaultProjectId?: string | null
  defaultProjectLabel?: string | null
  totalItems: number
}): Promise<{ batchId?: string; error?: string }> {
  const session = await getSession()
  if (!session || !canMutate(session.role)) return { error: 'Non autorizzato' }

  const parsed = z.object({
    fileName: z.string().min(1),
    defaultProjectId: z.string().optional().nullable(),
    defaultProjectLabel: z.string().optional().nullable(),
    totalItems: z.number().int().min(1),
  }).safeParse(input)
  if (!parsed.success) return { error: 'Dati lotto non validi' }

  const batch = await prisma.receiptImportBatch.create({
    data: {
      fileName: parsed.data.fileName,
      defaultProjectId: parsed.data.defaultProjectId || null,
      defaultProjectLabel: parsed.data.defaultProjectLabel || null,
      totalItems: parsed.data.totalItems,
      createdById: session.id,
      createdByName: session.name,
    },
    select: { id: true },
  })

  await logActivity(session, 'IMPORT', 'Scontrini', {
    entityId: batch.id,
    entityLabel: parsed.data.fileName,
    details: { totalItems: parsed.data.totalItems },
  })

  revalidatePath('/receipts/import')
  return { batchId: batch.id }
}

export async function importReceiptBatchItem(
  batchId: string,
  formData: FormData,
): Promise<ReceiptImportActionResult> {
  const session = await getSession()
  if (!session || !canMutate(session.role)) return { error: 'Non autorizzato' }

  const batch = await prisma.receiptImportBatch.findUnique({ where: { id: batchId } })
  if (!batch) return { error: 'Lotto import non trovato' }

  const itemJson = formData.get('itemJson')
  if (typeof itemJson !== 'string') return { error: 'Riga import mancante' }

  let raw: unknown
  try {
    raw = JSON.parse(itemJson)
  } catch {
    return { error: 'JSON riga non valido' }
  }

  const parsed = reviewedItemSchema.safeParse(raw)
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? 'Riga import non valida' }
  }
  const item = parsed.data
  const existingReceipt = item.receiptInboxId
    ? await prisma.receiptInbox.findUnique({
      where: { id: item.receiptInboxId },
      select: { id: true, photoUrl: true, processedAt: true, expenseId: true },
    })
    : null

  if (item.skip) {
    await prisma.$transaction([
      prisma.receiptImportItem.create({
        data: {
          batchId,
          imageFile: item.imageFile,
          receiptInboxId: item.receiptInboxId || null,
          rawJson: itemJson,
          supplierNameRaw: item.supplierName || null,
          projectId: item.projectId || null,
          projectLabel: item.projectLabel || null,
          status: 'SKIPPED',
          errorMessage: item.skipReason || 'Saltato dall utente',
        },
      }),
      prisma.receiptImportBatch.update({
        where: { id: batchId },
        data: { skippedCount: { increment: 1 } },
      }),
    ])
    return { status: 'SKIPPED', message: item.skipReason || 'Saltato' }
  }

  if (item.supplierMode === 'existing' && !item.supplierId) {
    return { error: 'Seleziona un fornitore' }
  }
  if (item.supplierMode === 'create' && !item.createSupplierName?.trim()) {
    return { error: 'Nome nuovo fornitore obbligatorio' }
  }
  // supplierMode === 'none' is allowed: expense will be created without supplier
  // (used when the receipt photo is unreadable and Marcos will fix it later)
  if (item.receiptInboxId && !existingReceipt) return { error: 'Scontrino originale non trovato' }
  if (existingReceipt?.processedAt || existingReceipt?.expenseId) return { error: 'Scontrino originale gia processato' }

  const photoEntry = formData.get('photo')
  const photoFile = photoEntry instanceof File && photoEntry.size > 0 ? photoEntry : null
  if (!existingReceipt && !photoFile) return { error: 'Foto scontrino mancante' }
  if (photoFile && photoFile.size > 15 * 1024 * 1024) return { error: 'Foto troppo grande (max 15 MB)' }

  const duplicate = await findDuplicateExpense({
    date: item.date,
    amount: item.amount,
    currency: item.currency,
    supplierId: item.supplierId,
  })
  if (duplicate && !item.allowDuplicate) {
    await prisma.$transaction([
      prisma.receiptImportItem.create({
        data: {
          batchId,
          imageFile: item.imageFile,
          receiptInboxId: item.receiptInboxId || null,
          rawJson: itemJson,
          supplierNameRaw: item.supplierName || null,
          supplierId: item.supplierId || null,
          projectId: item.projectId || null,
          projectLabel: item.projectLabel || null,
          status: 'SKIPPED',
          errorMessage: 'Possibile duplicato',
          duplicateExpenseId: duplicate.id,
        },
      }),
      prisma.receiptImportBatch.update({
        where: { id: batchId },
        data: { skippedCount: { increment: 1 } },
      }),
    ])
    return { status: 'SKIPPED', duplicateExpenseId: duplicate.id, message: 'Possibile duplicato saltato' }
  }

  const ext = photoFile ? photoFile.name.split('.').pop()?.toLowerCase() || 'jpg' : 'jpg'
  const fileName = `receipts/import/${batchId}/${Date.now()}-${safePathPart(item.imageFile)}.${ext}`
  let blobUrl: string | null = existingReceipt?.photoUrl ?? null
  let uploadedNewBlob = false

  try {
    if (!blobUrl && photoFile) {
      const blob = await put(fileName, photoFile, { access: 'public' })
      blobUrl = blob.url
      uploadedNewBlob = true
    }
    if (!blobUrl) throw new Error('Foto scontrino mancante')
    const finalBlobUrl = blobUrl

    const result = await prisma.$transaction(async (tx) => {
      let supplierId: string | null = item.supplierId || null
      let supplierName = ''

      if (item.supplierMode === 'none') {
        supplierId = null
        supplierName = item.supplierName?.trim() || 'fornitore non leggibile'
      } else if (item.supplierMode === 'create') {
        const desiredName = item.createSupplierName?.trim() || item.supplierName?.trim() || 'Fornitore importato'
        const normalizedDesired = normalizeText(desiredName)
        const existing = await tx.supplier.findFirst({
          where: { name: desiredName },
          select: { id: true, name: true },
        })
        const fuzzyExisting = existing ?? (normalizedDesired
          ? (await tx.supplier.findMany({ select: { id: true, name: true } }))
            .find((supplier) => normalizeText(supplier.name) === normalizedDesired)
          : null)

        if (fuzzyExisting) {
          supplierId = fuzzyExisting.id
          supplierName = fuzzyExisting.name
        } else {
          const category = supplierCategoryForExpense(item.expenseType, item.createSupplierCategory)
          const created = await tx.supplier.create({
            data: {
              name: desiredName,
              address: item.supplierAddress?.trim() || undefined,
              vatNumber: item.supplierVatNumber?.trim() || undefined,
              category,
              tags: defaultSupplierTagsForCategory(category),
              notes: 'Creato da import scontrini',
            },
            select: { id: true, name: true },
          })
          supplierId = created.id
          supplierName = created.name
        }
      } else {
        const supplier = await tx.supplier.findUnique({
          where: { id: supplierId ?? '' },
          select: { id: true, name: true },
        })
        if (!supplier) throw new Error('Fornitore non trovato')
        supplierId = supplier.id
        supplierName = supplier.name
      }

      const settings = await tx.companySettings.findFirst({
        select: { eurChfRate: true, eurChfRateUpdatedAt: true },
        orderBy: { createdAt: 'asc' },
      })
      const isEuro = item.currency === 'EUR' || item.isItalianPurchase === true
      const amountChf = isEuro ? Math.round(item.amount * (settings?.eurChfRate ?? 0.9119) * 100) / 100 : undefined
      const expense = await tx.expense.create({
        data: {
          projectId: item.projectId || null,
          supplierId,
          expenseType: item.expenseType,
          paymentStatus: item.paymentStatus,
          description: item.description,
          amount: item.amount,
          currency: item.currency,
          amountChf,
          exchangeRate: isEuro ? settings?.eurChfRate ?? 0.9119 : undefined,
          exchangeRateUpdatedAt: isEuro ? settings?.eurChfRateUpdatedAt ?? undefined : undefined,
          isItalianPurchase: item.isItalianPurchase ?? item.currency === 'EUR',
          date: parseDateOnly(item.date),
          notes: buildExpenseNotes(item, supplierName),
        },
        select: { id: true },
      })

      await tx.document.create({
        data: {
          name: `Scontrino ${item.date} - ${supplierName}`,
          filePath: finalBlobUrl,
          fileType: photoFile?.type || 'image/jpeg',
          fileSize: photoFile?.size,
          documentType: 'RECEIPT',
          expenseId: expense.id,
          projectId: item.projectId || undefined,
        },
      })

      const receipt = existingReceipt
        ? await tx.receiptInbox.update({
          where: { id: existingReceipt.id },
          data: {
            note: item.description,
            processedAt: new Date(),
            expenseId: expense.id,
          },
          select: { id: true },
        })
        : await tx.receiptInbox.create({
          data: {
            photoUrl: finalBlobUrl,
            note: item.description,
            capturedAt: parseDateOnly(item.date),
            processedAt: new Date(),
            expenseId: expense.id,
            createdById: session.id,
          },
          select: { id: true },
        })

      await tx.receiptImportItem.create({
        data: {
          batchId,
          imageFile: item.imageFile,
          photoUrl: finalBlobUrl,
          rawJson: itemJson,
          supplierNameRaw: item.supplierName || null,
          supplierId,
          supplierName,
          projectId: item.projectId || null,
          projectLabel: item.projectLabel || null,
          expenseId: expense.id,
          receiptInboxId: receipt.id,
          status: 'CREATED',
          duplicateExpenseId: duplicate?.id ?? null,
        },
      })

      await tx.receiptImportBatch.update({
        where: { id: batchId },
        data: { createdCount: { increment: 1 } },
      })

      return { expenseId: expense.id, receiptInboxId: receipt.id }
    })

    await logActivity(session, 'IMPORT', 'Spesa', {
      entityId: result.expenseId,
      entityLabel: item.description,
      details: { batchId, imageFile: item.imageFile },
    })

    revalidatePath('/receipts')
    revalidatePath('/receipts/import')
    revalidatePath('/expenses')
    if (item.projectId) revalidatePath(`/projects/${item.projectId}`)
    return { status: 'CREATED', ...result }
  } catch (error) {
    if (blobUrl && uploadedNewBlob) {
      try { await del(blobUrl) } catch { /* ignore cleanup failure */ }
    }
    const message = error instanceof Error ? error.message : String(error)
    await prisma.$transaction([
      prisma.receiptImportItem.create({
        data: {
          batchId,
          imageFile: item.imageFile,
          receiptInboxId: item.receiptInboxId || null,
          rawJson: itemJson,
          supplierNameRaw: item.supplierName || null,
          supplierId: item.supplierId || null,
          projectId: item.projectId || null,
          projectLabel: item.projectLabel || null,
          status: 'ERROR',
          errorMessage: message,
        },
      }),
      prisma.receiptImportBatch.update({
        where: { id: batchId },
        data: { errorCount: { increment: 1 } },
      }),
    ])
    return { status: 'ERROR', error: message }
  }
}

export async function finalizeReceiptImportBatch(batchId: string): Promise<{ error?: string }> {
  const session = await getSession()
  if (!session || !canMutate(session.role)) return { error: 'Non autorizzato' }

  const batch = await prisma.receiptImportBatch.findUnique({
    where: { id: batchId },
    include: { items: { select: { status: true } } },
  })
  if (!batch) return { error: 'Lotto import non trovato' }

  if (batch.items.length === 0) {
    await prisma.receiptImportBatch.delete({ where: { id: batchId } })
    revalidatePath('/receipts/import')
    return {}
  }

  const createdCount = batch.items.filter((item) => item.status === 'CREATED').length
  const skippedCount = batch.items.filter((item) => item.status === 'SKIPPED').length
  const errorCount = batch.items.filter((item) => item.status === 'ERROR').length
  const status = errorCount > 0 ? 'PARTIAL' : 'COMPLETED'

  await prisma.receiptImportBatch.update({
    where: { id: batchId },
    data: { createdCount, skippedCount, errorCount, status },
  })

  await logActivity(session, 'IMPORT', 'Scontrini', {
    entityId: batchId,
    entityLabel: batch.fileName,
    details: { status, createdCount, skippedCount, errorCount },
  })

  revalidatePath('/receipts/import')
  revalidatePath('/receipts')
  return {}
}
