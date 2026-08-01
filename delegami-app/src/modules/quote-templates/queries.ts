import { prisma } from '@/lib/db'
import type { QuoteItem } from '@/components/quotes/quote-items-editor'

export type QuoteTemplateRow = {
  id: string
  name: string
  description: string | null
  category: string
  subcategory: string | null
  emoji: string
  sortOrder: number
  templateType: string
  qualityLevel: string
  scopeLevel: string
  templateGroupKey: string | null
  version: number
  sourceQuoteId: string | null
  sourceQuoteExists?: boolean
  isActive: boolean
  createdAt: Date
  updatedAt: Date
  items: QuoteItem[]
}

export type QuoteTemplatePickerOption = {
  id: string
  quoteNumber: string
  version: number
  projectName: string
  clientName: string
  updatedAt: Date
}

/**
 * Build lookup maps for current prezzario prices.
 * Used to override template prices with current prezzario values.
 * Only ITEM rows are matched; SECTION/NOTE rows keep template values.
 */
type PriceMapEntry = { id: string; unitCost: number; notes: string | null; links: string | null }
type PriceMaps = { byId: Map<string, PriceMapEntry>; byDescription: Map<string, PriceMapEntry> }

async function buildPriceMap(): Promise<PriceMaps> {
  const items = await prisma.priceItem.findMany({
    where: { isActive: true },
    select: { id: true, description: true, unitCost: true, notes: true, links: true },
  })
  const byId = new Map<string, PriceMapEntry>()
  const byDescription = new Map<string, PriceMapEntry>()
  for (const item of items) {
    const entry = { id: item.id, unitCost: item.unitCost, notes: item.notes, links: item.links }
    byId.set(item.id, entry)
    byDescription.set(item.description.toLowerCase().trim(), entry)
  }
  return { byId, byDescription }
}

function applyMargin(cost: number, pct: number): number {
  if (pct <= 0 || pct >= 100) return cost
  return parseFloat((cost / (1 - pct / 100)).toFixed(2))
}

/**
 * Resolve template items against current prezzario prices.
 * For each ITEM row whose description matches a prezzario entry,
 * update unitCost (and recalculate unitPrice via margin).
 * SECTION and NOTE rows are passed through unchanged.
 */
function resolveItems(items: QuoteItem[], priceMap: PriceMaps, marginPercent = 0): QuoteItem[] {
  return items.map((item) => {
    if (item.itemType !== 'ITEM') return item
    const key = (item.description ?? '').toLowerCase().trim()
    const entry = (item.priceItemId ? priceMap.byId.get(item.priceItemId) : undefined)
      ?? priceMap.byDescription.get(key)
    if (entry == null) return item // no match → keep template price as-is

    const newCost = entry.unitCost
    const newPrice = item.directPrice
      ? item.unitPrice ?? newCost
      : applyMargin(newCost, item.marginPercent ?? marginPercent)
    const firstLink = entry.links?.split('\n').find((u) => u.trim())?.trim()

    return {
      ...item,
      priceItemId: entry.id,
      unitCost: newCost,
      unitPrice: newPrice,
      sourceNote: entry.notes ?? item.sourceNote,
      sourceUrl: firstLink ?? item.sourceUrl,
    }
  })
}

const QUALITY_RANK: Record<string, number> = {
  LIGHT: 0,
  STANDARD: 1,
  COMPLETE: 2,
  SERVICE: 3,
  LOW: 0,
  MEDIUM: 1,
  HIGH: 2,
}

function sortTemplateRows(a: QuoteTemplateRow, b: QuoteTemplateRow) {
  const type = a.templateType.localeCompare(b.templateType, 'it')
  if (type !== 0) return type
  const category = a.category.localeCompare(b.category, 'it')
  if (category !== 0) return category
  const subcategory = (a.subcategory ?? '').localeCompare(b.subcategory ?? '', 'it')
  if (subcategory !== 0) return subcategory
  const group = (a.templateGroupKey ?? '').localeCompare(b.templateGroupKey ?? '', 'it')
  if (group !== 0) return group
  const quality = (QUALITY_RANK[a.scopeLevel] ?? QUALITY_RANK[a.qualityLevel] ?? 99) - (QUALITY_RANK[b.scopeLevel] ?? QUALITY_RANK[b.qualityLevel] ?? 99)
  if (quality !== 0) return quality
  if (a.sortOrder !== b.sortOrder) return a.sortOrder - b.sortOrder
  return a.name.localeCompare(b.name, 'it')
}

export async function getActiveTemplates(marginPercent = 0, type: 'QUOTE' | 'INVOICE' = 'QUOTE'): Promise<QuoteTemplateRow[]> {
  const [rows, priceMap] = await Promise.all([
    prisma.quoteTemplate.findMany({
      where: { isActive: true, templateType: type },
      orderBy: [
        { category: 'asc' },
        { subcategory: 'asc' },
        { templateGroupKey: 'asc' },
        { scopeLevel: 'asc' },
        { sortOrder: 'asc' },
        { name: 'asc' },
      ],
    }),
    type === 'QUOTE' ? buildPriceMap() : Promise.resolve({ byId: new Map<string, PriceMapEntry>(), byDescription: new Map<string, PriceMapEntry>() }),
  ])

  return rows.map((r) => {
    const raw = JSON.parse(r.itemsJson) as QuoteItem[]
    return {
      id: r.id,
      name: r.name,
      description: r.description,
      category: r.category,
      subcategory: r.subcategory,
      emoji: r.emoji,
      sortOrder: r.sortOrder,
      templateType: r.templateType,
      qualityLevel: r.qualityLevel,
      scopeLevel: r.scopeLevel,
      templateGroupKey: r.templateGroupKey,
      version: r.version,
      sourceQuoteId: r.sourceQuoteId,
      isActive: r.isActive,
      createdAt: r.createdAt,
      updatedAt: r.updatedAt,
      items: resolveItems(raw, priceMap, marginPercent),
    }
  }).sort(sortTemplateRows)
}

export async function getTemplateById(id: string, marginPercent = 0): Promise<QuoteTemplateRow | null> {
  const [r, priceMap] = await Promise.all([
    prisma.quoteTemplate.findUnique({ where: { id } }),
    buildPriceMap(),
  ])
  if (!r) return null
  const raw = JSON.parse(r.itemsJson) as QuoteItem[]
  return {
    id: r.id,
    name: r.name,
    description: r.description,
    category: r.category,
    subcategory: r.subcategory,
    emoji: r.emoji,
    sortOrder: r.sortOrder,
    templateType: r.templateType,
    qualityLevel: r.qualityLevel,
    scopeLevel: r.scopeLevel,
    templateGroupKey: r.templateGroupKey,
    version: r.version,
    sourceQuoteId: r.sourceQuoteId,
    isActive: r.isActive,
    createdAt: r.createdAt,
    updatedAt: r.updatedAt,
    items: resolveItems(raw, priceMap, marginPercent),
  }
}

export async function getTemplateForEdit(id: string): Promise<QuoteTemplateRow | null> {
  const r = await prisma.quoteTemplate.findUnique({ where: { id } })
  if (!r) return null
  const raw = JSON.parse(r.itemsJson) as QuoteItem[]
  return {
    id: r.id,
    name: r.name,
    description: r.description,
    category: r.category,
    subcategory: r.subcategory,
    emoji: r.emoji,
    sortOrder: r.sortOrder,
    templateType: r.templateType,
    qualityLevel: r.qualityLevel,
    scopeLevel: r.scopeLevel,
    templateGroupKey: r.templateGroupKey,
    version: r.version,
    sourceQuoteId: r.sourceQuoteId,
    isActive: r.isActive,
    createdAt: r.createdAt,
    updatedAt: r.updatedAt,
    items: raw,
  }
}

export async function getTemplateManagerRows(): Promise<QuoteTemplateRow[]> {
  const rows = await prisma.quoteTemplate.findMany({
    orderBy: [
      { templateType: 'asc' },
      { category: 'asc' },
      { subcategory: 'asc' },
      { scopeLevel: 'asc' },
      { sortOrder: 'asc' },
      { name: 'asc' },
    ],
  })

  const sourceQuoteIds = Array.from(
    new Set(rows.map((r) => r.sourceQuoteId).filter((id): id is string => Boolean(id))),
  )
  const existingQuotes = sourceQuoteIds.length > 0
    ? await prisma.quote.findMany({ where: { id: { in: sourceQuoteIds } }, select: { id: true } })
    : []
  const existingIds = new Set(existingQuotes.map((q) => q.id))

  return rows.map((r) => ({
    id: r.id,
    name: r.name,
    description: r.description,
    category: r.category,
    subcategory: r.subcategory,
    emoji: r.emoji,
    sortOrder: r.sortOrder,
    templateType: r.templateType,
    qualityLevel: r.qualityLevel,
    scopeLevel: r.scopeLevel,
    templateGroupKey: r.templateGroupKey,
    version: r.version,
    sourceQuoteId: r.sourceQuoteId,
    sourceQuoteExists: r.sourceQuoteId ? existingIds.has(r.sourceQuoteId) : false,
    isActive: r.isActive,
    createdAt: r.createdAt,
    updatedAt: r.updatedAt,
    items: JSON.parse(r.itemsJson) as QuoteItem[],
  })).sort(sortTemplateRows)
}

export async function getQuotesForTemplatePicker(): Promise<QuoteTemplatePickerOption[]> {
  const quotes = await prisma.quote.findMany({
    orderBy: { updatedAt: 'desc' },
    select: {
      id: true,
      quoteNumber: true,
      version: true,
      updatedAt: true,
      project: { select: { name: true, client: { select: { name: true } } } },
    },
  })

  return quotes.map((q) => ({
    id: q.id,
    quoteNumber: q.quoteNumber,
    version: q.version,
    projectName: q.project.name,
    clientName: q.project.client.name,
    updatedAt: q.updatedAt,
  }))
}
