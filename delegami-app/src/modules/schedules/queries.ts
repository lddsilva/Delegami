import { prisma } from '@/lib/db'

export async function getScheduleByProjectId(projectId: string) {
  return prisma.projectSchedule.findUnique({
    where: { projectId },
    include: {
      phases: {
        orderBy: [{ sortOrder: 'asc' }, { startDate: 'asc' }],
        include: { tasks: { orderBy: [{ sortOrder: 'asc' }, { startDate: 'asc' }] } },
      },
    },
  })
}

export async function getScheduleWithProject(projectId: string) {
  return prisma.projectSchedule.findUnique({
    where: { projectId },
    include: {
      project: { include: { client: { select: { id: true, name: true } } } },
      phases: {
        orderBy: [{ sortOrder: 'asc' }, { startDate: 'asc' }],
        include: { tasks: { orderBy: [{ sortOrder: 'asc' }, { startDate: 'asc' }] } },
      },
    },
  })
}
