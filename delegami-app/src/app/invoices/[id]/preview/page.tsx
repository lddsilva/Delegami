import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import { getInvoiceById } from '@/modules/invoices/queries'
import { prisma } from '@/lib/db'
import { formatDate, swissNumber } from '@/lib/utils'
import { PrintButton } from '@/components/ui/print-button'

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>
}): Promise<Metadata> {
  const { id } = await params
  const invoice = await getInvoiceById(id)
  if (!invoice) return { title: 'Fattura' }
  const client = invoice.project.client.name
  return {
    title: `${invoice.invoiceNumber} - ${client} - Fattura`,
  }
}

function fmt(n: number | null | undefined) {
  if (n == null) return '—'
  return swissNumber(new Intl.NumberFormat('de-CH', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(n))
}

export default async function InvoicePreviewPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const [invoice, company] = await Promise.all([
    getInvoiceById(id),
    prisma.companySettings.findFirst(),
  ])
  if (!invoice) notFound()

  return (
    <div className="min-h-screen bg-gray-100 py-8 print:bg-white print:p-0 print:min-h-0">
      <style>{`
        @media print {
          @page { margin: 10mm 14mm; size: A4 portrait; }
          html, body {
            height: auto !important; overflow: visible !important;
            margin: 0 !important; padding: 0 !important;
            -webkit-print-color-adjust: exact; print-color-adjust: exact;
          }
          .inv-doc {
            padding: 0 !important; margin: 0 !important;
            max-width: none !important; box-shadow: none !important;
            font-size: 8pt !important;
          }
          .inv-doc * { font-size: inherit; }
          table { page-break-inside: auto; border-collapse: collapse; width: 100%; }
          tr { page-break-inside: avoid; page-break-after: auto; }
          thead { display: table-header-group; }
          tfoot { display: table-footer-group; }
          .inv-header { margin-bottom: 4mm !important; padding-bottom: 3mm !important; }
          .inv-parties { margin-bottom: 3mm !important; }
          .inv-project { margin-bottom: 3mm !important; }
          .inv-totals { margin-top: 3mm !important; }
          .inv-footer { margin-top: 4mm !important; }
          .no-print { display: none !important; }
        }
      `}</style>
      {/* Toolbar — hidden on print */}
      <div className="no-print max-w-[210mm] mx-auto mb-4 flex items-center justify-between">
        <a href={`/invoices/${id}`} className="text-sm text-gray-600 hover:text-blue-600">← Torna alla fattura</a>
        <PrintButton />
      </div>

      {/* Document */}
      <div
        className="inv-doc bg-white max-w-[210mm] mx-auto shadow-lg print:shadow-none"
        style={{ padding: '10mm 14mm', fontFamily: "'Helvetica Neue', Arial, sans-serif", fontSize: '9.5pt' }}
      >
        {/* Header */}
        <div className="inv-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '5mm', paddingBottom: '4mm', borderBottom: '2px solid var(--doc-brand)' }}>
          <div>
            <div style={{ fontSize: '15pt', fontWeight: 700, color: 'var(--doc-brand)' }}>{company?.name ?? 'Zanetti Office'}</div>
            <div style={{ fontSize: '8pt', color: 'var(--doc-ink-muted)', marginTop: '4px', lineHeight: 1.5 }}>
              {company?.address && (
                <div>
                  <div>{company.address}</div>
                  {(company.postalCode || company.city) && <div>{company.postalCode} {company.city}</div>}
                </div>
              )}
              {company?.phone && <div>Tel: {company.phone}</div>}
              {company?.email && <div>{company.email}</div>}
            </div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: '16pt', fontWeight: 700, color: 'var(--doc-brand)', fontFamily: 'monospace' }}>{invoice.invoiceNumber}</div>
            <div style={{ fontSize: '8pt', color: 'var(--doc-ink-muted)', marginTop: '4px', lineHeight: 1.6 }}>
              <div><span style={{ display: 'inline-block', padding: '2px 8px', borderRadius: '4px', background: 'var(--doc-accent-soft)', color: 'var(--doc-brand)', fontSize: '8pt', fontWeight: 600 }}>Fattura</span></div>
              <div>Data: {formatDate(invoice.issueDate)}</div>
              {invoice.dueDate && <div>Scadenza: {formatDate(invoice.dueDate)}</div>}
              {invoice.quote && (
                <div style={{ fontSize: '7.5pt', color: 'var(--doc-ink-subtle)' }}>
                  Rif. {invoice.quote.quoteNumber} v{invoice.quote.version}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Parties */}
        <div className="inv-parties" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4mm', marginBottom: '4mm' }}>
          {[
            { label: 'Emessa da', name: company?.name ?? 'Zanetti Office', address: company?.address, city: `${company?.postalCode ?? ''} ${company?.city ?? ''}` },
            { label: 'Intestata a', name: invoice.project.client.name, address: invoice.project.client.address, city: `${invoice.project.client.postalCode ?? ''} ${invoice.project.client.city ?? ''}` },
          ].map((p) => (
            <div key={p.label} style={{ border: '1px solid var(--doc-line)', borderRadius: '6px', padding: '3mm 4mm' }}>
              <div style={{ fontSize: '7pt', textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--doc-ink-muted)', marginBottom: '4px' }}>{p.label}</div>
              <div style={{ fontSize: '11pt', fontWeight: 600, color: 'var(--doc-ink)' }}>{p.name}</div>
              {(p.address || p.city.trim()) && (
                <div style={{ color: 'var(--doc-ink-strong)' }}>
                  {p.address && <div style={{ fontSize: '8.5pt', lineHeight: 1.5 }}>{p.address}</div>}
                  {p.city.trim() && <div style={{ fontSize: '8.5pt' }}>{p.city.trim()}</div>}
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Project */}
        <div className="inv-project" style={{ marginBottom: '4mm', padding: '2mm 4mm', background: 'var(--doc-fill-cool)', borderRadius: '6px', border: '1px solid var(--doc-line)', fontSize: '9pt' }}>
          <span style={{ fontSize: '8pt', textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--doc-ink-muted)' }}>Opera: </span>
          <span style={{ fontWeight: 600 }}>{invoice.project.name}</span>
          {invoice.project.address && <span style={{ color: 'var(--doc-ink-strong)' }}> — {invoice.project.address}</span>}
        </div>

        {/* Items table */}
        <div>
          <div style={{ fontSize: '11pt', fontWeight: 700, color: 'var(--doc-brand)', marginBottom: '4mm', borderBottom: '1px solid var(--doc-line)', paddingBottom: '2mm' }}>Articoli</div>
          <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '4mm', fontSize: '9pt' }}>
            <thead>
              <tr style={{ background: 'var(--doc-fill)', borderBottom: '2px solid var(--doc-line)' }}>
                <th style={{ textAlign: 'left', padding: '3px 6px', fontSize: '7.5pt', textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--doc-ink-muted)', width: '50%' }}>Descrizione</th>
                <th style={{ padding: '3px 6px', textAlign: 'center', fontSize: '7.5pt', color: 'var(--doc-ink-muted)' }}>U.M.</th>
                <th style={{ padding: '3px 6px', textAlign: 'right', fontSize: '7.5pt', color: 'var(--doc-ink-muted)' }}>Qtà</th>
                <th style={{ padding: '3px 6px', textAlign: 'right', fontSize: '7.5pt', color: 'var(--doc-ink-muted)' }}>Prezzo u.</th>
                <th style={{ padding: '3px 6px', textAlign: 'right', fontSize: '7.5pt', color: 'var(--doc-ink-muted)' }}>Totale</th>
              </tr>
            </thead>
            <tbody>
              {invoice.items.map((item) => (
                <tr key={item.id} style={{ borderBottom: '1px solid var(--doc-fill)' }}>
                  <td style={{ padding: '4px 6px' }}>{item.description}</td>
                  <td style={{ padding: '4px 6px', textAlign: 'center', color: 'var(--doc-ink-subtle)' }}>{item.unit ?? '—'}</td>
                  <td style={{ padding: '4px 6px', textAlign: 'right' }}>{fmt(item.quantity)}</td>
                  <td style={{ padding: '4px 6px', textAlign: 'right' }}>{fmt(item.unitPrice)}</td>
                  <td style={{ padding: '4px 6px', textAlign: 'right', fontWeight: 600 }}>{fmt(item.total)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Totals */}
        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
          <div style={{ width: '60mm', border: '1px solid var(--doc-line)', borderRadius: '6px', overflow: 'hidden', fontSize: '9pt' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 8px', background: 'var(--doc-accent-soft)', color: 'var(--doc-accent)' }}>
              <span>Subtotale</span><span>CHF {fmt(invoice.subtotal)}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 8px', background: 'var(--doc-fill)', color: 'var(--doc-ink-strong)', fontSize: '8.5pt' }}>
              <span>IVA {invoice.taxRate}%</span><span>CHF {fmt(invoice.taxAmount)}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 8px', background: 'var(--doc-brand)', color: 'white', fontWeight: 700, fontSize: '11pt' }}>
              <span>Totale</span><span>CHF {fmt(invoice.total)}</span>
            </div>
          </div>
        </div>

        {/* Notes */}
        {invoice.notes && (
          <div style={{ border: '1px solid var(--doc-line)', borderRadius: '6px', padding: '4mm', marginTop: '5mm' }}>
            <div style={{ fontSize: '7.5pt', textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--doc-ink-muted)', marginBottom: '3px' }}>Note</div>
            <div style={{ fontSize: '8.5pt', color: 'var(--doc-ink-strong)', lineHeight: 1.5, whiteSpace: 'pre-wrap' }}>{invoice.notes}</div>
          </div>
        )}

        {company?.paymentTerms && (() => {
          // Static payment QR: printed only from INV-2026-015 onwards (zero-padded numbers keep the string compare correct across years)
          const showQr = Boolean(company?.paymentQrUrl) && invoice.invoiceNumber >= 'INV-2026-015'
          return (
            <div style={{ border: '1px solid var(--doc-line)', borderRadius: '6px', padding: '4mm', marginTop: '4mm', breakInside: 'avoid' }}>
              <div style={{ fontSize: '7.5pt', textTransform: 'uppercase', color: 'var(--doc-ink-muted)', marginBottom: '3px' }}>Condizioni di pagamento</div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '5mm' }}>
                <div style={{ minWidth: 0, flex: 1 }}>
                  <div style={{ fontSize: '8.5pt', color: 'var(--doc-ink-strong)', whiteSpace: 'pre-wrap' }}>{company.paymentTerms}</div>
                  {company?.iban && (
                    <div style={{ marginTop: '3mm', paddingTop: '2mm', borderTop: '1px solid var(--doc-line)', fontSize: '8.5pt' }}>
                      <strong>Coordinate bancarie:</strong> IBAN {company.iban}
                    </div>
                  )}
                </div>
                {showQr && (
                  <div style={{ flexShrink: 0, textAlign: 'center' }}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={company.paymentQrUrl as string}
                      alt="QR pagamento"
                      style={{ width: '26mm', height: '26mm', objectFit: 'contain', display: 'block' }}
                    />
                    <div style={{ fontSize: '6.5pt', color: 'var(--doc-ink-muted)', marginTop: '1mm' }}>Scansiona per pagare</div>
                  </div>
                )}
              </div>
            </div>
          )
        })()}

        {/* Footer */}
        <div className="inv-footer" style={{ marginTop: '5mm', paddingTop: '3mm', borderTop: '1px solid var(--doc-line)', display: 'flex', justifyContent: 'space-between', fontSize: '7.5pt', color: 'var(--doc-ink-subtle)' }}>
          <span>{company?.name ?? 'Zanetti Office'} · {invoice.invoiceNumber}</span>
          <span>Generato il {formatDate(new Date())}</span>
        </div>
      </div>
    </div>
  )
}
