require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@libsql/client');
const { randomUUID } = require('crypto');

const client = createClient({ url: process.env.DATABASE_URL, authToken: process.env.DATABASE_AUTH_TOKEN });
const now = new Date().toISOString();
const uid = () => randomUUID();

// IDs to keep (Ballestra real data)
const KEEP_QUOTE = 'cmobzgzsh0003y0ukbly36k3q';
const KEEP_PROJECT = 'cmobzgzlk0001y0ukb3hkjyih';
const KEEP_CLIENT = 'cmobzgzjc0000y0uk328aizqj';

async function run() {
  console.log('=== 1. CLEANUP ===');

  // Delete in cascade order
  await client.execute('DELETE FROM invoice_payments');
  await client.execute('DELETE FROM invoice_items');
  await client.execute('DELETE FROM invoices');
  await client.execute('DELETE FROM financial_transactions');
  await client.execute(`DELETE FROM expenses WHERE projectId != '${KEEP_PROJECT}' OR projectId IS NULL`);
  await client.execute(`DELETE FROM quote_items WHERE quoteId != '${KEEP_QUOTE}'`);
  await client.execute(`DELETE FROM quotes WHERE id != '${KEEP_QUOTE}'`);
  await client.execute('DELETE FROM documents WHERE projectId IS NOT NULL AND projectId != \'' + KEEP_PROJECT + '\'');
  await client.execute(`DELETE FROM projects WHERE id != '${KEEP_PROJECT}'`);
  await client.execute(`DELETE FROM clients WHERE id != '${KEEP_CLIENT}'`);
  await client.execute('DELETE FROM suppliers');
  console.log('Cleanup done.');

  // Reset document sequences
  await client.execute("UPDATE document_sequences SET lastNumber=13 WHERE type='QUOTE' AND year=2026");
  await client.execute("DELETE FROM document_sequences WHERE type='INVOICE'");
  await client.execute("INSERT OR IGNORE INTO document_sequences (id,type,year,lastNumber) VALUES ('" + uid() + "','INVOICE',2026,0)");
  console.log('Sequences reset.');

  // ─── TEST USER ──────────────────────────────────────────────────────────────
  console.log('\n=== 2. TEST USER ===');
  const testUserId = uid();
  await client.execute({
    sql: `INSERT OR REPLACE INTO users (id,email,name,passwordHash,role,createdAt,updatedAt)
          VALUES (?,?,?,?,?,?,?)`,
    args: [testUserId, 'teste@zanettiedili.ch', 'Utente Test', '$2b$10$.7ezb5pkhoPC5mYdykBt/OApaglylpMxXJYWG/aeZ9RiirrYexkGm', 'MANAGER', now, now]
  });
  console.log('Test user: teste@zanettiedili.ch / Teste2026!');

  // ─── SUPPLIERS ──────────────────────────────────────────────────────────────
  console.log('\n=== 3. SUPPLIERS ===');
  const suppliers = [
    [uid(), 'Sanitec Ticino SA', 'Via Industria 12, Taverne', '+41 91 942 10 20', 'info@sanitec-ti.ch'],
    [uid(), 'Elettro Lugano Sagl', 'Via Besso 14, Lugano', '+41 91 971 33 44', 'elettro@lugano.ch'],
    [uid(), 'Ceramiche Menotti & Figli', 'Via Cantonale 88, Manno', '+41 91 610 55 60', 'menotti@ceramiche.ch'],
    [uid(), 'Hornbach Lugano', 'Via Industria 4, Grancia', '+41 91 960 20 20', null],
    [uid(), 'Inerti Sigirino SA', 'Sigirino, 6998', '+41 91 608 11 22', 'info@inerti.ch'],
    [uid(), 'Bauhaus Lugano', 'Via Serafino Balestra 17, Lugano', '+41 91 913 60 00', null],
  ];
  for (const [id, name, address, phone, email] of suppliers) {
    await client.execute({ sql: 'INSERT INTO suppliers (id,name,address,phone,email,createdAt,updatedAt) VALUES (?,?,?,?,?,?,?)',
      args: [id, name, address, phone, email, now, now] });
  }
  console.log('Suppliers created:', suppliers.length);

  // ─── CLIENTS ────────────────────────────────────────────────────────────────
  console.log('\n=== 4. CLIENTS ===');
  const cliFerrari = uid(), cliTicinese = uid(), cliBonfiglio = uid(), cliTreValli = uid();
  const clients = [
    [cliFerrari,   'Marco Ferrari',              'Via Pessina 12',         '6900', 'Lugano',    '+41 79 321 44 55', 'marco.ferrari@gmail.com'],
    [cliTicinese,  'Immobiliare Ticinese SA',    'Via Cattedrale 4',       '6900', 'Lugano',    '+41 91 923 10 00', 'info@imm-ticinese.ch'],
    [cliBonfiglio, 'Studio Arch. Bonfiglio',     'Piazza Cioccaro 2',      '6900', 'Lugano',    '+41 91 922 88 33', 'bonfiglio@architettura.ch'],
    [cliTreValli,  'Cantiere Tre Valli Sagl',    'Via Vallemaggia 8',      '6600', 'Locarno',   '+41 91 751 22 11', 'info@trevalli.ch'],
  ];
  for (const [id, name, address, cap, city, phone, email] of clients) {
    await client.execute({ sql: 'INSERT INTO clients (id,name,address,postalCode,city,phone,email,createdAt,updatedAt) VALUES (?,?,?,?,?,?,?,?,?)',
      args: [id, name, address, cap, city, phone, email, now, now] });
  }
  console.log('Clients created:', clients.length);

  // ─── PROJECTS ───────────────────────────────────────────────────────────────
  console.log('\n=== 5. PROJECTS ===');
  const prjFerrari = uid(), prjTicinese = uid(), prjBonfiglio = uid(), prjTreValli = uid();
  const projects = [
    [prjFerrari,   'Ristrutturazione cucina e bagno',      'Via Pessina 12, Lugano',          cliFerrari,   'IN_PROGRESS', 'Appartamento 2° piano. Cliente esigente — sopralluogo fatto 10/04/2026.'],
    [prjTicinese,  'Posa pavimenti uffici — Palazzo Nord', 'Via Cattedrale 4, Lugano',         cliTicinese,  'COMPLETED',   '3 piani uffici, 420m² pavimento laminato. Completato aprile 2026.'],
    [prjBonfiglio, 'Rifacimento facciata + intonaco',      'Piazza Cioccaro 2, Lugano',        cliBonfiglio, 'PLANNED',     'Ponteggio previsto settembre 2026. Attendere ok permesso comunale.'],
    [prjTreValli,  'Impianto elettrico + cartongesso',     'Via Vallemaggia 8, Locarno',       cliTreValli,  'IN_PROGRESS', 'Cantiere avviato maggio 2026.'],
  ];
  for (const [id, name, address, clientId, status, desc] of projects) {
    await client.execute({ sql: 'INSERT INTO projects (id,name,address,clientId,status,description,createdAt,updatedAt) VALUES (?,?,?,?,?,?,?,?)',
      args: [id, name, address, clientId, status, desc, now, now] });
  }
  console.log('Projects created:', projects.length);

  // ─── QUOTES ─────────────────────────────────────────────────────────────────
  console.log('\n=== 6. QUOTES ===');

  const insertQuote = async (number, projectId, status, version, total, clientNotes, internalNotes, sentAt = null, approvedAt = null) => {
    const id = uid();
    await client.execute({
      sql: `INSERT INTO quotes (id,quoteNumber,version,projectId,type,status,marginPercent,subtotalCost,subtotalClient,taxRate,taxAmount,total,clientNotes,internalNotes,sentAt,approvedAt,createdAt,updatedAt)
            VALUES (?,?,?,?,'DETAILED',?,15,?,?,0,0,?,?,?,?,?,?,?)`,
      args: [id, number, version, projectId, status, total * 0.87, total, total, clientNotes, internalNotes, sentAt, approvedAt, now, now]
    });
    return id;
  };

  const baseNotes = "Condizioni di pagamento:\n• 30% all'accettazione del preventivo\n• 40% a metà lavori\n• 30% al completamento dei lavori\n\nPagamento entro 30 giorni dalla data fattura.";

  // PRE-2026-014: Ferrari DRAFT
  const q014 = await insertQuote('PRE-2026-014', prjFerrari, 'DRAFT', 1, 18500, baseNotes, 'Margine 15%. Da definire materiali cucina.');
  // PRE-2026-015: Ferrari SENT (v2 clone)
  const q015 = await insertQuote('PRE-2026-015', prjFerrari, 'SENT', 2, 19200, baseNotes, 'Revisione prezzi cucina. Inviato 28/04/2026.', now);
  // PRE-2026-016: Ticinese APPROVED
  const q016 = await insertQuote('PRE-2026-016', prjTicinese, 'APPROVED', 1, 42800, baseNotes, 'Approvato direttore tecnico Ticinese SA.', now, now);
  // PRE-2026-017: Ticinese INVOICED
  const q017 = await insertQuote('PRE-2026-017', prjTicinese, 'INVOICED', 1, 12600, baseNotes, 'Lavori extra non previsti — corridoio piano 3.', now, now);
  // PRE-2026-018: Bonfiglio DRAFT
  const q018 = await insertQuote('PRE-2026-018', prjBonfiglio, 'DRAFT', 1, 38000, baseNotes, 'Preventivo preliminare soggetto a sopralluogo definitivo.', null);
  // PRE-2026-019: Tre Valli SENT
  const q019 = await insertQuote('PRE-2026-019', prjTreValli, 'SENT', 1, 22400, baseNotes, null, now);
  console.log('Quotes created: PRE-2026-014 to 019');

  // Add a few items to PRE-2026-014 for realism
  const itemsQ014 = [
    ['SECTION', 'Cucina', 0, 'CUCINA E BAGNO', null, null, null, null],
    ['ITEM', 'Cucina', 1, 'Demolizione cucina esistente e smaltimento', 'corpo', 1, 1200, 1380],
    ['ITEM', 'Cucina', 2, 'Piastrelatura cucina 18 m² (fornitura e posa)', 'm²', 18, 135, 155.25],
    ['ITEM', 'Cucina', 3, 'Cucina componibile 280 cm (montaggio incluso)', 'pz', 1, 2800, 3220],
    ['ITEM', 'Cucina', 4, 'Piano cottura a induzione 60 cm', 'pz', 1, 550, 632.5],
    ['ITEM', 'Cucina', 5, 'Forno ventilato da incasso', 'pz', 1, 480, 552],
    ['ITEM', 'Cucina', 6, 'Lavello inox 2 vasche + miscelatore', 'pz', 1, 320, 368],
    ['ITEM', 'Cucina', 7, 'Montaggio cucina e posa elettrodomestici', 'corpo', 1, 900, 1035],
    ['SECTION', 'Bagno', 8, 'BAGNO', null, null, null, null],
    ['ITEM', 'Bagno', 9, 'Piastrelatura bagno 12 m² (fornitura e posa)', 'm²', 12, 145, 166.75],
    ['ITEM', 'Bagno', 10, 'Sanitario WC sospeso completo', 'pz', 1, 850, 977.5],
    ['ITEM', 'Bagno', 11, 'Mobile lavabo con rubinetteria', 'pz', 1, 620, 713],
    ['ITEM', 'Bagno', 12, 'Box doccia 80×90 cm', 'pz', 1, 680, 782],
    ['ITEM', 'Bagno', 13, 'Montaggio sanitari e accessori', 'corpo', 1, 1100, 1265],
  ];
  for (const [type, section, order, desc, unit, qty, cost, price] of itemsQ014) {
    await client.execute({
      sql: `INSERT INTO quote_items (id,quoteId,itemType,section,sortOrder,description,unit,quantity,unitCost,unitPrice,totalCost,totalPrice,createdAt,updatedAt)
            VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
      args: [uid(), q014, type, section, order, desc, unit, qty, cost, price,
             qty && cost ? qty*cost : null, qty && price ? qty*price : null, now, now]
    });
  }
  console.log('Items added to PRE-2026-014');

  // ─── INVOICES ───────────────────────────────────────────────────────────────
  console.log('\n=== 7. INVOICES ===');

  const insertInvoice = async (number, projectId, quoteId, status, total, paidAt = null) => {
    const id = uid();
    await client.execute({
      sql: `INSERT INTO invoices (id,invoiceNumber,projectId,quoteId,status,subtotal,taxRate,taxAmount,total,notes,paidAt,createdAt,updatedAt)
            VALUES (?,?,?,?,?,?,0,0,?,?,?,?,?)`,
      args: [id, number, projectId, quoteId, status, total, total,
             "Pagamento entro 30 giorni. IBAN CH47 0900 0000 1647 7640 1", paidAt, now, now]
    });
    await client.execute({
      sql: `INSERT INTO invoice_items (id,invoiceId,description,quantity,unitPrice,total,createdAt,updatedAt)
            VALUES (?,?,?,1,?,?,?,?)`,
      args: [uid(), id, 'Acconto 30% — ' + number, total, total, now, now]
    });
    return id;
  };

  const inv016 = await insertInvoice('INV-2026-001', prjTicinese, q016, 'SENT', 12840);
  const inv017 = await insertInvoice('INV-2026-002', prjTicinese, q017, 'PAID', 12600, now);
  const inv019 = await insertInvoice('INV-2026-003', prjTreValli, q019, 'DRAFT', 6720);
  console.log('Invoices created: INV-2026-001 to 003');

  // ─── EXPENSES ───────────────────────────────────────────────────────────────
  console.log('\n=== 8. EXPENSES ===');
  const expenses = [
    [prjFerrari,   'Piastrelle cucina e bagno — Ceramiche Menotti', 2200, 'CHF', null],
    [prjFerrari,   'Cucina componibile + elettrodomestici — IKEA', 3280, 'CHF', null],
    [prjFerrari,   'Carburante sopralluogo', 45, 'CHF', null],
    [prjTicinese,  'Parquet laminato 420m² — Bauhaus', 8400, 'CHF', null],
    [prjTicinese,  'Colla e accessori posa parquet', 980, 'CHF', null],
    [prjTicinese,  'Smaltimento materiali demolizione', 650, 'CHF', null],
    [prjBonfiglio, 'Sopralluogo e rilievi facciata', 180, 'CHF', null],
    [prjTreValli,  'Materiale elettrico — Elettro Lugano', 3200, 'CHF', null],
    [prjTreValli,  'Cartongesso e materiali gessatura', 1850, 'CHF', null],
    [null,         'Noleggio furgone mensile maggio', 680, 'CHF', null],
    [null,         'Carburante — aprile 2026', 320, 'CHF', null],
    [null,         'Utensili e attrezzatura varia', 490, 'CHF', null],
  ];
  const today = new Date().toISOString().split('T')[0];
  for (const [projectId, desc, amount, currency] of expenses) {
    await client.execute({
      sql: 'INSERT INTO expenses (id,projectId,description,amount,amountChf,currency,date,paymentStatus,createdAt,updatedAt) VALUES (?,?,?,?,?,?,?,?,?,?)',
      args: [uid(), projectId, desc, amount, amount, currency, today, 'PAID', now, now]
    });
  }
  console.log('Expenses created:', expenses.length);

  // ─── UPDATE DOCUMENT SEQUENCE ────────────────────────────────────────────────
  await client.execute("UPDATE document_sequences SET lastNumber=19 WHERE type='QUOTE' AND year=2026");
  await client.execute("UPDATE document_sequences SET lastNumber=3 WHERE type='INVOICE' AND year=2026");
  console.log('Sequences updated: QUOTE=19, INVOICE=3');

  console.log('\n=== DONE ===');
  console.log('Test user: teste@zanettiedili.ch / Teste2026!');
  console.log('Quotes: PRE-2026-013 (Ballestra, real) + PRE-2026-014..019 (demo)');
}

run().catch(e => { console.error(e.message); process.exit(1); });
