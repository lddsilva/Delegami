'use server'

import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { prisma } from '@/lib/db'
import { getSession, canMutate, canDelete } from '@/lib/auth'
import { PRICE_CATALOG_CATEGORIES, normalizePriceCategory, priceCategoryPrefix } from '@/lib/price-catalog-taxonomy'
import { logActivity } from '@/lib/activity-log'

const priceItemSchema = z.object({
  code: z.string().optional(),
  category: z.string().min(1, 'Categoria obbligatoria'),
  description: z.string().min(1, 'Descrizione obbligatoria'),
  unit: z.string().min(1, 'Unità obbligatoria'),
  unitCost: z.coerce.number().min(0),
  productTier: z.enum(['ESSENTIAL', 'STANDARD', 'PREMIUM']).nullable().optional(),
  notes: z.string().optional(),
  links: z.string().optional(),
  isActive: z.boolean().default(true),
})

export type PriceItemFormState = { errors?: Record<string, string[]>; message?: string } | null

function parseFormData(formData: FormData) {
  const productTier = (formData.get('productTier') as string) || null
  return {
    code: (formData.get('code') as string) || undefined,
    category: normalizePriceCategory(formData.get('category') as string),
    description: formData.get('description') as string,
    unit: formData.get('unit') as string,
    unitCost: formData.get('unitCost') as string,
    productTier,
    notes: (formData.get('notes') as string) || undefined,
    links: (formData.get('links') as string) || undefined,
    isActive: formData.get('isActive') !== 'false' && formData.has('isActive'),
  }
}

function legacyQualityFromTier(productTier?: string | null) {
  if (productTier === 'ESSENTIAL') return 'LOW'
  if (productTier === 'PREMIUM') return 'HIGH'
  if (productTier === 'STANDARD') return 'MEDIUM'
  return 'STANDARD'
}

export async function createPriceItem(prevState: PriceItemFormState, formData: FormData): Promise<PriceItemFormState> {
  const session = await getSession()
  if (!session || !canMutate(session.role)) return { message: 'Non autorizzato' }

  const parsed = priceItemSchema.safeParse(parseFormData(formData))
  if (!parsed.success) return { errors: parsed.error.flatten().fieldErrors }
  const code = parsed.data.code?.trim() || await getNextPriceCode(parsed.data.category)
  const item = await prisma.priceItem.create({
    data: {
      ...parsed.data,
      code,
      qualityLevel: legacyQualityFromTier(parsed.data.productTier),
    },
  })
  await logActivity(session, 'CREATE', 'Prezzario', { entityId: item.id, entityLabel: `${code} – ${parsed.data.description}` })
  revalidatePath('/price-catalog')
  redirect('/price-catalog')
}

export async function updatePriceItem(id: string, prevState: PriceItemFormState, formData: FormData): Promise<PriceItemFormState> {
  const session = await getSession()
  if (!session || !canMutate(session.role)) return { message: 'Non autorizzato' }

  const parsed = priceItemSchema.safeParse(parseFormData(formData))
  if (!parsed.success) return { errors: parsed.error.flatten().fieldErrors }
  const code = parsed.data.code?.trim() || await getNextPriceCode(parsed.data.category)
  await prisma.priceItem.update({
    where: { id },
    data: {
      ...parsed.data,
      code,
      qualityLevel: legacyQualityFromTier(parsed.data.productTier),
    },
  })
  await logActivity(session, 'UPDATE', 'Prezzario', { entityId: id, entityLabel: `${code} – ${parsed.data.description}` })
  revalidatePath('/price-catalog')
  redirect('/price-catalog')
}

export async function deletePriceItem(id: string) {
  const session = await getSession()
  if (!session || !canDelete(session.role)) return

  const priceItem = await prisma.priceItem.findUnique({ where: { id }, select: { code: true, description: true } })
  await prisma.priceItem.delete({ where: { id } })
  await logActivity(session, 'DELETE', 'Prezzario', { entityId: id, entityLabel: priceItem ? `${priceItem.code} – ${priceItem.description}` : id })
  revalidatePath('/price-catalog')
}

export async function saveItemToCatalog(item: {
  description: string
  unit?: string
  unitCost?: number
  category?: string
}): Promise<{ ok: boolean; message?: string }> {
  const session = await getSession()
  if (!session || !canMutate(session.role)) return { ok: false, message: 'Non autorizzato' }
  if (!item.description?.trim()) return { ok: false, message: 'Descrizione mancante' }
  const category = normalizePriceCategory(item.category)
  if (!PRICE_CATALOG_CATEGORIES.includes(category as (typeof PRICE_CATALOG_CATEGORIES)[number])) {
    return { ok: false, message: 'Categoria non valida' }
  }
  const code = await getNextPriceCode(category)
  await prisma.priceItem.create({
    data: {
      code,
      description: item.description.trim(),
      unit: item.unit ?? 'corpo',
      unitCost: item.unitCost ?? 0,
      category,
      qualityLevel: 'STANDARD',
      isActive: true,
    },
  })
  await logActivity(session, 'SAVE_TO_CATALOG', 'Prezzario', { entityLabel: `${code} – ${item.description.trim()}` })
  revalidatePath('/price-catalog')
  return { ok: true }
}

export async function togglePriceItemActive(id: string, isActive: boolean) {
  const session = await getSession()
  if (!session || !canMutate(session.role)) return

  await prisma.priceItem.update({ where: { id }, data: { isActive } })
  revalidatePath('/price-catalog')
}

export async function getNextPriceCode(category: string): Promise<string> {
  const normalized = normalizePriceCategory(category)
  const prefix = priceCategoryPrefix(normalized)
  const rows = await prisma.priceItem.findMany({
    where: { category: normalized, code: { startsWith: `${prefix}-` } },
    select: { code: true },
  })
  const max = rows.reduce((current, row) => {
    const match = row.code?.match(new RegExp(`^${prefix}-(\\d+)$`))
    return Math.max(current, match ? Number(match[1]) : 0)
  }, 0)
  return `${prefix}-${String(max + 1).padStart(3, '0')}`
}
