import { prisma } from '@/lib/db'
import type { Prisma } from '@/generated/prisma/client'

const quoteListInclude = {
  project: {
    select: { id: true, name: true, client: { select: { id: true, name: true } } },
  },
  _count: { select: { items: true } },
} satisfies Prisma.QuoteInclude

type QuoteListRow = Prisma.QuoteGetPayload<{ include: typeof quoteListInclude }>

export type QuoteFamilyRow = QuoteListRow & {
  rootId: string
  versionCount: number
  versions: Array<{
    id: string
    version: number
    status: QuoteListRow['status']
    total: number
    updatedAt: Date
  }>
}

function buildQuoteFamilies(quotes: QuoteListRow[]): QuoteFamilyRow[] {
  const groups = new Map<string, QuoteListRow[]>()

  for (const quote of quotes) {
    const rootId = quote.parentQuoteId ?? quote.id
    const group = groups.get(rootId) ?? []
    group.push(quote)
    groups.set(rootId, group)
  }

  return Array.from(groups.entries())
    .map(([rootId, rows]) => {
      const versions = [...rows].sort((a, b) => a.version - b.version)
      const latest = [...rows].sort((a, b) => {
        if (b.version !== a.version) return b.version - a.version
        return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
      })[0]

      return {
        ...latest,
        rootId,
        versionCount: versions.length,
        versions: versions.map((v) => ({
          id: v.id,
          version: v.version,
          status: v.status,
          total: v.total,
          updatedAt: v.updatedAt,
        })),
      }
    })
    .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
}

export async function getQuotes() {
  return prisma.quote.findMany({
    orderBy: { updatedAt: 'desc' },
    include: quoteListInclude,
  })
}

export async function getQuoteFamilies(projectId?: string): Promise<QuoteFamilyRow[]> {
  const quotes = await prisma.quote.findMany({
    where: projectId ? { projectId } : undefined,
    orderBy: [{ quoteNumber: 'desc' }, { version: 'desc' }],
    include: quoteListInclude,
  })

  return buildQuoteFamilies(quotes)
}

export async function getQuoteById(id: string) {
  return prisma.quote.findUnique({
    where: { id },
    include: {
      project: { include: { client: true } },
      items: { orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }] },
      documents: { orderBy: { uploadedAt: 'desc' } },
      invoices: {
        where: { status: { not: 'CANCELLED' } },
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          invoiceNumber: true,
          status: true,
          total: true,
          subtotal: true,
          billingMode: true,
          billingPercent: true,
          createdAt: true,
        },
      },
    },
  })
}

export async function getQuoteVersions(quoteId: string): Promise<Array<{
  id: string; quoteNumber: string; version: number; status: string; total: number; createdAt: Date; sentAt: Date | null
}>> {
  const self = await prisma.quote.findUnique({
    where: { id: quoteId },
    select: { id: true, parentQuoteId: true },
  })
  if (!self) return []

  const rootId = self.parentQuoteId ?? self.id
  return prisma.quote.findMany({
    where: { OR: [{ id: rootId }, { parentQuoteId: rootId }] },
    orderBy: { version: 'asc' },
    select: { id: true, quoteNumber: true, version: true, status: true, total: true, createdAt: true, sentAt: true },
  })
}

export async function getQuotesByProject(projectId: string) {
  return prisma.quote.findMany({
    where: { projectId },
    orderBy: { updatedAt: 'desc' },
    include: { _count: { select: { items: true } } },
  })
}

export async function getInvoiceableQuotes() {
  const quotes = await prisma.quote.findMany({
    orderBy: [{ quoteNumber: 'desc' }, { version: 'desc' }],
    include: {
      project: { select: { id: true, name: true, client: { select: { name: true } } } },
      items: { where: { itemType: 'ITEM', hiddenFromClient: false }, orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }] },
    },
  })

  const byRoot = new Map<string, (typeof quotes)[number]>()
  for (const quote of quotes) {
    const rootId = quote.parentQuoteId ?? quote.id
    const current = byRoot.get(rootId)
    if (!current || quote.version > current.version) byRoot.set(rootId, quote)
  }

  return Array.from(byRoot.values())
    .filter((quote) => quote.status === 'APPROVED')
    .sort((a, b) => {
      if (b.updatedAt.getTime() !== a.updatedAt.getTime()) return b.updatedAt.getTime() - a.updatedAt.getTime()
      return b.version - a.version
    })
}
