import { prisma } from '@/lib/db'

export async function getPriceItems() {
  return prisma.priceItem.findMany({
    where: { isActive: true },
    orderBy: [{ category: 'asc' }, { code: 'asc' }, { description: 'asc' }],
  })
}

export async function getAllPriceItems() {
  return prisma.priceItem.findMany({
    orderBy: [{ category: 'asc' }, { code: 'asc' }, { description: 'asc' }],
    include: {
      priceSources: {
        orderBy: [{ confidence: 'asc' }, { sourceType: 'asc' }],
        select: {
          id: true,
          sourceType: true,
          supplierName: true,
          url: true,
          observedPrice: true,
          currency: true,
          confidence: true,
          observedAt: true,
        },
      },
    },
  })
}

export async function getPriceItemById(id: string) {
  return prisma.priceItem.findUnique({ where: { id } })
}
