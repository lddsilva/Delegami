import 'server-only'
import { prisma } from '@/lib/db'

/**
 * Accounting report data for the external bookkeeper.
 *
 * Two views of revenue coexist on purpose, because a small Swiss business is
 * usually taxed on cash but reconciles on accrual:
 *  - accrual ("competenza"): invoices ISSUED in the period (SENT/PAID only)
 *  - cash ("cassa"): payments RECEIVED in the period
 * DRAFT invoices are never revenue — they are listed apart as "not yet issued".
 */

export type AccountingPeriod = { from: Date; to: Date }

function expenseAmountChf(e: { amount: number; amountChf: number | null }) {
  return e.amountChf ?? e.amount
}

export async function getAccountingReport({ from, to }: AccountingPeriod) {
  const [issued, drafts, payments, expenses, openInvoices, workLogs, workerPayments, company] =
    await Promise.all([
      // Invoices issued in the period (accrual basis) — DRAFT excluded
      prisma.invoice.findMany({
        where: { issueDate: { gte: from, lte: to }, status: { in: ['SENT', 'PAID'] } },
        include: { project: { include: { client: true } }, payments: true },
        orderBy: { invoiceNumber: 'asc' },
      }),
      // Drafts issued in the period — shown apart, never counted as revenue
      prisma.invoice.findMany({
        where: { issueDate: { gte: from, lte: to }, status: 'DRAFT' },
        include: { project: { include: { client: true } } },
        orderBy: { invoiceNumber: 'asc' },
      }),
      // Payments cashed in the period (cash basis)
      prisma.invoicePayment.findMany({
        where: { paidAt: { gte: from, lte: to } },
        include: { invoice: { include: { project: { include: { client: true } } } } },
        orderBy: { paidAt: 'asc' },
      }),
      prisma.expense.findMany({
        where: { date: { gte: from, lte: to } },
        include: { supplier: true, project: true },
        orderBy: { date: 'asc' },
      }),
      // Receivables: every non-draft, non-cancelled invoice still open TODAY,
      // regardless of period — the bookkeeper needs the full outstanding position.
      prisma.invoice.findMany({
        where: { status: 'SENT' },
        include: { project: { include: { client: true } }, payments: true },
        orderBy: { dueDate: 'asc' },
      }),
      prisma.workLog.findMany({
        where: { workDate: { gte: from, lte: to }, status: 'APPROVED' },
        orderBy: { workDate: 'asc' },
      }),
      prisma.workerPayment.findMany({
        where: { paidAt: { gte: from, lte: to } },
        orderBy: { paidAt: 'asc' },
      }),
      prisma.companySettings.findFirst({ orderBy: { createdAt: 'asc' } }),
    ])

  const totalIssued = issued.reduce((s, i) => s + i.total, 0)
  const totalIssuedNet = issued.reduce((s, i) => s + i.subtotal, 0)
  const totalVat = issued.reduce((s, i) => s + i.taxAmount, 0)
  const totalDraft = drafts.reduce((s, i) => s + i.total, 0)
  const totalCashed = payments.reduce((s, p) => s + p.amount, 0)
  const totalExpenses = expenses.reduce((s, e) => s + expenseAmountChf(e), 0)

  const receivables = openInvoices
    .map((inv) => {
      const paid = inv.payments.reduce((s, p) => s + p.amount, 0)
      const residuo = inv.total - paid
      const due = inv.dueDate ?? inv.issueDate
      const daysOverdue = Math.floor((Date.now() - new Date(due).getTime()) / 86_400_000)
      return { invoice: inv, paid, residuo, daysOverdue }
    })
    .filter((r) => r.residuo > 0.005)

  const totalReceivable = receivables.reduce((s, r) => s + r.residuo, 0)
  const aging = {
    current: receivables.filter((r) => r.daysOverdue <= 0).reduce((s, r) => s + r.residuo, 0),
    d1_30: receivables.filter((r) => r.daysOverdue > 0 && r.daysOverdue <= 30).reduce((s, r) => s + r.residuo, 0),
    d31_60: receivables.filter((r) => r.daysOverdue > 30 && r.daysOverdue <= 60).reduce((s, r) => s + r.residuo, 0),
    d60plus: receivables.filter((r) => r.daysOverdue > 60).reduce((s, r) => s + r.residuo, 0),
  }

  const expensesByType = expenses.reduce<Record<string, { count: number; total: number }>>((acc, e) => {
    const key = e.expenseType ?? 'OTHER'
    acc[key] = acc[key] ?? { count: 0, total: 0 }
    acc[key].count += 1
    acc[key].total += expenseAmountChf(e)
    return acc
  }, {})

  const totalHours = workLogs.reduce((s, l) => s + (l.hours ?? 0), 0)
  const laborCost = workLogs.reduce((s, l) => {
    if (l.amountOverride != null) return s + l.amountOverride
    return s + (l.hours ?? 0) * (l.costRate ?? l.hourlyRate ?? 0)
  }, 0)
  const totalWorkerPaid = workerPayments.reduce((s, p) => s + p.amount, 0)

  // Calendar-year turnover drives the CHF 100'000 Swiss VAT registration threshold.
  const yearStart = new Date(to.getFullYear(), 0, 1)
  const yearEnd = new Date(to.getFullYear(), 11, 31, 23, 59, 59)
  const yearInvoices = await prisma.invoice.findMany({
    where: { issueDate: { gte: yearStart, lte: yearEnd }, status: { in: ['SENT', 'PAID'] } },
    select: { total: true },
  })
  const yearTurnover = yearInvoices.reduce((s, i) => s + i.total, 0)

  return {
    company,
    period: { from, to },
    generatedAt: new Date(),
    issued,
    drafts,
    payments,
    expenses,
    expensesByType,
    receivables,
    workLogs,
    workerPayments,
    totals: {
      issued: totalIssued,
      issuedNet: totalIssuedNet,
      vat: totalVat,
      draft: totalDraft,
      cashed: totalCashed,
      expenses: totalExpenses,
      receivable: totalReceivable,
      laborCost,
      totalHours,
      workerPaid: totalWorkerPaid,
      result: totalIssued - totalExpenses - laborCost,
    },
    aging,
    vatThreshold: { yearTurnover, year: to.getFullYear(), limit: 100_000 },
  }
}

export type AccountingReport = Awaited<ReturnType<typeof getAccountingReport>>
