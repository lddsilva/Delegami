'use server'

import { prisma } from '@/lib/db'
import { getSession } from '@/lib/auth'

export type SearchHit = {
  id: string
  href: string
  /** What the row is — "Cliente", "Opera", "Preventivo"… */
  kind: SearchKind
  /** The line the user reads first. */
  title: string
  /** Where it sits: the client, the opera, the date. Never a number without it. */
  context: string | null
  /** Right-aligned figure, already formatted, or null when the row has no amount. */
  amount: number | null
}

export type SearchKind =
  | 'client'
  | 'project'
  | 'quote'
  | 'invoice'
  | 'expense'
  | 'supplier'
  | 'priceItem'

/** How many rows per kind. Enough to recognise the one you meant, few enough to scan. */
const PER_KIND = 5

/**
 * One field for the whole app.
 *
 * Eighteen destinations in the navigation and no way to ask for a specific
 * record: finding PRE-2026-013 meant Preventivi → scroll → read. This searches
 * the six entities people actually look up by name or number.
 *
 * SQLite's LIKE is case-insensitive for ASCII, which is what `contains`
 * compiles to — Prisma's `mode: 'insensitive'` is not supported on this
 * provider and would throw, so it is deliberately absent.
 */
export async function searchEverything(rawQuery: string): Promise<SearchHit[]> {
  const session = await getSession()
  // A WORKER only ever reaches /rapportino; giving them a search box over the
  // whole business would be a hole in that restriction, not a convenience.
  if (!session || session.role === 'WORKER') return []

  const q = rawQuery.trim()
  if (q.length < 2) return []

  const [clients, projects, quotes, invoices, expenses, suppliers, priceItems] = await Promise.all([
    prisma.client.findMany({
      where: {
        OR: [
          { name: { contains: q } },
          { email: { contains: q } },
          { phone: { contains: q } },
          { vatNumber: { contains: q } },
        ],
      },
      select: { id: true, name: true, city: true },
      take: PER_KIND,
      orderBy: { name: 'asc' },
    }),
    prisma.project.findMany({
      where: { OR: [{ name: { contains: q } }, { referenceCode: { contains: q } }] },
      select: {
        id: true,
        name: true,
        referenceCode: true,
        estimatedValue: true,
        client: { select: { name: true } },
      },
      take: PER_KIND,
      orderBy: { updatedAt: 'desc' },
    }),
    prisma.quote.findMany({
      where: { OR: [{ quoteNumber: { contains: q } }, { project: { name: { contains: q } } }] },
      select: {
        id: true,
        quoteNumber: true,
        version: true,
        total: true,
        project: { select: { name: true } },
      },
      take: PER_KIND,
      orderBy: { updatedAt: 'desc' },
    }),
    prisma.invoice.findMany({
      where: { OR: [{ invoiceNumber: { contains: q } }, { project: { name: { contains: q } } }] },
      select: {
        id: true,
        invoiceNumber: true,
        total: true,
        project: { select: { name: true } },
      },
      take: PER_KIND,
      orderBy: { issueDate: 'desc' },
    }),
    prisma.expense.findMany({
      where: {
        OR: [{ description: { contains: q } }, { supplier: { name: { contains: q } } }],
      },
      select: {
        id: true,
        description: true,
        amount: true,
        amountChf: true,
        currency: true,
        supplier: { select: { name: true } },
        project: { select: { name: true } },
      },
      take: PER_KIND,
      orderBy: { date: 'desc' },
    }),
    prisma.supplier.findMany({
      where: { OR: [{ name: { contains: q } }, { category: { contains: q } }, { tags: { contains: q } }] },
      select: { id: true, name: true, category: true },
      take: PER_KIND,
      orderBy: { name: 'asc' },
    }),
    prisma.priceItem.findMany({
      where: {
        isActive: true,
        OR: [{ description: { contains: q } }, { code: { contains: q } }],
      },
      select: { id: true, description: true, code: true, category: true, unitCost: true, unit: true },
      take: PER_KIND,
      orderBy: { description: 'asc' },
    }),
  ])

  return [
    ...quotes.map((row): SearchHit => ({
      id: row.id,
      href: `/quotes/${row.id}`,
      kind: 'quote',
      title: `${row.quoteNumber} v${row.version}`,
      context: row.project.name,
      amount: row.total,
    })),
    ...invoices.map((row): SearchHit => ({
      id: row.id,
      href: `/invoices/${row.id}`,
      kind: 'invoice',
      title: row.invoiceNumber,
      context: row.project.name,
      amount: row.total,
    })),
    ...projects.map((row): SearchHit => ({
      id: row.id,
      href: `/projects/${row.id}`,
      kind: 'project',
      title: row.name,
      context: [row.client.name, row.referenceCode].filter(Boolean).join(' · ') || null,
      amount: row.estimatedValue,
    })),
    ...clients.map((row): SearchHit => ({
      id: row.id,
      href: `/clients/${row.id}`,
      kind: 'client',
      title: row.name,
      context: row.city,
      amount: null,
    })),
    ...expenses.map((row): SearchHit => ({
      id: row.id,
      href: `/expenses/${row.id}`,
      kind: 'expense',
      title: row.description,
      context: [row.supplier?.name, row.project?.name].filter(Boolean).join(' · ') || 'Spesa aziendale',
      amount: row.currency !== 'CHF' && row.amountChf != null ? row.amountChf : row.amount,
    })),
    ...suppliers.map((row): SearchHit => ({
      id: row.id,
      href: `/suppliers/${row.id}`,
      kind: 'supplier',
      title: row.name,
      context: row.category,
      amount: null,
    })),
    ...priceItems.map((row): SearchHit => ({
      id: row.id,
      href: `/price-catalog/${row.id}/edit`,
      kind: 'priceItem',
      title: row.description,
      context: [row.code, row.category].filter(Boolean).join(' · ') || null,
      amount: row.unitCost,
    })),
  ]
}
