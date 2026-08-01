import { prisma } from '@/lib/db'
import { getProjectLaborCost } from '@/modules/workers/queries'
import { REVENUE_INVOICE_STATUSES, projectEconomics, expenseChf, invoicePaid } from './rules'

/**
 * Company-wide financial overview behind /reports.
 *
 * Lives here rather than in the page so that the revenue rules are applied in one
 * place — a project's margin must read the same on /reports as on /projects/[id].
 * That means: only SENT + PAID invoices count as revenue, "Incassato" is the sum of
 * registered payments (not the invoice total of PAID rows), and manodopera is
 * subtracted from every margin.
 */
export async function getFinancialOverview() {
  const [projects, invoices, pendingExpenses] = await Promise.all([
    prisma.project.findMany({
      where: { status: { notIn: ['LEAD', 'CANCELLED'] } },
      include: {
        client: { select: { name: true } },
        invoices: {
          where: { status: { in: [...REVENUE_INVOICE_STATUSES] } },
          select: { total: true, status: true, payments: { select: { amount: true } } },
        },
        expenses: { select: { amount: true, amountChf: true, currency: true } },
      },
      orderBy: { createdAt: 'desc' },
    }),
    prisma.invoice.findMany({
      where: { status: { in: [...REVENUE_INVOICE_STATUSES] } },
      include: {
        project: { select: { id: true, name: true, client: { select: { name: true } } } },
        payments: { select: { amount: true } },
      },
      orderBy: { issueDate: 'desc' },
    }),
    prisma.expense.findMany({
      where: { paymentStatus: { in: ['PENDING', 'PARTIALLY_PAID'] } },
      include: { project: { select: { id: true, name: true } }, supplier: { select: { name: true } } },
      orderBy: { date: 'desc' },
    }),
  ])

  // Only projects with financial activity belong in the P&L table.
  const activeProjects = projects.filter((p) => p.invoices.length > 0 || p.expenses.length > 0)

  // Labor is per-project and needs its own query each; keep it parallel.
  const laborByProject = new Map(
    await Promise.all(
      activeProjects.map(async (p) => [p.id, (await getProjectLaborCost(p.id)).cost] as const),
    ),
  )

  const projectRows = activeProjects
    .map((p) => ({
      id: p.id,
      name: p.name,
      clientName: p.client.name,
      economics: projectEconomics({
        invoices: p.invoices,
        expenses: p.expenses,
        labor: laborByProject.get(p.id) ?? 0,
      }),
    }))
    .sort((a, b) => b.economics.invoiced - a.economics.invoiced)

  const invoiced = invoices.reduce((sum, i) => sum + i.total, 0)
  const collected = invoices.reduce((sum, i) => sum + invoicePaid(i), 0)
  const expensesPending = pendingExpenses.reduce((sum, e) => sum + expenseChf(e), 0)

  return {
    projectRows,
    invoices,
    pendingExpenses,
    totals: {
      invoiced,
      collected,
      /** Billed but not yet in the bank — the number that actually matters. */
      outstanding: invoiced - collected,
      expensesPending,
    },
  }
}
