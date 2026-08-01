import type { InvoiceStatus } from '@/generated/prisma/enums'

/**
 * Single source of truth for the money figures shown across the app.
 *
 * Before this file existed, "Fatturato" and "Margine" were recomputed inline on
 * every screen and disagreed with each other: /projects/[id] summed *all* invoices
 * (including DRAFT and CANCELLED) and subtracted manodopera, /reports summed only
 * SENT+PAID and ignored manodopera, and /invoices reported outstanding amounts from
 * `total` while the dashboard used `total - paid`. Same project, different answers.
 *
 * Everything here is pure — no Prisma, no 'use server' — so pages, queries and
 * server actions can all import it.
 */

/**
 * Invoice statuses that represent real billed revenue.
 * DRAFT has not been issued to the client yet; CANCELLED was voided.
 * Neither is money, so neither may ever enter a revenue or margin figure.
 */
export const REVENUE_INVOICE_STATUSES: readonly InvoiceStatus[] = ['SENT', 'PAID']

export function isRevenueInvoice(invoice: { status: InvoiceStatus }): boolean {
  return REVENUE_INVOICE_STATUSES.includes(invoice.status)
}

type PaymentLike = { amount: number }
type InvoiceLike = { total: number; status: InvoiceStatus; payments?: PaymentLike[] }

/**
 * How much of this invoice has actually been collected.
 *
 * A PAID invoice is settled by definition and counts in full: `markInvoicePaid()`
 * flips the status directly without writing an InvoicePayment row, so summing
 * payments alone would report a fully-settled invoice as CHF 0 collected.
 * For every other status we use the registered partial payments.
 */
export function invoicePaid(invoice: InvoiceLike): number {
  if (invoice.status === 'PAID') return invoice.total
  return (invoice.payments ?? []).reduce((sum, payment) => sum + payment.amount, 0)
}

/**
 * What the client still owes on this invoice.
 * Never negative — an overpayment is not a negative receivable.
 */
export function invoiceOutstanding(invoice: InvoiceLike): number {
  if (!isRevenueInvoice(invoice)) return 0
  return Math.max(0, invoice.total - invoicePaid(invoice))
}

/** Total still to collect across a set of invoices. */
export function totalOutstanding(invoices: InvoiceLike[]): number {
  return invoices.reduce((sum, invoice) => sum + invoiceOutstanding(invoice), 0)
}

type ExpenseLike = { amount: number; currency?: string | null; amountChf?: number | null }

/** Expense value in CHF, using the stored conversion when the expense is not in CHF. */
export function expenseChf(expense: ExpenseLike): number {
  return expense.currency && expense.currency !== 'CHF' && expense.amountChf != null
    ? expense.amountChf
    : expense.amount
}

export type ProjectEconomics = {
  /** Billed to the client (SENT + PAID only). */
  invoiced: number
  /** Actually received. */
  collected: number
  /** Billed but not yet received. */
  outstanding: number
  /** Material and supplier costs, in CHF. */
  expenses: number
  /** Company cost of approved work logs. */
  labor: number
  /** invoiced − expenses − labor. */
  margin: number
  /** Margin as a share of invoiced revenue; null when nothing has been invoiced. */
  marginPct: number | null
}

/**
 * Margin the accepted quote promised: (price − cost) / price.
 *
 * The app already stores both sides of this on every quote and has never shown
 * it next to the margin the opera actually achieved — which is the single most
 * useful comparison in the system.
 */
export function quotedMarginPct(quote: { subtotalCost: number; subtotalClient: number } | null | undefined): number | null {
  if (!quote || quote.subtotalClient <= 0) return null
  return ((quote.subtotalClient - quote.subtotalCost) / quote.subtotalClient) * 100
}

/**
 * The P&L of one opera. `labor` comes from getProjectLaborCost() — the company
 * cost of APPROVED work logs, which is the agency bill rate for AGENCY workers
 * and the worker's own rate for DIRECT ones.
 */
export function projectEconomics(input: {
  invoices: InvoiceLike[]
  expenses: ExpenseLike[]
  labor: number
}): ProjectEconomics {
  const revenueInvoices = input.invoices.filter(isRevenueInvoice)

  const invoiced = revenueInvoices.reduce((sum, invoice) => sum + invoice.total, 0)
  const collected = revenueInvoices.reduce((sum, invoice) => sum + Math.min(invoice.total, invoicePaid(invoice)), 0)
  const outstanding = totalOutstanding(revenueInvoices)
  const expenses = input.expenses.reduce((sum, expense) => sum + expenseChf(expense), 0)
  const labor = input.labor
  const margin = invoiced - expenses - labor

  return {
    invoiced,
    collected,
    outstanding,
    expenses,
    labor,
    margin,
    marginPct: invoiced > 0 ? (margin / invoiced) * 100 : null,
  }
}
