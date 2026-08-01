import { prisma } from '@/lib/db'

export async function getReceiptInbox() {
  return prisma.receiptInbox.findMany({
    orderBy: { capturedAt: 'desc' },
    include: {
      expense: { select: { id: true, description: true, amount: true, currency: true } },
    },
  })
}

export async function getReceiptInboxById(id: string) {
  return prisma.receiptInbox.findUnique({
    where: { id },
    include: {
      expense: { select: { id: true, description: true, amount: true, currency: true } },
    },
  })
}

export type ReceiptInboxItem = Awaited<ReturnType<typeof getReceiptInbox>>[number]

/**
 * Returns the suggested project (when set) for each pending receipt.
 * Used to label the bulk-assigned project on /receipts cards.
 */
export async function getReceiptSuggestedProjects(): Promise<Map<string, { id: string; name: string }>> {
  const receipts = await prisma.receiptInbox.findMany({
    where: { processedAt: null, suggestedProjectId: { not: null } },
    select: { suggestedProjectId: true },
  })
  const ids = Array.from(new Set(receipts.map((r) => r.suggestedProjectId).filter((id): id is string => Boolean(id))))
  if (ids.length === 0) return new Map()
  const projects = await prisma.project.findMany({
    where: { id: { in: ids } },
    select: { id: true, name: true },
  })
  return new Map(projects.map((p) => [p.id, p]))
}
