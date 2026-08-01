import { prisma } from '@/lib/db'

export async function getInvoices() {
  return prisma.invoice.findMany({
    orderBy: { createdAt: 'desc' },
    include: {
      project: {
        select: { id: true, name: true, referenceCode: true, client: { select: { id: true, name: true } } },
      },
      quote: { select: { id: true, quoteNumber: true, version: true } },
      // Needed to show what is actually still owed. Without this the list can only
      // report `total` and silently ignores every partial payment.
      payments: { select: { amount: true } },
      _count: { select: { items: true } },
    },
  })
}

export async function getInvoiceVersions(invoiceId: string): Promise<Array<{
  id: string
  invoiceNumber: string
  version: number
  status: string
  total: number
  createdAt: Date
}>> {
  const self = await prisma.invoice.findUnique({
    where: { id: invoiceId },
    select: { id: true, parentInvoiceId: true },
  })
  if (!self) return []

  const rootId = self.parentInvoiceId ?? self.id
  return prisma.invoice.findMany({
    where: { OR: [{ id: rootId }, { parentInvoiceId: rootId }] },
    orderBy: { version: 'asc' },
    select: {
      id: true,
      invoiceNumber: true,
      version: true,
      status: true,
      total: true,
      createdAt: true,
    },
  })
}

export async function getInvoiceById(id: string) {
  return prisma.invoice.findUnique({
    where: { id },
    include: {
      project: { include: { client: true } },
      quote: { select: { id: true, quoteNumber: true, version: true } },
      items: { orderBy: { createdAt: 'asc' } },
      payments: { orderBy: { paidAt: 'asc' } },
      documents: { orderBy: { uploadedAt: 'desc' } },
    },
  })
}
