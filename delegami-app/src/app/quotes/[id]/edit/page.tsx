import { notFound, redirect } from 'next/navigation'
import { getQuoteById } from '@/modules/quotes/queries'
import { getProjects } from '@/modules/projects/queries'
import { getPriceItems } from '@/modules/price-catalog/queries'
import { updateQuote } from '@/modules/quotes/actions'
import { QuoteForm } from '@/components/quotes/quote-form'
import { getActiveTemplates } from '@/modules/quote-templates/queries'
import { prisma } from '@/lib/db'

export default async function EditQuotePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const [quote, projects, priceItems, settings] = await Promise.all([
    getQuoteById(id),
    getProjects(),
    getPriceItems(),
    prisma.companySettings.findFirst({ select: { paymentTerms: true, defaultMargin: true }, orderBy: { createdAt: 'asc' } }),
  ])
  if (!quote) notFound()
  // Load templates with current prezzario prices using quote's own margin
  const templates = await getActiveTemplates(quote.marginPercent ?? settings?.defaultMargin ?? 0)

  // Block editing locked quotes — must create a new version instead
  if (quote.status === 'SENT' || quote.status === 'APPROVED' || quote.status === 'INVOICED') {
    redirect(`/quotes/${id}?locked=1`)
  }

  // Resolve default payment terms: project → company (used as hint if quote has no paymentTerms)
  const defaultPaymentTerms = quote.project.paymentTerms ?? settings?.paymentTerms ?? undefined

  const action = updateQuote.bind(null, id)

  const quoteItems = quote.items.map((i) => ({
    id: i.id,
    priceItemId: i.priceItemId ?? undefined,
    itemType: i.itemType,
    section: i.section ?? undefined,
    sortOrder: i.sortOrder,
    description: i.description,
    unit: i.unit ?? undefined,
    quantity: i.quantity ?? undefined,
    unitCost: i.unitCost ?? undefined,
    unitPrice: i.unitPrice ?? undefined,
    marginPercent: i.marginPercent ?? undefined,
    directPrice: i.directPrice,
    hiddenFromClient: i.hiddenFromClient,
    sourceUrl: i.sourceUrl ?? undefined,
    sourceNote: i.sourceNote ?? undefined,
  }))

  const projectOptions = projects.map((p) => ({
    id: p.id,
    name: p.name,
    client: { name: p.client.name },
  }))

  const catalogItems = priceItems.map((p) => ({
    id: p.id,
    code: p.code,
    category: p.category,
    description: p.description,
    unit: p.unit,
    unitCost: p.unitCost,
    qualityLevel: p.qualityLevel,
    productTier: p.productTier,
    notes: p.notes,
    links: p.links,
  }))

  const quoteData = {
    projectId: quote.projectId,
    status: quote.status as string,
    marginPercent: quote.marginPercent,
    taxRate: quote.taxRate,
    validUntil: quote.validUntil,
    internalNotes: quote.internalNotes,
    clientNotes: quote.clientNotes,
    paymentTerms: quote.paymentTerms,
    items: quoteItems,
  }

  return (
    <div className="page-wide">
      <div className="mb-6">
        <h1 className="text-display font-semibold text-ink">Modifica preventivo</h1>
        <p className="text-body text-ink-muted mt-1 font-mono">{quote.quoteNumber}</p>
      </div>
      <QuoteForm
        action={action}
        quote={quoteData}
        projects={projectOptions}
        priceItems={catalogItems}
        defaultPaymentTerms={defaultPaymentTerms}
        templates={templates}
        title="Dati preventivo"
        backHref={`/quotes/${id}`}
      />
    </div>
  )
}
