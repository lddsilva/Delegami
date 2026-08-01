import { prisma } from '@/lib/db'
import { ProjectStatus } from '@/generated/prisma/enums'
import { expenseChf, invoiceOutstanding, invoicePaid, isRevenueInvoice, REVENUE_INVOICE_STATUSES } from '@/modules/finance/rules'

export async function getNextProjectCode(): Promise<string> {
  const year = new Date().getFullYear()
  const prefix = `OBR-${year}-`
  const sequence = await prisma.documentSequence.findUnique({
    where: { type_year: { type: 'PROJECT', year } },
    select: { lastNumber: true },
  })
  const last = await prisma.project.findFirst({
    where: { referenceCode: { startsWith: prefix } },
    orderBy: { referenceCode: 'desc' },
    select: { referenceCode: true },
  })
  const lastNum = last?.referenceCode ? parseInt(last.referenceCode.slice(prefix.length), 10) : 0
  const next = Math.max(sequence?.lastNumber ?? 0, isNaN(lastNum) ? 0 : lastNum) + 1
  return `${prefix}${String(next).padStart(3, '0')}`
}

export type ProjectStatusCount = {
  status: ProjectStatus
  _count: { status: number }
}

export async function getProjects(status?: ProjectStatus) {
  return prisma.project.findMany({
    where: status ? { status } : undefined,
    orderBy: { createdAt: 'desc' },
    include: {
      client: { select: { id: true, name: true } },
      _count: { select: { quotes: true, invoices: true, expenses: true } },
    },
  })
}

/**
 * Rows for the /projects list.
 *
 * The list used to lead with `estimatedValue`, which is filled on a minority of
 * projects — most rows showed no number at all. These rows lead with money that
 * actually happened (invoiced/outstanding, via the finance rules) and fall back
 * to the estimate only while a project has not been invoiced yet.
 */
export async function getProjectsOverview() {
  const projects = await prisma.project.findMany({
    orderBy: { createdAt: 'desc' },
    include: {
      client: { select: { id: true, name: true } },
      invoices: {
        select: {
          id: true, status: true, total: true, dueDate: true,
          payments: { select: { amount: true } },
        },
      },
      quotes: { select: { id: true, status: true, total: true, quoteNumber: true, version: true } },
      _count: { select: { expenses: true } },
    },
  })

  const today = new Date()

  return projects.map((project) => {
    const revenueInvoices = project.invoices.filter(isRevenueInvoice)
    const invoiced = revenueInvoices.reduce((sum, inv) => sum + inv.total, 0)
    const collected = revenueInvoices.reduce((sum, inv) => sum + invoicePaid(inv), 0)
    const outstanding = revenueInvoices.reduce((sum, inv) => sum + invoiceOutstanding(inv), 0)

    const hasOverdue = revenueInvoices.some(
      (inv) => invoiceOutstanding(inv) > 0 && inv.dueDate != null && new Date(inv.dueDate) < today,
    )

    // Only the current version of each quote family counts, otherwise superseded
    // versions would inflate the totals and the progress bar with them.
    const currentByFamily = new Map<string, (typeof project.quotes)[number]>()
    for (const quote of project.quotes) {
      const existing = currentByFamily.get(quote.quoteNumber)
      if (!existing || quote.version > existing.version) currentByFamily.set(quote.quoteNumber, quote)
    }
    const currentQuotes = [...currentByFamily.values()]

    // The agreed value of a family is its latest APPROVED/INVOICED version, which
    // is not always the latest version: drafting a revision on top of a signed
    // quote must not erase the contract the client actually approved.
    const agreedByFamily = new Map<string, (typeof project.quotes)[number]>()
    for (const quote of project.quotes) {
      if (quote.status !== 'APPROVED' && quote.status !== 'INVOICED') continue
      const existing = agreedByFamily.get(quote.quoteNumber)
      if (!existing || quote.version > existing.version) agreedByFamily.set(quote.quoteNumber, quote)
    }
    const agreedQuotes = [...agreedByFamily.values()]
    const approvedTotal = agreedQuotes.reduce((sum, q) => sum + q.total, 0)

    const pendingQuotes = currentQuotes.filter((q) => q.status === 'DRAFT' || q.status === 'SENT').length
    // Money already agreed but not yet billed — the reason this chip exists.
    const toInvoice = agreedQuotes.length > 0 && approvedTotal - invoiced > 0.005

    const billedPct = approvedTotal > 0 ? Math.min(100, (invoiced / approvedTotal) * 100) : null

    return {
      id: project.id,
      name: project.name,
      status: project.status,
      referenceCode: project.referenceCode,
      address: project.address,
      estimatedValue: project.estimatedValue,
      startDate: project.startDate,
      updatedAt: project.updatedAt,
      client: project.client,
      counts: {
        quotes: currentQuotes.length,
        invoices: revenueInvoices.length,
        expenses: project._count.expenses,
      },
      economics: { invoiced, collected, outstanding, approvedTotal, billedPct },
      flags: { hasOverdue, toInvoice, pendingQuotes },
    }
  })
}

export async function getProjectById(id: string) {
  return prisma.project.findUnique({
    where: { id },
    include: {
      client: true,
      invoices: {
        orderBy: { issueDate: 'desc' },
        include: { payments: { select: { amount: true } } },
      },
      expenses: { orderBy: { date: 'desc' }, include: { supplier: { select: { id: true, name: true } } } },
      documents: { orderBy: { uploadedAt: 'desc' } },
    },
  })
}

// Status priority for display ordering (most important first)
export const PROJECT_STATUS_PRIORITY: Record<string, number> = {
  IN_PROGRESS: 0, APPROVED: 1, QUOTING: 2, LEAD: 3, COMPLETED: 4, CANCELLED: 5,
}

/** Projects shown on the dashboard. The rest live on /projects. */
const DASHBOARD_PROJECT_LIMIT = 8

export async function getDashboardStats() {
  const now = new Date()

  const [
    totalClients,
    totalProjects,
    rawGroupBy,
    activeProjectCount,
    allProjects,
    unpaidExpenses,
    pendingReceiptsCount,
    allQuotesForDashboard,
    revenueInvoicesForResidual,
    receivableInvoices,
  ] = await Promise.all([
    prisma.client.count(),
    prisma.project.count(),
    prisma.project.groupBy({ by: ['status'], _count: { status: true } }),
    prisma.project.count({ where: { status: { in: ['IN_PROGRESS', 'APPROVED', 'QUOTING', 'LEAD'] } } }),
    // Only work that is genuinely live. The old query took every non-cancelled
    // project — including COMPLETED — with no limit, under a heading that said
    // "Opere attive", and rendered every one of them.
    prisma.project.findMany({
      where: { status: { in: ['IN_PROGRESS', 'APPROVED', 'QUOTING'] } },
      orderBy: { updatedAt: 'desc' },
      take: DASHBOARD_PROJECT_LIMIT,
      include: { client: { select: { id: true, name: true } } },
    }),
    prisma.expense.findMany({
      where: { paymentStatus: { in: ['PENDING', 'PARTIALLY_PAID'] } },
      select: { amount: true, amountChf: true, currency: true },
    }),
    prisma.receiptInbox.count({ where: { processedAt: null } }),
    prisma.quote.findMany({
      orderBy: [{ quoteNumber: 'desc' }, { version: 'desc' }],
      select: {
        id: true,
        parentQuoteId: true,
        projectId: true,
        version: true,
        status: true,
        total: true,
        invoices: {
          where: { status: { not: 'CANCELLED' } },
          select: { id: true },
        },
      },
    }),
    // Billed revenue per project, for the residual-to-invoice figure.
    prisma.invoice.findMany({
      where: { status: { in: [...REVENUE_INVOICE_STATUSES] } },
      select: { projectId: true, total: true },
    }),
    // One query, one list. Previously an overdue SENT invoice came back from
    // both `overdueInvoices` and `openInvoices` and was rendered three times on
    // the same screen, with two different amounts.
    prisma.invoice.findMany({
      where: { status: 'SENT' },
      include: {
        project: { include: { client: { select: { id: true, name: true, email: true } } } },
        payments: { select: { amount: true } },
      },
      orderBy: { dueDate: 'asc' },
    }),
  ])

  const projectsByStatus = rawGroupBy as ProjectStatusCount[]
  const currentQuotesByRoot = new Map<string, (typeof allQuotesForDashboard)[number]>()
  for (const quote of allQuotesForDashboard) {
    const rootId = quote.parentQuoteId ?? quote.id
    const current = currentQuotesByRoot.get(rootId)
    if (!current || quote.version > current.version) currentQuotesByRoot.set(rootId, quote)
  }
  const currentQuotes = Array.from(currentQuotesByRoot.values())

  // What is left to bill, per project — not "does this quote have an invoice".
  //
  // The old per-quote test was binary and broke on the two ways this business
  // actually bills: one acconto covering several quotes (base + variante) left
  // every quote but one looking unbilled forever, and a rate agreement with open
  // quantities (total 0) could never stop being "to invoice". Comparing the
  // agreed total of a project against what it has invoiced answers the real
  // question — how much money is still un-billed — and self-corrects as invoices
  // are issued, with no manual marking.
  const agreedByProject = new Map<string, number>()
  for (const quote of currentQuotes) {
    if (quote.status !== 'APPROVED' && quote.status !== 'INVOICED') continue
    if (quote.total <= 0) continue // rate agreement: nothing to bill against yet
    agreedByProject.set(quote.projectId, (agreedByProject.get(quote.projectId) ?? 0) + quote.total)
  }

  const invoicedByProject = new Map<string, number>()
  for (const invoice of revenueInvoicesForResidual) {
    invoicedByProject.set(
      invoice.projectId,
      (invoicedByProject.get(invoice.projectId) ?? 0) + invoice.total,
    )
  }

  let quotesResidualTotal = 0
  let quotesResidualProjects = 0
  for (const [projectId, agreed] of agreedByProject) {
    const residual = agreed - (invoicedByProject.get(projectId) ?? 0)
    if (residual > 0.005) {
      quotesResidualTotal += residual
      quotesResidualProjects += 1
    }
  }
  const quoteStatusOrder = ['DRAFT', 'SENT', 'APPROVED', 'REJECTED', 'INVOICED']
  const quoteStatusCounts = quoteStatusOrder
    .map((status) => ({
      status,
      _count: { status: currentQuotes.filter((quote) => quote.status === status).length },
    }))
    .filter((entry) => entry._count.status > 0)

  // Sort projects by status priority then updatedAt
  const sortedProjects = [...allProjects].sort((a, b) => {
    const pa = PROJECT_STATUS_PRIORITY[a.status] ?? 99
    const pb = PROJECT_STATUS_PRIORITY[b.status] ?? 99
    if (pa !== pb) return pa - pb
    return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
  })

  // One receivables list, annotated. `daysOverdue` is null when not yet due, so
  // the page can sort by urgency instead of showing two overlapping lists.
  const receivables = receivableInvoices
    .map((invoice) => {
      const outstanding = invoiceOutstanding(invoice)
      const daysOverdue =
        invoice.dueDate && invoice.dueDate < now
          ? Math.floor((now.getTime() - new Date(invoice.dueDate).getTime()) / 86_400_000)
          : null
      return { invoice, outstanding, paid: invoicePaid(invoice), daysOverdue }
    })
    .filter((row) => row.outstanding > 0)
    .sort((a, b) => (b.daysOverdue ?? -1) - (a.daysOverdue ?? -1))

  const overdue = receivables.filter((row) => row.daysOverdue !== null)

  return {
    totalClients: totalClients as number,
    totalProjects: totalProjects as number,
    activeProjectCount: activeProjectCount as number,
    projectsByStatus: projectsByStatus as ProjectStatusCount[],
    sortedProjects,
    hasMoreProjects: activeProjectCount > sortedProjects.length,
    receivables,
    /** The headline figure: everything billed and not yet in the bank. */
    receivableTotal: receivables.reduce((sum, row) => sum + row.outstanding, 0),
    overdueCount: overdue.length,
    overdueTotal: overdue.reduce((sum, row) => sum + row.outstanding, 0),
    unpaidExpensesCount: unpaidExpenses.length,
    unpaidExpensesTotal: unpaidExpenses.reduce((sum, expense) => sum + expenseChf(expense), 0),
    quotesResidualTotal,
    quotesResidualProjects,
    quoteStatusCounts,
    pendingReceiptsCount: pendingReceiptsCount as number,
  }
}
