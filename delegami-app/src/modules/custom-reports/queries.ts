import { prisma } from '@/lib/db'

export async function getCustomReports() {
  return prisma.customReport.findMany({
    orderBy: { createdAt: 'desc' },
    include: {
      project: { select: { id: true, name: true, client: { select: { id: true, name: true } } } },
      quote: { select: { id: true, quoteNumber: true } },
    },
  })
}

export async function getCustomReportById(id: string) {
  return prisma.customReport.findUnique({
    where: { id },
    include: {
      project: { select: { id: true, name: true, address: true, client: { select: { id: true, name: true } } } },
      quote: { select: { id: true, quoteNumber: true, version: true } },
    },
  })
}
