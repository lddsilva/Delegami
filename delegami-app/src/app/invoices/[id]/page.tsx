import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Lock, Pencil, Printer } from 'lucide-react'
import { getInvoiceById } from '@/modules/invoices/queries'
import { getSession, canDelete, canMutate } from '@/lib/auth'
import { uploadInvoiceDocument } from '@/modules/documents/actions'
import { Button, ButtonLink } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { DocumentList } from '@/components/documents/document-list'
import { InvoicePaymentList } from '@/components/invoices/invoice-payment-list'
import { InvoiceStatusBadge } from '@/components/invoices/invoice-status-badge'
import { MarkPaidButton } from '@/components/invoices/mark-paid-button'
import { DeleteInvoiceButton } from '@/components/invoices/delete-invoice-button'
import { SendDocumentButton } from '@/components/ui/send-document-button'
import { formatCurrency, formatDate, swissNumber } from '@/lib/utils'

function fmt(n: number | null | undefined) {
  if (n == null) return '-'
  return swissNumber(new Intl.NumberFormat('de-CH', { minimumFractionDigits: 2 }).format(n))
}

export default async function InvoiceDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>
  searchParams: Promise<{ locked?: string }>
}) {
  const { id } = await params
  const { locked } = await searchParams
  const [invoice, session] = await Promise.all([getInvoiceById(id), getSession()])
  if (!invoice) notFound()

  const canEdit = session ? canMutate(session.role) : false
  const canDel = session ? canDelete(session.role) : false
  const isLocked = invoice.status === 'PAID'

  return (
    <div className="page-content">
      {(locked || isLocked) && canEdit && (
        <div className="mb-4 flex items-center gap-3 px-4 py-3 rounded-control bg-attention-surface border border-attention-border text-body text-attention">
          <Lock className="w-4 h-4 shrink-0 text-attention" />
          <span>Questa fattura e <strong>saldata</strong> e non puo essere modificata.</span>
        </div>
      )}

      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 mb-6">
        <div className="flex items-center gap-3">
          <ButtonLink href="/invoices" variant="ghost" size="sm" aria-label="Torna indietro"><ArrowLeft className="w-4 h-4" /></ButtonLink>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-title sm:text-display font-semibold font-mono text-ink">{invoice.invoiceNumber}</h1>
              <InvoiceStatusBadge status={invoice.status} />
            </div>
            <div className="flex items-center gap-2 mt-1 text-body flex-wrap">
              <Link href={`/projects/${invoice.project.id}`} className="text-action hover:underline">{invoice.project.name}</Link>
              <span className="text-ink-muted">-</span>
              <Link href={`/clients/${invoice.project.client.id}`} className="text-ink-muted hover:text-action">{invoice.project.client.name}</Link>
              {invoice.quote && (
                <>
                  <span className="text-ink-muted">-</span>
                  <Link href={`/quotes/${invoice.quote.id}`} className="text-ink-muted hover:text-action">
                    Da {invoice.quote.quoteNumber} v{invoice.quote.version}
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2 flex-wrap sm:justify-end shrink-0">
          {canEdit && (invoice.status === 'DRAFT' || invoice.status === 'SENT') && (
            <MarkPaidButton id={id} status={invoice.status} primary />
          )}
          <SendDocumentButton
            docNumber={invoice.invoiceNumber}
            docType="invoice"
            clientName={invoice.project.client.name}
            clientEmail={invoice.project.client.email}
            clientPhone={invoice.project.client.phone}
            total={invoice.total}
            docId={id}
          />
          <Link href={`/invoices/${id}/preview`} target="_blank"><Button variant="secondary" size="sm"><Printer className="w-4 h-4" /> Stampa PDF</Button></Link>
          {canDel && <DeleteInvoiceButton id={id} />}
          {canEdit && !isLocked && <Link href={`/invoices/${id}/edit`}><Button variant="secondary" size="sm"><Pencil className="w-4 h-4" /> Modifica</Button></Link>}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="space-y-4">
          <Card>
            <CardHeader><CardTitle>Riepilogo</CardTitle></CardHeader>
            <CardContent className="space-y-2 text-body">
              <div className="flex justify-between"><span className="text-ink-muted">Emissione</span><span>{formatDate(invoice.issueDate)}</span></div>
              <div className="flex justify-between"><span className="text-ink-muted">Scadenza</span><span>{formatDate(invoice.dueDate)}</span></div>
              {invoice.paidAt && <div className="flex justify-between text-positive"><span>Pagata il</span><span className="font-medium">{formatDate(invoice.paidAt)}</span></div>}
              {invoice.billingMode === 'PERCENTAGE' && invoice.billingPercent != null && (
                <div className="flex justify-between"><span className="text-ink-muted">Acconto/SAL</span><span>{fmt(invoice.billingPercent)}%</span></div>
              )}
              <div className="border-t pt-2 space-y-1">
                <div className="flex justify-between"><span className="text-ink-muted">Subtotale</span><span className="tabular-nums">{formatCurrency(invoice.subtotal)}</span></div>
                <div className="flex justify-between text-ink-muted"><span>IVA ({invoice.taxRate}%)</span><span className="tabular-nums">{formatCurrency(invoice.taxAmount)}</span></div>
                <div className="flex justify-between font-bold text-body border-t pt-1"><span>Totale</span><span className="tabular-nums text-action">{formatCurrency(invoice.total)}</span></div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader><CardTitle>Pagamenti ricevuti</CardTitle></CardHeader>
            <CardContent>
              <InvoicePaymentList
                invoiceId={id}
                invoiceTotal={invoice.total}
                payments={invoice.payments}
                canEdit={canEdit}
              />
            </CardContent>
          </Card>
          {invoice.notes && (
            <Card>
              <CardHeader><CardTitle>Note</CardTitle></CardHeader>
              <CardContent><p className="text-body text-ink-muted whitespace-pre-wrap">{invoice.notes}</p></CardContent>
            </Card>
          )}
        </div>

        <div className="lg:col-span-2 space-y-4">
          <Card>
            <CardHeader><CardTitle>Articoli ({invoice.items.length})</CardTitle></CardHeader>
            <ul className="divide-y divide-line">
              {invoice.items.map((item) => {
                const qtyLabel = item.quantity != null || item.unit ? `${fmt(item.quantity)} ${item.unit ?? ''}`.trim() : null
                return (
                  <li key={item.id} className="flex items-start gap-3 px-4 sm:px-6 py-3">
                    <div className="min-w-0 flex-1">
                      <p className="text-body text-ink leading-snug">{item.description}</p>
                      {(qtyLabel || item.unitPrice != null) && (
                        <p className="mt-0.5 text-label text-ink-muted tabular-nums">
                          {qtyLabel}
                          {qtyLabel && item.unitPrice != null && ' × '}
                          {item.unitPrice != null && `CHF ${fmt(item.unitPrice)}`}
                        </p>
                      )}
                    </div>
                    <span className="shrink-0 text-body font-medium text-ink tabular-nums">{fmt(item.total)}</span>
                  </li>
                )
              })}
            </ul>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-body">Documenti / Comunicazioni</CardTitle>
              <p className="text-label text-ink-muted mt-0.5">Comprovanti di pagamento, screenshot WhatsApp, email, PDF allegati</p>
            </CardHeader>
            <CardContent>
              <DocumentList
                documents={invoice.documents ?? []}
                uploadAction={uploadInvoiceDocument}
                uploadFieldName="invoiceId"
                uploadFieldValue={id}
                uploadDocumentType="ATTACHMENT"
                revalidatePath={`/invoices/${id}`}
                canEdit={canEdit}
                emptyLabel="Nessun documento allegato"
                acceptCamera={true}
              />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
