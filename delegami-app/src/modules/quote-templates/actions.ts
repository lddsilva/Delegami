'use server'

import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { prisma } from '@/lib/db'
import { canMutate, canDelete, getSession } from '@/lib/auth'
import { logActivity } from '@/lib/activity-log'

const templateTypeSchema = z.enum(['QUOTE', 'INVOICE'])
const qualityLevelSchema = z.enum(['STANDARD', 'LOW', 'MEDIUM', 'HIGH'])
const scopeLevelSchema = z.enum(['LIGHT', 'STANDARD', 'COMPLETE', 'SERVICE'])

const itemSchema = z.object({
  id: z.string().optional(),
  priceItemId: z.string().optional(),
  itemType: z.enum(['ITEM', 'SECTION', 'NOTE', 'SUBTOTAL', 'HEADER']).default('ITEM'),
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

const templateSchema = z.object({
  name: z.string().min(2, 'Nome obbligatorio'),
  description: z.string().optional(),
  category: z.string().min(1, 'Categoria obbligatoria'),
  subcategory: z.string().optional(),
  emoji: z.string().optional(),
  sortOrder: z.coerce.number().default(0),
  templateType: templateTypeSchema.default('QUOTE'),
  qualityLevel: qualityLevelSchema.default('STANDARD'),
  scopeLevel: scopeLevelSchema.default('SERVICE'),
  templateGroupKey: z.string().optional(),
  version: z.coerce.number().min(1).default(1),
  sourceQuoteId: z.string().optional(),
  isActive: z.boolean().default(true),
})

export type TemplateFormState = {
  errors?: Record<string, string[]>
  message?: string
} | null

function slugify(value: string) {
  return value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

function legacyQualityFromScope(scopeLevel: string) {
  if (scopeLevel === 'LIGHT') return 'LOW'
  if (scopeLevel === 'COMPLETE') return 'HIGH'
  if (scopeLevel === 'STANDARD') return 'MEDIUM'
  return 'STANDARD'
}

function scopeFromLegacy(qualityLevel: string) {
  if (qualityLevel === 'LOW') return 'LIGHT'
  if (qualityLevel === 'HIGH') return 'COMPLETE'
  if (qualityLevel === 'MEDIUM') return 'STANDARD'
  return 'SERVICE'
}

function parseItems(formData: FormData) {
  const itemsJson = formData.get('itemsJson') as string
  const raw = itemsJson ? JSON.parse(itemsJson) : []
  if (!Array.isArray(raw)) throw new Error('INVALID_ITEMS')
  return raw
    .map((item) => itemSchema.safeParse(item))
    .filter((result) => result.success)
    .map((result) => result.data)
    .filter((item) => item.itemType !== 'ITEM' || item.description.trim() !== '')
}

function parseTemplate(formData: FormData) {
  const fields = {
    name: formData.get('name') as string,
    description: (formData.get('description') as string) || undefined,
    category: formData.get('category') as string,
    subcategory: (formData.get('subcategory') as string) || undefined,
    emoji: (formData.get('emoji') as string) || '📋',
    sortOrder: formData.get('sortOrder') || '0',
    templateType: formData.get('templateType') || 'QUOTE',
    scopeLevel: formData.get('scopeLevel') || scopeFromLegacy((formData.get('qualityLevel') as string) || 'STANDARD'),
    qualityLevel: legacyQualityFromScope(String(formData.get('scopeLevel') || scopeFromLegacy((formData.get('qualityLevel') as string) || 'STANDARD'))),
    templateGroupKey: (formData.get('templateGroupKey') as string) || undefined,
    version: formData.get('version') || '1',
    sourceQuoteId: (formData.get('sourceQuoteId') as string) || undefined,
    isActive: formData.get('isActive') === 'on',
  }

  const parsed = templateSchema.safeParse(fields)
  if (!parsed.success) return { parsed, items: [] }
  const items = parseItems(formData)
  return { parsed, items }
}

export async function createTemplate(
  prevState: TemplateFormState,
  formData: FormData,
): Promise<TemplateFormState> {
  const session = await getSession()
  if (!session || !canMutate(session.role)) return { message: 'Non autorizzato' }

  let form
  try {
    form = parseTemplate(formData)
  } catch {
    return { message: 'Errore nei dati degli articoli' }
  }
  if (!form.parsed.success) return { errors: form.parsed.error.flatten().fieldErrors }
  if (form.items.length === 0) return { message: 'Aggiungi almeno una voce al template' }

  const data = form.parsed.data
  const groupKey = data.templateGroupKey || slugify(`${data.templateType}-${data.category}-${data.subcategory || data.name}`)

  const tmpl = await prisma.quoteTemplate.create({
    data: {
      ...data,
      templateGroupKey: groupKey,
      itemsJson: JSON.stringify(form.items),
    },
  })
  await logActivity(session, 'CREATE', 'Template', { entityId: tmpl.id, entityLabel: data.name })

  revalidatePath('/settings/templates')
  revalidatePath('/quotes/new')
  revalidatePath('/invoices/new')
  redirect('/settings/templates')
}

export async function updateTemplate(
  id: string,
  prevState: TemplateFormState,
  formData: FormData,
): Promise<TemplateFormState> {
  const session = await getSession()
  if (!session || !canMutate(session.role)) return { message: 'Non autorizzato' }

  let form
  try {
    form = parseTemplate(formData)
  } catch {
    return { message: 'Errore nei dati degli articoli' }
  }
  if (!form.parsed.success) return { errors: form.parsed.error.flatten().fieldErrors }
  if (form.items.length === 0) return { message: 'Aggiungi almeno una voce al template' }

  const data = form.parsed.data
  const groupKey = data.templateGroupKey || slugify(`${data.templateType}-${data.category}-${data.subcategory || data.name}`)

  await prisma.quoteTemplate.update({
    where: { id },
    data: {
      ...data,
      templateGroupKey: groupKey,
      itemsJson: JSON.stringify(form.items),
    },
  })
  await logActivity(session, 'UPDATE', 'Template', { entityId: id, entityLabel: data.name })

  revalidatePath('/settings/templates')
  revalidatePath(`/settings/templates/${id}/edit`)
  revalidatePath('/quotes/new')
  revalidatePath('/invoices/new')
  redirect('/settings/templates')
}

export async function toggleTemplateActive(id: string) {
  const session = await getSession()
  if (!session || !canMutate(session.role)) return

  const template = await prisma.quoteTemplate.findUnique({ where: { id }, select: { isActive: true, name: true } })
  if (!template) return

  await prisma.quoteTemplate.update({
    where: { id },
    data: { isActive: !template.isActive },
  })
  await logActivity(session, template.isActive ? 'DEACTIVATE' : 'ACTIVATE', 'Template', { entityId: id, entityLabel: template.name })

  revalidatePath('/settings/templates')
  revalidatePath('/quotes/new')
  revalidatePath('/invoices/new')
}

// ─── Import a template from AI-generated JSON ────────────────────────────────

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

const templateImportSchema = z.object({
  kind: z.literal('template').optional(),
  name: z.string().min(2, 'Nome obbligatorio'),
  description: z.string().optional(),
  category: z.string().min(1, 'Categoria obbligatoria'),
  subcategory: z.string().optional(),
  emoji: z.string().optional(),
  templateType: templateTypeSchema.default('QUOTE'),
  items: z.array(importItemSchema).min(1, 'Almeno una voce richiesta'),
})

export type TemplateImportResult = { templateId?: string; error?: string }

export async function importTemplateFromJson(jsonText: string): Promise<TemplateImportResult> {
  const session = await getSession()
  if (!session || !canMutate(session.role)) return { error: 'Non autorizzato' }

  let raw: unknown
  try {
    raw = JSON.parse(jsonText)
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'JSON non valido'
    return { error: `JSON non valido: ${msg}` }
  }

  const parsed = templateImportSchema.safeParse(raw)
  if (!parsed.success) {
    const first = parsed.error.issues[0]
    return { error: `Schema non valido: ${first.path.join('.') || 'root'} — ${first.message}` }
  }

  const data = parsed.data
  const validItems = data.items
    .map((item, idx) => ({
      itemType: item.type,
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
    }))
    .filter((i) => i.itemType !== 'ITEM' || i.description.trim() !== '')

  if (validItems.length === 0) return { error: 'Nessuna voce valida nel JSON' }

  const groupKey = slugify(`${data.templateType}-${data.category}-${data.subcategory || data.name}`)

  try {
    const created = await prisma.quoteTemplate.create({
      data: {
        name: data.name,
        description: data.description,
        category: data.category,
        subcategory: data.subcategory,
        emoji: data.emoji || '📋',
        sortOrder: 0,
        templateType: data.templateType,
        qualityLevel: 'STANDARD',
        scopeLevel: 'SERVICE',
        templateGroupKey: groupKey,
        version: 1,
        isActive: true,
        itemsJson: JSON.stringify(validItems),
      },
    })

    await logActivity(session, 'IMPORT', 'Template', {
      entityId: created.id,
      entityLabel: data.name,
      details: { source: 'json-import', itemCount: validItems.length },
    })

    revalidatePath('/settings/templates')
    revalidatePath('/quotes/new')
    revalidatePath('/invoices/new')
    return { templateId: created.id }
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Errore sconosciuto'
    return { error: `Creazione template fallita: ${msg}` }
  }
}

export async function deleteTemplate(id: string): Promise<{ error?: string }> {
  const session = await getSession()
  if (!session || !canDelete(session.role)) return { error: 'Non autorizzato' }

  const template = await prisma.quoteTemplate.findUnique({ where: { id }, select: { name: true } })
  if (!template) return { error: 'Template non trovato' }

  await prisma.quoteTemplate.delete({ where: { id } })
  await logActivity(session, 'DELETE', 'Template', { entityId: id, entityLabel: template.name })

  revalidatePath('/settings/templates')
  revalidatePath('/quotes/new')
  revalidatePath('/invoices/new')
  return {}
}

export async function clearTemplateSourceQuote(id: string): Promise<{ error?: string }> {
  const session = await getSession()
  if (!session || !canMutate(session.role)) return { error: 'Non autorizzato' }

  const template = await prisma.quoteTemplate.findUnique({ where: { id }, select: { name: true, sourceQuoteId: true } })
  if (!template) return { error: 'Template non trovato' }
  if (!template.sourceQuoteId) return {}

  await prisma.quoteTemplate.update({ where: { id }, data: { sourceQuoteId: null } })
  await logActivity(session, 'UPDATE', 'Template', { entityId: id, entityLabel: template.name, details: { clearedSourceQuoteId: template.sourceQuoteId } })

  revalidatePath('/settings/templates')
  return {}
}
