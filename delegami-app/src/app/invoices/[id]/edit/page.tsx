import { notFound, redirect } from 'next/navigation'
import { getInvoiceById } from '@/modules/invoices/queries'
import { getProjects } from '@/modules/projects/queries'
import { getInvoiceableQuotes } from '@/modules/quotes/queries'
import { updateInvoice } from '@/modules/invoices/actions'
import { InvoiceForm } from '@/components/invoices/invoice-form'
import { prisma } from '@/lib/db'

export default async function EditInvoicePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const [invoice, projects, quotes, settings] = await Promise.all([
    getInvoiceById(id),
    getProjects(),
    getInvoiceableQuotes(),
    prisma.companySettings.findFirst({ select: { defaultInvoiceDueDays: true }, orderBy: { createdAt: 'asc' } }),
  ])
  if (!invoice) notFound()

  // Block editing paid invoices
  if (invoice.status === 'PAID') {
    redirect(`/invoices/${id}?locked=1`)
  }

  const action = updateInvoice.bind(null, id)

  const invoiceData = {
    projectId: invoice.projectId,
    quoteId: invoice.quoteId,
    status: invoice.status,
    issueDate: invoice.issueDate,
    dueDate: invoice.dueDate,
    taxRate: invoice.taxRate,
    notes: invoice.notes,
    items: invoice.items.map((i) => ({
      quoteItemId: i.quoteItemId,
      description: i.description,
      unit: i.unit ?? undefined,
      quantity: i.quantity,
      unitPrice: i.unitPrice,
    })),
  }

  const projectOptions = projects.map((p) => ({ id: p.id, name: p.name, client: { name: p.client.name } }))
  const quoteOptions = quotes.map((q) => ({
    id: q.id,
    quoteNumber: q.quoteNumber,
    version: q.version,
    projectId: q.projectId,
    projectName: q.project.name,
    clientName: q.project.client.name,
  }))
  if (invoice.quote && !quoteOptions.some((q) => q.id === invoice.quote?.id)) {
    quoteOptions.push({
      id: invoice.quote.id,
      quoteNumber: invoice.quote.quoteNumber,
      version: invoice.quote.version,
      projectId: invoice.projectId,
      projectName: invoice.project.name,
      clientName: invoice.project.client.name,
    })
  }

  return (
    <div className="page-wide">
      <div className="mb-6">
        <h1 className="text-display font-semibold text-ink">Modifica fattura</h1>
        <p className="text-body text-ink-muted mt-1 font-mono">{invoice.invoiceNumber}</p>
      </div>
      <InvoiceForm
        action={action}
        invoice={invoiceData}
        projects={projectOptions}
        quotes={quoteOptions}
        defaultInvoiceDueDays={settings?.defaultInvoiceDueDays ?? 5}
        title="Dati fattura"
        backHref={`/invoices/${id}`}
      />
    </div>
  )
}
