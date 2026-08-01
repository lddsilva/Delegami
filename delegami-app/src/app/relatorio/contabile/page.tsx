import type { Metadata } from 'next'
import { prisma } from '@/lib/db'
import { formatDate, formatDateTime, formatCurrency } from '@/lib/utils'
import { PrintButton } from '@/components/ui/print-button'
import { getAccountingReport } from '@/modules/accounting/queries'

/**
 * The browser derives the suggested PDF filename from the document title, so it
 * carries the period and the company instead of a bare "Rapporto contabile".
 */
export async function generateMetadata({
  searchParams,
}: {
  searchParams: Promise<{ from?: string; to?: string }>
}): Promise<Metadata> {
  const sp = await searchParams
  const year = new Date().getFullYear()
  const from = sp.from ?? `${year}-01-01`
  const to = sp.to ?? `${year}-12-31`
  const company = await prisma.companySettings.findFirst({ orderBy: { createdAt: 'asc' } })
  const name = company?.name ?? 'Zanetti Office'
  return { title: `Rapporto contabile ${periodLabel(from)}–${periodLabel(to)} — ${name}` }
}

const expenseTypeLabel: Record<string, string> = {
  MATERIAL: 'Materiale',
  LABOR: 'Manodopera',
  TRANSPORT: 'Trasporto',
  EQUIPMENT: 'Attrezzatura',
  ADMIN: 'Amministrazione',
  OTHER: 'Altro',
}

const invoiceStatusLabel: Record<string, string> = {
  DRAFT: 'Bozza',
  SENT: 'Emessa',
  PAID: 'Incassata',
  OVERDUE: 'Scaduta',
  CANCELLED: 'Annullata',
}

function chf(n: number) {
  return formatCurrency(n)
}

/**
 * Formats a plain 'YYYY-MM-DD' boundary as dd.mm.yyyy.
 * The period end is stored at 23:59:59, so running it through the
 * timezone-aware formatDate() would roll it into the next day.
 */
function periodLabel(iso: string) {
  const [y, m, d] = iso.split('-')
  return `${Number(d)}.${Number(m)}.${y}`
}

/** Section heading with the same navy rule used by the invoice/quote PDFs. */
function SectionTitle({ children, note }: { children: React.ReactNode; note?: string }) {
  return (
    <div style={{ marginTop: '6mm', marginBottom: '3mm', borderBottom: '1px solid var(--doc-line, #e5e7eb)', paddingBottom: '1.5mm' }}>
      <div style={{ fontSize: '11pt', fontWeight: 700, color: 'var(--doc-brand, #1e3a5f)' }}>{children}</div>
      {note && <div style={{ fontSize: '7.5pt', color: 'var(--doc-ink-muted, #6b7280)', marginTop: '1mm' }}>{note}</div>}
    </div>
  )
}

const th: React.CSSProperties = {
  textAlign: 'left', padding: '3px 6px', fontSize: '7pt', textTransform: 'uppercase',
  letterSpacing: '0.05em', color: 'var(--doc-ink-muted, #6b7280)', borderBottom: '2px solid var(--doc-line, #e5e7eb)',
}
const thR: React.CSSProperties = { ...th, textAlign: 'right' }
const td: React.CSSProperties = { padding: '3px 6px', borderBottom: '1px solid #f3f4f6' }
const tdR: React.CSSProperties = { ...td, textAlign: 'right' }
const tfootTd: React.CSSProperties = { padding: '4px 6px', fontWeight: 700, borderTop: '2px solid var(--doc-line, #e5e7eb)' }
const tfootTdR: React.CSSProperties = { ...tfootTd, textAlign: 'right' }

export default async function AccountingReportPage({
  searchParams,
}: {
  searchParams: Promise<{ from?: string; to?: string }>
}) {
  const sp = await searchParams
  const now = new Date()
  const from = sp.from ? new Date(`${sp.from}T00:00:00`) : new Date(now.getFullYear(), 0, 1)
  const to = sp.to ? new Date(`${sp.to}T23:59:59`) : new Date(now.getFullYear(), 11, 31, 23, 59, 59)

  const fromStr = sp.from ?? `${from.getFullYear()}-01-01`
  const toStr = sp.to ?? `${to.getFullYear()}-12-31`

  const r = await getAccountingReport({ from, to })
  const c = r.company
  const allZeroVat = r.issued.every((i) => i.taxRate === 0)
  const thresholdPct = (r.vatThreshold.yearTurnover / r.vatThreshold.limit) * 100

  return (
    <div className="min-h-screen bg-gray-100 py-8 print:bg-white print:p-0 print:min-h-0">
      <style>{`
        @media print {
          @page { margin: 10mm 12mm; size: A4 portrait; }
          html, body {
            height: auto !important; overflow: visible !important;
            margin: 0 !important; padding: 0 !important;
            -webkit-print-color-adjust: exact; print-color-adjust: exact;
          }
          .acc-doc {
            padding: 0 !important; margin: 0 !important;
            max-width: none !important; box-shadow: none !important;
            font-size: 7.5pt !important;
          }
          .acc-doc * { font-size: inherit; }
          table { page-break-inside: auto; border-collapse: collapse; width: 100%; }
          tr { page-break-inside: avoid; page-break-after: auto; }
          thead { display: table-header-group; }
          .acc-block { break-inside: avoid; }
          .no-print { display: none !important; }
        }
      `}</style>

      {/* Toolbar — hidden on print */}
      <div className="no-print max-w-[210mm] mx-auto mb-4 flex flex-wrap items-center justify-between gap-3">
        <a href="/reports" className="text-sm text-gray-600 hover:text-blue-600">← Report</a>
        <form method="get" className="flex flex-wrap items-end gap-2">
          <label className="text-xs text-gray-600">
            Dal
            <input type="date" name="from" defaultValue={fromStr} className="ml-1 rounded border border-gray-300 px-2 py-1 text-sm" />
          </label>
          <label className="text-xs text-gray-600">
            Al
            <input type="date" name="to" defaultValue={toStr} className="ml-1 rounded border border-gray-300 px-2 py-1 text-sm" />
          </label>
          <button type="submit" className="rounded-md bg-blue-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-blue-700">
            Aggiorna
          </button>
          <a
            href={`/relatorio/contabile/csv?from=${fromStr}&to=${toStr}`}
            className="rounded-md border border-gray-300 px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50"
          >
            Esporta CSV
          </a>
        </form>
        <PrintButton />
      </div>

      {/* Document */}
      <div
        className="acc-doc bg-white max-w-[210mm] mx-auto shadow-lg print:shadow-none"
        style={{ padding: '10mm 12mm', fontFamily: "'Helvetica Neue', Arial, sans-serif", fontSize: '8.5pt', color: '#111' }}
      >
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', paddingBottom: '4mm', borderBottom: '2px solid var(--doc-brand, #1e3a5f)' }}>
          <div>
            <div style={{ fontSize: '15pt', fontWeight: 700, color: 'var(--doc-brand, #1e3a5f)' }}>{c?.name ?? 'Zanetti Office'}</div>
            <div style={{ fontSize: '8pt', color: 'var(--doc-ink-muted, #666)', marginTop: '3px', lineHeight: 1.5 }}>
              {c?.address && <div>{c.address}</div>}
              {(c?.postalCode || c?.city) && <div>{c?.postalCode} {c?.city}</div>}
              {c?.vatNumber && <div>N. IVA/IDE: {c.vatNumber}</div>}
              {c?.registrationNumber && <div>N. registro: {c.registrationNumber}</div>}
            </div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: '13pt', fontWeight: 700, color: 'var(--doc-brand, #1e3a5f)' }}>RAPPORTO CONTABILE</div>
            <div style={{ fontSize: '8pt', color: 'var(--doc-ink-muted, #666)', marginTop: '3px', lineHeight: 1.6 }}>
              <div><strong>Periodo:</strong> {periodLabel(fromStr)} — {periodLabel(toStr)}</div>
              <div>Generato il {formatDateTime(r.generatedAt)}</div>
              <div>Valuta: CHF</div>
            </div>
          </div>
        </div>

        {/* 1. Riepilogo */}
        <SectionTitle note="Fatturato = fatture emesse nel periodo (bozze escluse). Incassato = pagamenti ricevuti nel periodo.">
          1. Riepilogo del periodo
        </SectionTitle>
        <div className="acc-block" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '3mm' }}>
          {[
            { label: 'Fatturato emesso (competenza)', value: chf(r.totals.issued), strong: true },
            { label: 'Incassato (cassa)', value: chf(r.totals.cashed), strong: true },
            { label: 'Da incassare (totale aperto)', value: chf(r.totals.receivable), strong: true },
            { label: 'Costi registrati', value: chf(r.totals.expenses) },
            { label: 'Costo manodopera', value: chf(r.totals.laborCost) },
            { label: 'Risultato (ricavi − costi)', value: chf(r.totals.result), strong: true },
          ].map((k) => (
            <div key={k.label} style={{ border: '1px solid var(--doc-line, #e5e7eb)', borderRadius: '5px', padding: '2.5mm 3mm' }}>
              <div style={{ fontSize: '7pt', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--doc-ink-muted, #6b7280)' }}>{k.label}</div>
              <div style={{ fontSize: k.strong ? '12pt' : '11pt', fontWeight: 700, marginTop: '1mm' }}>{k.value}</div>
            </div>
          ))}
        </div>
        {r.drafts.length > 0 && (
          <div style={{ marginTop: '3mm', padding: '2.5mm 3mm', background: '#fffbeb', border: '1px solid #fde68a', borderRadius: '5px', fontSize: '8pt' }}>
            <strong>Fatture in bozza (non ancora emesse):</strong> {r.drafts.length} per {chf(r.totals.draft)} — non incluse nel fatturato.
          </div>
        )}

        {/* 2. Registro fatture emesse */}
        <SectionTitle note="Documenti emessi nel periodo, ordinati per numero. Le bozze sono elencate a parte (sezione 3).">
          2. Registro fatture emesse
        </SectionTitle>
        <table>
          <thead>
            <tr>
              <th style={th}>N°</th>
              <th style={th}>Data</th>
              <th style={th}>Scadenza</th>
              <th style={th}>Cliente</th>
              <th style={th}>Opera</th>
              <th style={thR}>Imponibile</th>
              <th style={thR}>IVA %</th>
              <th style={thR}>IVA</th>
              <th style={thR}>Totale</th>
              <th style={th}>Stato</th>
              <th style={th}>Incasso</th>
            </tr>
          </thead>
          <tbody>
            {r.issued.length === 0 && (
              <tr><td style={td} colSpan={11}><em>Nessuna fattura emessa nel periodo.</em></td></tr>
            )}
            {r.issued.map((inv) => (
              <tr key={inv.id}>
                <td style={{ ...td, fontFamily: 'monospace' }}>{inv.invoiceNumber}</td>
                <td style={td}>{formatDate(inv.issueDate)}</td>
                <td style={td}>{inv.dueDate ? formatDate(inv.dueDate) : '—'}</td>
                <td style={td}>{inv.project.client.name}</td>
                <td style={td}>{inv.project.referenceCode ?? inv.project.name}</td>
                <td style={tdR}>{chf(inv.subtotal)}</td>
                <td style={tdR}>{inv.taxRate}%</td>
                <td style={tdR}>{chf(inv.taxAmount)}</td>
                <td style={{ ...tdR, fontWeight: 600 }}>{chf(inv.total)}</td>
                <td style={td}>{invoiceStatusLabel[inv.status] ?? inv.status}</td>
                <td style={td}>{inv.paidAt ? formatDate(inv.paidAt) : '—'}</td>
              </tr>
            ))}
          </tbody>
          {r.issued.length > 0 && (
            <tfoot>
              <tr>
                <td style={tfootTd} colSpan={5}>Totale ({r.issued.length} fatture)</td>
                <td style={tfootTdR}>{chf(r.totals.issuedNet)}</td>
                <td style={tfootTdR}>—</td>
                <td style={tfootTdR}>{chf(r.totals.vat)}</td>
                <td style={tfootTdR}>{chf(r.totals.issued)}</td>
                <td style={tfootTd} colSpan={2}></td>
              </tr>
            </tfoot>
          )}
        </table>

        {/* 3. Bozze */}
        {r.drafts.length > 0 && (
          <>
            <SectionTitle note="Documenti preparati ma non ancora emessi al cliente: esclusi da ricavi e IVA.">
              3. Fatture in bozza (non emesse)
            </SectionTitle>
            <table>
              <thead>
                <tr>
                  <th style={th}>N°</th><th style={th}>Data</th><th style={th}>Cliente</th>
                  <th style={th}>Opera</th><th style={thR}>Totale</th>
                </tr>
              </thead>
              <tbody>
                {r.drafts.map((d) => (
                  <tr key={d.id}>
                    <td style={{ ...td, fontFamily: 'monospace' }}>{d.invoiceNumber}</td>
                    <td style={td}>{formatDate(d.issueDate)}</td>
                    <td style={td}>{d.project.client.name}</td>
                    <td style={td}>{d.project.referenceCode ?? d.project.name}</td>
                    <td style={tdR}>{chf(d.total)}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr><td style={tfootTd} colSpan={4}>Totale bozze</td><td style={tfootTdR}>{chf(r.totals.draft)}</td></tr>
              </tfoot>
            </table>
          </>
        )}

        {/* 4. Incassi */}
        <SectionTitle note="Pagamenti effettivamente ricevuti nel periodo (base cassa).">
          4. Incassi del periodo
        </SectionTitle>
        <table>
          <thead>
            <tr>
              <th style={th}>Data</th><th style={th}>Fattura</th><th style={th}>Cliente</th>
              <th style={th}>Note</th><th style={thR}>Importo</th>
            </tr>
          </thead>
          <tbody>
            {r.payments.length === 0 && (
              <tr><td style={td} colSpan={5}><em>Nessun incasso nel periodo.</em></td></tr>
            )}
            {r.payments.map((p) => (
              <tr key={p.id}>
                <td style={td}>{formatDate(p.paidAt)}</td>
                <td style={{ ...td, fontFamily: 'monospace' }}>{p.invoice.invoiceNumber}</td>
                <td style={td}>{p.invoice.project.client.name}</td>
                <td style={td}>{p.notes ?? '—'}</td>
                <td style={{ ...tdR, fontWeight: 600 }}>{chf(p.amount)}</td>
              </tr>
            ))}
          </tbody>
          {r.payments.length > 0 && (
            <tfoot>
              <tr><td style={tfootTd} colSpan={4}>Totale incassato</td><td style={tfootTdR}>{chf(r.totals.cashed)}</td></tr>
            </tfoot>
          )}
        </table>

        {/* 5. Partite aperte */}
        <SectionTitle note="Crediti verso clienti aperti alla data di generazione, indipendentemente dal periodo selezionato.">
          5. Partite aperte (crediti verso clienti)
        </SectionTitle>
        <div className="acc-block" style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '2mm', marginBottom: '3mm' }}>
          {[
            { label: 'Non scaduto', value: r.aging.current },
            { label: 'Scaduto 1–30 gg', value: r.aging.d1_30 },
            { label: 'Scaduto 31–60 gg', value: r.aging.d31_60 },
            { label: 'Scaduto oltre 60 gg', value: r.aging.d60plus },
          ].map((a) => (
            <div key={a.label} style={{ border: '1px solid var(--doc-line, #e5e7eb)', borderRadius: '5px', padding: '2mm 2.5mm' }}>
              <div style={{ fontSize: '6.5pt', textTransform: 'uppercase', color: 'var(--doc-ink-muted, #6b7280)' }}>{a.label}</div>
              <div style={{ fontSize: '10pt', fontWeight: 700, marginTop: '0.5mm' }}>{chf(a.value)}</div>
            </div>
          ))}
        </div>
        <table>
          <thead>
            <tr>
              <th style={th}>N°</th><th style={th}>Data</th><th style={th}>Scadenza</th><th style={th}>Cliente</th>
              <th style={thR}>Totale</th><th style={thR}>Incassato</th><th style={thR}>Residuo</th><th style={thR}>gg ritardo</th>
            </tr>
          </thead>
          <tbody>
            {r.receivables.length === 0 && (
              <tr><td style={td} colSpan={8}><em>Nessuna partita aperta.</em></td></tr>
            )}
            {r.receivables.map(({ invoice: inv, paid, residuo, daysOverdue }) => (
              <tr key={inv.id}>
                <td style={{ ...td, fontFamily: 'monospace' }}>{inv.invoiceNumber}</td>
                <td style={td}>{formatDate(inv.issueDate)}</td>
                <td style={td}>{inv.dueDate ? formatDate(inv.dueDate) : '—'}</td>
                <td style={td}>{inv.project.client.name}</td>
                <td style={tdR}>{chf(inv.total)}</td>
                <td style={tdR}>{chf(paid)}</td>
                <td style={{ ...tdR, fontWeight: 600 }}>{chf(residuo)}</td>
                <td style={{ ...tdR, color: daysOverdue > 0 ? '#b91c1c' : 'inherit' }}>{daysOverdue > 0 ? daysOverdue : '—'}</td>
              </tr>
            ))}
          </tbody>
          {r.receivables.length > 0 && (
            <tfoot>
              <tr>
                <td style={tfootTd} colSpan={6}>Totale da incassare</td>
                <td style={tfootTdR}>{chf(r.totals.receivable)}</td>
                <td style={tfootTd}></td>
              </tr>
            </tfoot>
          )}
        </table>

        {/* 6. Costi */}
        <SectionTitle note="Spese registrate nel periodo. Gli importi in EUR sono convertiti in CHF al cambio memorizzato sulla spesa.">
          6. Registro costi
        </SectionTitle>
        <table>
          <thead>
            <tr>
              <th style={th}>Data</th><th style={th}>Fornitore</th><th style={th}>Descrizione</th>
              <th style={th}>Tipo</th><th style={th}>Opera</th><th style={th}>Stato</th><th style={thR}>Importo CHF</th>
            </tr>
          </thead>
          <tbody>
            {r.expenses.length === 0 && (
              <tr><td style={td} colSpan={7}><em>Nessuna spesa registrata nel periodo.</em></td></tr>
            )}
            {r.expenses.map((e) => (
              <tr key={e.id}>
                <td style={td}>{formatDate(e.date)}</td>
                <td style={td}>{e.supplier?.name ?? '—'}</td>
                <td style={td}>{e.description}</td>
                <td style={td}>{expenseTypeLabel[e.expenseType] ?? e.expenseType}</td>
                <td style={td}>{e.project?.referenceCode ?? '—'}</td>
                <td style={td}>{e.paymentStatus === 'PAID' ? 'Pagata' : 'Da pagare'}</td>
                <td style={tdR}>
                  {chf(e.amountChf ?? e.amount)}
                  {e.currency !== 'CHF' && (
                    <span style={{ color: 'var(--doc-ink-muted, #6b7280)', fontSize: '6.5pt' }}> ({e.currency} {e.amount.toFixed(2)})</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
          {r.expenses.length > 0 && (
            <tfoot>
              <tr><td style={tfootTd} colSpan={6}>Totale costi</td><td style={tfootTdR}>{chf(r.totals.expenses)}</td></tr>
            </tfoot>
          )}
        </table>
        {Object.keys(r.expensesByType).length > 0 && (
          <div style={{ marginTop: '2mm', fontSize: '7.5pt', color: 'var(--doc-ink-muted, #6b7280)' }}>
            Ripartizione per tipo:{' '}
            {Object.entries(r.expensesByType)
              .map(([k, v]) => `${expenseTypeLabel[k] ?? k} ${chf(v.total)} (${v.count})`)
              .join(' · ')}
          </div>
        )}

        {/* 7. Manodopera */}
        <SectionTitle note="Ore approvate nel periodo e compensi effettivamente versati agli operai.">
          7. Costo manodopera
        </SectionTitle>
        <div className="acc-block" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '3mm' }}>
          {[
            { label: 'Ore approvate', value: `${r.totals.totalHours.toFixed(2)} h` },
            { label: 'Costo manodopera (maturato)', value: chf(r.totals.laborCost) },
            { label: 'Compensi versati nel periodo', value: chf(r.totals.workerPaid) },
          ].map((k) => (
            <div key={k.label} style={{ border: '1px solid var(--doc-line, #e5e7eb)', borderRadius: '5px', padding: '2.5mm 3mm' }}>
              <div style={{ fontSize: '7pt', textTransform: 'uppercase', color: 'var(--doc-ink-muted, #6b7280)' }}>{k.label}</div>
              <div style={{ fontSize: '11pt', fontWeight: 700, marginTop: '1mm' }}>{k.value}</div>
            </div>
          ))}
        </div>
        {r.workerPayments.length > 0 && (
          <table style={{ marginTop: '3mm' }}>
            <thead>
              <tr><th style={th}>Data</th><th style={th}>Operaio</th><th style={th}>Metodo</th><th style={thR}>Importo</th></tr>
            </thead>
            <tbody>
              {r.workerPayments.map((p) => (
                <tr key={p.id}>
                  <td style={td}>{formatDate(p.paidAt)}</td>
                  <td style={td}>{p.userName}</td>
                  <td style={td}>{p.method ?? '—'}</td>
                  <td style={tdR}>{chf(p.amount)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        {/* 8. Note metodologiche */}
        <SectionTitle>8. Note metodologiche</SectionTitle>
        <div className="acc-block" style={{ border: '1px solid var(--doc-line, #e5e7eb)', borderRadius: '5px', padding: '3mm 4mm', fontSize: '8pt', lineHeight: 1.6 }}>
          <ul style={{ margin: 0, paddingLeft: '4mm' }}>
            <li>Il <strong>fatturato</strong> comprende le fatture con stato Emessa, Incassata o Scaduta, per <strong>data di emissione</strong>. Le bozze sono escluse.</li>
            <li>L&apos;<strong>incassato</strong> considera i pagamenti registrati per data di incasso (base cassa).</li>
            <li>Le <strong>partite aperte</strong> sono calcolate alla data di generazione del documento, su tutte le fatture non ancora saldate.</li>
            <li>Importi in valuta estera convertiti in CHF al cambio memorizzato su ogni spesa.</li>
            <li>
              <strong>Regime IVA:</strong>{' '}
              {allZeroVat
                ? 'tutte le fatture del periodo sono state emesse senza IVA (aliquota 0%).'
                : 'nel periodo sono presenti fatture con aliquote IVA diverse — vedere la colonna IVA %.'}
            </li>
          </ul>

          <div style={{ marginTop: '3mm', paddingTop: '2mm', borderTop: '1px solid var(--doc-line, #e5e7eb)' }}>
            <strong>Cifra d&apos;affari {r.vatThreshold.year} (anno civile):</strong> {chf(r.vatThreshold.yearTurnover)} — pari al {thresholdPct.toFixed(1)}% della soglia di CHF 100&apos;000.00 prevista per l&apos;assoggettamento IVA.
            {thresholdPct >= 70 && (
              <span style={{ color: '#b45309' }}> Si segnala l&apos;avvicinamento alla soglia, da valutare con il consulente fiscale.</span>
            )}
          </div>

          {(r.expenses.length === 0 || r.workerPayments.length === 0) && (
            <div style={{ marginTop: '3mm', padding: '2.5mm 3mm', background: '#fffbeb', border: '1px solid #fde68a', borderRadius: '5px' }}>
              <strong>Dati incompleti — da completare:</strong>
              <ul style={{ margin: '1mm 0 0', paddingLeft: '4mm' }}>
                {r.expenses.length === 0 && <li>Nessuna spesa registrata nel periodo: i costi indicati non riflettono ancora i costi effettivi.</li>}
                {r.workerPayments.length === 0 && r.totals.totalHours > 0 && (
                  <li>Ore di lavoro approvate ({r.totals.totalHours.toFixed(2)} h) senza compensi registrati nel periodo.</li>
                )}
              </ul>
            </div>
          )}
        </div>

        {/* Footer */}
        <div style={{ marginTop: '5mm', paddingTop: '3mm', borderTop: '1px solid var(--doc-line, #e5e7eb)', display: 'flex', justifyContent: 'space-between', fontSize: '7pt', color: 'var(--doc-ink-subtle, #9ca3af)' }}>
          <span>{c?.name ?? 'Zanetti Office'} · Rapporto contabile {periodLabel(fromStr)} — {periodLabel(toStr)}</span>
          <span>Generato il {formatDateTime(r.generatedAt)}</span>
        </div>
      </div>
    </div>
  )
}
