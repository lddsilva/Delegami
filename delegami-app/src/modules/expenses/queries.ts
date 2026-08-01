import { prisma } from '@/lib/db'
import type { Prisma } from '@/generated/prisma/client'
import { PaymentStatus } from '@/generated/prisma/enums'

const EXPENSE_STATUS_PRIORITY: Record<string, number> = { PENDING: 0, PARTIALLY_PAID: 1, PAID: 2 }

export async function getExpenses(filters?: { projectId?: string; status?: string }) {
  const where: Prisma.ExpenseWhereInput = {}
  if (filters?.projectId === 'none') where.projectId = null
  else if (filters?.projectId) where.projectId = filters.projectId
  if (filters?.status && Object.values(PaymentStatus).includes(filters.status as PaymentStatus)) {
    where.paymentStatus = filters.status as PaymentStatus
  }

  const rows = await prisma.expense.findMany({
    where,
    orderBy: { updatedAt: 'desc' },
    include: {
      project: { select: { id: true, name: true, client: { select: { name: true } } } },
      supplier: { select: { id: true, name: true } },
    },
  })
  return rows.sort((a, b) => {
    const pa = EXPENSE_STATUS_PRIORITY[a.paymentStatus] ?? 99
    const pb = EXPENSE_STATUS_PRIORITY[b.paymentStatus] ?? 99
    if (pa !== pb) return pa - pb
    const pName = (a.project?.name ?? 'zzz').localeCompare(b.project?.name ?? 'zzz')
    if (pName !== 0) return pName
    return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
  })
}

export async function getExpenseById(id: string) {
  return prisma.expense.findUnique({
    where: { id },
    include: {
      project: { include: { client: true } },
      supplier: true,
      documents: { orderBy: { uploadedAt: 'asc' } },
    },
  })
}
