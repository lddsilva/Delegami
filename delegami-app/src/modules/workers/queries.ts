import { prisma } from '@/lib/db'

/** What the worker earns for a single log: fixed override, else hours × agreed rate. */
export function workLogAmount(log: { hours: number; hourlyRate?: number | null; amountOverride?: number | null }) {
  if (log.amountOverride != null) return log.amountOverride
  return (log.hours ?? 0) * (log.hourlyRate ?? 0)
}

/**
 * What the log costs the company:
 * - AGENCY worker (has costRate): hours × agency cost rate — what the agency bills us.
 * - DIRECT worker (no costRate): same as what the worker earns.
 */
export function workLogCost(log: { hours: number; hourlyRate?: number | null; costRate?: number | null; amountOverride?: number | null }) {
  if (log.costRate != null) return (log.hours ?? 0) * log.costRate
  return workLogAmount(log)
}

export async function getWorkerProfile(userId: string) {
  return prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true, name: true, email: true, role: true, active: true,
      phone: true, address: true, hourlyRate: true, notes: true,
      employmentType: true, agencySupplierId: true, costRate: true,
      contractStart: true, contractType: true, identityNumber: true,
    },
  })
}

export async function getWorkerDocuments(userId: string) {
  return prisma.workerDocument.findMany({
    where: { userId },
    orderBy: { uploadedAt: 'desc' },
  })
}

export async function getWorkerPayments(userId: string) {
  return prisma.workerPayment.findMany({
    where: { userId },
    orderBy: { paidAt: 'desc' },
  })
}

export type PaidState = 'PAID' | 'PARTIAL' | 'UNPAID'

/**
 * Ledger for one worker:
 * - earned = sum of APPROVED logs' amount (verified by admin/manager)
 * - paid   = sum of payments
 * - balance = earned − paid
 * - paidByLogId: FIFO allocation (oldest logs covered first) → per-log paid state
 */
export async function getWorkerLedger(userId: string) {
  const [approvedLogs, payments] = await Promise.all([
    prisma.workLog.findMany({
      where: { userId, status: 'APPROVED' },
      orderBy: [{ workDate: 'asc' }, { createdAt: 'asc' }],
      select: { id: true, hours: true, hourlyRate: true, costRate: true, amountOverride: true },
    }),
    prisma.workerPayment.findMany({ where: { userId }, select: { amount: true } }),
  ])

  const earned = approvedLogs.reduce((sum, log) => sum + workLogAmount(log), 0)
  const cost = approvedLogs.reduce((sum, log) => sum + workLogCost(log), 0)
  const paid = payments.reduce((sum, p) => sum + p.amount, 0)
  const balance = earned - paid

  // FIFO allocation of the paid pool across approved logs (oldest first).
  const paidByLogId: Record<string, PaidState> = {}
  let pool = paid
  for (const log of approvedLogs) {
    const amount = workLogAmount(log)
    if (amount <= 0) { paidByLogId[log.id] = 'PAID'; continue }
    if (pool >= amount - 0.001) { paidByLogId[log.id] = 'PAID'; pool -= amount }
    else if (pool > 0.001) { paidByLogId[log.id] = 'PARTIAL'; pool = 0 }
    else paidByLogId[log.id] = 'UNPAID'
  }

  return { earned, cost, paid, balance, paidByLogId }
}

/**
 * Agency reconciliation for one AGENCY worker: expected cost (approved hours × cost rate)
 * vs what the agency has actually invoiced (expenses linked to the agency supplier).
 * Returns null for DIRECT workers or when no agency is set.
 * NOTE: agency expenses are per-supplier, not per-worker — if several workers share the
 * same agency, `invoicedTotal` covers all of them. Fine while there is one agency worker.
 */
export async function getAgencyReconciliation(userId: string) {
  const worker = await prisma.user.findUnique({
    where: { id: userId },
    select: { employmentType: true, agencySupplierId: true, costRate: true },
  })
  if (!worker || worker.employmentType !== 'AGENCY' || !worker.agencySupplierId) return null

  const [approvedLogs, expenses, agency] = await Promise.all([
    prisma.workLog.findMany({
      where: { userId, status: 'APPROVED' },
      select: { hours: true, hourlyRate: true, costRate: true, amountOverride: true },
    }),
    prisma.expense.findMany({
      where: { supplierId: worker.agencySupplierId },
      select: { amount: true, amountChf: true },
    }),
    prisma.supplier.findUnique({ where: { id: worker.agencySupplierId }, select: { id: true, name: true } }),
  ])

  const expectedCost = approvedLogs.reduce((sum, log) => sum + workLogCost(log), 0)
  const invoicedTotal = expenses.reduce((sum, e) => sum + (e.amountChf ?? e.amount), 0)

  return {
    agency,
    costRate: worker.costRate,
    expectedCost,
    invoicedTotal,
    variance: invoicedTotal - expectedCost,
    expenseCount: expenses.length,
  }
}

/** Total labour cost booked against an opera: sum of APPROVED work logs' company cost. */
export async function getProjectLaborCost(projectId: string) {
  const logs = await prisma.workLog.findMany({
    where: { projectId, status: 'APPROVED' },
    select: { hours: true, hourlyRate: true, costRate: true, amountOverride: true },
  })
  const cost = logs.reduce((sum, log) => sum + workLogCost(log), 0)
  const hours = logs.reduce((sum, log) => sum + (log.hours ?? 0), 0)
  return { cost, hours }
}

/** Overview of all worker accounts with their hours + compenso balances. */
export async function getWorkersOverview() {
  const workers = await prisma.user.findMany({
    where: { role: 'WORKER' },
    orderBy: { name: 'asc' },
    select: { id: true, name: true, active: true, hourlyRate: true, phone: true, employmentType: true },
  })
  if (workers.length === 0) return []

  const ids = workers.map((w) => w.id)
  const [logs, payments] = await Promise.all([
    prisma.workLog.findMany({
      where: { userId: { in: ids }, status: 'APPROVED' },
      select: { userId: true, hours: true, hourlyRate: true, amountOverride: true },
    }),
    prisma.workerPayment.findMany({ where: { userId: { in: ids } }, select: { userId: true, amount: true } }),
  ])

  return workers.map((w) => {
    const wLogs = logs.filter((l) => l.userId === w.id)
    const earned = wLogs.reduce((sum, l) => sum + workLogAmount(l), 0)
    const hours = wLogs.reduce((sum, l) => sum + (l.hours ?? 0), 0)
    const paid = payments.filter((p) => p.userId === w.id).reduce((sum, p) => sum + p.amount, 0)
    return { ...w, hours, earned, paid, balance: earned - paid }
  })
}
