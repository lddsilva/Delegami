import { prisma } from '@/lib/db'

export async function getReceiptImportBatches(limit = 12) {
  const batches = await prisma.receiptImportBatch.findMany({
    where: { items: { some: {} } },
    orderBy: { createdAt: 'desc' },
    take: limit,
    include: {
      items: {
        orderBy: { createdAt: 'asc' },
        select: {
          id: true,
          imageFile: true,
          supplierNameRaw: true,
          supplierName: true,
          projectLabel: true,
          expenseId: true,
          status: true,
          errorMessage: true,
          duplicateExpenseId: true,
        },
      },
    },
  })

  const expenseIds = Array.from(new Set(
    batches.flatMap((batch) =>
      batch.items
        .map((item) => item.expenseId)
        .filter((id): id is string => Boolean(id)),
    ),
  ))
  const existingExpenses = expenseIds.length > 0
    ? await prisma.expense.findMany({
      where: { id: { in: expenseIds } },
      select: { id: true },
    })
    : []
  const existingExpenseIds = new Set(existingExpenses.map((expense) => expense.id))

  return batches.map((batch) => ({
    ...batch,
    items: batch.items.map((item) => ({
      ...item,
      expenseExists: item.expenseId ? existingExpenseIds.has(item.expenseId) : false,
    })),
  }))
}

export type ReceiptImportBatchRow = Awaited<ReturnType<typeof getReceiptImportBatches>>[number]
