require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@libsql/client');
const client = createClient({ url: process.env.DATABASE_URL, authToken: process.env.DATABASE_AUTH_TOKEN });
const now = new Date().toISOString();
const Q = 'cmobzgzsh0003y0ukbly36k3q';

async function run() {

  // 1. APERTURA: rasatura description
  await client.execute({ sql: 'UPDATE quote_items SET description=?, updatedAt=? WHERE id=?', args: [
    "Aggrappante, rasatura con cola e rete e stabilitura sulla parete oggetto dell'intervento",
    now, '9acf289c-9802-4a6b-8e2e-07b44174ee24'
  ]});
  console.log('1. Apertura rasatura OK');

  // 2. CORRIDOIO D'INGRESSO: 170->145, rasatura->aggrappante
  await client.execute({ sql: 'UPDATE quote_items SET unitCost=145, unitPrice=145, totalCost=2175, totalPrice=2175, sourceNote=?, updatedAt=? WHERE id=?', args: [
    'CHF 145/m² = doppia lastra + isolazione lana di roccia + manodopera. (Base CHF 95/m² materiale + CHF 50/m² manodopera)',
    now, '40a521ce-a05d-468a-b06f-8b2c57a4ca83'
  ]});
  await client.execute({ sql: 'UPDATE quote_items SET description=?, updatedAt=? WHERE id=?', args: [
    'Aggrappante e stabilitura sulla superficie di cartongesso',
    now, 'cd174994-c108-409b-b441-455fed215652'
  ]});
  console.log('2. Corridoio Ingresso OK');

  // 3. STANZA PADRONALE -> NUOVO CORRIDOIO INTERNO
  await client.execute({ sql: "UPDATE quote_items SET section='Nuovo Corridoio Interno', updatedAt=? WHERE quoteId=? AND section='Stanza Padronale'", args: [now, Q] });
  await client.execute({ sql: 'UPDATE quote_items SET description=?, updatedAt=? WHERE id=?', args: [
    'NUOVO CORRIDOIO INTERNO', now, '6c322bd0-0fa5-467d-956c-7d836e81d13a'
  ]});
  // Merge rasatura (1000+900 -> 1900)
  await client.execute({ sql: 'UPDATE quote_items SET description=?, unitCost=1900, unitPrice=1900, totalCost=1900, totalPrice=1900, updatedAt=? WHERE id=?', args: [
    'Aggrappante e stabilitura sulle superfici di cartongesso del corridoio interno',
    now, 'e058623e-2f72-45e6-9a2a-a3836a254061'
  ]});
  await client.execute({ sql: 'DELETE FROM quote_items WHERE id=?', args: ['f1c5280e-6c97-4f4b-90fe-fe806568919e'] });
  // Merge porte (qty 1 -> 2, total 750 -> 1500)
  await client.execute({ sql: 'UPDATE quote_items SET quantity=2, totalCost=1500, totalPrice=1500, updatedAt=? WHERE id=?', args: [
    now, '5eacd773-73f7-4469-acba-ebb719e4e992'
  ]});
  await client.execute({ sql: 'DELETE FROM quote_items WHERE id=?', args: ['dc949fb5-e3a5-4758-a6cf-90946c742ca8'] });
  console.log('3. Nuovo Corridoio Interno OK');

  // 4. BAGNO: remove intonaco area box doccia
  await client.execute({ sql: 'UPDATE quote_items SET description=?, updatedAt=? WHERE id=?', args: [
    'Muratura – smontaggio fisico, rimozione e smaltimento vasca e accessori esistenti; passaggio conduit e cassette elettriche; impermeabilizzazione box doccia; aggrappante su piastrelle restanti; rasatura in stabilitura (malta fine)',
    now, '49224bb5-d1b2-4de9-8a65-2046b4cd9a17'
  ]});
  console.log('4. Bagno muratura OK');

  // 5. BAGNO NUOVO
  await client.execute({ sql: 'UPDATE quote_items SET description=?, unitCost=4900, unitPrice=4900, totalCost=4900, totalPrice=4900, updatedAt=? WHERE id=?', args: [
    'Muratura bagno nuovo: base pareti, WC e doccia, rimozione parquet, creazione pavimento in 3 livelli, passaggi idraulici ed elettrici, intonaco, impermeabilizzazione',
    now, '73a12d32-feaa-4e60-8757-82e9b8165bb1'
  ]});
  await client.execute({ sql: 'UPDATE quote_items SET description=?, updatedAt=? WHERE id=?', args: [
    'Parete in cartongesso 12 m² doppia lastra con isolazione',
    now, 'afd1c175-8150-46ee-9036-20be6fd309eb'
  ]});
  await client.execute({ sql: 'UPDATE quote_items SET description=?, unitCost=1200, unitPrice=1200, totalCost=1200, totalPrice=1200, updatedAt=? WHERE id=?', args: [
    'Aggrappante e stabilitura sulle pareti interne ed esterne del bagno (superfici oggetto di intervento)',
    now, '88cefdb3-55fd-4e04-80ea-916703b5791b'
  ]});
  await client.execute({ sql: 'UPDATE quote_items SET description=?, updatedAt=? WHERE id=?', args: [
    'Pavimenti e rivestimenti bagno nuovo — piastrella 60×60 (fornitura e posa inclusa)',
    now, '4af441a0-416c-40d9-8470-eb863f18483c'
  ]});
  console.log('5. Bagno Nuovo OK');

  // 6. IMPIANTO ELETTRICO: 5 notes -> 1
  const unifiedNote = "ESCLUSO – Non sono inclusi nel presente preventivo: corpi illuminanti (lampadari, plafoniere, faretti, strisce LED); citofono/videocitofono; predisposizione cavi rete dati e TV (CAT6/coassiale). L'adeguamento dell'impianto di terra e l'eventuale upgrade della potenza di ingresso sono da verificare in loco e, se necessari, saranno oggetto di offerta aggiuntiva separata.";
  await client.execute({ sql: 'UPDATE quote_items SET description=?, updatedAt=? WHERE id=?', args: [unifiedNote, now, 'ecc06cda-1219-4752-83b4-58fea870bd9e'] });
  await client.execute({ sql: 'DELETE FROM quote_items WHERE id IN (?,?,?,?)', args: [
    'ebb7980f-dfee-4b22-9bdb-426c44a37a75',
    '31745e0d-a6f5-4de1-91cc-9dedb840daa2',
    'e3ed2ae2-34be-49c5-a542-4dbf06b37ae3',
    '9a2ef004-09a4-427d-8fc5-b638441e3396'
  ]});
  console.log('6. Impianto elettrico notes unified OK');

  // 7. clientNotes: rejunte -> stucco
  const { rows } = await client.execute({ sql: 'SELECT clientNotes FROM quotes WHERE id=?', args: [Q] });
  const newCN = rows[0].clientNotes.replace('rejunte', 'stucco');
  await client.execute({ sql: 'UPDATE quotes SET clientNotes=?, updatedAt=? WHERE id=?', args: [newCN, now, Q] });
  console.log('7. clientNotes stucco OK');

  // 8. paymentTerms
  const newPT = "• 30% all'accettazione del preventivo\n• 40% a metà lavori (prima della posa di pavimenti e rivestimenti)\n• 30% al completamento dei lavori\n\nPagamento entro 30 giorni dalla data fattura. In caso di ritardo si applicano interessi di mora del 5% annuo.";
  await client.execute({ sql: 'UPDATE company_settings SET paymentTerms=?', args: [newPT] });
  console.log('8. paymentTerms OK');

  // 9. Total: -375 (CI 2550->2175), BN muratura -600 (5500->4900), BN aggrappante +600 (600->1200) = net -375
  const newTotal = 79512.85 - 375;
  await client.execute({ sql: 'UPDATE quotes SET total=?, subtotalCost=?, subtotalClient=?, updatedAt=? WHERE id=?',
    args: [newTotal, newTotal, newTotal, now, Q] });
  console.log('9. Total:', newTotal.toFixed(2));
  console.log('Done.');
}
run().catch(e => { console.error(e.message); process.exit(1); });
