'use server'

import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { del } from '@vercel/blob'
import { z } from 'zod'
import { prisma } from '@/lib/db'
import { ExpenseType, PaymentStatus } from '@/generated/prisma/enums'
import { getSession, canMutate, canDelete } from '@/lib/auth'
import { logActivity } from '@/lib/activity-log'

const expenseSchema = z.object({
  projectId: z.string().optional().nullable(),
  supplierId: z.string().optional(),
  expenseType: z.nativeEnum(ExpenseType).default(ExpenseType.MATERIAL),
  paymentStatus: z.nativeEnum(PaymentStatus).default(PaymentStatus.PAID),
  category: z.string().optional(),
  description: z.string().min(1, 'Descrizione obbligatoria'),
  amount: z.coerce.number().min(0),
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

export type ExpenseFormState = { errors?: Record<string, string[]>; message?: string; createdId?: string } | null

function parseFormData(formData: FormData) {
  const currency = (formData.get('currency') as string) || 'CHF'
  const amountChfRaw = formData.get('amountChf') as string
  const exchangeRateRaw = formData.get('exchangeRate') as string
  const exchangeRateUpdatedAtRaw = formData.get('exchangeRateUpdatedAt') as string
  const projectIdRaw = (formData.get('projectId') as string) || ''
  const isItalianPurchase = formData.get('isItalianPurchase') === 'on'
  return {
    projectId: projectIdRaw || null,
    supplierId: (formData.get('supplierId') as string) || undefined,
    expenseType: formData.get('expenseType') as ExpenseType,
    paymentStatus: (formData.get('paymentStatus') as PaymentStatus) || PaymentStatus.PAID,
    category: undefined,
    description: formData.get('description') as string,
    amount: formData.get('amount') as string,
    currency: isItalianPurchase ? 'EUR' : currency,
    amountChf: amountChfRaw ? Number(amountChfRaw) : (currency === 'CHF' ? undefined : undefined),
    exchangeRate: exchangeRateRaw ? Number(exchangeRateRaw) : undefined,
    exchangeRateUpdatedAt: exchangeRateUpdatedAtRaw || undefined,
    isItalianPurchase,
    date: formData.get('date') as string,
    notes: (formData.get('notes') as string) || undefined,
  }
}

export async function createExpense(prevState: ExpenseFormState, formData: FormData): Promise<ExpenseFormState> {
  const session = await getSession()
  if (!session || !canMutate(session.role)) return { message: 'Non autorizzato' }

  const shoppingListItemId = (formData.get('shoppingListItemId') as string) || ''
  const parsed = expenseSchema.safeParse(parseFormData(formData))
  if (!parsed.success) return { errors: parsed.error.flatten().fieldErrors }
  const expense = await prisma.expense.create({ data: parsed.data })

  if (shoppingListItemId) {
    const paidAmount = parsed.data.currency !== 'CHF' && parsed.data.amountChf != null
      ? parsed.data.amountChf
      : parsed.data.amount
    const shoppingItem = await prisma.shoppingListItem.findUnique({
      where: { id: shoppingListItemId },
      select: { qtyPlanned: true, list: { select: { projectId: true } } },
    })
    if (shoppingItem && parsed.data.projectId === shoppingItem.list.projectId) {
      const unitPaid = shoppingItem.qtyPlanned ? paidAmount / shoppingItem.qtyPlanned : paidAmount
      await prisma.shoppingListItem.update({
        where: { id: shoppingListItemId },
        data: {
          expenseId: expense.id,
          status: 'PURCHASED',
          unitPricePaid: unitPaid,
        },
      })
      revalidatePath(`/projects/${parsed.data.projectId}/shopping-list`)
    }
  }

  await logActivity(session, 'CREATE', 'Spesa', { entityId: expense.id, entityLabel: parsed.data.description, details: { amount: parsed.data.amount, currency: parsed.data.currency } })
  revalidatePath('/expenses')
  if (parsed.data.projectId) revalidatePath(`/projects/${parsed.data.projectId}`)
  // Return ID so client can upload receipt then redirect
  return { createdId: expense.id }
}

export async function updateExpense(id: string, prevState: ExpenseFormState, formData: FormData): Promise<ExpenseFormState> {
  const session = await getSession()
  if (!session || !canMutate(session.role)) return { message: 'Non autorizzato' }

  const parsed = expenseSchema.safeParse(parseFormData(formData))
  if (!parsed.success) return { errors: parsed.error.flatten().fieldErrors }
  await prisma.expense.update({ where: { id }, data: parsed.data })
  const paidAmount = parsed.data.currency !== 'CHF' && parsed.data.amountChf != null
    ? parsed.data.amountChf
    : parsed.data.amount
  const linkedShoppingItems = await prisma.shoppingListItem.findMany({
    where: { expenseId: id },
    select: { id: true, qtyPlanned: true },
  })
  if (linkedShoppingItems.length > 0) {
    await prisma.$transaction(linkedShoppingItems.map((item) =>
      prisma.shoppingListItem.update({
        where: { id: item.id },
        data: { unitPricePaid: item.qtyPlanned ? paidAmount / item.qtyPlanned : paidAmount },
      }),
    ))
  }
  await logActivity(session, 'UPDATE', 'Spesa', { entityId: id, entityLabel: parsed.data.description })
  revalidatePath('/expenses')
  revalidatePath(`/expenses/${id}`)
  if (parsed.data.projectId) revalidatePath(`/projects/${parsed.data.projectId}`)
  if (parsed.data.projectId) revalidatePath(`/projects/${parsed.data.projectId}/shopping-list`)
  redirect(`/expenses/${id}`)
}

export async function deleteExpense(id: string) {
  const session = await getSession()
  if (!session || !canDelete(session.role)) return

  const exp = await prisma.expense.findUnique({ where: { id }, select: { projectId: true, description: true } })

  // Receipts that will be unarchived keep their photoUrl alive — preserve those blobs.
  const linkedReceipts = await prisma.receiptInbox.findMany({
    where: { expenseId: id },
    select: { photoUrl: true },
  })
  const preservedBlobUrls = new Set(linkedReceipts.map((r) => r.photoUrl))

  const linkedDocuments = await prisma.document.findMany({
    where: { expenseId: id },
    select: { id: true, filePath: true },
  })
  for (const doc of linkedDocuments) {
    if (preservedBlobUrls.has(doc.filePath)) continue
    if (!doc.filePath.includes('blob.vercel-storage.com')) continue
    try { await del(doc.filePath) } catch { /* blob may already be gone */ }
  }
  await prisma.document.deleteMany({ where: { expenseId: id } })

  // Unarchive any receipt that was processed into this expense
  await prisma.receiptInbox.updateMany({
    where: { expenseId: id },
    data: { expenseId: null, processedAt: null },
  })

  await prisma.receiptImportItem.updateMany({
    where: { expenseId: id },
    data: { expenseId: null, errorMessage: 'Spesa eliminata' },
  })

  await prisma.shoppingListItem.updateMany({
    where: { expenseId: id },
    data: { expenseId: null, status: 'PENDING', unitPricePaid: null },
  })

  await prisma.expense.delete({ where: { id } })
  await logActivity(session, 'DELETE', 'Spesa', { entityId: id, entityLabel: exp?.description })
  revalidatePath('/expenses')
  revalidatePath('/receipts')
  revalidatePath('/receipts/import')
  if (exp?.projectId) revalidatePath(`/projects/${exp.projectId}`)
  if (exp?.projectId) revalidatePath(`/projects/${exp.projectId}/shopping-list`)
  redirect('/expenses')
}

export async function moveExpenseToProject(
  id: string,
  newProjectId: string | null,
): Promise<{ error?: string }> {
  const session = await getSession()
  if (!session || !canMutate(session.role)) return { error: 'Non autorizzato' }

  const exp = await prisma.expense.findUnique({ where: { id }, select: { projectId: true, description: true } })
  if (!exp) return { error: 'Spesa non trovata' }

  if (newProjectId) {
    const target = await prisma.project.findUnique({ where: { id: newProjectId }, select: { id: true } })
    if (!target) return { error: 'Opera di destinazione non trovata' }
  }

  await prisma.$transaction([
    prisma.expense.update({ where: { id }, data: { projectId: newProjectId } }),
    // Keep linked receipt documents pointing at the same project for clean media grouping.
    prisma.document.updateMany({
      where: { expenseId: id },
      data: { projectId: newProjectId ?? undefined },
    }),
  ])

  await logActivity(session, 'UPDATE', 'Spesa', {
    entityId: id,
    entityLabel: exp.description,
    details: { movedFromProjectId: exp.projectId, movedToProjectId: newProjectId },
  })

  revalidatePath('/expenses')
  revalidatePath(`/expenses/${id}`)
  if (exp.projectId) revalidatePath(`/projects/${exp.projectId}`)
  if (newProjectId) revalidatePath(`/projects/${newProjectId}`)
  return {}
}

export async function markExpensePaid(id: string): Promise<{ error?: string }> {
  const session = await getSession()
  if (!session || !canMutate(session.role)) return { error: 'Non autorizzato' }
  const exp = await prisma.expense.findUnique({ where: { id }, select: { projectId: true, description: true } })
  await prisma.expense.update({ where: { id }, data: { paymentStatus: PaymentStatus.PAID } })
  await logActivity(session, 'STATUS_CHANGE', 'Spesa', { entityId: id, entityLabel: exp?.description, details: { status: 'PAID' } })
  revalidatePath(`/expenses/${id}`)
  revalidatePath('/expenses')
  if (exp?.projectId) revalidatePath(`/projects/${exp.projectId}`)
  return {}
}

export async function markExpensePending(id: string): Promise<{ error?: string }> {
  const session = await getSession()
  if (!session || !canMutate(session.role)) return { error: 'Non autorizzato' }
  const exp = await prisma.expense.findUnique({ where: { id }, select: { projectId: true, description: true } })
  await prisma.expense.update({ where: { id }, data: { paymentStatus: PaymentStatus.PENDING } })
  await logActivity(session, 'STATUS_CHANGE', 'Spesa', { entityId: id, entityLabel: exp?.description, details: { status: 'PENDING' } })
  revalidatePath(`/expenses/${id}`)
  revalidatePath('/expenses')
  if (exp?.projectId) revalidatePath(`/projects/${exp.projectId}`)
  return {}
}
