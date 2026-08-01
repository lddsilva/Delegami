import { createInvoice } from '@/modules/invoices/actions'
import { getProjects } from '@/modules/projects/queries'
import { getInvoiceableQuotes } from '@/modules/quotes/queries'
import { getActiveTemplates } from '@/modules/quote-templates/queries'
import { NewInvoiceClient } from '@/components/invoices/new-invoice-client'
import { prisma } from '@/lib/db'

export default async function NewInvoicePage({
  searchParams,
}: {
  searchParams: Promise<{ projectId?: string; quoteId?: string }>
}) {
  const { projectId, quoteId } = await searchParams
  const [projects, quotes, templates, settings] = await Promise.all([
    getProjects(),
    getInvoiceableQuotes(),
    getActiveTemplates(0, 'INVOICE'),
    prisma.companySettings.findFirst({ select: { defaultTaxRate: true, defaultInvoiceDueDays: true }, orderBy: { createdAt: 'asc' } }),
  ])

  const projectOptions = projects.map((p) => ({ id: p.id, name: p.name, client: { name: p.client.name } }))
  const quoteOptions = quotes.map((q) => ({
    id: q.id, quoteNumber: q.quoteNumber, version: q.version,
    projectId: q.projectId, projectName: q.project.name, clientName: q.project.client.name,
  }))
  const quoteItemsMap = Object.fromEntries(
    quotes.map((q) => [q.id, q.items.map((item) => ({
      quoteItemId: item.id,
      description: item.description, unit: item.unit ?? undefined,
      quantity: item.quantity ?? 1, unitPrice: item.unitPrice ?? 0,
    }))]),
  )
  const preselectedQuote = quoteId ? quotes.find((q) => q.id === quoteId) : null
  const initialProjectId = projectId ?? preselectedQuote?.projectId ?? ''

  // When the invoice starts from a project, preselect that project's approved
  // quote. Invoices used to be created with "Preventivo collegato" left empty
  // and the quote only named in the notes, which left the link unrecorded.
  const quotesForProject = initialProjectId
    ? quotes.filter((q) => q.projectId === initialProjectId)
    : []
  const initialQuoteId =
    quoteId ?? (quotesForProject.length === 1 ? quotesForProject[0].id : undefined)

  return (
    <div className="page-wide">
      <div className="mb-6">
        <h1 className="text-display font-semibold text-ink">Nuova fattura</h1>
        <p className="text-body text-ink-muted mt-1">Crea da template o manualmente</p>
      </div>
      <NewInvoiceClient
        action={createInvoice}
        projects={projectOptions}
        quotes={quoteOptions}
        quoteItemsMap={quoteItemsMap}
        templates={templates}
        defaultProjectId={initialProjectId}
        defaultQuoteId={initialQuoteId}
        defaultTaxRate={settings?.defaultTaxRate ?? 8.1}
        defaultInvoiceDueDays={settings?.defaultInvoiceDueDays ?? 5}
      />
    </div>
  )
}
