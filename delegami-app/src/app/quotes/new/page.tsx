import { createQuote } from '@/modules/quotes/actions'
import { getProjects } from '@/modules/projects/queries'
import { getPriceItems } from '@/modules/price-catalog/queries'
import { getActiveTemplates } from '@/modules/quote-templates/queries'
import { NewQuoteClient } from '@/components/quotes/new-quote-client'
import { prisma } from '@/lib/db'

export default async function NewQuotePage({
  searchParams,
}: {
  searchParams: Promise<{ projectId?: string }>
}) {
  const { projectId } = await searchParams
  const [projects, priceItems, settings] = await Promise.all([
    getProjects(),
    getPriceItems(),
    prisma.companySettings.findFirst({ select: { defaultMargin: true, defaultTaxRate: true, paymentTerms: true, defaultQuoteNotes: true, defaultQuoteValidityDays: true }, orderBy: { createdAt: 'asc' } }),
  ])
  const defaultMarginValue = settings?.defaultMargin ?? 0
  const defaultTaxRateValue = settings?.defaultTaxRate ?? 8.1
  // Load templates with current prezzario prices (dynamic pricing)
  const templates = await getActiveTemplates(defaultMarginValue)

  let defaultPaymentTerms: string | undefined
  if (projectId) {
    const project = await prisma.project.findUnique({ where: { id: projectId }, select: { paymentTerms: true } })
    defaultPaymentTerms = project?.paymentTerms ?? settings?.paymentTerms ?? undefined
  } else {
    defaultPaymentTerms = settings?.paymentTerms ?? undefined
  }

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

  return (
    <div className="page-wide">
      <div className="mb-6">
        <h1 className="text-display font-semibold text-ink">Nuovo preventivo</h1>
        <p className="text-body text-ink-muted mt-1">Inizia da un template o crea da zero</p>
      </div>
      <NewQuoteClient
        action={createQuote}
        projects={projectOptions}
        priceItems={catalogItems}
        templates={templates}
        defaultProjectId={projectId}
        defaultMargin={defaultMarginValue}
        defaultTaxRate={defaultTaxRateValue}
        defaultPaymentTerms={defaultPaymentTerms}
        defaultClientNotes={settings?.defaultQuoteNotes ?? undefined}
        defaultQuoteValidityDays={settings?.defaultQuoteValidityDays ?? 30}
      />
    </div>
  )
}
