import 'dotenv/config'
import { createClient } from '@libsql/client'

const db = createClient({ url: process.env.DATABASE_URL, authToken: process.env.DATABASE_AUTH_TOKEN })

const HOURS_TABLE = `Dettaglio ore lavorate:
08.06.2026 — 7,5 h
09.06.2026 — 10,5 h
10.06.2026 — 17,5 h
11.06.2026 — 9,5 h
13.06.2026 — 6,5 h
20.06.2026 — 5,5 h
26.06.2026 — 4,5 h
04.07.2026 — 7,5 h
06.07.2026 — 8,5 h
07.07.2026 — 7,5 h
08.07.2026 — 8,5 h
10.07.2026 — 9,5 h
Totale ore lavoro: 103 h`

async function main() {
  const quoteRes = await db.execute(`SELECT id, clientNotes FROM quotes WHERE quoteNumber = 'PRE-2026-032'`)
  if (quoteRes.rows.length === 0) throw new Error('Quote PRE-2026-032 not found')
  const quote = quoteRes.rows[0]

  const invRes = await db.execute(`SELECT id, notes FROM invoices WHERE invoiceNumber = 'INV-2026-010'`)
  if (invRes.rows.length === 0) throw new Error('Invoice INV-2026-010 not found')
  const invoice = invRes.rows[0]

  // 1. Simplify the "Ore di lavoro" quote item description
  await db.execute({
    sql: `UPDATE quote_items SET description = ? WHERE quoteId = ? AND description LIKE 'Ore di lavoro%'`,
    args: ['Ore di lavoro (manodopera)', quote.id],
  })

  // 2. Append hours table to quote.clientNotes
  const newClientNotes = quote.clientNotes ? `${quote.clientNotes}\n\n${HOURS_TABLE}` : HOURS_TABLE
  await db.execute({
    sql: `UPDATE quotes SET clientNotes = ? WHERE id = ?`,
    args: [newClientNotes, quote.id],
  })

  // 3. Set hours table as invoice.notes
  const newInvoiceNotes = invoice.notes ? `${invoice.notes}\n\n${HOURS_TABLE}` : HOURS_TABLE
  await db.execute({
    sql: `UPDATE invoices SET notes = ? WHERE id = ?`,
    args: [newInvoiceNotes, invoice.id],
  })

  console.log('✓ Quote item description updated')
  console.log('✓ Quote clientNotes updated')
  console.log('✓ Invoice notes updated')
}

main().catch((e) => { console.error(e); process.exit(1) })
