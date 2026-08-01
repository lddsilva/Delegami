import { notFound, redirect } from 'next/navigation'
import { prisma } from '@/lib/db'
import { getSession, canMutate } from '@/lib/auth'
import { InvoiceStatus, QuoteStatus } from '@/generated/prisma/enums'
import { createInvoiceFromQuoteSelection, createPercentageInvoiceFromQuote } from '@/modules/invoices/actions'
import { QuoteInvoiceSelection } from '@/components/invoices/quote-invoice-selection'

export default async function QuoteInvoicePage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const session = await getSession()
  if (!session || !canMutate(session.role)) redirect(`/quotes/${id}`)

  const quote = await prisma.quote.findUnique({
    where: { id },
    include: {
      project: { include: { client: true } },
      items: {
        where: { itemType: 'ITEM', hiddenFromClient: false },
        orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }],
      },
      invoices: {
        where: { status: { not: InvoiceStatus.CANCELLED } },
        include: { items: true },
      },
    },
  })
  if (!quote) notFound()
  if (quote.status !== QuoteStatus.APPROVED && quote.status !== QuoteStatus.INVOICED) redirect(`/quotes/${id}`)

  const invoicedByItem = new Map<string, number>()
  for (const invoice of quote.invoices) {
    for (const item of invoice.items) {
      if (!item.quoteItemId) continue
      invoicedByItem.set(item.quoteItemId, (invoicedByItem.get(item.quoteItemId) ?? 0) + item.quantity)
    }
  }
  const billingMode: 'ITEMS' | 'PERCENTAGE' | 'MANUAL' | null = quote.invoices.some((invoice) => invoice.billingMode === 'PERCENTAGE')
    ? 'PERCENTAGE'
    : quote.invoices.some((invoice) => invoice.billingMode === 'ITEMS' || invoice.items.some((item) => item.quoteItemId))
      ? 'ITEMS'
      : quote.invoices.length > 0
        ? 'MANUAL'
        : null
  const billedPercent = quote.invoices.reduce((sum, invoice) => {
    if (invoice.billingMode !== 'PERCENTAGE') return sum
    if (invoice.billingPercent != null) return sum + invoice.billingPercent
    if (quote.subtotalClient <= 0.01) return sum
    return sum + (invoice.subtotal / quote.subtotalClient) * 100
  }, 0)

  return (
    <div className="page-wide">
      <QuoteInvoiceSelection
        quote={{
          id: quote.id,
          quoteNumber: quote.quoteNumber,
          version: quote.version,
          taxRate: quote.taxRate,
          subtotalClient: quote.subtotalClient,
          total: quote.total,
          projectName: quote.project.name,
          projectHref: `/projects/${quote.projectId}`,
          clientName: quote.project.client.name,
          billingMode,
          billedPercent,
        }}
        items={quote.items.map((item) => ({
          id: item.id,
          description: item.description,
          unit: item.unit,
          quantity: item.quantity ?? 1,
          unitPrice: item.unitPrice ?? 0,
          invoicedQuantity: invoicedByItem.get(item.id) ?? 0,
        }))}
        itemAction={createInvoiceFromQuoteSelection.bind(null, quote.id)}
        percentageAction={createPercentageInvoiceFromQuote.bind(null, quote.id)}
      />
    </div>
  )
}
