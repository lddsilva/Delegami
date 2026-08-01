require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@libsql/client');
const { randomUUID } = require('crypto');

const client = createClient({ url: process.env.DATABASE_URL, authToken: process.env.DATABASE_AUTH_TOKEN });
const now = new Date().toISOString();
const Q7 = 'cmobzgzsh0003y0ukbly36k3q'; // PRE-2026-013 v7

// ─── Sections/items to eliminate completely ───────────────────────────────────
const REMOVE_SECTIONS = [
  'Apertura Corridoio – Soggiorno',
  'Bagno Nuovo',
  'Cucina',
];

// ─── New clientNotes ──────────────────────────────────────────────────────────
const NEW_CLIENT_NOTES = `Tutti i materiali forniti saranno presentati con almeno 2 modelli diversi. I materiali saranno presentati e concordati per iscritto prima dell'inizio lavori. In caso di mancato accordo, il valore del materiale sarà detratto e il cliente provvederà autonomamente alla fornitura. Per pavimenti e rivestimenti: in caso di mancato accordo verrà detratto CHF 25/m² (restano inclusi stucco, silicone, colla e profili in alluminio). Qualora il cliente rifiuti entrambe le opzioni proposte e scelga materiale proprio, la manodopera potrà essere soggetta a revisione.

L'impianto elettrico non verrà rinnovato: il presente preventivo copre esclusivamente la sostituzione delle tubazioni incassate esistenti e il ripassaggio dei cavi attuali nei nuovi tubi corrugati.

Non incluso nel presente preventivo:
• Impianto idraulico: da concordare separatamente.
• Eventuale domanda di costruzione per lavori strutturali.
• Corpi illuminanti (lampadari, plafoniere, faretti), citofono/videocitofono, cavi rete dati e TV.
• Adeguamento impianto di terra ed eventuale upgrade potenza di ingresso: da verificare in loco; se necessari, oggetto di offerta separata.

N.B.: Eventuali opere supplementari verranno comunicate e approvate dalla committenza prima dell'esecuzione.`;

async function run() {
  // 1. Fetch v7 data
  const [qRes, itemsRes, csRes] = await Promise.all([
    client.execute({ sql: 'SELECT * FROM quotes WHERE id=?', args: [Q7] }),
    client.execute({ sql: 'SELECT * FROM quote_items WHERE quoteId=? ORDER BY sortOrder', args: [Q7] }),
    client.execute('SELECT paymentTerms FROM company_settings LIMIT 1'),
  ]);
  const v7 = qRes.rows[0];
  const v7Items = itemsRes.rows;
  console.log('v7 fetched:', v7Items.length, 'items');

  // 2. Build v8 item list — filter and transform
  const v8Items = [];
  let sortOrder = 0;

  for (const item of v7Items) {
    const sec = item.section || '';

    // Skip entire sections
    if (REMOVE_SECTIONS.includes(sec)) continue;

    // Impianto Elettrico: keep SECTION header only, replace all items with 1 flat item
    if (sec === 'Impianto Elettrico') {
      if (item.itemType === 'SECTION') {
        v8Items.push({ ...item, id: randomUUID(), sortOrder: sortOrder++ });
        // Add the single flat item right after the section header
        v8Items.push({
          id: randomUUID(), quoteId: 'V8_TMP', itemType: 'ITEM',
          section: 'Impianto Elettrico', sortOrder: sortOrder++,
          description: 'Impianto elettrico – sostituzione delle tubazioni incassate esistenti e ripassaggio dei cavi attuali nei nuovi tubi corrugati a parete e a pavimento',
          unit: 'corpo', quantity: 1, unitCost: 4000, unitPrice: 4000,
          totalCost: 4000, totalPrice: 4000, marginPercent: null,
          sourceNote: 'Non comprende nuovo quadro, nuove linee né nuovi circuiti. Lavoro eseguito sulle tubazioni esistenti.',
          sourceUrl: null, createdAt: now, updatedAt: now,
        });
      }
      // Skip all other items in IE (items, notes)
      continue;
    }

    // Stanze: update description to remove the armadio/nicchia part
    if (sec === 'Stanze' && item.itemType === 'ITEM' &&
        item.description && item.description.includes('rimozione armadio')) {
      v8Items.push({
        ...item, id: randomUUID(), sortOrder: sortOrder++,
        description: 'Muratura 3 stanze – tracce e installazione cassette elettriche',
        sourceNote: null,
        updatedAt: now,
      });
      continue;
    }

    // Bagno – WC: change from sospeso to pavimento, keep price CHF 550
    if (sec === 'Bagno' && item.itemType === 'ITEM' &&
        item.description && item.description.includes('Sanitario WC Geberit')) {
      v8Items.push({
        ...item, id: randomUUID(), sortOrder: sortOrder++,
        description: 'Sanitario WC a pavimento con cassetta monoblocco, copriwater (fornitura)',
        sourceNote: 'Vaso WC a pavimento qualità standard. Il telaio Duofix non è necessario per installazione a pavimento. Posa a cura di GC Termo-Idraulica.',
        sourceUrl: null, updatedAt: now,
      });
      continue;
    }

    // Bagno – Bidet: remove completely
    if (sec === 'Bagno' && item.itemType === 'ITEM' &&
        item.description && item.description.toLowerCase().includes('bidet')) {
      console.log('  Removed:', item.description, '(CHF', item.totalPrice, ')');
      continue;
    }

    // All other items: keep as-is with new ID and sortOrder
    v8Items.push({ ...item, id: randomUUID(), sortOrder: sortOrder++ });
  }

  // 3. Calculate new totals
  const subtotalClient = v8Items
    .filter(i => i.itemType === 'ITEM')
    .reduce((s, i) => s + (Number(i.totalPrice) || 0), 0);
  const subtotalCost = v8Items
    .filter(i => i.itemType === 'ITEM')
    .reduce((s, i) => s + (Number(i.totalCost) || 0), 0);
  const total = subtotalClient; // taxRate = 0

  console.log('v8 items:', v8Items.length, '| Total: CHF', total.toFixed(2));

  // 4. Update v7 in-place to v8 (same quoteNumber, avoids UNIQUE constraint)
  const v8Id = Q7; // same record, updated in-place
  await client.execute({
    sql: `UPDATE quotes SET version=8, status='DRAFT', subtotalCost=?, subtotalClient=?,
          taxRate=0, taxAmount=0, total=?, clientNotes=?, updatedAt=? WHERE id=?`,
    args: [subtotalCost, subtotalClient, total, NEW_CLIENT_NOTES, now, Q7]
  });
  // Delete all existing items and reinsert
  await client.execute({ sql: 'DELETE FROM quote_items WHERE quoteId=?', args: [Q7] });
  console.log('Quote updated to v8:', v7.quoteNumber, '| ID:', v8Id);

  // 5. Insert v8 items
  for (const item of v8Items) {
    await client.execute({
      sql: `INSERT INTO quote_items
        (id,quoteId,itemType,section,sortOrder,description,unit,quantity,unitCost,unitPrice,
         totalCost,totalPrice,marginPercent,sourceNote,sourceUrl,createdAt,updatedAt)
        VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
      args: [
        item.id, v8Id, item.itemType, item.section || null, item.sortOrder,
        item.description, item.unit || null, item.quantity || null,
        item.unitCost || null, item.unitPrice || null,
        item.totalCost || null, item.totalPrice || null,
        item.marginPercent || null, item.sourceNote || null, item.sourceUrl || null,
        now, now
      ]
    });
  }
  console.log('Items inserted:', v8Items.length);

  // 6. Create INV-2026-002 (30%)
  const inv30 = Math.round(total * 0.30 * 100) / 100;
  const invId = randomUUID();
  const dueDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
  const today = now.split('T')[0];

  // Update invoice sequence
  await client.execute("UPDATE document_sequences SET lastNumber=2 WHERE type='INVOICE' AND year=2026");

  await client.execute({
    sql: `INSERT INTO invoices
      (id,invoiceNumber,version,projectId,quoteId,status,issueDate,dueDate,subtotal,taxRate,taxAmount,total,notes,createdAt,updatedAt)
      VALUES (?,?,1,?,?,'DRAFT',?,?,?,0,0,?,?,?,?)`,
    args: [
      invId, 'INV-2026-002', v7.projectId, v8Id,
      today, dueDate, inv30, inv30,
      `Acconto 30% — Preventivo ${v7.quoteNumber} v8\nRistrutturazione appartamento — Via Bernardino Stazio 2, 3° piano, 6815 Massagno\n\nPagamento entro 30 giorni dalla data fattura. In caso di ritardo si applicano interessi di mora del 5% annuo.\n\nCoordinate bancarie: IBAN CH47 0900 0000 1647 7640 1\nIntestatario: Marcos Zanetti Filho`,
      now, now
    ]
  });

  // Add invoice item
  await client.execute({
    sql: `INSERT INTO invoice_items (id,invoiceId,description,quantity,unitPrice,total,createdAt,updatedAt) VALUES (?,?,?,1,?,?,?,?)`,
    args: [randomUUID(), invId, `Acconto 30% — Preventivo ${v7.quoteNumber} v8 (Ristrutturazione appartamento Via Bernardino Stazio 2, Massagno)`, inv30, inv30, now, now]
  });

  console.log('');
  console.log('=== DONE ===');
  console.log('Preventivo:', v7.quoteNumber, 'v8 | Total: CHF', total.toFixed(2));
  console.log('Fatura INV-2026-002 (30%): CHF', inv30.toFixed(2));
  console.log('Scadenza fatura:', dueDate);
  console.log('App URL: /quotes/' + v8Id);
}

run().catch(e => { console.error(e.message); process.exit(1); });
