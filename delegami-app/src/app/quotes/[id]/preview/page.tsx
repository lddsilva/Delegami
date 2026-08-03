import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import { getQuoteById } from '@/modules/quotes/queries'
import { prisma } from '@/lib/db'
import type { PdfVariant } from '@/lib/pdf/service'
import { formatDate, swissNumber } from '@/lib/utils'
import { PrintButton } from '@/components/ui/print-button'
import { QuoteNotesToggle } from '@/components/quotes/quote-notes-toggle'
import { QuoteAutoFit } from '@/components/quotes/quote-auto-fit'

export async function generateMetadata({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>
  searchParams: Promise<{ variant?: string }>
}): Promise<Metadata> {
  const { id } = await params
  const { variant = 'client' } = await searchParams
  const [quote, vData] = await Promise.all([
    getQuoteById(id),
    prisma.quote.findUnique({ where: { id }, select: { version: true } }),
  ])
  if (!quote) return { title: 'Preventivo' }
  const version = vData?.version ?? 1
  const projectName = quote.project.name
  const suffix = variant === 'internal' ? 'Preventivo Interno' : 'Preventivo'
  return {
    title: `${quote.quoteNumber} v${version} - ${projectName} - ${suffix}`,
  }
}

function fmt(n: number | null | undefined) {
  if (n == null) return '—'
  return swissNumber(new Intl.NumberFormat('de-CH', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(n))
}

export default async function QuotePreviewPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>
  searchParams: Promise<{ variant?: string; layout?: string }>
}) {
  const { id } = await params
  const { variant = 'client', layout = 'auto' } = await searchParams
  const pdfVariant: PdfVariant = variant === 'internal' ? 'internal' : 'client'
  const layoutMode: 'auto' | 'compatto' | 'esteso' =
    layout === 'compatto' || layout === 'esteso' ? layout : 'auto'

  const [quote, company, versionData] = await Promise.all([
    getQuoteById(id),
    prisma.companySettings.findFirst(),
    prisma.quote.findUnique({ where: { id }, select: { version: true } }),
  ])
  if (!quote) notFound()
  const quoteVersion = versionData?.version ?? 1

  const isInternal = pdfVariant === 'internal'
  const isBank = false
  const showCosts = isInternal

  // Resolve payment terms: quote → project → company
  const resolvedPaymentTerms = quote.paymentTerms ?? quote.project.paymentTerms ?? company?.paymentTerms ?? null

  const variantLabel = isInternal ? 'Interno' : 'Cliente'

  // For client PDF: exclude items hidden from client and internal NOTE rows
  const displayItems = isInternal
    ? quote.items
    : quote.items.filter((i) => !i.hiddenFromClient && i.itemType !== 'NOTE')

  // Hidden items total (for internal PDF note)
  const hiddenItemsTotal = quote.items
    .filter((i) => i.itemType === 'ITEM' && i.hiddenFromClient)
    .reduce((s, i) => s + ((i.totalPrice as number | null) ?? 0), 0)

  // Compute per-section subtotals for the summary page (using displayItems)
  const sectionSummary = (() => {
    const sections: { name: string; totalPrice: number; totalCost: number }[] = []
    let cur = { name: '', totalPrice: 0, totalCost: 0 }
    for (const item of displayItems) {
      if (item.itemType === 'SECTION' || item.itemType === 'HEADER') {
        if (cur.name && item.itemType === 'SECTION') sections.push({ ...cur })
        if (item.itemType === 'SECTION') cur = { name: item.description, totalPrice: 0, totalCost: 0 }
      } else if (item.itemType === 'ITEM') {
        cur.totalPrice += (item.totalPrice as number | null) ?? 0
        cur.totalCost += (item.totalCost as number | null) ?? 0
      }
    }
    if (cur.name) sections.push({ ...cur })
    return sections.filter((s) => s.totalPrice > 0)
  })()

  // Compact layout: short quotes flow onto fewer pages (no forced summary/detail/final breaks).
  // Auto picks compact when the quote is small; user can override via toolbar (?layout=).
  const itemRowCount = displayItems.filter((i) => i.itemType === 'ITEM').length
  const COMPACT_THRESHOLD = 12
  const compact = layoutMode === 'compatto' || (layoutMode === 'auto' && itemRowCount <= COMPACT_THRESHOLD)

  // Totals block (+ hidden-items note) — shown on the summary page in extended mode,
  // or right after the detail table in compact mode.
  const totalsAndHidden = (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', marginBottom: 'calc(5mm * var(--vspace, 1))', gap: '3mm' }}>
      <TotalsBlock
        subtotalCost={quote.subtotalCost}
        subtotalClient={quote.subtotalClient}
        taxRate={quote.taxRate}
        taxAmount={quote.taxAmount}
        total={quote.total}
        showCosts={showCosts}
      />
      {isInternal && hiddenItemsTotal > 0 && (
        <div style={{ fontSize: '8pt', color: 'var(--doc-warn)', background: 'var(--doc-warn-soft)', border: '1px solid var(--doc-warn-line)', borderRadius: '4px', padding: '4px 10px', textAlign: 'right' }}>
          ⚠ Voci nascoste al cliente (non fatturate): <strong>CHF {fmt(hiddenItemsTotal)}</strong>
        </div>
      )}
    </div>
  )

  return (
    <div className="pdf-outer min-h-screen bg-gray-100 py-8 print:bg-white print:p-0 print:min-h-0">
      <style>{`
        @media print {
          @page { margin: 15mm 20mm; size: A4; }
          html, body {
            height: auto !important;
            overflow: visible !important;
            margin: 0 !important;
            padding: 0 !important;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }
          .pdf-outer {
            padding: 0 !important;
            min-height: auto !important;
            background: white !important;
          }
          .pdf-document {
            max-width: none !important;
            padding: 0 0 10mm 0 !important;
            margin: 0 !important;
            box-shadow: none !important;
            overflow: visible !important;
            page-break-inside: auto;
          }
          .quote-final-page {
            page-break-before: always;
            page-break-inside: avoid;
            padding-top: 2mm;
          }
          .quote-final-page .quote-final-card {
            padding: 4mm !important;
            margin-top: 3mm !important;
          }
          .quote-final-page .quote-signature-line {
            height: 10mm !important;
          }
          /* Anti-cut: never split a card or the signature block across pages */
          .quote-final-card { page-break-inside: avoid; break-inside: avoid; }
          .quote-signature-block { page-break-inside: avoid; break-inside: avoid; }
          table { page-break-inside: auto; border-collapse: collapse; width: 100%; }
          tr { page-break-inside: avoid; page-break-after: auto; }
          thead { display: table-header-group; }
          tfoot { display: table-footer-group; }
          .no-print { display: none !important; }
          .page-break-before { page-break-before: always; }
        }
      `}</style>
      {/* Toolbar — hidden on print */}
      <div className="no-print max-w-[210mm] mx-auto mb-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          {(['client', 'internal'] as PdfVariant[]).map((v) => (
            <a
              key={v}
              href={`/quotes/${id}/preview?variant=${v}&layout=${layoutMode}`}
              className={`px-3 py-1.5 rounded text-sm font-medium transition-colors ${
                v === pdfVariant
                  ? 'bg-blue-600 text-white'
                  : 'bg-white text-gray-600 hover:bg-gray-50 border border-gray-200'
              }`}
            >
              {v === 'client' ? 'Cliente' : 'Interno'}
            </a>
          ))}
        </div>
        <div className="flex items-center gap-2">
          <QuoteNotesToggle quoteId={id} initialShow={quote.showClientNotes} />
          <div className="flex items-center gap-1 rounded-lg bg-white border border-gray-200 p-0.5">
            {([
              { key: 'auto', label: 'Auto' },
              { key: 'compatto', label: 'Compatto' },
              { key: 'esteso', label: 'Esteso' },
            ] as const).map((l) => (
              <a
                key={l.key}
                href={`/quotes/${id}/preview?variant=${pdfVariant}&layout=${l.key}`}
                title={
                  l.key === 'auto'
                    ? 'Decide automaticamente in base alla lunghezza'
                    : l.key === 'compatto'
                      ? 'Tutto su meno pagine possibili (senza riepilogo)'
                      : 'Riepilogo, dettaglio e firma su pagine separate'
                }
                className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
                  l.key === layoutMode
                    ? 'bg-blue-600 text-white'
                    : 'text-gray-600 hover:bg-gray-50'
                }`}
              >
                {l.label}
              </a>
            ))}
          </div>
          <PrintButton />
        </div>
      </div>

      {/* Document */}
      <div
        className="pdf-document bg-white max-w-[210mm] mx-auto shadow-lg print:shadow-none"
        style={{ padding: '12mm 18mm', fontFamily: "'Helvetica Neue', Arial, sans-serif", fontSize: '9.5pt' }}
      >
        {isInternal && (
          <div style={{ background: 'var(--doc-warn-soft)', border: '1px solid var(--doc-warn-line)', borderRadius: '4px', padding: '4px 10px', fontSize: '8pt', fontWeight: 600, color: 'var(--doc-warn)', marginBottom: '6mm', textAlign: 'center' }}>
            ⚠ DOCUMENTO INTERNO — Contiene margini e costi. Non condividere con il cliente.
          </div>
        )}

        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 'calc(6mm * var(--vspace, 1))', paddingBottom: '5mm', borderBottom: '2px solid var(--doc-brand)' }}>
          <div>
            <div style={{ fontSize: '18pt', fontWeight: 700, color: 'var(--doc-brand)' }}>{company?.name ?? 'Delegami'}</div>
            <div style={{ fontSize: '8pt', color: 'var(--doc-ink-muted)', marginTop: '4px', lineHeight: 1.5 }}>
              {company?.address && (
                isInternal
                  ? <a href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent([company.address, company.postalCode, company.city].filter(Boolean).join(', '))}`} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--doc-accent)', textDecoration: 'none' }}>
                      <div>{company.address}</div>
                      {(company.postalCode || company.city) && <div>{company.postalCode} {company.city}</div>}
                    </a>
                  : <div>
                      <div>{company.address}</div>
                      {(company.postalCode || company.city) && <div>{company.postalCode} {company.city}</div>}
                    </div>
              )}
              {company?.phone && <div>Tel: {company.phone}</div>}
              {company?.email && <div>{company.email}</div>}
            </div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: '16pt', fontWeight: 700, color: 'var(--doc-brand)', fontFamily: 'monospace' }}>{quote.quoteNumber}</div>
            <div style={{ fontSize: '8pt', color: 'var(--doc-ink-muted)', marginTop: '4px', lineHeight: 1.6 }}>
              <div><span style={{ display: 'inline-block', padding: '2px 8px', borderRadius: '4px', background: 'var(--doc-accent-soft)', color: 'var(--doc-brand)', fontSize: '8pt', fontWeight: 600 }}>Preventivo</span></div>
              <div>Data: {formatDate(quote.sentAt ?? new Date())}</div>
              {quote.validUntil && <div>Valido fino: {formatDate(quote.validUntil)}</div>}
              <div>Versione: {quoteVersion}</div>
            </div>
          </div>
        </div>

        {/* Parties */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '5mm', marginBottom: 'calc(6mm * var(--vspace, 1))' }}>
          {[
            { label: 'Da', name: company?.name ?? 'Delegami', address: company?.address, city: `${company?.postalCode ?? ''} ${company?.city ?? ''}` },
            { label: 'A', name: quote.project.client.name, address: quote.project.client.address, city: `${quote.project.client.postalCode ?? ''} ${quote.project.client.city ?? ''}` },
          ].map((p) => (
            <div key={p.label} style={{ border: '1px solid var(--doc-line)', borderRadius: '6px', padding: '5mm' }}>
              <div style={{ fontSize: '7pt', textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--doc-ink-muted)', marginBottom: '4px' }}>{p.label}</div>
              <div style={{ fontSize: '11pt', fontWeight: 600, color: 'var(--doc-ink)' }}>{p.name}</div>
              {(p.address || p.city.trim()) && (
                isInternal
                  ? <a href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent([p.address, p.city.trim()].filter(Boolean).join(', '))}`} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--doc-accent)', textDecoration: 'none' }}>
                      {p.address && <div style={{ fontSize: '8.5pt', lineHeight: 1.5 }}>{p.address}</div>}
                      {p.city.trim() && <div style={{ fontSize: '8.5pt' }}>{p.city.trim()}</div>}
                    </a>
                  : <div>
                      {p.address && <div style={{ fontSize: '8.5pt', lineHeight: 1.5 }}>{p.address}</div>}
                      {p.city.trim() && <div style={{ fontSize: '8.5pt' }}>{p.city.trim()}</div>}
                    </div>
              )}
            </div>
          ))}
        </div>

        {/* Project */}
        <div style={{ marginBottom: 'calc(5mm * var(--vspace, 1))', padding: '3mm 5mm', background: 'var(--doc-fill-cool)', borderRadius: '6px', border: '1px solid var(--doc-line)', fontSize: '9pt' }}>
          <span style={{ fontSize: '8pt', textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--doc-ink-muted)' }}>Opera: </span>
          <span style={{ fontWeight: 600 }}>{quote.project.name}</span>
          {quote.project.address && (
            isInternal
              ? <a href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(quote.project.address)}`} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--doc-accent)', textDecoration: 'none' }}> — {quote.project.address}</a>
              : <span style={{ color: 'var(--doc-ink-strong)' }}> — {quote.project.address}</span>
          )}
        </div>

        {/* Items or Bank summary */}
        {isBank ? (
          <div>
            {/* Bank: description of works */}
            <div style={{ fontSize: '11pt', fontWeight: 700, color: 'var(--doc-brand)', marginBottom: '4mm', borderBottom: '1px solid var(--doc-line)', paddingBottom: '2mm' }}>Descrizione dei lavori</div>
            {quote.project.description && (
              <div style={{ fontSize: '9pt', color: 'var(--doc-ink-strong)', lineHeight: 1.6, marginBottom: '6mm', padding: '4mm', background: 'var(--doc-fill-cool)', borderRadius: '4px', border: '1px solid var(--doc-line)' }}>
                {quote.project.description}
              </div>
            )}
            {/* Sections list */}
            {(() => {
              const sections = displayItems.filter((i) => i.itemType === 'SECTION')
              const lineItemCount = displayItems.filter((i) => i.itemType === 'ITEM').length
              if (sections.length > 0) return (
                <div style={{ marginBottom: '6mm' }}>
                  <div style={{ fontSize: '8.5pt', fontWeight: 600, color: 'var(--doc-ink-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '3mm' }}>Categorie di lavoro</div>
                  <ul style={{ paddingLeft: '4mm', margin: 0 }}>
                    {sections.map((s) => (
                      <li key={s.id} style={{ fontSize: '9.5pt', color: 'var(--doc-ink-strong)', padding: '2px 0', listStyle: 'disc' }}>{s.description}</li>
                    ))}
                    <li style={{ fontSize: '9pt', color: 'var(--doc-ink-muted)', padding: '2px 0', listStyle: 'none', marginTop: '2mm' }}>
                      Totale voci di lavoro: {lineItemCount}
                    </li>
                  </ul>
                </div>
              )
            })()}
            {quote.clientNotes && (
              <div style={{ fontSize: '9pt', color: 'var(--doc-ink-strong)', lineHeight: 1.5, marginBottom: '6mm', padding: '4mm', background: 'var(--doc-positive-soft)', borderRadius: '4px', border: '1px solid var(--doc-positive-line)' }}>
                <div style={{ fontSize: '7.5pt', textTransform: 'uppercase', color: 'var(--doc-positive)', marginBottom: '3px', fontWeight: 600 }}>Condizioni e note</div>
                {quote.clientNotes}
              </div>
            )}
            <div style={{ marginTop: '4mm', display: 'flex', justifyContent: 'flex-end' }}>
              <TotalsBlock subtotalClient={quote.subtotalClient} taxRate={quote.taxRate} taxAmount={quote.taxAmount} total={quote.total} showCosts={false} subtotalCost={0} />
            </div>
          </div>
        ) : (
          <div>
            {/* ── SUMMARY PAGE (extended only) ── */}
            {!compact && (
              <>
                <div style={{ fontSize: '11pt', fontWeight: 700, color: 'var(--doc-brand)', marginBottom: '4mm', borderBottom: '1px solid var(--doc-line)', paddingBottom: '2mm' }}>Riepilogo per sezione</div>
                <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '6mm', fontSize: '9.5pt' }}>
                  <thead>
                    <tr style={{ background: 'var(--doc-fill-cool)', borderBottom: '2px solid var(--doc-line)' }}>
                      <th style={{ textAlign: 'left', padding: '5px 8px', fontSize: '8pt', textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--doc-ink-muted)' }}>Sezione</th>
                      {showCosts && <th style={{ textAlign: 'right', padding: '5px 8px', fontSize: '8pt', color: 'var(--doc-warn)' }}>Costo</th>}
                      <th style={{ textAlign: 'right', padding: '5px 8px', fontSize: '8pt', color: 'var(--doc-ink-muted)' }}>Importo</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sectionSummary.map((s, i) => (
                      <tr key={i} style={{ borderBottom: '1px solid var(--doc-fill)', background: i % 2 === 0 ? 'var(--doc-paper)' : 'var(--doc-fill)' }}>
                        <td style={{ padding: '5px 8px', fontWeight: 500 }}>{s.name}</td>
                        {showCosts && <td style={{ padding: '5px 8px', textAlign: 'right', color: 'var(--doc-warn)' }}>CHF {fmt(s.totalCost)}</td>}
                        <td style={{ padding: '5px 8px', textAlign: 'right', fontWeight: 600 }}>CHF {fmt(s.totalPrice)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {totalsAndHidden}
              </>
            )}

            {/* ── DETAIL — own page in extended mode, inline in compact mode ── */}
            <div className={compact ? undefined : 'page-break-before'}>
              {!compact && (
                <div style={{ fontSize: '8pt', color: 'var(--doc-ink-subtle)', marginBottom: '5mm', paddingBottom: '3mm', borderBottom: '1px solid var(--doc-line)', display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ fontWeight: 600, color: 'var(--doc-ink-muted)' }}>{quote.quoteNumber} v{quoteVersion} · Dettaglio articoli</span>
                  <span>{variantLabel}</span>
                </div>
              )}
            <div style={{ fontSize: '11pt', fontWeight: 700, color: 'var(--doc-brand)', marginBottom: '4mm', borderBottom: '1px solid var(--doc-line)', paddingBottom: '2mm' }}>Articoli</div>
            <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: 'calc(6mm * var(--vspace, 1))', fontSize: '9pt' }}>
              <thead>
                <tr style={{ background: 'var(--doc-fill)', borderBottom: '2px solid var(--doc-line)' }}>
                  <th style={{ padding: '4px 6px', textAlign: 'right', fontSize: '7.5pt', color: 'var(--doc-ink-muted)', width: '6mm' }}>#</th>
                  <th style={{ textAlign: 'left', padding: '4px 6px', fontSize: '7.5pt', textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--doc-ink-muted)', width: '40%' }}>Descrizione</th>
                  <th style={{ padding: '4px 6px', textAlign: 'center', fontSize: '7.5pt', color: 'var(--doc-ink-muted)' }}>U.M.</th>
                  <th style={{ padding: '4px 6px', textAlign: 'right', fontSize: '7.5pt', color: 'var(--doc-ink-muted)' }}>Qtà</th>
                  {showCosts && <>
                    <th style={{ padding: '4px 6px', textAlign: 'right', fontSize: '7.5pt', color: 'var(--doc-warn)' }}>Costo u.</th>
                    <th style={{ padding: '4px 6px', textAlign: 'right', fontSize: '7.5pt', color: 'var(--doc-warn)' }}>Tot. costo</th>
                    <th style={{ padding: '4px 6px', textAlign: 'center', fontSize: '7.5pt', color: 'var(--doc-note)' }}>Marg.%</th>
                  </>}
                  <th style={{ padding: '4px 6px', textAlign: 'right', fontSize: '7.5pt', color: 'var(--doc-ink-muted)' }}>Prezzo u.</th>
                  <th style={{ padding: '4px 6px', textAlign: 'right', fontSize: '7.5pt', color: 'var(--doc-ink-muted)' }}>Totale</th>
                </tr>
              </thead>
              <tbody>
                {(() => {
                  // Build rows with section subtotals injected after each section's last item
                  type PdfRow =
                    | { kind: 'item'; item: typeof quote.items[0] }
                    | { kind: 'subtotal'; totalCost: number; totalPrice: number }
                  const rows: PdfRow[] = []
                  let secCost = 0, secPrice = 0, hasItems = false
                  let itemNum = 0
                  const itemNums = new Map<string, number>()
                  for (const it of displayItems) {
                    if (it.itemType === 'ITEM') itemNums.set(it.id, ++itemNum)
                  }
                  for (let i = 0; i < displayItems.length; i++) {
                    const item = displayItems[i]
                    const next = displayItems[i + 1]
                    if (item.itemType === 'ITEM') {
                      secCost += (item.totalCost as number | null) ?? 0
                      secPrice += (item.totalPrice as number | null) ?? 0
                      hasItems = true
                    }
                    rows.push({ kind: 'item', item })
                    if ((!next || next.itemType === 'SECTION' || next.itemType === 'HEADER') && hasItems) {
                      rows.push({ kind: 'subtotal', totalCost: secCost, totalPrice: secPrice })
                      secCost = 0; secPrice = 0; hasItems = false
                    }
                  }
                  // totalCols: # + desc + um + qty + [cost_u + tot_cost + marg%] + price_u + totale
                  const totalCols = showCosts ? 9 : 6
                  return rows.map((row, idx) => {
                    if (row.kind === 'subtotal') return (
                      <tr key={`sub-${idx}`}>
                        {showCosts ? (
                          <>
                            <td colSpan={5} style={{ padding: '3px 6px', textAlign: 'right', fontSize: '7.5pt', color: 'var(--doc-ink-subtle)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', background: 'var(--doc-fill-cool)' }}>Subtotale sezione</td>
                            <td style={{ padding: '3px 6px', textAlign: 'right', fontSize: '8pt', color: 'var(--doc-warn)', fontWeight: 700, background: 'var(--doc-warn-soft)' }}>{fmt(row.totalCost)}</td>
                            <td style={{ background: 'var(--doc-fill-cool)' }} />
                            <td style={{ background: 'var(--doc-fill-cool)' }} />
                            <td style={{ padding: '3px 6px', textAlign: 'right', fontSize: '8pt', color: 'var(--doc-accent)', fontWeight: 700, background: 'var(--doc-accent-soft)' }}>{fmt(row.totalPrice)}</td>
                          </>
                        ) : (
                          <>
                            <td colSpan={totalCols - 1} style={{ padding: '3px 6px', textAlign: 'right', fontSize: '7.5pt', color: 'var(--doc-ink-subtle)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', background: 'var(--doc-fill-cool)' }}>Subtotale sezione</td>
                            <td style={{ padding: '3px 6px', textAlign: 'right', fontSize: '8pt', color: 'var(--doc-accent)', fontWeight: 700, background: 'var(--doc-accent-soft)' }}>{fmt(row.totalPrice)}</td>
                          </>
                        )}
                      </tr>
                    )
                    const item = row.item
                  if (item.itemType === 'HEADER') return (
                    <tr key={item.id}>
                      <td colSpan={totalCols} style={{ background: 'var(--doc-brand)', padding: '6px 10px', borderRadius: '4px' }}>
                        <span style={{ color: 'var(--doc-line-strong)', marginRight: '6px', fontSize: '8pt' }}>▶</span>
                        <span style={{ fontWeight: 700, fontSize: '10pt', color: 'white', letterSpacing: '0.08em' }}>{item.description}</span>
                      </td>
                    </tr>
                  )
                  if (item.itemType === 'SECTION') return (
                    <tr key={item.id}><td /><td colSpan={totalCols - 1} style={{ background: 'var(--doc-fill-cool)', fontWeight: 600, fontSize: '8.5pt', textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--doc-ink-muted)', padding: '4px 6px' }}>{item.description}</td></tr>
                  )
                  if (item.itemType === 'NOTE') return (
                    <tr key={item.id}><td /><td colSpan={totalCols - 1} style={{ background: 'var(--doc-warn-soft)', fontStyle: 'italic', fontSize: '8.5pt', color: 'var(--doc-warn)', padding: '4px 6px' }}>📝 {item.description}</td></tr>
                  )
                  const effectiveMargin = item.marginPercent ?? quote.marginPercent
                  const marginDisplay = item.directPrice ? 'dir.' : `${effectiveMargin}%`
                  const isItemHidden = item.hiddenFromClient === true
                  return (
                    <tr key={item.id} style={{ borderBottom: '1px solid var(--doc-fill)', opacity: isItemHidden ? 0.65 : 1, background: isItemHidden ? 'var(--doc-warn-soft)' : undefined }}>
                      <td style={{ padding: '5px 6px', textAlign: 'right', fontSize: '7.5pt', color: 'var(--doc-line-strong)', whiteSpace: 'nowrap' }}>{itemNums.get(item.id)}</td>
                      <td style={{ padding: '5px 6px' }}>
                        <div style={{ display: 'flex', alignItems: 'baseline', gap: '5px' }}>
                          <span style={{ textDecoration: isItemHidden ? 'line-through' : undefined, color: isItemHidden ? 'var(--doc-ink-subtle)' : undefined }}>{item.description}</span>
                          {isItemHidden && <span style={{ fontSize: '7pt', fontWeight: 700, color: 'var(--doc-warn)', background: 'var(--doc-warn-soft)', border: '1px solid var(--doc-warn-line)', borderRadius: '3px', padding: '0 4px', whiteSpace: 'nowrap' }}>NASCOSTO</span>}
                        </div>
                        {isInternal && (item.sourceNote || item.sourceUrl) && (
                          <div style={{ marginTop: '2px' }}>
                            {item.sourceNote && <span style={{ fontSize: '7.5pt', color: 'var(--doc-ink-muted)' }}>{item.sourceNote}</span>}
                            {item.sourceUrl && (
                              <a href={item.sourceUrl} style={{ fontSize: '7.5pt', color: 'var(--doc-accent)', marginLeft: item.sourceNote ? '6px' : '0', textDecoration: 'underline' }}>
                                {item.sourceUrl.replace(/^https?:\/\//, '').split('/')[0]}
                              </a>
                            )}
                          </div>
                        )}
                      </td>
                      <td style={{ padding: '5px 6px', textAlign: 'center', color: 'var(--doc-ink-subtle)' }}>{item.unit ?? '—'}</td>
                      <td style={{ padding: '5px 6px', textAlign: 'right' }}>{fmt(item.quantity)}</td>
                      {showCosts && <>
                        <td style={{ padding: '5px 6px', textAlign: 'right', color: 'var(--doc-warn)' }}>{fmt(item.unitCost)}</td>
                        <td style={{ padding: '5px 6px', textAlign: 'right', color: 'var(--doc-warn)' }}>{fmt(item.totalCost)}</td>
                        <td style={{ padding: '5px 6px', textAlign: 'center', color: 'var(--doc-note)', fontSize: '8pt' }}>{marginDisplay}</td>
                      </>}
                      <td style={{ padding: '5px 6px', textAlign: 'right' }}>{fmt(item.unitPrice)}</td>
                      <td style={{ padding: '5px 6px', textAlign: 'right', fontWeight: 600 }}>{fmt(item.totalPrice)}</td>
                    </tr>
                  )
                  })
                })()}
              </tbody>
            </table>
            {compact && totalsAndHidden}
            </div>{/* end detail pages div */}
          </div>
        )}

        {/* Note e condizioni - own page in extended mode; flows inline in compact mode */}
        <div className={compact ? undefined : 'quote-final-page'}>
        {quote.showClientNotes && quote.clientNotes?.trim() && (
          <div className="quote-final-card" style={{ border: '1px solid var(--doc-line)', borderRadius: '6px', padding: '5mm', marginTop: 'calc(8mm * var(--vspace, 1))' }}>
            <div style={{ fontSize: '7.5pt', textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--doc-ink-muted)', marginBottom: '4px' }}>Note e condizioni</div>
            <div style={{ fontSize: '8.5pt', color: 'var(--doc-ink-strong)', lineHeight: 1.4, whiteSpace: 'pre-wrap' }}>{quote.clientNotes}</div>
          </div>
        )}

        {/* Condizioni di pagamento + IBAN */}
        {resolvedPaymentTerms?.trim() && (
          <div className="quote-final-card" style={{ border: '1px solid var(--doc-line)', borderRadius: '6px', padding: '5mm', marginTop: 'calc(4mm * var(--vspace, 1))' }}>
            <div style={{ fontSize: '7.5pt', textTransform: 'uppercase', color: 'var(--doc-ink-muted)', marginBottom: '4px' }}>Condizioni di pagamento</div>
            <div style={{ fontSize: '8.5pt', color: 'var(--doc-ink-strong)', whiteSpace: 'pre-wrap', lineHeight: 1.35 }}>{resolvedPaymentTerms}</div>
            {company?.iban && (
              <div style={{ marginTop: '3mm', paddingTop: '2mm', borderTop: '1px solid var(--doc-line)', fontSize: '8.5pt', color: 'var(--doc-ink-strong)' }}>
                <strong>Coordinate bancarie:</strong> IBAN {company.iban}<br />
                <span style={{ fontSize: '8.5pt', color: 'var(--doc-ink-muted)' }}>Intestatario: Marcos Delegami Filho</span>
              </div>
            )}
          </div>
        )}

        {/* Note interne (internal only) */}
        {isInternal && quote.internalNotes?.trim() && (
          <div className="quote-final-card" style={{ border: '1px solid var(--doc-warn-line)', borderRadius: '6px', padding: '5mm', marginTop: 'calc(4mm * var(--vspace, 1))', background: 'var(--doc-warn-soft)' }}>
            <div style={{ fontSize: '7.5pt', textTransform: 'uppercase', color: 'var(--doc-warn)', marginBottom: '4px' }}>Note interne</div>
            <div style={{ fontSize: '8.5pt', color: 'var(--doc-warn)', whiteSpace: 'pre-wrap', lineHeight: 1.35 }}>{quote.internalNotes}</div>
          </div>
        )}

        {/* Signature block — client-facing only */}
        {!isInternal && (
          <div className="quote-signature-block" style={{ marginTop: 'calc(7mm * var(--vspace, 1))', paddingTop: 'calc(4mm * var(--vspace, 1))', borderTop: '2px solid var(--doc-brand)' }}>
            {/* Firme per accettazione */}
            <div style={{ fontSize: '8pt', textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--doc-ink-muted)', marginBottom: 'calc(4mm * var(--vspace, 1))' }}>Firma per accettazione dell&apos;offerta</div>
            {(() => {
              const names = quote.signatories
                ? quote.signatories.split('\n').map((n) => n.trim()).filter(Boolean)
                : (() => {
                    const addr = quote.project.client.address ?? ''
                    if (addr.toLowerCase().startsWith('c/o')) {
                      return [addr.replace(/^c\/o\s+fiduciaria\s+/i, '').replace(/^c\/o\s+/i, '').split(',')[0].trim()]
                    }
                    return [quote.project.client.name]
                  })()
              const cols = names.length > 1 ? names.length : 2
              return (
                <div style={{ display: 'grid', gridTemplateColumns: `repeat(${cols}, 1fr)`, gap: '10mm' }}>
                  {names.map((name, i) => (
                    <div key={i}>
                      <div style={{ fontSize: '9pt', fontWeight: 600, color: 'var(--doc-ink)', marginBottom: '3mm' }}>{name}</div>
                      <div className="quote-signature-line" style={{ borderBottom: '1px solid var(--doc-ink-strong)', marginBottom: '2mm', height: 'max(7mm, calc(14mm * var(--vspace, 1)))' }} />
                      <div style={{ fontSize: '7.5pt', color: 'var(--doc-ink-subtle)' }}>Firma e data</div>
                    </div>
                  ))}
                  {names.length === 1 && (
                    <div>
                      <div style={{ fontSize: '9pt', fontWeight: 600, color: 'var(--doc-ink)', marginBottom: '3mm' }}>{company?.name ?? 'Delegami'}</div>
                      <div className="quote-signature-line" style={{ borderBottom: '1px solid var(--doc-ink-strong)', marginBottom: '2mm', height: 'max(7mm, calc(14mm * var(--vspace, 1)))' }} />
                      <div style={{ fontSize: '7.5pt', color: 'var(--doc-ink-subtle)' }}>Firma e data</div>
                    </div>
                  )}
                </div>
              )
            })()}
            <div style={{ marginTop: 'calc(5mm * var(--vspace, 1))' }}>
              <div style={{ fontSize: '8pt', color: 'var(--doc-ink-muted)', marginBottom: '2mm' }}>Luogo e data</div>
              <div style={{ borderBottom: '1px solid var(--doc-ink-subtle)', width: '90mm', height: 'max(5mm, calc(6mm * var(--vspace, 1)))' }} />
            </div>
          </div>
        )}

        {/* Footer */}
        <div style={{ marginTop: 'calc(8mm * var(--vspace, 1))', paddingTop: '4mm', borderTop: '1px solid var(--doc-line)', display: 'flex', justifyContent: 'space-between', fontSize: '7.5pt', color: 'var(--doc-ink-subtle)' }}>
          <span>{company?.name ?? 'Delegami'} · {quote.quoteNumber} v{quoteVersion}</span>
          <span>Generato il {formatDate(new Date())}</span>
        </div>
        </div>
      </div>
      <QuoteAutoFit enabled={compact} />
    </div>
  )
}

function TotalsBlock({ subtotalCost, subtotalClient, taxRate, taxAmount, total, showCosts }: {
  subtotalCost: number; subtotalClient: number; taxRate: number; taxAmount: number; total: number; showCosts: boolean
}) {
  return (
    <div style={{ width: showCosts ? '72mm' : '60mm', border: '1px solid var(--doc-line)', borderRadius: '6px', overflow: 'hidden', fontSize: '9pt' }}>
      {showCosts && (
        <div style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 8px', background: 'var(--doc-warn-soft)', color: 'var(--doc-warn)' }}>
          <span>Subtotale costi</span><span>CHF {fmt(subtotalCost)}</span>
        </div>
      )}
      <div style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 8px', background: 'var(--doc-accent-soft)', color: 'var(--doc-accent)' }}>
        <span>Subtotale</span><span>CHF {fmt(subtotalClient)}</span>
      </div>
      {showCosts && (() => {
        const marginAmt = subtotalClient - subtotalCost
        const actualPct = subtotalClient > 0 ? Math.round((marginAmt / subtotalClient) * 1000) / 10 : 0
        return (
          <div style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 8px', background: 'var(--doc-fill)', color: 'var(--doc-ink-strong)', fontSize: '8.5pt' }}>
            <span>Margine ({actualPct}%)</span><span>CHF {fmt(marginAmt)}</span>
          </div>
        )
      })()}
      {taxRate > 0 && (
        <div style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 8px', background: 'var(--doc-fill)', color: 'var(--doc-ink-strong)', fontSize: '8.5pt' }}>
          <span>IVA {taxRate}%</span><span>CHF {fmt(taxAmount)}</span>
        </div>
      )}
      <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 8px', background: 'var(--doc-brand)', color: 'white', fontWeight: 700, fontSize: '11pt' }}>
        <span>Totale</span><span>CHF {fmt(total)}</span>
      </div>
    </div>
  )
}
