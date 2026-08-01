require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@libsql/client');
const { randomUUID } = require('crypto');

const client = createClient({ url: process.env.DATABASE_URL, authToken: process.env.DATABASE_AUTH_TOKEN });
const now = new Date().toISOString();

const Q013 = 'cmobzgzsh0003y0ukbly36k3q';
const PROJECT_ID = 'cmobzgzlk0001y0ukb3hkjyih';
const CLIENT_ID = 'cmobzgzjc0000y0uk328aizqj';

// ── New sortOrder map for PRE-2026-013 reorganisation ─────────────────────────
// Maps item ID → new sortOrder. Only items 0-64 need reordering.
const NEW_SORT = {
  // Stanze (was 31-32 → now 0-1)
  '0a5481b5-15cb-44a2-b23e-820847cc2ac7': 0,
  '808878ee-1cad-47ed-8340-4c21cb00d4cc': 1,
  // Apertura Corridoio-Soggiorno (was 33-37 → now 2-6)
  '98a7d4f8-0906-4024-942f-2f86c37127b4': 2,
  'b925e06a-f711-4988-ad06-8a0413d33311': 3,
  'ab1740fb-5ee4-49c6-af70-89e312410bd4': 4,
  '7a576663-1ff1-4da5-97d4-a0b53c627c49': 5,
  '9acf289c-9802-4a6b-8e2e-07b44174ee24': 6,
  // Corridoio d'Ingresso (was 38-40 → now 7-9)
  'f513e559-5c9d-4ac2-adaf-361b977f6072': 7,
  '40a521ce-a05d-468a-b06f-8b2c57a4ca83': 8,
  'cd174994-c108-409b-b441-455fed215652': 9,
  // Stanza Padronale (was 41-48 → now 10-17)
  '6c322bd0-0fa5-467d-956c-7d836e81d13a': 10,
  '5f5b0901-56b1-4b85-a410-f1cd6730e983': 11,
  '611b0945-4907-4e57-8048-cb52f04674b1': 12,
  'e058623e-2f72-45e6-9a2a-a3836a254061': 13,
  'f8cdd0f8-fd8e-4de4-a3ad-7a01e2990e65': 14,
  '5eacd773-73f7-4469-acba-ebb719e4e992': 15,
  'dc949fb5-e3a5-4758-a6cf-90946c742ca8': 16,
  'f1c5280e-6c97-4f4b-90fe-fe806568919e': 17,
  // Bagno Esistente (was 0-13 → now 18-31)
  'fbe85840-1000-42d9-aba6-7845366b7b69': 18,
  '49224bb5-d1b2-4de9-8a65-2046b4cd9a17': 19,
  'd88eb540-9025-4e3a-a39f-a668381dd880': 20,
  'adbf8715-5257-400f-ab88-39ae1a508dc9': 21,
  '9f75c692-0acf-4f66-839c-ffd8194cce15': 22,
  '38285e4e-4e71-453a-83f4-3a7ee7b6e83f': 23,
  'bef92ddb-4f5e-4a40-9561-5b58cd2cf76c': 24,
  'b77393ed-abc1-4d2a-b4e6-433ef965b07a': 25,
  '738b9eb9-ad20-44c3-adf9-b8175ed8d909': 26,
  'f46dc2cc-9dee-48ed-8f7b-d31d44c8e5ec': 27,
  '8959fa13-a475-4f7b-89bf-c6bcbcb33d3d': 28,
  '81beb125-abf1-45a6-a626-80a4573e6f38': 29,
  '89042a89-bebe-4c9b-81d1-6d1275a5fac7': 30,
  'cf98369d-8f9f-434c-a018-5ef642b6c765': 31,
  // Bagno Nuovo (was 49-64 → now 32-47)
  'a3364a93-f7de-47bf-855b-df962ed65a9a': 32,
  '73a12d32-feaa-4e60-8757-82e9b8165bb1': 33,
  'afd1c175-8150-46ee-9036-20be6fd309eb': 34,
  '20259558-48bb-4e78-87fa-2b991aa8e60c': 35,
  '88cefdb3-55fd-4e04-80ea-916703b5791b': 36,
  '5cddf258-c879-4cda-afba-c1e7e7c47d49': 37,
  'b5a007f0-7034-43a2-93c1-5f8f6825b297': 38,
  '0af21ca8-d1b2-4ef2-8f48-ea99b42602fb': 39,
  'ffeed3e4-5973-4812-9b32-b1efb85ca90e': 40,
  'bdd932e3-04bc-4d76-a456-6193e0e6c438': 41,
  'cf000ee4-c9ec-464f-93ae-9287549bcb4f': 42,
  '8cc4146a-9e11-45ff-896e-fc50088f56ec': 43,
  'e72b6b68-06e3-4a81-a46d-1da079d9ae09': 44,
  'bc168703-7bf5-4e2c-af3b-dc9360941137': 45,
  '4af441a0-416c-40d9-8470-eb863f18483c': 46,
  '553cab26-b71e-44b0-845f-676efbce4a95': 47,
  // Corridoio e Cucina (was 14-16 → now 48-50)
  '310f6097-b134-4ce1-a851-0716e639af46': 48,
  '7a129728-552c-45a1-9edf-f564a20e0dfc': 49,
  'dce27b3a-f845-4598-8a78-950b11887eb6': 50,
  // Cucina (was 17-30 → now 51-64)
  '74ad530d-497f-4f07-9352-26872435d069': 51,
  '0731d08d-3b23-4105-b4a3-79e6fc3b50bf': 52,
  'dec4a9cf-3e96-4d3d-b50f-eba2ac94bb59': 53,
  'a23da71e-ea8c-4ef8-8390-66c25e6adc5c': 54,
  'd358451e-2650-45d2-a1e4-682ad7c9b7ad': 55,
  'a6b41e65-9954-4fde-a674-00f73f2bb792': 56,
  '2dbbfa62-4f6d-4e93-81b9-6ff759b246ef': 57,
  'e1005faf-d627-4d0c-8084-220c826e0ba6': 58,
  '0e7071ca-b83c-4da4-9c97-3e9a977d4a97': 59,
  '7907704d-2ee2-439c-b187-eae8520a8e80': 60,
  '229394fb-3f44-495e-bafe-023bcc0b23fe': 61,
  'e1ca38fd-da94-4014-a591-f6db5cca8963': 62,
  '596a9b67-af4f-4f75-87bc-f70d4f317094': 63,
  '11b6a335-55a1-4f1d-9d1e-e0ff8a5f936e': 64,
  // sortOrders 65-88 stay unchanged (Pittura, IE, Varie)
};

const CLIENT_NOTES_SPLIT = `Il presente preventivo fa parte del progetto di ristrutturazione appartamento (rif. PRE-2026-013) suddiviso in 4 fasi esecutive.

Tutti i materiali forniti saranno presentati con almeno 2 modelli diversi. In caso di mancato accordo, il valore del materiale sarà detratto e il cliente provvederà autonomamente alla fornitura.

Condizioni di pagamento:
• 30% all'accettazione del preventivo
• 40% a metà lavori
• 30% al completamento dei lavori

Pagamento entro 30 giorni dalla data fattura. In caso di ritardo si applicano interessi di mora del 5% annuo.`;

function varie(quoteId, startSort) {
  return [
    { id: randomUUID(), quoteId, itemType: 'SECTION', section: 'Varie', sortOrder: startSort,
      description: 'VARIE', unit: null, quantity: null, unitCost: null, unitPrice: null,
      totalCost: null, totalPrice: null, marginPercent: null, sourceNote: null, sourceUrl: null },
    { id: randomUUID(), quoteId, itemType: 'NOTE', section: 'Varie', sortOrder: startSort + 1,
      description: 'Impianto idraulico ed eventuale domanda di costruzione: costi separati, non inclusi nel presente preventivo.',
      unit: null, quantity: null, unitCost: null, unitPrice: null,
      totalCost: null, totalPrice: null, marginPercent: null, sourceNote: null, sourceUrl: null },
    { id: randomUUID(), quoteId, itemType: 'ITEM', section: 'Varie', sortOrder: startSort + 2,
      description: 'Direzione lavori', unit: 'corpo', quantity: 1,
      unitCost: 0, unitPrice: 0, totalCost: 0, totalPrice: 0,
      marginPercent: null, sourceNote: null, sourceUrl: null },
  ];
}

async function insertItems(rows) {
  for (const r of rows) {
    await client.execute({
      sql: `INSERT INTO quote_items
        (id,quoteId,itemType,section,sortOrder,description,unit,quantity,unitCost,unitPrice,
         totalCost,totalPrice,marginPercent,sourceNote,sourceUrl,createdAt,updatedAt)
        VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
      args: [r.id, r.quoteId, r.itemType, r.section, r.sortOrder, r.description,
             r.unit ?? null, r.quantity ?? null, r.unitCost ?? null, r.unitPrice ?? null,
             r.totalCost ?? null, r.totalPrice ?? null, r.marginPercent ?? null,
             r.sourceNote ?? null, r.sourceUrl ?? null, now, now],
    });
  }
}

async function createQuote(quoteNumber, title, total, internalNotes, itemRows) {
  const id = randomUUID();
  await client.execute({
    sql: `INSERT INTO quotes
      (id,quoteNumber,version,projectId,type,status,marginPercent,subtotalCost,subtotalClient,
       taxRate,taxAmount,total,internalNotes,clientNotes,createdAt,updatedAt)
      VALUES (?,?,1,?,'QUOTE','DRAFT',0,?,?,0,0,?,?,?,?,?)`,
    args: [id, quoteNumber, PROJECT_ID, total, total, total, internalNotes, CLIENT_NOTES_SPLIT, now, now],
  });
  await insertItems(itemRows.map(r => ({ ...r, quoteId: id })));
  console.log(`  Created ${quoteNumber} "${title}" — CHF ${total.toFixed(2)} (${itemRows.length} items)`);
  return id;
}

async function main() {
  // ── 1. Fetch all items from PRE-2026-013 ──────────────────────────────────
  const { rows: items } = await client.execute(
    `SELECT * FROM quote_items WHERE quoteId=? ORDER BY sortOrder`,
    [Q013]
  );
  console.log(`Fetched ${items.length} items from PRE-2026-013`);

  // ── 2. Update prese T13: Feller CHF 54.10 → ABB CHF 22 ───────────────────
  const preseId = '3fd43418-0e67-40df-ae2a-aa47e6d1d1be';
  await client.execute({
    sql: `UPDATE quote_items SET unitCost=22, unitPrice=22, totalCost=616, totalPrice=616,
          description='Prese tipo 13 – fornitura',
          sourceNote='ABB Basic55 T13, presa tipo 13 standard CH – ~CHF 22/pz (alternativa qualità a Feller EDIZIOdue). Disponibile da Bauhaus, OBI, Jumbo. 28 pz: stanze 12, soggiorno 8, cucina 4, corridoio/ingresso 4.',
          sourceUrl=null, updatedAt=? WHERE id=?`,
    args: [now, preseId],
  });
  console.log('  Updated prese T13 → ABB CHF 22/pz, total CHF 616');

  // ── 3. Update manodopera: CHF 8500 → CHF 7500 (75h × CHF 100/h) ──────────
  const posaId = '43cbc768-65b2-4207-81ac-be3ed608059a';
  await client.execute({
    sql: `UPDATE quote_items SET unitCost=7500, unitPrice=7500, totalCost=7500, totalPrice=7500,
          sourceNote='Stesa cavi, connessioni quadro, montaggio prese/interruttori, cablaggio circuiti dedicati, collaudo interno. Stima ~75h × CHF 100/h. Tariffa elettricista certificato NIN Ticino: CHF 100–130/h (fonte: houzy.ch)',
          updatedAt=? WHERE id=?`,
    args: [now, posaId],
  });
  console.log('  Updated manodopera → CHF 7.500 (75h × CHF 100/h)');

  // ── 4. Update client data ─────────────────────────────────────────────────
  await client.execute({
    sql: `UPDATE clients SET name=?, address=?, postalCode=?, city=?, email=?, updatedAt=? WHERE id=?`,
    args: ['Comunione eredi fu Alda Martini', 'c/o Fiduciaria Dr. Aldo Ballestra, Via dei Castagni 3',
           '6962', 'Viganello', 'aldoballestra@bluewin.ch', now, CLIENT_ID],
  });
  console.log('  Updated client → Comunione eredi fu Alda Martini, Viganello');

  // ── 5. Reorganise sortOrders on PRE-2026-013 ─────────────────────────────
  // Pass 1: move items 0-64 out of the way (+500)
  await client.execute(`UPDATE quote_items SET sortOrder=sortOrder+500 WHERE quoteId=? AND sortOrder<=64`, [Q013]);
  // Pass 2: assign final sortOrders
  for (const [id, newSort] of Object.entries(NEW_SORT)) {
    await client.execute({
      sql: `UPDATE quote_items SET sortOrder=?, updatedAt=? WHERE id=? AND quoteId=?`,
      args: [newSort, now, id, Q013],
    });
  }
  console.log('  Reorganised section order on PRE-2026-013');

  // ── 6. Update PRE-2026-013 total and clientNotes/internalNotes ───────────
  // New total: original 80963.65 - (1514.80-616) prese - (8500-7500) posa
  const newTotal013 = 80963.65 - (1514.80 - 616) - 1000; // = 79064.85
  const internalNotes013 = `DOCUMENTO MASTER — suddiviso in 4 preventivi separati:
• PRE-2026-014: Fase 1 – Struttura e Demolizioni (CHF 18.590,00)
• PRE-2026-015: Fase 2 – Ristrutturazione Bagni (CHF 27.357,40)
• PRE-2026-016: Fase 3 – Cucina e Finiture (CHF 19.805,95)
• PRE-2026-017: Fase 4 – Impianto Elettrico (CHF 13.311,50)
• TOTALE: CHF 79.064,85

MARGINE APPLICATO: 0% (preventivo a prezzo di costo – margine da definire)

⚠️ VERIFICARE CON IDRAULICO (GC Termo-Idraulica, offerta N° 2026.05.002):
• Telaio Duofix: ESCLUSO dalla nostra fornitura WC (fornito da GC Termo-Idraulica)
• Montaggio WC e bidet: a carico GC Termo-Idraulica
• Smontaggio: il nostro item muratura bagno (CHF 2.000) include già lo smontaggio

NOTE OPERATIVE:
• WC entrambi i bagni: Geberit – vaso rimless + placca Sigma + copriwater (senza Duofix)
• Bidet bagno esistente: Duravit D-Code sospeso + rubinetteria Hansgrohe Logis
• Box doccia bagno esistente 120×80 cm, bagno nuovo 70×110 cm: acquisto locale Ticino
• Sistema doccia: Grohe / Hansgrohe o equivalente qualità media
• Lavastoviglie: modello da definire, verifica spazio cucina 307 cm
• Edilgroup CH Manno: +41 91 610 02 02 · Sanitas Troesch Mendrisio: Via Borromini 4
• Bagno Design Contone: +41 91 290 81 01
• Impianto elettrico: tracce incluse nelle rispettive sezioni muratura; IMPIANTO ELETTRICO copre la parte impiantistica
• Prese: ABB Basic55 T13 (qualità standard, budget); interruttori: Feller EDIZIOdue (mantenuti)
• Eletricista: tariffa CHF 100/h`;

  await client.execute({
    sql: `UPDATE quotes SET total=?, subtotalCost=?, subtotalClient=?, internalNotes=?, clientNotes=?, updatedAt=? WHERE id=?`,
    args: [newTotal013, newTotal013, newTotal013, internalNotes013, CLIENT_NOTES_SPLIT, now, Q013],
  });
  console.log(`  Updated PRE-2026-013 total → CHF ${newTotal013.toFixed(2)}`);

  // ── 7. Helper: build item rows for a new quote from source items ──────────
  function cloneItems(quoteId, sourceItems, sectionFilter, startSort = 0) {
    const filtered = sourceItems.filter(i => sectionFilter.includes(i.section));
    return filtered.map((src, idx) => ({
      id: randomUUID(), quoteId,
      itemType: src.itemType, section: src.section,
      sortOrder: startSort + idx,
      description: src.description, unit: src.unit, quantity: src.quantity,
      unitCost: src.unitCost, unitPrice: src.unitPrice,
      totalCost: src.totalCost, totalPrice: src.totalPrice,
      marginPercent: src.marginPercent, sourceNote: src.sourceNote, sourceUrl: src.sourceUrl,
    }));
  }

  // ── 8. PRE-2026-014: Fase 1 – Struttura e Demolizioni ─────────────────────
  const sections014 = ['Stanze', 'Apertura Corridoio – Soggiorno', "Corridoio d'Ingresso", 'Stanza Padronale'];
  const rows014 = cloneItems('TMP', items, sections014);
  const total014 = rows014.filter(r => r.itemType === 'ITEM').reduce((s, r) => s + (r.totalPrice || 0), 0);
  const allRows014 = [...rows014, ...varie('TMP', rows014.length)];
  await createQuote('PRE-2026-014', 'Fase 1 – Struttura e Demolizioni', total014,
    'Fase 1 del progetto di ristrutturazione appartamento Eredi Martini.\nIncluso: lavori strutturali, demolizioni, aperture, pareti in cartongesso, porte.\nSequenza esecutiva: prima di tutti gli altri lotti.',
    allRows014);

  // ── 9. PRE-2026-015: Fase 2 – Ristrutturazione Bagni ──────────────────────
  const sections015 = ['Bagno', 'Bagno Nuovo'];
  const rows015 = cloneItems('TMP', items, sections015);
  const total015 = rows015.filter(r => r.itemType === 'ITEM').reduce((s, r) => s + (r.totalPrice || 0), 0);
  const allRows015 = [...rows015, ...varie('TMP', rows015.length)];
  await createQuote('PRE-2026-015', 'Fase 2 – Ristrutturazione Bagni', total015,
    'Fase 2 del progetto di ristrutturazione appartamento Eredi Martini.\nIncluso: ristrutturazione bagno esistente + creazione bagno nuovo nella stanza padronale.\nNota: telaio Duofix WC e bidet forniti da GC Termo-Idraulica (offerta separata).',
    allRows015);

  // ── 10. PRE-2026-016: Fase 3 – Cucina e Finiture ─────────────────────────
  const sections016 = ['Corridoio e Cucina', 'Cucina', 'Pittura e Finitura'];
  const rows016 = cloneItems('TMP', items, sections016);
  const total016 = rows016.filter(r => r.itemType === 'ITEM').reduce((s, r) => s + (r.totalPrice || 0), 0);
  const allRows016 = [...rows016, ...varie('TMP', rows016.length)];
  await createQuote('PRE-2026-016', 'Fase 3 – Cucina e Finiture', total016,
    'Fase 3 del progetto di ristrutturazione appartamento Eredi Martini.\nIncluso: pavimentazione corridoio/cucina, cucina METOD 307cm, elettrodomestici, pittura appartamento, battiscopa.',
    allRows016);

  // ── 11. PRE-2026-017: Fase 4 – Impianto Elettrico ────────────────────────
  const sections017 = ['Impianto Elettrico'];
  const rows017raw = cloneItems('TMP', items, sections017);
  // Apply prese/manodopera corrections
  const rows017 = rows017raw.map(r => {
    if (r.description === 'Prese tipo 13 – fornitura') {
      return { ...r, unitCost: 22, unitPrice: 22, totalCost: 616, totalPrice: 616,
        sourceNote: 'ABB Basic55 T13 – ~CHF 22/pz. 28 pz distribuzione appartamento.',
        sourceUrl: null };
    }
    if (r.description === 'Posa impianto elettrico completo – manodopera') {
      return { ...r, unitCost: 7500, unitPrice: 7500, totalCost: 7500, totalPrice: 7500,
        sourceNote: 'Stima ~75h × CHF 100/h. Tariffa elettricista certificato NIN Ticino.' };
    }
    return r;
  });
  const total017 = rows017.filter(r => r.itemType === 'ITEM').reduce((s, r) => s + (r.totalPrice || 0), 0);
  // Varie for 017: no idraulico note, just direzione lavori
  const varie017 = [
    { id: randomUUID(), quoteId: 'TMP', itemType: 'SECTION', section: 'Varie',
      sortOrder: rows017.length, description: 'VARIE', unit: null, quantity: null,
      unitCost: null, unitPrice: null, totalCost: null, totalPrice: null,
      marginPercent: null, sourceNote: null, sourceUrl: null },
    { id: randomUUID(), quoteId: 'TMP', itemType: 'ITEM', section: 'Varie',
      sortOrder: rows017.length + 1, description: 'Direzione lavori', unit: 'corpo',
      quantity: 1, unitCost: 0, unitPrice: 0, totalCost: 0, totalPrice: 0,
      marginPercent: null, sourceNote: null, sourceUrl: null },
  ];
  const allRows017 = [...rows017, ...varie017];
  await createQuote('PRE-2026-017', 'Fase 4 – Impianto Elettrico', total017,
    'Fase 4 del progetto di ristrutturazione appartamento Eredi Martini.\nIncluso: quadro di distribuzione completo, cavi, prese, interruttori, posa e dichiarazione di conformità ESTI.\nPrese: ABB Basic55 T13. Tariffa manodopera: CHF 100/h.',
    allRows017);

  // ── 12. Update document sequence to 17 ───────────────────────────────────
  await client.execute(`UPDATE document_sequences SET lastNumber=17, updatedAt=? WHERE type='QUOTE' AND year=2026`, [now]);
  console.log('  Document sequence updated to 17');

  console.log('\n✅ Done.');
  console.log(`  PRE-2026-013 master: CHF ${newTotal013.toFixed(2)}`);
  console.log(`  PRE-2026-014 Struttura: CHF ${total014.toFixed(2)}`);
  console.log(`  PRE-2026-015 Bagni: CHF ${total015.toFixed(2)}`);
  console.log(`  PRE-2026-016 Cucina+Finiture: CHF ${total016.toFixed(2)}`);
  console.log(`  PRE-2026-017 Elettrico: CHF ${total017.toFixed(2)}`);
}

main().catch(e => { console.error(e.message); process.exit(1); });
