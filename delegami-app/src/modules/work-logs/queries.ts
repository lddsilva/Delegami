import { prisma } from '@/lib/db'

export interface WorkLogFilters {
  userId?: string
  projectId?: string
  from?: Date
  to?: Date
}

/** Logs belonging to a single worker (their own rapportino view). */
export async function getWorkLogsForUser(userId: string) {
  return prisma.workLog.findMany({
    where: { userId },
    orderBy: [{ workDate: 'desc' }, { createdAt: 'desc' }],
    include: {
      photos: { orderBy: { createdAt: 'asc' } },
      project: { select: { id: true, name: true } },
    },
  })
}

/** Admin/manager list with optional filters + hours total. */
export async function getWorkLogs(filters: WorkLogFilters = {}) {
  const where: Record<string, unknown> = {}
  if (filters.userId) where.userId = filters.userId
  if (filters.projectId) where.projectId = filters.projectId
  if (filters.from || filters.to) {
    where.workDate = {
      ...(filters.from ? { gte: filters.from } : {}),
      ...(filters.to ? { lte: filters.to } : {}),
    }
  }

  const logs = await prisma.workLog.findMany({
    where,
    orderBy: [{ workDate: 'desc' }, { createdAt: 'desc' }],
    include: {
      photos: { orderBy: { createdAt: 'asc' } },
      project: { select: { id: true, name: true } },
    },
  })

  const totalHours = logs.reduce((sum, log) => sum + (log.hours ?? 0), 0)
  const submittedHours = logs
    .filter((log) => log.status !== 'DRAFT')
    .reduce((sum, log) => sum + (log.hours ?? 0), 0)

  return { logs, totalHours, submittedHours }
}

/** Count of logs needing admin/manager attention: SUBMITTED (to approve) or revision-requested. */
export async function getPendingWorkLogsCount() {
  return prisma.workLog.count({
    where: { OR: [{ status: 'SUBMITTED' }, { revisionRequestedAt: { not: null } }] },
  })
}

export async function getWorkLogById(id: string) {
  return prisma.workLog.findUnique({
    where: { id },
    include: {
      photos: { orderBy: { createdAt: 'asc' } },
      project: { select: { id: true, name: true } },
    },
  })
}

/** Active accounts that can have hours logged against them (workers + staff). */
export async function getLoggableUsers() {
  return prisma.user.findMany({
    where: { active: true },
    orderBy: { name: 'asc' },
    select: { id: true, name: true, role: true },
  })
}

/** Light project list for the opera selector. */
export async function getProjectsForWorkLog() {
  return prisma.project.findMany({
    where: { isPlaceholder: false },
    orderBy: { createdAt: 'desc' },
    select: { id: true, name: true, client: { select: { name: true } } },
  })
}
