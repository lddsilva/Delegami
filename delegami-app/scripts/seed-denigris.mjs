// Create Davide De Nigris + project + quote + invoice from Fattura 2026-001
import { createClient } from '@libsql/client'
import { config } from 'dotenv'
config({ path: '.env.local' })

const db = createClient({ url: process.env.DATABASE_URL, authToken: process.env.DATABASE_AUTH_TOKEN })
function uid() { return 'c' + Date.now().toString(36) + Math.random().toString(36).slice(2, 10) }

async function main() {
  const now = new Date().toISOString()

  // ── 1. Client ──────────────────────────────────────────────────────────────
  let existing = await db.execute({ sql: "SELECT id FROM clients WHERE name = 'Davide De Nigris'", args: [] })
  let clientId
  if (existing.rows.length > 0) {
    clientId = existing.rows[0].id
    console.log('✓ Client già presente:', clientId)
  } else {
    clientId = uid()
    await db.execute({
      sql: `INSERT INTO clients (id, name, address, city, postalCode, country, createdAt, updatedAt)
            VALUES (?,?,?,?,?,?,?,?)`,
      args: [clientId, 'Davide De Nigris', 'Via P. Lepori 11', 'Tesserete', '6950', 'CH', now, now],
    })
    console.log('✓ Client creato:', clientId)
  }

  // ── 2. Project ─────────────────────────────────────────────────────────────
  let projExist = await db.execute({ sql: "SELECT id FROM projects WHERE name = 'Sostituzione Trave Tetto – Tesserete'", args: [] })
  let projectId
  if (projExist.rows.length > 0) {
    projectId = projExist.rows[0].id
    console.log('✓ Opera già presente:', projectId)
  } else {
    projectId = uid()
    await db.execute({
      sql: `INSERT INTO projects (id, clientId, name, referenceCode, address, status, createdAt, updatedAt)
            VALUES (?,?,?,?,?,?,?,?)`,
      args: [projectId, clientId, 'Sostituzione Trave Tetto – Tesserete',
             'OBR-2026-002', 'Via P. Lepori 11, 6950 Tesserete', 'COMPLETED', now, now],
    })
    console.log('✓ Opera creata:', projectId)
  }

  // ── 3. Quote PRE-2026-001 ──────────────────────────────────────────────────
  let qExist = await db.execute({ sql: "SELECT id FROM quotes WHERE quoteNumber = 'PRE-2026-001'", args: [] })
  let quoteId
  if (qExist.rows.length > 0) {
    quoteId = qExist.rows[0].id
    console.log('✓ Preventivo già presente:', quoteId)
  } else {
    quoteId = uid()
    const sentAt = '2026-03-28T10:00:00.000Z'
    const approvedAt = '2026-03-30T10:00:00.000Z'
    await db.execute({
      sql: `INSERT INTO quotes (id, quoteNumber, version, projectId, type, status,
              marginPercent, subtotalCost, subtotalClient, taxRate, taxAmount, total,
              sentAt, approvedAt, paymentTerms, createdAt, updatedAt)
            VALUES (?,?,1,?,?,?,0,700,700,0,0,700,?,?,?,?,?)`,
      args: [quoteId, 'PRE-2026-001', projectId, 'DETAILED', 'INVOICED',
             sentAt, approvedAt,
             'Pagamento entro 5 giorni dalla data fattura',
             now, now],
    })
    // Seq update to avoid collisions
    await db.execute({
      sql: `INSERT OR REPLACE INTO document_sequences (id, type, year, lastNumber)
            VALUES (?, 'QUOTE', 2026, MAX(1, (SELECT COALESCE(lastNumber,0) FROM document_sequences WHERE type='QUOTE' AND year=2026)))`,
      args: [uid()],
    }).catch(() => {}) // ignore if sequence table doesn't support this
    // Quote item
    await db.execute({
      sql: `INSERT INTO quote_items (id, quoteId, itemType, sortOrder, description, unit,
              quantity, unitCost, unitPrice, totalCost, totalPrice, directPrice, hiddenFromClient,
              createdAt, updatedAt)
            VALUES (?,?,'ITEM',0,?,?,1,700,700,700,700,1,0,?,?)`,
      args: [uid(), quoteId,
             'Sostituzione trave tetto – Rimozione trave esistente e posa nuova trave in legno',
             'corpo', now, now],
    })
    console.log('✓ Preventivo PRE-2026-001 creato (INVOICED, sentAt+approvedAt)')
  }

  // ── 4. Invoice INV-2026-001 ────────────────────────────────────────────────
  let invExist = await db.execute({ sql: "SELECT id FROM invoices WHERE invoiceNumber = 'INV-2026-001'", args: [] })
  let invoiceId
  if (invExist.rows.length > 0) {
    invoiceId = invExist.rows[0].id
    console.log('✓ Fattura già presente:', invoiceId)
  } else {
    invoiceId = uid()
    const issueDate = '2026-04-01T00:00:00.000Z'
    const dueDate   = '2026-04-06T00:00:00.000Z'
    const paidAt    = '2026-04-05T00:00:00.000Z'
    await db.execute({
      sql: `INSERT INTO invoices (id, invoiceNumber, version, projectId, quoteId, status,
              issueDate, dueDate, subtotal, taxRate, taxAmount, total, paidAt, notes, createdAt, updatedAt)
            VALUES (?,?,1,?,?,'PAID',?,?,700,0,0,700,?,?,?,?)`,
      args: [invoiceId, 'INV-2026-001', projectId, quoteId,
             issueDate, dueDate, paidAt,
             'Bonifico bancario / TWINT / PostFinance',
             now, now],
    })
    // Invoice item
    await db.execute({
      sql: `INSERT INTO invoice_items (id, invoiceId, description, unit, quantity, unitPrice, total, createdAt, updatedAt)
            VALUES (?,?,?,?,1,700,700,?,?)`,
      args: [uid(), invoiceId,
             'Sostituzione trave tetto – Rimozione trave esistente e posa nuova trave in legno',
             'corpo', now, now],
    })
    // Payment record
    await db.execute({
      sql: `INSERT INTO invoice_payments (id, invoiceId, amount, paidAt, notes, createdAt)
            VALUES (?,?,700,?,?,?)`,
      args: [uid(), invoiceId, paidAt, 'Pagamento ricevuto (bonifico/TWINT/PostFinance)', now],
    })
    // Update document sequence so next INV-2026 starts from 003
    await db.execute({
      sql: `UPDATE document_sequences SET lastNumber = MAX(lastNumber, 1) WHERE type = 'INVOICE' AND year = 2026`,
      args: [],
    }).catch(() => {})
    console.log('✓ Fattura INV-2026-001 creata (PAID, CHF 700, 01.04.2026)')
    console.log('✓ Pagamento registrato: CHF 700 il 05.04.2026')
  }

  // ── 5. Update company settings ─────────────────────────────────────────────
  const settings = await db.execute({ sql: 'SELECT id FROM company_settings LIMIT 1', args: [] })
  if (settings.rows.length > 0) {
    await db.execute({
      sql: `UPDATE company_settings SET
              name = 'Zanetti Soluzioni Edili',
              address = 'Via Cantonale 1',
              city = 'Magliaso',
              postalCode = '6983',
              country = 'CH',
              phone = '+41 76 545 40 07',
              email = 'zanettisoluzioniedili@gmail.com',
              iban = 'CH47 0900 0000 1647 7640 1',
              paymentTerms = 'Pagamento entro 5 giorni dalla data fattura\nModalità: Bonifico bancario / TWINT / PostFinance\nIntestatario: Marcos Zanetti Filho',
              updatedAt = ?
            WHERE id = ?`,
      args: [now, settings.rows[0].id],
    })
    console.log('✓ Impostazioni azienda aggiornate (nome, IBAN, condizioni)')
  }

  console.log('\n✅ Tutto fatto!')
  console.log('   Cliente:    Davide De Nigris — Via P. Lepori 11, 6950 Tesserete')
  console.log('   Opera:      Sostituzione Trave Tetto – Tesserete (COMPLETED)')
  console.log('   Preventivo: PRE-2026-001 v1 — CHF 700 — INVOICED (inviato+approvato)')
  console.log('   Fattura:    INV-2026-001 — CHF 700 — PAID (01.04.2026, scad. 06.04.2026)')
}

main().catch(console.error).finally(() => db.close())
