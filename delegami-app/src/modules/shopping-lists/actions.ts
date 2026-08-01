'use server'

import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { prisma } from '@/lib/db'
import { canDelete, canMutate, getSession } from '@/lib/auth'
import { logActivity } from '@/lib/activity-log'

export type ShoppingListResult = { id?: string; error?: string }
export type ShoppingListItemResult = { id?: string; error?: string }
export type ActionResult = { error?: string }

const STATUS_VALUES = ['PENDING', 'ORDERED', 'PURCHASED', 'RECEIVED'] as const

export type ShoppingListImportMode = 'replace' | 'append'

function normalizeMatch(value: string | null | undefined) {
  return (value ?? '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()
}

function inferSupplierId(
  supplierName: string | null | undefined,
  sourceNote: string | null | undefined,
  sourceUrl: string | null | undefined,
  suppliers: Array<{ id: string; name: string; website: string | null }>,
) {
  const supplierNeedle = normalizeMatch(supplierName)
  if (supplierNeedle) {
    const exact = suppliers.find((supplier) => normalizeMatch(supplier.name) === supplierNeedle)
    if (exact) return exact.id
    const loose = suppliers.find((supplier) => {
      const name = normalizeMatch(supplier.name)
      return name.includes(supplierNeedle) || supplierNeedle.includes(name)
    })
    if (loose) return loose.id
  }

  const noteNeedle = normalizeMatch(sourceNote)
  if (noteNeedle) {
    const fromNote = suppliers.find((supplier) => noteNeedle.includes(normalizeMatch(supplier.name)))
    if (fromNote) return fromNote.id
  }

  if (sourceUrl) {
    const fromUrl = suppliers.find((supplier) => {
      if (!supplier.website) return false
      try {
        return new URL(sourceUrl).hostname.includes(new URL(supplier.website).hostname.replace(/^www\./, ''))
      } catch {
        return false
      }
    })
    if (fromUrl) return fromUrl.id
  }

  return null
}

// ─── Generate a list from an APPROVED quote ──────────────────────────────────

export async function createEmptyShoppingList(projectId: string): Promise<ShoppingListResult> {
  const session = await getSession()
  if (!session || !canMutate(session.role)) return { error: 'Non autorizzato' }

  const project = await prisma.project.findUnique({ where: { id: projectId }, select: { id: true, name: true } })
  if (!project) return { error: 'Opera non trovata' }

  const existing = await prisma.shoppingList.findFirst({ where: { projectId }, select: { id: true } })
  if (existing) return { id: existing.id }

  const created = await prisma.shoppingList.create({
    data: { projectId },
    select: { id: true },
  })

  await logActivity(session, 'CREATE', 'ListaAcquisti', {
    entityId: created.id,
    entityLabel: project.name,
    details: { source: 'empty' },
  })

  revalidatePath(`/projects/${projectId}`)
  revalidatePath(`/projects/${projectId}/shopping-list`)
  return { id: created.id }
}

export async function generateShoppingListFromQuote(
  projectId: string,
  quoteId: string,
): Promise<ShoppingListResult> {
  const session = await getSession()
  if (!session || !canMutate(session.role)) return { error: 'Non autorizzato' }

  const project = await prisma.project.findUnique({ where: { id: projectId }, select: { id: true, name: true } })
  if (!project) return { error: 'Opera non trovata' }

  const [quote, suppliers] = await Promise.all([
    prisma.quote.findUnique({
      where: { id: quoteId },
      include: {
        items: {
          orderBy: [{ sortOrder: 'asc' }],
          include: {
            priceItem: {
              select: {
                id: true,
                priceSources: {
                  where: { supplierName: { not: null } },
                  orderBy: { observedAt: 'desc' },
                  take: 1,
                  select: { supplierName: true },
                },
              },
            },
          },
        },
      },
    }),
    prisma.supplier.findMany({ select: { id: true, name: true, website: true } }),
  ])
  if (!quote) return { error: 'Preventivo non trovato' }
  if (quote.projectId !== projectId) return { error: 'Il preventivo non appartiene a questa opera' }
  if (quote.status !== 'APPROVED' && quote.status !== 'INVOICED') {
    return { error: 'Usa un preventivo approvato per generare la lista' }
  }

  const itemRows = quote.items.filter((item) => item.itemType === 'ITEM' && item.description.trim() !== '')
  if (itemRows.length === 0) return { error: 'Il preventivo non contiene articoli' }

  // Replace any existing list for this project (only one active list per project in v1).
  const existing = await prisma.shoppingList.findFirst({ where: { projectId }, select: { id: true } })
  if (existing) {
    await prisma.shoppingList.delete({ where: { id: existing.id } })
  }

  const created = await prisma.shoppingList.create({
    data: {
      projectId,
      sourceQuoteId: quoteId,
      items: {
        create: itemRows.map((item, idx) => {
          const inferredSupplierId = inferSupplierId(
            item.priceItem?.priceSources?.[0]?.supplierName,
            item.sourceNote,
            item.sourceUrl,
            suppliers,
          )
          return {
            description: item.description,
            unit: item.unit ?? undefined,
            qtyPlanned: item.quantity ?? 1,
            unitPriceEstimated: item.unitCost ?? undefined,
            supplierId: inferredSupplierId,
            sourceQuoteItemId: item.id,
            sourceUrl: item.sourceUrl ?? undefined,
            notes: item.sourceNote ?? undefined,
            sortOrder: idx,
            status: 'PENDING',
          }
        }),
      },
    },
    select: { id: true },
  })

  await logActivity(session, 'CREATE', 'ListaAcquisti', {
    entityId: created.id,
    entityLabel: project.name,
    details: { sourceQuoteId: quoteId, itemCount: itemRows.length },
  })

  revalidatePath(`/projects/${projectId}`)
  revalidatePath(`/projects/${projectId}/shopping-list`)
  return { id: created.id }
}

// ─── Update a single item (inline edit) ──────────────────────────────────────

const updateItemSchema = z.object({
  description: z.string().min(1).optional(),
  unit: z.string().optional().nullable(),
  qtyPlanned: z.coerce.number().min(0).optional(),
  qtyPurchased: z.coerce.number().min(0).optional().nullable(),
  unitPriceEstimated: z.coerce.number().min(0).optional().nullable(),
  unitPricePaid: z.coerce.number().min(0).optional().nullable(),
  supplierId: z.string().nullable().optional(),
  status: z.enum(STATUS_VALUES).optional(),
  sourceUrl: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
})

export async function updateShoppingListItem(
  itemId: string,
  data: z.infer<typeof updateItemSchema>,
): Promise<ActionResult> {
  const session = await getSession()
  if (!session || !canMutate(session.role)) return { error: 'Non autorizzato' }

  const parsed = updateItemSchema.safeParse(data)
  if (!parsed.success) return { error: 'Dati non validi' }

  const item = await prisma.shoppingListItem.findUnique({
    where: { id: itemId },
    select: { list: { select: { projectId: true } } },
  })
  if (!item) return { error: 'Articolo non trovato' }

  await prisma.shoppingListItem.update({
    where: { id: itemId },
    data: {
      ...parsed.data,
      supplierId: parsed.data.supplierId === '' ? null : parsed.data.supplierId,
    },
  })

  revalidatePath(`/projects/${item.list.projectId}/shopping-list`)
  return {}
}

// ─── Create a manual item ────────────────────────────────────────────────────

export async function createShoppingListItem(
  listId: string,
  data: { description: string; unit?: string; qtyPlanned?: number; supplierId?: string | null },
): Promise<ShoppingListItemResult> {
  const session = await getSession()
  if (!session || !canMutate(session.role)) return { error: 'Non autorizzato' }
  if (!data.description?.trim()) return { error: 'Descrizione obbligatoria' }

  const list = await prisma.shoppingList.findUnique({ where: { id: listId }, select: { projectId: true } })
  if (!list) return { error: 'Lista non trovata' }

  const last = await prisma.shoppingListItem.findFirst({
    where: { listId },
    orderBy: { sortOrder: 'desc' },
    select: { sortOrder: true },
  })

  const created = await prisma.shoppingListItem.create({
    data: {
      listId,
      description: data.description.trim(),
      unit: data.unit || null,
      qtyPlanned: data.qtyPlanned ?? 1,
      supplierId: data.supplierId || null,
      sortOrder: (last?.sortOrder ?? -1) + 1,
      status: 'PENDING',
    },
    select: { id: true },
  })

  revalidatePath(`/projects/${list.projectId}/shopping-list`)
  return { id: created.id }
}

// ─── Delete an item ─────────────────────────────────────────────────────────

export async function deleteShoppingListItem(itemId: string): Promise<ActionResult> {
  const session = await getSession()
  if (!session || !canMutate(session.role)) return { error: 'Non autorizzato' }

  const item = await prisma.shoppingListItem.findUnique({
    where: { id: itemId },
    select: { list: { select: { projectId: true } } },
  })
  if (!item) return { error: 'Articolo non trovato' }

  await prisma.shoppingListItem.delete({ where: { id: itemId } })
  revalidatePath(`/projects/${item.list.projectId}/shopping-list`)
  return {}
}

// ─── Reorder (used by ↑/↓ buttons) ──────────────────────────────────────────

export async function reorderShoppingListItem(
  itemId: string,
  direction: 'up' | 'down',
): Promise<ActionResult> {
  const session = await getSession()
  if (!session || !canMutate(session.role)) return { error: 'Non autorizzato' }

  const item = await prisma.shoppingListItem.findUnique({
    where: { id: itemId },
    select: { id: true, listId: true, sortOrder: true, supplierId: true, list: { select: { projectId: true } } },
  })
  if (!item) return { error: 'Articolo non trovato' }

  // Reorder within the same supplier group only.
  const neighbours = await prisma.shoppingListItem.findMany({
    where: { listId: item.listId, supplierId: item.supplierId },
    orderBy: { sortOrder: 'asc' },
    select: { id: true, sortOrder: true },
  })
  const idx = neighbours.findIndex((n) => n.id === itemId)
  if (idx === -1) return { error: 'Articolo non trovato nel gruppo' }
  const swapWith = direction === 'up' ? neighbours[idx - 1] : neighbours[idx + 1]
  if (!swapWith) return {} // already at the edge

  await prisma.$transaction([
    prisma.shoppingListItem.update({ where: { id: item.id }, data: { sortOrder: swapWith.sortOrder } }),
    prisma.shoppingListItem.update({ where: { id: swapWith.id }, data: { sortOrder: item.sortOrder } }),
  ])

  revalidatePath(`/projects/${item.list.projectId}/shopping-list`)
  return {}
}

// ─── Restore snapshot (session undo) ───────────────────────────────────────

const restoreItemSchema = z.object({
  description: z.string().min(1),
  unit: z.string().nullable().optional(),
  qtyPlanned: z.coerce.number().min(0),
  qtyPurchased: z.coerce.number().nullable().optional(),
  unitPriceEstimated: z.coerce.number().nullable().optional(),
  unitPricePaid: z.coerce.number().nullable().optional(),
  supplierId: z.string().nullable().optional(),
  status: z.enum(STATUS_VALUES),
  sourceUrl: z.string().nullable().optional(),
  notes: z.string().nullable().optional(),
  sortOrder: z.number(),
  sourceQuoteItemId: z.string().nullable().optional(),
  expenseId: z.string().nullable().optional(),
})

const restoreShoppingListSchema = z.object({
  notes: z.string().nullable().optional(),
  items: z.array(restoreItemSchema),
})

export async function restoreShoppingListSnapshot(
  listId: string,
  snapshotJson: string,
): Promise<ActionResult> {
  const session = await getSession()
  if (!session || !canMutate(session.role)) return { error: 'Non autorizzato' }

  const list = await prisma.shoppingList.findUnique({
    where: { id: listId },
    select: { id: true, projectId: true },
  })
  if (!list) return { error: 'Lista non trovata' }

  let raw: unknown
  try {
    raw = JSON.parse(snapshotJson)
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'JSON non valido'
    return { error: `Snapshot non valido: ${msg}` }
  }

  const parsed = restoreShoppingListSchema.safeParse(raw)
  if (!parsed.success) {
    const first = parsed.error.issues[0]
    return { error: `Snapshot non valido: ${first.path.join('.') || 'root'} - ${first.message}` }
  }

  await prisma.$transaction([
    prisma.shoppingListItem.deleteMany({ where: { listId } }),
    prisma.shoppingList.update({
      where: { id: listId },
      data: { notes: parsed.data.notes ?? null, updatedAt: new Date() },
    }),
    prisma.shoppingListItem.createMany({
      data: parsed.data.items.map((item) => ({
        listId,
        description: item.description,
        unit: item.unit ?? null,
        qtyPlanned: item.qtyPlanned,
        qtyPurchased: item.qtyPurchased ?? null,
        unitPriceEstimated: item.unitPriceEstimated ?? null,
        unitPricePaid: item.unitPricePaid ?? null,
        supplierId: item.supplierId ?? null,
        status: item.status,
        sourceUrl: item.sourceUrl ?? null,
        notes: item.notes ?? null,
        sortOrder: item.sortOrder,
        sourceQuoteItemId: item.sourceQuoteItemId ?? null,
        expenseId: item.expenseId ?? null,
      })),
    }),
  ])

  await logActivity(session, 'UPDATE', 'ListaAcquisti', {
    entityId: listId,
    details: { source: 'session-restore', itemCount: parsed.data.items.length },
  })

  revalidatePath(`/projects/${list.projectId}/shopping-list`)
  return {}
}

// ─── AI export/import ───────────────────────────────────────────────────────

const importShoppingItemSchema = z.object({
  description: z.string().min(1),
  unit: z.string().optional().nullable(),
  qtyPlanned: z.coerce.number().min(0).optional(),
  qty: z.coerce.number().min(0).optional(),
  unitPriceEstimated: z.coerce.number().min(0).optional().nullable(),
  supplierId: z.string().optional().nullable(),
  supplierName: z.string().optional().nullable(),
  status: z.enum(STATUS_VALUES).optional(),
  sourceUrl: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
})

const shoppingListImportSchema = z.object({
  kind: z.literal('shopping_list').optional(),
  notes: z.string().optional().nullable(),
  items: z.array(importShoppingItemSchema).min(1),
})

export async function importShoppingListFromJson(
  projectId: string,
  jsonText: string,
  mode: ShoppingListImportMode,
): Promise<ShoppingListResult> {
  const session = await getSession()
  if (!session || !canMutate(session.role)) return { error: 'Non autorizzato' }

  const project = await prisma.project.findUnique({ where: { id: projectId }, select: { id: true, name: true } })
  if (!project) return { error: 'Opera non trovata' }

  let raw: unknown
  try {
    raw = JSON.parse(jsonText)
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'JSON non valido'
    return { error: `JSON non valido: ${msg}` }
  }

  const parsed = shoppingListImportSchema.safeParse(raw)
  if (!parsed.success) {
    const first = parsed.error.issues[0]
    return { error: `Schema non valido: ${first.path.join('.') || 'root'} - ${first.message}` }
  }

  const suppliers = await prisma.supplier.findMany({ select: { id: true, name: true, website: true } })
  const existing = await prisma.shoppingList.findFirst({ where: { projectId }, select: { id: true } })
  const list = existing ?? await prisma.shoppingList.create({ data: { projectId }, select: { id: true } })

  if (mode === 'replace') {
    await prisma.shoppingListItem.deleteMany({ where: { listId: list.id } })
    await prisma.shoppingList.update({ where: { id: list.id }, data: { sourceQuoteId: null } })
  }

  const last = mode === 'append'
    ? await prisma.shoppingListItem.findFirst({ where: { listId: list.id }, orderBy: { sortOrder: 'desc' }, select: { sortOrder: true } })
    : null

  await prisma.shoppingList.update({
    where: { id: list.id },
    data: {
      notes: parsed.data.notes || undefined,
      items: {
        create: parsed.data.items.map((item, idx) => {
          const validSupplierId = item.supplierId && suppliers.some((supplier) => supplier.id === item.supplierId)
            ? item.supplierId
            : null
          return {
            description: item.description.trim(),
            unit: item.unit || null,
            qtyPlanned: item.qtyPlanned ?? item.qty ?? 1,
            unitPriceEstimated: item.unitPriceEstimated ?? undefined,
            supplierId: validSupplierId || inferSupplierId(item.supplierName, item.notes, item.sourceUrl, suppliers),
            status: item.status ?? 'PENDING',
            sourceUrl: item.sourceUrl || null,
            notes: item.notes || null,
            sortOrder: (last?.sortOrder ?? -1) + idx + 1,
          }
        }),
      },
    },
  })

  await logActivity(session, 'IMPORT', 'ListaAcquisti', {
    entityId: list.id,
    entityLabel: project.name,
    details: { source: 'ai-json', mode, itemCount: parsed.data.items.length },
  })

  revalidatePath(`/projects/${projectId}`)
  revalidatePath(`/projects/${projectId}/shopping-list`)
  return { id: list.id }
}

function jsonDate(date: Date | null | undefined) {
  return date ? date.toISOString().split('T')[0] : undefined
}

export async function exportShoppingListAiContext(projectId: string): Promise<{ data?: unknown; error?: string }> {
  const session = await getSession()
  if (!session || !canMutate(session.role)) return { error: 'Non autorizzato' }

  const project = await prisma.project.findUnique({
    where: { id: projectId },
    include: { client: { select: { name: true } } },
  })
  if (!project) return { error: 'Opera non trovata' }

  const [quotes, suppliers, list] = await Promise.all([
    prisma.quote.findMany({
      where: { projectId, status: { in: ['APPROVED', 'INVOICED'] } },
      orderBy: [{ version: 'desc' }, { updatedAt: 'desc' }],
      include: { items: { orderBy: { sortOrder: 'asc' } } },
    }),
    prisma.supplier.findMany({ orderBy: { name: 'asc' }, select: { id: true, name: true, category: true, website: true } }),
    prisma.shoppingList.findFirst({
      where: { projectId },
      include: { items: { orderBy: { sortOrder: 'asc' }, include: { supplier: { select: { id: true, name: true } } } } },
    }),
  ])

  return {
    data: {
      kind: 'shopping_list_ai_context',
      instructions: 'Genera SOLO JSON valido con kind="shopping_list". Usa items[] per i materiali da comprare. Usa supplierId solo se corrisponde a uno dei fornitori elencati; altrimenti usa supplierName. Non inventare prezzi o URL senza indicarlo in notes.',
      project: {
        id: project.id,
        name: project.name,
        address: project.address,
        startDate: jsonDate(project.startDate),
        clientName: project.client.name,
      },
      suppliers,
      approvedQuotes: quotes.map((quote) => ({
        id: quote.id,
        quoteNumber: quote.quoteNumber,
        version: quote.version,
        total: quote.total,
        items: quote.items.map((item) => ({
          type: item.itemType,
          description: item.description,
          unit: item.unit,
          quantity: item.quantity,
          unitCost: item.unitCost,
          sourceUrl: item.sourceUrl,
          sourceNote: item.sourceNote,
        })),
      })),
      currentShoppingList: list ? {
        notes: list.notes,
        items: list.items.map((item) => ({
          description: item.description,
          unit: item.unit,
          qtyPlanned: item.qtyPlanned,
          qtyPurchased: item.qtyPurchased,
          unitPriceEstimated: item.unitPriceEstimated,
          unitPricePaid: item.unitPricePaid,
          supplierId: item.supplierId,
          supplierName: item.supplier?.name,
          status: item.status,
          sourceUrl: item.sourceUrl,
          notes: item.notes,
        })),
      } : null,
      expectedOutputSchema: {
        kind: 'shopping_list',
        notes: 'string optional',
        items: [{
          description: 'string',
          qtyPlanned: 1,
          unit: 'pz | m² | m³ | ml | kg | t | l | h | set | corpo | sacco | scatola | confezione | rotolo | tubo | lastra | barattolo',
          supplierId: 'optional existing supplier id',
          supplierName: 'optional supplier name',
          unitPriceEstimated: 0,
          sourceUrl: 'optional',
          notes: 'optional',
        }],
      },
    },
  }
}

// ─── Delete entire list ─────────────────────────────────────────────────────

export async function deleteShoppingList(listId: string): Promise<ActionResult> {
  const session = await getSession()
  if (!session || !canDelete(session.role)) return { error: 'Non autorizzato' }

  const list = await prisma.shoppingList.findUnique({ where: { id: listId }, select: { projectId: true } })
  if (!list) return { error: 'Lista non trovata' }

  await prisma.shoppingList.delete({ where: { id: listId } })
  await logActivity(session, 'DELETE', 'ListaAcquisti', { entityId: listId })

  revalidatePath(`/projects/${list.projectId}`)
  revalidatePath(`/projects/${list.projectId}/shopping-list`)
  return {}
}
