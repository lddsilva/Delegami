'use server'

import { revalidatePath } from 'next/cache'
import { put, del } from '@vercel/blob'
import { z } from 'zod'
import { prisma } from '@/lib/db'
import { getSession, canMutate } from '@/lib/auth'
import { logActivity } from '@/lib/activity-log'

const settingsSchema = z.object({
  name: z.string().min(1),
  address: z.string().optional(),
  city: z.string().optional(),
  postalCode: z.string().optional(),
  country: z.string().default('CH'),
  phone: z.string().optional(),
  email: z.string().email().optional().or(z.literal('')),
  iban: z.string().optional(),
  vatNumber: z.string().optional(),
  registrationNumber: z.string().optional(),
  accountantEmail: z.string().email().optional().or(z.literal('')),
  paymentTerms: z.string().optional(),
  quoteFooterText: z.string().optional(),
  invoiceFooterText: z.string().optional(),
  worksDirector: z.string().optional(),
  defaultQuoteNotes: z.string().optional(),
  defaultQuoteValidityDays: z.coerce.number().int().min(1).max(180).default(30),
  defaultInvoiceDueDays: z.coerce.number().int().min(0).max(180).default(5),
  eurChfRate: z.coerce.number().positive().default(0.9119),
  eurChfRateUpdatedAt: z.preprocess(
    (v) => (v === '' || v == null ? undefined : new Date(v as string)),
    z.date().optional(),
  ),
  defaultMargin: z.coerce.number().min(0).max(100).default(0),
  defaultTaxRate: z.coerce.number().min(0).max(100).default(8.1),
  defaultWorkerHourlyRate: z.coerce.number().min(0).default(25),
})

const SETTINGS_ID = 'company-default'

export type SettingsFormState = {
  errors?: Record<string, string[]>
  success?: boolean
} | null

export async function upsertSettings(
  prevState: SettingsFormState,
  formData: FormData,
): Promise<SettingsFormState> {
  const session = await getSession()
  if (!session || !canMutate(session.role)) return { errors: { _: ['Non autorizzato'] } }

  const raw = {
    name: formData.get('name') as string,
    address: formData.get('address') as string || undefined,
    city: formData.get('city') as string || undefined,
    postalCode: formData.get('postalCode') as string || undefined,
    country: formData.get('country') as string || 'CH',
    phone: formData.get('phone') as string || undefined,
    email: formData.get('email') as string || undefined,
    iban: formData.get('iban') as string || undefined,
    vatNumber: formData.get('vatNumber') as string || undefined,
    registrationNumber: formData.get('registrationNumber') as string || undefined,
    accountantEmail: formData.get('accountantEmail') as string || undefined,
    paymentTerms: formData.get('paymentTerms') as string || undefined,
    quoteFooterText: formData.get('quoteFooterText') as string || undefined,
    invoiceFooterText: formData.get('invoiceFooterText') as string || undefined,
    worksDirector: formData.get('worksDirector') as string || undefined,
    defaultQuoteNotes: formData.get('defaultQuoteNotes') as string || undefined,
    defaultQuoteValidityDays: formData.get('defaultQuoteValidityDays') as string || '30',
    defaultInvoiceDueDays: formData.get('defaultInvoiceDueDays') as string || '5',
    eurChfRate: formData.get('eurChfRate') as string || '0.9119',
    eurChfRateUpdatedAt: formData.get('eurChfRateUpdatedAt') as string || undefined,
    defaultMargin: formData.get('defaultMargin') as string || '0',
    defaultTaxRate: formData.get('defaultTaxRate') as string || '8.1',
    defaultWorkerHourlyRate: formData.get('defaultWorkerHourlyRate') as string || '25',
  }

  const parsed = settingsSchema.safeParse(raw)
  if (!parsed.success) {
    return { errors: parsed.error.flatten().fieldErrors }
  }

  const existing = await prisma.companySettings.findFirst({ orderBy: { createdAt: 'asc' } })
  try {
    if (existing) {
      await prisma.companySettings.update({ where: { id: existing.id }, data: parsed.data })
    } else {
      await prisma.companySettings.create({ data: { id: SETTINGS_ID, ...parsed.data } })
    }
  } catch (error) {
    if (typeof error === 'object' && error != null && 'code' in error && error.code === 'P2002') {
      await prisma.companySettings.update({ where: { id: SETTINGS_ID }, data: parsed.data })
    } else {
      throw error
    }
  }

  await logActivity(session, 'UPDATE', 'Configurazioni', { entityLabel: parsed.data.name })
  revalidatePath('/settings')
  return { success: true }
}

// ─── Payment QR (static image printed on invoice PDFs) ────────────────────────

export async function uploadPaymentQr(formData: FormData): Promise<{ error?: string }> {
  try {
    const session = await getSession()
    if (!session || !canMutate(session.role)) return { error: 'Non autorizzato' }

    const file = formData.get('file') as File
    if (!file || file.size === 0) return { error: 'Nessun file selezionato' }
    if (!file.type.startsWith('image/')) return { error: 'Il QR deve essere un’immagine (PNG/JPG)' }
    if (file.size > 5 * 1024 * 1024) return { error: 'File troppo grande (max 5 MB)' }

    const settings = await prisma.companySettings.findFirst({ orderBy: { createdAt: 'asc' } })
    if (!settings) return { error: 'Salva prima le impostazioni azienda' }

    const ext = file.name.split('.').pop()?.toLowerCase() || 'png'
    const blob = await put(`company/payment-qr-${Date.now()}.${ext}`, file, { access: 'public' })

    if (settings.paymentQrUrl) {
      try { await del(settings.paymentQrUrl) } catch { /* old blob may already be gone */ }
    }
    await prisma.companySettings.update({ where: { id: settings.id }, data: { paymentQrUrl: blob.url } })

    await logActivity(session, 'UPLOAD', 'Configurazioni', { entityLabel: 'QR pagamento fattura' })
    revalidatePath('/settings')
    return {}
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e)
    console.error('[uploadPaymentQr]', msg)
    return { error: msg }
  }
}

export async function removePaymentQr(): Promise<{ error?: string }> {
  try {
    const session = await getSession()
    if (!session || !canMutate(session.role)) return { error: 'Non autorizzato' }

    const settings = await prisma.companySettings.findFirst({ orderBy: { createdAt: 'asc' } })
    if (!settings?.paymentQrUrl) return {}

    try { await del(settings.paymentQrUrl) } catch { /* blob may already be gone */ }
    await prisma.companySettings.update({ where: { id: settings.id }, data: { paymentQrUrl: null } })

    await logActivity(session, 'UPDATE', 'Configurazioni', { entityLabel: 'QR pagamento rimosso' })
    revalidatePath('/settings')
    return {}
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e)
    console.error('[removePaymentQr]', msg)
    return { error: msg }
  }
}
