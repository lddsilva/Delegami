import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import { prisma } from '@/lib/db'
import { formatDate, formatCurrency } from '@/lib/utils'
import { PrintButton } from '@/components/ui/print-button'
import { getWorkerProfile, getWorkerLedger, getWorkerPayments } from '@/modules/workers/queries'
import { getWorkLogs } from '@/modules/work-logs/queries'

export async function generateMetadata({
  params,
}: {
  params: Promise<{ userId: string }>
}): Promise<Metadata> {
  const { userId } = await params
  const worker = await getWorkerProfile(userId)
  if (!worker) return { title: 'Rapportino' }
  return { title: `Rapportino - ${worker.name}` }
}

const statusLabel: Record<string, string> = {
  DRAFT: 'Bozza',
  SUBMITTED: 'In verifica',
  APPROVED: 'Approvato',
}

function workLogAmount(log: { hours: number; hourlyRate?: number | null; amountOverride?: number | null }) {
  if (log.amountOverride != null) return log.amountOverride
  return (log.hours ?? 0) * (log.hourlyRate ?? 0)
}

export default async function WorkerReportPrintPage({
  params,
  searchParams,
}: {
  params: Promise<{ userId: string }>
  searchParams: Promise<{ from?: string; to?: string; soloOre?: string }>
}) {
  const { userId } = await params
  const sp = await searchParams
  const from = sp.from ? new Date(`${sp.from}T00:00:00`) : undefined
  const to = sp.to ? new Date(`${sp.to}T23:59:59`) : undefined
  const soloOre = sp.soloOre === '1'

  const [worker, company, ledger, payments, { logs }] = await Promise.all([
    getWorkerProfile(userId),
    prisma.companySettings.findFirst(),
    getWorkerLedger(userId),
    getWorkerPayments(userId),
    getWorkLogs({ userId, from, to }),
  ])
  if (!worker) notFound()

  const sortedLogs = [...logs].sort((a, b) => new Date(a.workDate).getTime() - new Date(b.workDate).getTime())
  const totalHours = sortedLogs.reduce((sum, l) => sum + (l.hours ?? 0), 0)
  const moneyCols = soloOre ? 0 : 2

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
          .wr-doc {
            padding: 0 !important; margin: 0 !important;
            max-width: none !important; box-shadow: none !important;
            font-size: 8pt !important;
          }
          .wr-doc * { font-size: inherit; }
          table { page-break-inside: auto; border-collapse: collapse; width: 100%; }
          tr { page-break-inside: avoid; page-break-after: auto; }
          thead { display: table-header-group; }
          .no-print { display: none !important; }
          .wr-signature { break-inside: avoid; }
        }
      `}</style>

      {/* Toolbar — hidden on print */}
      <div className="no-print max-w-[210mm] mx-auto mb-4 flex items-center justify-between gap-3 flex-wrap">
        <a href={`/rapportini/${userId}`} className="text-sm text-gray-600 hover:text-blue-600">← Torna alla scheda operaio</a>
        <form method="get" className="flex items-end gap-2 flex-wrap">
          <label className="flex flex-col text-xs text-gray-500">Dal
            <input type="date" name="from" defaultValue={sp.from ?? ''} className="rounded-md border border-gray-300 px-2 py-1 text-sm" />
          </label>
          <label className="flex flex-col text-xs text-gray-500">Al
            <input type="date" name="to" defaultValue={sp.to ?? ''} className="rounded-md border border-gray-300 px-2 py-1 text-sm" />
          </label>
          <label className="flex items-center gap-1.5 text-xs text-gray-600 pb-1.5">
            <input type="checkbox" name="soloOre" value="1" defaultChecked={soloOre} className="accent-blue-600" /> Solo ore (agenzia)
          </label>
          <button type="submit" className="rounded-md bg-gray-100 border border-gray-300 px-3 py-1.5 text-sm hover:bg-gray-200">Aggiorna</button>
        </form>
        <PrintButton />
      </div>

      {/* Document */}
      <div
        className="wr-doc bg-white max-w-[210mm] mx-auto shadow-lg print:shadow-none"
        style={{ padding: '10mm 14mm', fontFamily: "'Helvetica Neue', Arial, sans-serif", fontSize: '9.5pt' }}
      >
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '5mm', paddingBottom: '4mm', borderBottom: '2px solid var(--doc-brand)' }}>
          <div>
            <div style={{ fontSize: '15pt', fontWeight: 700, color: 'var(--doc-brand)' }}>{company?.name ?? 'Delegami'}</div>
            <div style={{ fontSize: '8pt', color: 'var(--doc-ink-muted)', marginTop: '4px', lineHeight: 1.5 }}>
              {company?.address && (
                <div>
                  <div>{company.address}</div>
                  {(company.postalCode || company.city) && <div>{company.postalCode} {company.city}</div>}
                </div>
              )}
              {company?.phone && <div>Tel: {company.phone}</div>}
            </div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: '16pt', fontWeight: 700, color: 'var(--doc-brand)' }}>Rapporto ore</div>
            <div style={{ fontSize: '8pt', color: 'var(--doc-ink-muted)', marginTop: '4px', lineHeight: 1.6 }}>
              <div>
                {from && to
                  ? <>Periodo {formatDate(from)} — {formatDate(to)}</>
                  : from
                    ? <>Dal {formatDate(from)}</>
                    : to
                      ? <>Fino al {formatDate(to)}</>
                      : <>Storico completo</>}
              </div>
              <div>Generato il {formatDate(new Date())}</div>
            </div>
          </div>
        </div>

        {/* Worker card */}
        <div style={{ border: '1px solid var(--doc-line)', borderRadius: '6px', padding: '3mm 4mm', marginBottom: '4mm' }}>
          <div style={{ fontSize: '7pt', textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--doc-ink-muted)', marginBottom: '4px' }}>Operaio</div>
          <div style={{ fontSize: '11pt', fontWeight: 600, color: 'var(--doc-ink)' }}>{worker.name}</div>
          {worker.identityNumber && (
            <div style={{ color: 'var(--doc-ink-strong)', fontSize: '8.5pt', marginTop: '2px' }}>N. identità / matricola: {worker.identityNumber}</div>
          )}
          <div style={{ color: 'var(--doc-ink-strong)', fontSize: '8.5pt', marginTop: '2px' }}>
            {worker.phone && <span>{worker.phone}</span>}
            {!soloOre && worker.phone && worker.hourlyRate != null && <span> · </span>}
            {!soloOre && worker.hourlyRate != null && <span>Tariffa attuale: {formatCurrency(worker.hourlyRate)}/h</span>}
          </div>
        </div>

        {/* Hours table */}
        <div>
          <div style={{ fontSize: '11pt', fontWeight: 700, color: 'var(--doc-brand)', marginBottom: '4mm', borderBottom: '1px solid var(--doc-line)', paddingBottom: '2mm' }}>Ore lavorate</div>
          {sortedLogs.length === 0 ? (
            <p style={{ color: 'var(--doc-ink-subtle)', fontSize: '9pt' }}>Nessun rapportino nel periodo selezionato.</p>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '4mm', fontSize: '9pt' }}>
              <thead>
                <tr style={{ background: 'var(--doc-fill)', borderBottom: '2px solid var(--doc-line)' }}>
                  <th style={{ textAlign: 'left', padding: '3px 6px', fontSize: '7.5pt', textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--doc-ink-muted)' }}>Data</th>
                  <th style={{ textAlign: 'left', padding: '3px 6px', fontSize: '7.5pt', color: 'var(--doc-ink-muted)' }}>Luogo / Opera</th>
                  <th style={{ padding: '3px 6px', textAlign: 'right', fontSize: '7.5pt', color: 'var(--doc-ink-muted)' }}>Ore</th>
                  {!soloOre && <th style={{ padding: '3px 6px', textAlign: 'right', fontSize: '7.5pt', color: 'var(--doc-ink-muted)' }}>Tariffa</th>}
                  {!soloOre && <th style={{ padding: '3px 6px', textAlign: 'right', fontSize: '7.5pt', color: 'var(--doc-ink-muted)' }}>Valore</th>}
                  <th style={{ padding: '3px 6px', textAlign: 'right', fontSize: '7.5pt', color: 'var(--doc-ink-muted)' }}>Stato</th>
                </tr>
              </thead>
              <tbody>
                {sortedLogs.map((log) => {
                  const place = log.location || log.project?.name
                  return (
                    <tr key={log.id} style={{ borderBottom: '1px solid var(--doc-fill)' }}>
                      <td style={{ padding: '4px 6px' }}>{formatDate(log.workDate)}</td>
                      <td style={{ padding: '4px 6px', color: place ? 'var(--doc-ink)' : 'var(--doc-ink-subtle)' }}>{place ?? '—'}</td>
                      <td style={{ padding: '4px 6px', textAlign: 'right' }}>{log.hours.toLocaleString('it-CH')} h</td>
                      {!soloOre && (
                        <td style={{ padding: '4px 6px', textAlign: 'right', color: 'var(--doc-ink-muted)' }}>
                          {log.amountOverride != null ? 'fisso' : log.hourlyRate != null ? `${formatCurrency(log.hourlyRate)}/h` : '—'}
                        </td>
                      )}
                      {!soloOre && <td style={{ padding: '4px 6px', textAlign: 'right', fontWeight: 600 }}>{formatCurrency(workLogAmount(log))}</td>}
                      <td style={{ padding: '4px 6px', textAlign: 'right', color: 'var(--doc-ink-muted)', fontSize: '8pt' }}>{statusLabel[log.status] ?? log.status}</td>
                    </tr>
                  )
                })}
              </tbody>
              <tfoot>
                <tr style={{ borderTop: '2px solid var(--doc-line)', fontWeight: 700 }}>
                  <td style={{ padding: '5px 6px' }} colSpan={2}>Totale</td>
                  <td style={{ padding: '5px 6px', textAlign: 'right' }}>{totalHours.toLocaleString('it-CH')} h</td>
                  <td colSpan={1 + moneyCols} />
                </tr>
              </tfoot>
            </table>
          )}
        </div>

        {/* Compenso totals — hidden in the agency (hours-only) version */}
        {!soloOre && (
          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <div style={{ width: '70mm', border: '1px solid var(--doc-line)', borderRadius: '6px', overflow: 'hidden', fontSize: '9pt' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 8px', background: 'var(--doc-accent-soft)', color: 'var(--doc-accent)' }}>
                <span>Maturato (approvato)</span><span>{formatCurrency(ledger.earned)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 8px', background: 'var(--doc-fill)', color: 'var(--doc-ink-strong)', fontSize: '8.5pt' }}>
                <span>Pagato</span><span>{formatCurrency(ledger.paid)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 8px', background: 'var(--doc-brand)', color: 'white', fontWeight: 700, fontSize: '11pt' }}>
                <span>Saldo</span><span>{formatCurrency(ledger.balance)}</span>
              </div>
            </div>
          </div>
        )}

        {/* Payments — hidden in the agency (hours-only) version */}
        {!soloOre && payments.length > 0 && (
          <div style={{ marginTop: '6mm' }}>
            <div style={{ fontSize: '11pt', fontWeight: 700, color: 'var(--doc-brand)', marginBottom: '3mm', borderBottom: '1px solid var(--doc-line)', paddingBottom: '2mm' }}>Pagamenti ricevuti</div>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '9pt' }}>
              <thead>
                <tr style={{ background: 'var(--doc-fill)', borderBottom: '2px solid var(--doc-line)' }}>
                  <th style={{ textAlign: 'left', padding: '3px 6px', fontSize: '7.5pt', color: 'var(--doc-ink-muted)' }}>Data</th>
                  <th style={{ textAlign: 'left', padding: '3px 6px', fontSize: '7.5pt', color: 'var(--doc-ink-muted)' }}>Metodo</th>
                  <th style={{ padding: '3px 6px', textAlign: 'right', fontSize: '7.5pt', color: 'var(--doc-ink-muted)' }}>Importo</th>
                </tr>
              </thead>
              <tbody>
                {payments.map((p) => (
                  <tr key={p.id} style={{ borderBottom: '1px solid var(--doc-fill)' }}>
                    <td style={{ padding: '4px 6px' }}>{formatDate(p.paidAt)}</td>
                    <td style={{ padding: '4px 6px', color: 'var(--doc-ink-muted)' }}>{p.method ?? '—'}</td>
                    <td style={{ padding: '4px 6px', textAlign: 'right', fontWeight: 600 }}>{formatCurrency(p.amount)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Signature block — bulletin d'heures for the agency / client */}
        <div className="wr-signature" style={{ marginTop: '14mm', display: 'flex', justifyContent: 'space-between', gap: '10mm' }}>
          <div style={{ flex: 1 }}>
            <div style={{ borderTop: '1px solid var(--doc-ink)', paddingTop: '2mm', fontSize: '8pt', color: 'var(--doc-ink-strong)' }}>
              Firma operaio<br />{worker.name}
            </div>
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ borderTop: '1px solid var(--doc-ink)', paddingTop: '2mm', fontSize: '8pt', color: 'var(--doc-ink-strong)' }}>
              Firma responsabile<br />{company?.worksDirector || company?.name || 'Delegami'}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
