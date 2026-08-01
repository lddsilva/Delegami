import { prisma } from '@/lib/db'

export type ShoppingListWithItems = Awaited<ReturnType<typeof getShoppingListByProjectId>>

export async function getShoppingListByProjectId(projectId: string) {
  return prisma.shoppingList.findFirst({
    where: { projectId },
    include: {
      items: {
        orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }],
        include: { supplier: { select: { id: true, name: true, website: true, address: true } } },
      },
    },
  })
}

export async function getShoppingListById(id: string) {
  return prisma.shoppingList.findUnique({
    where: { id },
    include: {
      project: { include: { client: { select: { id: true, name: true } } } },
      items: {
        orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }],
        include: { supplier: { select: { id: true, name: true, website: true, address: true } } },
      },
    },
  })
}
