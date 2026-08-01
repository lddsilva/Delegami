import { prisma } from '@/lib/db'

export async function getSuppliers() {
  return prisma.supplier.findMany({
    orderBy: { name: 'asc' },
    include: { _count: { select: { expenses: true } } },
  })
}

/** Lightweight supplier list for the agency selector on worker forms. */
export async function getSupplierOptions() {
  return prisma.supplier.findMany({
    orderBy: { name: 'asc' },
    select: { id: true, name: true, category: true },
  })
}

export async function getSupplierById(id: string) {
  return prisma.supplier.findUnique({
    where: { id },
    include: {
      expenses: {
        orderBy: { date: 'desc' },
        include: { project: { select: { id: true, name: true } } },
      },
    },
  })
}
