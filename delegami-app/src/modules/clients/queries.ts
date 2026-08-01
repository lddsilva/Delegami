import { prisma } from '@/lib/db'

function sortClientsByName<T extends { name: string }>(clients: T[]): T[] {
  return [...clients].sort((a, b) => a.name.localeCompare(b.name, 'it', { sensitivity: 'base' }))
}

export async function getClients() {
  const clients = await prisma.client.findMany({
    orderBy: { name: 'asc' },
    include: {
      _count: { select: { projects: true } },
    },
  })
  return sortClientsByName(clients)
}

export async function getClientById(id: string) {
  return prisma.client.findUnique({
    where: { id },
    include: {
      projects: {
        orderBy: { createdAt: 'desc' },
      },
    },
  })
}

export async function getClientsSelect() {
  const clients = await prisma.client.findMany({
    select: { id: true, name: true, city: true },
    orderBy: { name: 'asc' },
  })
  return sortClientsByName(clients)
}
