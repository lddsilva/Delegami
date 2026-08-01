import { prisma } from '@/lib/db'

const INTERNAL_CLIENT_NAME = 'Interno'
const PLACEHOLDER_PROJECT_NAME = '🗂 Da classificare'

/**
 * Returns the id of the "Da classificare" placeholder project, creating it
 * (and the "Interno" client) on first access. Idempotent.
 */
export async function ensurePlaceholderProject(): Promise<string> {
  const existing = await prisma.project.findFirst({
    where: { isPlaceholder: true },
    select: { id: true },
  })
  if (existing) return existing.id

  const client = await prisma.client.upsert({
    where: { id: 'internal-client' },
    update: {},
    create: {
      id: 'internal-client',
      name: INTERNAL_CLIENT_NAME,
      notes: 'Cliente fittizio per voci interne / da classificare.',
    },
  })

  const project = await prisma.project.create({
    data: {
      clientId: client.id,
      name: PLACEHOLDER_PROJECT_NAME,
      description: 'Bucket per scontrini e spese in attesa di essere assegnati a un cantiere reale.',
      status: 'LEAD',
      isPlaceholder: true,
    },
    select: { id: true },
  })

  return project.id
}

export async function getPlaceholderProjectId(): Promise<string | null> {
  const existing = await prisma.project.findFirst({
    where: { isPlaceholder: true },
    select: { id: true },
  })
  return existing?.id ?? null
}
