import { prisma } from './db'
import type { Prisma } from '@/generated/prisma/client'

export type DocumentNumberType = 'QUOTE' | 'INVOICE' | 'PROJECT'

function prefixFor(type: DocumentNumberType) {
  if (type === 'QUOTE') return 'PRE'
  if (type === 'INVOICE') return 'INV'
  return 'OBR'
}

export async function reserveNextDocumentNumber(
  tx: Pick<Prisma.TransactionClient, 'documentSequence'>,
  type: DocumentNumberType,
): Promise<string> {
  const year = new Date().getFullYear()
  const prefix = prefixFor(type)

  const existing = await tx.documentSequence.findUnique({
    where: { type_year: { type, year } },
  })

  if (existing) {
    const updated = await tx.documentSequence.update({
      where: { type_year: { type, year } },
      data: { lastNumber: { increment: 1 } },
    })
    return `${prefix}-${year}-${String(updated.lastNumber).padStart(3, '0')}`
  }

  const created = await tx.documentSequence.create({
    data: { type, year, lastNumber: 1 },
  })
  return `${prefix}-${year}-${String(created.lastNumber).padStart(3, '0')}`
}

export async function getNextDocumentNumber(type: DocumentNumberType): Promise<string> {
  return prisma.$transaction((tx) => reserveNextDocumentNumber(tx, type))
}

export async function peekNextDocumentNumber(type: DocumentNumberType): Promise<string> {
  const year = new Date().getFullYear()
  const prefix = prefixFor(type)
  const existing = await prisma.documentSequence.findUnique({
    where: { type_year: { type, year } },
  })
  return `${prefix}-${year}-${String((existing?.lastNumber ?? 0) + 1).padStart(3, '0')}`
}
