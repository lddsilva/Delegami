'use server'

import { put, del } from '@vercel/blob'
import { revalidatePath } from 'next/cache'
import { prisma } from '@/lib/db'
import { getSession, canMutate, canDelete } from '@/lib/auth'

type ActionResult = { error?: string }

export async function uploadProjectPhoto(formData: FormData): Promise<ActionResult> {
  try {
    const session = await getSession()
    if (!session || !canMutate(session.role)) return { error: 'Non autorizzato' }

    const file = formData.get('file') as File
    const projectId = formData.get('projectId') as string

    if (!file || file.size === 0) return { error: 'Nessun file selezionato' }
    if (!projectId) return { error: 'Progetto mancante' }
    if (file.size > 10 * 1024 * 1024) return { error: 'File troppo grande (max 10 MB)' }

    const ext = file.name.split('.').pop() ?? 'jpg'
    const filename = `projects/${projectId}/photos/${Date.now()}.${ext}`

    const blob = await put(filename, file, { access: 'public' })

    await prisma.document.create({
      data: {
        name: file.name,
        filePath: blob.url,
        fileType: file.type,
        fileSize: file.size,
        documentType: 'PHOTO',
        projectId,
      },
    })

    revalidatePath(`/projects/${projectId}`)
    return {}
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e)
    console.error('[uploadProjectPhoto]', msg)
    return { error: msg }
  }
}

export async function uploadQuoteAttachment(formData: FormData): Promise<ActionResult> {
  try {
    const session = await getSession()
    if (!session || !canMutate(session.role)) return { error: 'Non autorizzato' }

    const file = formData.get('file') as File
    const quoteId = formData.get('quoteId') as string
    const projectId = formData.get('projectId') as string

    if (!file || file.size === 0) return { error: 'Nessun file selezionato' }
    if (!quoteId) return { error: 'Preventivo mancante' }
    if (file.size > 20 * 1024 * 1024) return { error: 'File troppo grande (max 20 MB)' }

    const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_')
    const filename = `quotes/${quoteId}/attachments/${Date.now()}-${safeName}`

    const quote = await prisma.quote.findUnique({
      where: { id: quoteId },
      select: { projectId: true },
    })
    const blob = await put(filename, file, { access: 'public' })

    await prisma.document.create({
      data: {
        name: file.name,
        filePath: blob.url,
        fileType: file.type,
        fileSize: file.size,
        documentType: 'ATTACHMENT',
        quoteId,
        projectId: projectId || quote?.projectId || null,
      },
    })

    revalidatePath(`/quotes/${quoteId}`)
    revalidatePath('/media')
    return {}
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e)
    console.error('[uploadQuoteAttachment]', msg)
    return { error: msg }
  }
}

export async function uploadExpenseReceipt(formData: FormData): Promise<ActionResult> {
  try {
    const session = await getSession()
    if (!session || !canMutate(session.role)) return { error: 'Non autorizzato' }

    const file = formData.get('file') as File
    const expenseId = formData.get('expenseId') as string

    if (!file || file.size === 0) return { error: 'Nessun file selezionato' }
    if (!expenseId) return { error: 'Spesa mancante' }
    if (file.size > 15 * 1024 * 1024) return { error: 'File troppo grande (max 15 MB)' }

    const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_')
    const filename = `expenses/${expenseId}/receipts/${Date.now()}-${safeName}`

    const expense = await prisma.expense.findUnique({
      where: { id: expenseId },
      select: { projectId: true },
    })
    const blob = await put(filename, file, { access: 'public' })

    await prisma.document.create({
      data: {
        name: file.name,
        filePath: blob.url,
        fileType: file.type,
        fileSize: file.size,
        documentType: 'RECEIPT',
        expenseId,
        projectId: expense?.projectId ?? null,
      },
    })

    revalidatePath(`/expenses/${expenseId}`)
    revalidatePath('/media')
    return {}
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e)
    console.error('[uploadExpenseReceipt]', msg)
    return { error: msg }
  }
}

export async function uploadInvoiceDocument(formData: FormData): Promise<ActionResult> {
  try {
    const session = await getSession()
    if (!session || !canMutate(session.role)) return { error: 'Non autorizzato' }

    const file = formData.get('file') as File
    const invoiceId = formData.get('invoiceId') as string
    const documentType = (formData.get('documentType') as string) || 'ATTACHMENT'

    if (!file || file.size === 0) return { error: 'Nessun file selezionato' }
    if (!invoiceId) return { error: 'Fattura mancante' }
    if (file.size > 20 * 1024 * 1024) return { error: 'File troppo grande (max 20 MB)' }

    const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_')
    const filename = `invoices/${invoiceId}/documents/${Date.now()}-${safeName}`

    const invoice = await prisma.invoice.findUnique({
      where: { id: invoiceId },
      select: { projectId: true },
    })
    const blob = await put(filename, file, { access: 'public' })

    await prisma.document.create({
      data: {
        name: file.name,
        filePath: blob.url,
        fileType: file.type,
        fileSize: file.size,
        documentType,
        invoiceId,
        projectId: invoice?.projectId ?? null,
      },
    })

    revalidatePath(`/invoices/${invoiceId}`)
    revalidatePath('/media')
    return {}
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e)
    console.error('[uploadInvoiceDocument]', msg)
    return { error: msg }
  }
}

export async function uploadProjectDocument(formData: FormData): Promise<ActionResult> {
  try {
    const session = await getSession()
    if (!session || !canMutate(session.role)) return { error: 'Non autorizzato' }

    const file = formData.get('file') as File
    const projectId = formData.get('projectId') as string
    const documentType = (formData.get('documentType') as string) || 'ATTACHMENT'

    if (!file || file.size === 0) return { error: 'Nessun file selezionato' }
    if (!projectId) return { error: 'Progetto mancante' }
    if (file.size > 20 * 1024 * 1024) return { error: 'File troppo grande (max 20 MB)' }

    const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_')
    const filename = `projects/${projectId}/documents/${Date.now()}-${safeName}`

    const blob = await put(filename, file, { access: 'public' })

    await prisma.document.create({
      data: {
        name: file.name,
        filePath: blob.url,
        fileType: file.type,
        fileSize: file.size,
        documentType,
        projectId,
      },
    })

    revalidatePath(`/projects/${projectId}`)
    revalidatePath('/media')
    return {}
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e)
    console.error('[uploadProjectDocument]', msg)
    return { error: msg }
  }
}

export async function uploadCompanyDocument(formData: FormData): Promise<ActionResult> {
  try {
    const session = await getSession()
    if (!session || !canMutate(session.role)) return { error: 'Non autorizzato' }

    const file = formData.get('file') as File
    const documentType = (formData.get('documentType') as string) || 'LEGAL'

    if (!file || file.size === 0) return { error: 'Nessun file selezionato' }
    if (file.size > 20 * 1024 * 1024) return { error: 'File troppo grande (max 20 MB)' }

    const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_')
    const filename = `company/${documentType.toLowerCase()}/${Date.now()}-${safeName}`
    const blob = await put(filename, file, { access: 'public' })

    await prisma.document.create({
      data: {
        name: file.name,
        filePath: blob.url,
        fileType: file.type,
        fileSize: file.size,
        documentType,
      },
    })

    revalidatePath('/media')
    return {}
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e)
    console.error('[uploadCompanyDocument]', msg)
    return { error: msg }
  }
}

export async function uploadPaymentReceipt(paymentId: string, invoiceId: string, formData: FormData): Promise<ActionResult & { url?: string }> {
  try {
    const session = await getSession()
    if (!session || !canMutate(session.role)) return { error: 'Non autorizzato' }

    const file = formData.get('file') as File
    if (!file || file.size === 0) return { error: 'Nessun file selezionato' }
    if (file.size > 15 * 1024 * 1024) return { error: 'File troppo grande (max 15 MB)' }

    const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_')
    const filename = `invoices/${invoiceId}/payments/${paymentId}-${safeName}`
    const blob = await put(filename, file, { access: 'public' })

    await prisma.invoicePayment.update({ where: { id: paymentId }, data: { receiptUrl: blob.url } })

    revalidatePath(`/invoices/${invoiceId}`)
    return { url: blob.url }
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e)
    console.error('[uploadPaymentReceipt]', msg)
    return { error: msg }
  }
}

export async function deleteDocument(id: string, returnPath: string): Promise<ActionResult> {
  try {
    const session = await getSession()
    if (!session || !canDelete(session.role)) return { error: 'Non autorizzato' }

    const doc = await prisma.document.findUnique({ where: { id } })
    if (!doc) return { error: 'Documento non trovato' }

    if (doc.filePath.includes('blob.vercel-storage.com')) {
      try { await del(doc.filePath) } catch { /* ignore */ }
    }

    await prisma.document.delete({ where: { id } })
    revalidatePath(returnPath)
    return {}
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e)
    return { error: msg }
  }
}
