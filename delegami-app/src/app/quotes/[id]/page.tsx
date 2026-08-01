import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Pencil, Printer, Lock, Paperclip } from 'lucide-react'
import { getQuoteById, getQuoteVersions } from '@/modules/quotes/queries'
import type { InvoiceStatus, QuoteStatus } from '@/generated/prisma/enums'
import { getSession, canMutate, canDelete } from '@/lib/auth'
import { Button, ButtonLink } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { QuoteStatusBadge } from '@/components/quotes/quote-status-badge'
import { InvoiceStatusBadge } from '@/components/invoices/invoice-status-badge'
import { DeleteQuoteButton } from '@/components/quotes/delete-quote-button'
import { CreateInvoiceButton } from '@/components/quotes/create-invoice-button'
import { QuoteStatusActions } from '@/components/quotes/quote-status-actions'
import { AttachmentList } from '@/components/quotes/attachment-list'
import { QuoteItemsTable } from '@/components/quotes/quote-items-table'
import { CloneQuoteButton } from '@/components/quotes/clone-quote-button'
import { QuoteActionsMenu } from '@/components/quotes/quote-actions-menu'
import { SendDocumentButton } from '@/components/ui/send-document-button'
import { SignatoriesForm } from '@/components/quotes/signatories-form'
import { formatAmount, formatCurrency, formatDate } from '@/lib/utils'

export default async function QuoteDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>
  searchParams: Promise<{ locked?: string }>
}) {
  const { id } = await params
  const { locked } = await searchParams
  const [quote, session, versions] = await Promise.all([getQuoteById(id), getSession(), getQuoteVersions(id)])
  if (!quote) notFound()
  const canEdit = session ? canMutate(session.role) : false
  const canDel = session ? canDelete(session.role) : false

  const isLocked = quote.status === 'SENT' || quote.status === 'APPROVED'
  const quoteVersion = versions.find(v => v.id === id)?.version ?? 1
  const canCreateQuoteVersion = quote.status === 'APPROVED' || quote.status === 'REJECTED'

  /**
   * The status already says what happens next; the screen just never said it
   * louder than anything else. Up to eight controls sat in one row, all the
   * same weight, so choosing between them meant reading all eight labels.
   * Exactly one of them is primary now, and which one depends on the status.
   */
  const primaryAction = !canEdit
    ? null
    : quote.status === 'DRAFT'
      ? 'send'
      : quote.status === 'SENT'
        ? 'decide'
        : quote.status === 'APPROVED'
          ? 'invoice'
          : quote.status === 'REJECTED'
            ? 'version'
            : null

  const lineItems = quote.items.filter((i) => i.itemType === 'ITEM')

  // Build display rows with section subtotals injected after each section's last item
  type ItemRow = { kind: 'item'; item: typeof quote.items[0] }
  type SubtotalRow = { kind: 'subtotal'; totalCost: number; totalPrice: number }
  type DisplayRow = ItemRow | SubtotalRow

  const displayRows: DisplayRow[] = []
  let secCost = 0
  let secPrice = 0
  let hasItemsInSec = false
  for (let i = 0; i < quote.items.length; i++) {
    const item = quote.items[i]
    const next = quote.items[i + 1]
    if (item.itemType === 'ITEM') {
      secCost += item.totalCost ?? 0
      secPrice += item.totalPrice ?? 0
      hasItemsInSec = true
    }
    displayRows.push({ kind: 'item', item })
    const flushHere = !next || next.itemType === 'SECTION' || next.itemType === 'HEADER'
    if (flushHere && hasItemsInSec) {
      displayRows.push({ kind: 'subtotal', totalCost: secCost, totalPrice: secPrice })
      secCost = 0; secPrice = 0; hasItemsInSec = false
    }
  }

  // Sequential item numbers (only ITEM rows)
  let itemCounter = 0
  const itemNumbers = new Map<string, number>()
  for (const item of quote.items) {
    if (item.itemType === 'ITEM') itemNumbers.set(item.id, ++itemCounter)
  }

  const realMarginPct = quote.subtotalClient > 0
    ? ((quote.subtotalClient - quote.subtotalCost) / quote.subtotalClient * 100).toFixed(1)
    : '0.0'
  const invoicedTotal = quote.invoices.reduce((sum, invoice) => sum + invoice.total, 0)
  const quoteBillingMode = quote.invoices.some((invoice) => invoice.billingMode === 'PERCENTAGE')
    ? 'PERCENTAGE'
    : quote.invoices.some((invoice) => invoice.billingMode === 'ITEMS')
      ? 'ITEMS'
      : quote.invoices.length > 0
        ? 'MANUAL'
        : null
  const billedPercent = quote.invoices.reduce((sum, invoice) => {
    if (invoice.billingMode === 'PERCENTAGE') {
      if (invoice.billingPercent != null) return sum + invoice.billingPercent
      if (quote.subtotalClient > 0) return sum + (invoice.subtotal / quote.subtotalClient) * 100
    }
    return sum
  }, 0)

  return (
    <div className="page-content">
      {/* Locked notice */}
      {(locked || isLocked) && canEdit && (
        <div className="mb-4 flex items-center gap-3 px-4 py-3 rounded-control bg-attention-surface border border-attention-border text-body text-attention">
          <Lock className="w-4 h-4 shrink-0 text-attention" />
          <span>
            Questo preventivo è bloccato (<strong>{quote.status === 'SENT' ? 'Inviato' : 'Approvato'}</strong>) e non
            può essere modificato.{canCreateQuoteVersion && ' Crea una nuova versione per cambiarlo.'}
          </span>
        </div>
      )}

      {/* Header */}
      <div className="mb-6 space-y-3">
        {/* Identity + total */}
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-3 min-w-0">
            <ButtonLink href="/quotes" variant="ghost" size="sm" className="mt-0.5 shrink-0" aria-label="Torna indietro"><ArrowLeft className="w-4 h-4" /></ButtonLink>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-title sm:text-display font-semibold font-mono text-ink whitespace-nowrap">{quote.quoteNumber}</h1>
                <QuoteStatusBadge status={quote.status} />
                <span className="text-label font-mono text-ink-muted bg-surface-raised rounded px-1.5 py-0.5">v{quoteVersion}</span>
              </div>
              <div className="flex items-center gap-2 mt-1 text-body min-w-0">
                <Link href={`/projects/${quote.project.id}`} className="text-action hover:underline truncate min-w-0">
                  {quote.project.name}
                </Link>
                <span className="text-ink-subtle shrink-0">·</span>
                <Link href={`/clients/${quote.project.client.id}`} className="text-ink-muted hover:text-action truncate min-w-0">
                  {quote.project.client.name}
                </Link>
              </div>
            </div>
          </div>
          <div className="text-right shrink-0">
            <div className="text-[11px] uppercase tracking-wide text-ink-muted">Totale</div>
            <div className="text-title sm:text-display font-bold text-action tabular-nums whitespace-nowrap">{formatCurrency(quote.total)}</div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2 flex-wrap border-t border-line pt-3">
          {canEdit && (
            <QuoteStatusActions
              id={id}
              status={quote.status}
              primary={primaryAction === 'send' || primaryAction === 'decide'}
            />
          )}
          {canEdit && quote.status === 'APPROVED' && (
            <CreateInvoiceButton quoteId={id} primary={primaryAction === 'invoice'} />
          )}
          {/* "Nuova versione" lives in Storico versioni, where a version list is
              the context for adding one. It is repeated up here only when it is
              the primary action — a rejected quote has nothing else to do. */}
          {canEdit && primaryAction === 'version' && <CloneQuoteButton id={id} primary />}
          <SendDocumentButton
            docNumber={quote.quoteNumber}
            docType="quote"
            clientName={quote.project.client.name}
            clientEmail={quote.project.client.email}
            clientPhone={quote.project.client.phone}
            total={quote.total}
            docId={id}
          />
          <Link href={`/quotes/${id}/preview?variant=client`} target="_blank">
            <Button variant="secondary" size="sm"><Printer className="w-4 h-4" /> PDF Cliente</Button>
          </Link>
          {canEdit && !isLocked && (
            <Link href={`/quotes/${id}/edit`}>
              <Button variant="secondary" size="sm"><Pencil className="w-4 h-4" /> Modifica</Button>
            </Link>
          )}
          <QuoteActionsMenu id={id} quoteLabel={`PRE-${quote.quoteNumber}-v${quote.version}`} canEdit={canEdit} />
          {canDel && <div className="ml-auto"><DeleteQuoteButton id={id} /></div>}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Summary */}
        <div className="space-y-4">
          <Card>
            <CardHeader><CardTitle>Riepilogo</CardTitle></CardHeader>
            <CardContent>
              {/* The KPI strip and the subtotal list below it used to state the
                  same three figures twice, ~40px apart: Costi/Subtotale costi
                  and Prezzi/Subtotale prezzi were the identical values. One
                  reading now — the margin as the answer, its inputs under it. */}
              <p className="text-label uppercase tracking-wider text-ink-muted">Margine</p>
              <p className="mt-1 text-display font-semibold text-positive numeric">{realMarginPct}%</p>
              <p className="mt-1 text-label text-ink-muted numeric">
                {formatAmount(quote.subtotalClient - quote.subtotalCost)} su {formatAmount(quote.subtotalClient)}
              </p>

              <dl className="mt-4 space-y-2 border-t border-line pt-3 text-body">
                <div className="flex justify-between gap-3">
                  <dt className="text-ink-muted">Costi</dt>
                  <dd className="font-medium text-ink numeric">{formatAmount(quote.subtotalCost)}</dd>
                </div>
                <div className="flex justify-between gap-3">
                  <dt className="text-ink-muted">Prezzi al cliente</dt>
                  <dd className="font-medium text-ink numeric">{formatAmount(quote.subtotalClient)}</dd>
                </div>
                {quote.taxRate > 0 && (
                  <div className="flex justify-between gap-3">
                    <dt className="text-ink-muted">IVA ({quote.taxRate}%)</dt>
                    <dd className="font-medium text-ink numeric">{formatAmount(quote.taxAmount)}</dd>
                  </div>
                )}
                <div className="flex justify-between gap-3 border-t border-line pt-2 text-title font-semibold">
                  <dt>Totale</dt>
                  <dd className="numeric">{formatCurrency(quote.total)}</dd>
                </div>
              </dl>

              <dl className="mt-4 space-y-2 border-t border-line pt-3 text-label text-ink-muted">
                <div className="flex justify-between gap-3">
                  <dt>Valido fino</dt>
                  <dd className="numeric">{formatDate(quote.validUntil)}</dd>
                </div>
                <div className="flex justify-between gap-3">
                  <dt>Inviato il</dt>
                  <dd className="numeric">{formatDate(quote.sentAt)}</dd>
                </div>
                <div className="flex justify-between gap-3">
                  <dt>Approvato il</dt>
                  <dd className="numeric">{formatDate(quote.approvedAt)}</dd>
                </div>
              </dl>
            </CardContent>
          </Card>

          {quote.invoices.length > 0 && (
            <Card>
              <CardHeader><CardTitle>Fatture collegate</CardTitle></CardHeader>
              <CardContent className="space-y-3 text-body">
                <div className="flex justify-between">
                  <span className="text-ink-muted">Fatturato</span>
                  <span className="font-semibold tabular-nums">{formatCurrency(invoicedTotal)}</span>
                </div>
                {quoteBillingMode && (
                  <div className="flex justify-between">
                    <span className="text-ink-muted">Metodo</span>
                    <span>{quoteBillingMode === 'PERCENTAGE' ? `Acconto/SAL ${billedPercent.toFixed(1)}%` : quoteBillingMode === 'ITEMS' ? 'Articoli' : 'Manuale'}</span>
                  </div>
                )}
                <div className="divide-y divide-line border-t">
                  {quote.invoices.map((invoice) => (
                    <div key={invoice.id} className="py-2 flex items-center gap-2">
                      <Link href={`/invoices/${invoice.id}`} className="font-mono text-action hover:underline flex-1">{invoice.invoiceNumber}</Link>
                      <InvoiceStatusBadge status={invoice.status as InvoiceStatus} />
                      <span className="text-label tabular-nums text-ink-muted">{formatCurrency(invoice.total)}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {quote.clientNotes && (
            <Card>
              <CardHeader><CardTitle>Note per il cliente</CardTitle></CardHeader>
              <CardContent><p className="text-body text-ink-muted whitespace-pre-wrap">{quote.clientNotes}</p></CardContent>
            </Card>
          )}
          {quote.internalNotes && (
            <Card>
              <CardHeader><CardTitle>Note interne</CardTitle></CardHeader>
              <CardContent><p className="text-body text-ink-muted whitespace-pre-wrap">{quote.internalNotes}</p></CardContent>
            </Card>
          )}

          <Card>
            <CardHeader><CardTitle>Firma per accettazione</CardTitle></CardHeader>
            <CardContent>
              <SignatoriesForm quoteId={id} signatories={quote.signatories ?? null} canEdit={canEdit} />
            </CardContent>
          </Card>
        </div>

        {/* Items + Attachments */}
        <div className="lg:col-span-2 space-y-4">
          <Card>
            <CardHeader><CardTitle>Articoli ({lineItems.length})</CardTitle></CardHeader>
            <QuoteItemsTable
              displayRows={displayRows}
              itemNumbers={Object.fromEntries(itemNumbers)}
            />
          </Card>

          {/* Attachments */}
          <Card>
            <CardHeader className="flex flex-row items-center gap-2">
              <Paperclip className="w-4 h-4 text-ink-muted" />
              <CardTitle>Allegati ({quote.documents.length})</CardTitle>
            </CardHeader>
            <CardContent>
              <AttachmentList
                quoteId={quote.id}
                projectId={quote.projectId}
                attachments={quote.documents}
                canEdit={canEdit}
              />
            </CardContent>
          </Card>

          {/* Version history — always visible */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-body">Storico versioni</CardTitle>
              {canEdit && canCreateQuoteVersion && <CloneQuoteButton id={id} />}
            </CardHeader>
            <div className="divide-y divide-line">
              {versions.map((v) => {
                const isCurrent = v.id === id
                return (
                  <div key={v.id} className={`flex items-center gap-3 px-4 sm:px-6 py-2.5 ${isCurrent ? 'bg-action-surface' : 'hover:bg-surface-raised'}`}>
                    <span className={`text-label font-mono font-bold w-8 ${isCurrent ? 'text-action' : 'text-ink-muted'}`}>v{v.version}</span>
                    <Link href={`/quotes/${v.id}`} className="text-body font-mono text-action hover:underline flex-1">{v.quoteNumber}</Link>
                    <QuoteStatusBadge status={v.status as QuoteStatus} />
                    {v.sentAt && <span className="text-label text-ink-muted hidden sm:block">Inviato {formatDate(new Date(v.sentAt))}</span>}
                    <span className="text-label text-ink-muted tabular-nums font-medium">{formatCurrency(v.total)}</span>
                    {isCurrent && <span className="text-label text-action font-medium hidden sm:block">← corrente</span>}
                  </div>
                )
              })}
            </div>
          </Card>
        </div>
      </div>
    </div>
  )
}
