import { NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { getAccountingReport } from '@/modules/accounting/queries'

/**
 * CSV export of the accounting report — the bookkeeper usually prefers importing
 * the invoice/expense journals into their own software instead of retyping the PDF.
 * Not a CRUD API route: it renders an existing report in a second format.
 */

function csvCell(v: string | number | null | undefined) {
  if (v == null) return ''
  const s = String(v)
  return /[";\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s
}

function csvRow(cells: (string | number | null | undefined)[]) {
  return cells.map(csvCell).join(';')
}

function d(date: Date | null | undefined) {
  return date ? new Date(date).toISOString().slice(0, 10) : ''
}

function n(value: number) {
  return value.toFixed(2)
}

export async function GET(request: Request) {
  const session = await getSession()
  if (!session) return new NextResponse('Non autorizzato', { status: 401 })

  const { searchParams } = new URL(request.url)
  const now = new Date()
  const from = searchParams.get('from')
    ? new Date(`${searchParams.get('from')}T00:00:00`)
    : new Date(now.getFullYear(), 0, 1)
  const to = searchParams.get('to')
    ? new Date(`${searchParams.get('to')}T23:59:59`)
    : new Date(now.getFullYear(), 11, 31, 23, 59, 59)

  const r = await getAccountingReport({ from, to })

  const lines: string[] = []
  lines.push(csvRow(['RAPPORTO CONTABILE']))
  lines.push(csvRow(['Periodo', d(from), d(to)]))
  lines.push(csvRow(['Generato il', r.generatedAt.toISOString()]))
  lines.push('')

  lines.push(csvRow(['FATTURE EMESSE']))
  lines.push(csvRow(['Numero', 'Data', 'Scadenza', 'Cliente', 'Opera', 'Imponibile', 'IVA %', 'IVA', 'Totale', 'Stato', 'Data incasso']))
  for (const i of r.issued) {
    lines.push(csvRow([
      i.invoiceNumber, d(i.issueDate), d(i.dueDate), i.project.client.name,
      i.project.referenceCode ?? i.project.name, n(i.subtotal), i.taxRate, n(i.taxAmount),
      n(i.total), i.status, d(i.paidAt),
    ]))
  }
  lines.push(csvRow(['Totale', '', '', '', '', n(r.totals.issuedNet), '', n(r.totals.vat), n(r.totals.issued)]))
  lines.push('')

  lines.push(csvRow(['INCASSI']))
  lines.push(csvRow(['Data', 'Fattura', 'Cliente', 'Note', 'Importo']))
  for (const p of r.payments) {
    lines.push(csvRow([d(p.paidAt), p.invoice.invoiceNumber, p.invoice.project.client.name, p.notes, n(p.amount)]))
  }
  lines.push(csvRow(['Totale', '', '', '', n(r.totals.cashed)]))
  lines.push('')

  lines.push(csvRow(['PARTITE APERTE']))
  lines.push(csvRow(['Numero', 'Data', 'Scadenza', 'Cliente', 'Totale', 'Incassato', 'Residuo', 'Giorni ritardo']))
  for (const { invoice, paid, residuo, daysOverdue } of r.receivables) {
    lines.push(csvRow([
      invoice.invoiceNumber, d(invoice.issueDate), d(invoice.dueDate), invoice.project.client.name,
      n(invoice.total), n(paid), n(residuo), daysOverdue > 0 ? daysOverdue : 0,
    ]))
  }
  lines.push(csvRow(['Totale', '', '', '', '', '', n(r.totals.receivable)]))
  lines.push('')

  lines.push(csvRow(['COSTI']))
  lines.push(csvRow(['Data', 'Fornitore', 'Descrizione', 'Tipo', 'Opera', 'Stato', 'Valuta', 'Importo originale', 'Importo CHF']))
  for (const e of r.expenses) {
    lines.push(csvRow([
      d(e.date), e.supplier?.name, e.description, e.expenseType, e.project?.referenceCode,
      e.paymentStatus, e.currency, n(e.amount), n(e.amountChf ?? e.amount),
    ]))
  }
  lines.push(csvRow(['Totale', '', '', '', '', '', '', '', n(r.totals.expenses)]))
  lines.push('')

  lines.push(csvRow(['MANODOPERA']))
  lines.push(csvRow(['Ore approvate', r.totals.totalHours.toFixed(2)]))
  lines.push(csvRow(['Costo manodopera maturato', n(r.totals.laborCost)]))
  lines.push(csvRow(['Compensi versati nel periodo', n(r.totals.workerPaid)]))

  // BOM keeps Excel from mangling accented characters on Windows.
  const csv = '﻿' + lines.join('\r\n')
  const filename = `rapporto-contabile_${d(from)}_${d(to)}.csv`

  return new NextResponse(csv, {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="${filename}"`,
    },
  })
}
