require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@libsql/client');
const { randomUUID } = require('crypto');

const QUOTE_ID = 'cmobzgzsh0003y0ukbly36k3q';
const client = createClient({ url: process.env.DATABASE_URL, authToken: process.env.DATABASE_AUTH_TOKEN });
const now = new Date().toISOString();
const uid = () => randomUUID();

function sec(section, sortOrder, description) {
  return { id: uid(), quoteId: QUOTE_ID, itemType: 'SECTION', section, sortOrder, description, unit: null, quantity: null, unitCost: null, unitPrice: null, totalCost: null, totalPrice: null, marginPercent: null, sourceNote: null, sourceUrl: null };
}
function note(section, sortOrder, description) {
  return { id: uid(), quoteId: QUOTE_ID, itemType: 'NOTE', section, sortOrder, description, unit: null, quantity: null, unitCost: null, unitPrice: null, totalCost: null, totalPrice: null, marginPercent: null, sourceNote: null, sourceUrl: null };
}
function item(section, sortOrder, description, unit, quantity, unitCost, sourceNote = null, sourceUrl = null) {
  const t = Math.round(quantity * unitCost * 100) / 100;
  return { id: uid(), quoteId: QUOTE_ID, itemType: 'ITEM', section, sortOrder, description, unit, quantity, unitCost, unitPrice: unitCost, totalCost: t, totalPrice: t, marginPercent: null, sourceNote, sourceUrl };
}

// ─── Item list ────────────────────────────────────────────────────────────────
const B  = 'Bagno';
const CC = 'Corridoio e Cucina';
const CU = 'Cucina';
const ST = 'Stanze';
const AC = 'Apertura Corridoio – Soggiorno';
const CI = 'Corridoio d\'Ingresso';
const SP = 'Stanza Padronale';
const BN = 'Bagno Nuovo';
const PF = 'Pittura e Finitura';
const EL = 'Impianto Elettrico';
const VA = 'Varie';

const rows = [
  // ── BAGNO ──────────────────────────────────────────────────────────────────
  sec(B, 0, 'BAGNO – RISTRUTTURAZIONE'),
  item(B, 1,
    'Muratura – rimozione vasca e accessori esistenti, passaggio conduit e cassette elettriche, intonaco area box doccia (senza rimozione piastrelle esistenti), impermeabilizzazione box doccia, aggrappante su piastrelle restanti, rasatura in stabilitura (malta fine)',
    'corpo', 1, 2000),
  item(B, 2,
    'Piastrelatura bagno 25,04 m² (fornitura materiale e posa inclusa)',
    'm²', 25.04, 135,
    'Materiale CHF 35/m² (Bauhaus art. 28795195 – gres 60×60) + posa CHF 100/m²',
    'https://www.bauhaus.ch/it/p/piastrella-in-gres-porcellanato-tribeca-28795195'),
  item(B, 3,
    'Sanitario WC Geberit completo: telaio Duofix Sigma, vaso sospeso rimless, placca Sigma, copriwater',
    'pz', 1, 950,
    'Geberit Duofix Sigma art. 3612 348.000.000 ≈ CHF 397.80 + vaso rimless ≈ CHF 350 + placca Sigma ≈ CHF 100 + copriwater ≈ CHF 100. Prezzo indicativo Sanitas Troesch – confermare sconto professionale.',
    'https://shop.sanitastroesch.ch'),
  item(B, 4,
    'Mobile lavabo con cassetti, lavabo e rubinetteria (fornitura completa)',
    'pz', 1, 517,
    'IKEA ÄNGSJÖN + BACKSJÖN art. 195.211.23',
    'https://www.ikea.com/ch/it/p/aengsjoen-backsjoen-mobile-lavabo-cassetti-lavabo-misc-s19521123/'),
  item(B, 5,
    'Specchio con armadietto pensile 80 cm',
    'pz', 1, 259,
    'IKEA LETTAN art. 805.349.23',
    'https://www.ikea.com/ch/it/p/lettan-mobile-a-specchio-con-ante-effetto-specchio-vetro-a-specchio-80534923/'),
  item(B, 6,
    'Box doccia rettangolare 120×80 cm',
    'pz', 1, 500,
    'Acquisto locale Ticino (Sanitas Troesch o Bagno Design) – stima CHF 400–600'),
  item(B, 7,
    'Fornitura sistema doccia completo (colonna doccia, soffione, doccetta, miscelatore)',
    'pz', 1, 450,
    'Stima standard qualità media – Grohe / Hansgrohe o equivalente'),
  item(B, 8,
    'Installazione sistema doccia completo (collegamenti idraulici, fissaggio, regolazione)',
    'corpo', 1, 250),
  item(B, 9,
    'Fornitura piletta e sistema di scarico doccia (sifone, collegamenti, accessori)',
    'pz', 1, 120),
  item(B, 10,
    'Accessori bagno – fornitura standard (porta asciugamani, porta carta igienica, ganci)',
    'corpo', 1, 150),
  item(B, 11,
    'Montaggio sanitari e accessori bagno',
    'corpo', 1, 1000),
  item(B, 12,
    'Controparete 10 m² doppio pannello idrofugo con isolazione',
    'm²', 10, 145,
    'Doppio pannello (2° idrofugo, es. Rigips impregnato) + isolazione lana di roccia 100mm (Swisspor ROC Tipo 1 ≈ CHF 15/m²) + manodopera'),

  // ── CORRIDOIO E CUCINA ────────────────────────────────────────────────────
  sec(CC, 13, 'CORRIDOIO E CUCINA'),
  item(CC, 14,
    'Muratura – rimozione pavimento del corridoio, levigatura e aggrappante sul pavimento della cucina (il pavimento della cucina non viene rimosso), predisposizione conduit elettrici e installazione cassette',
    'corpo', 1, 3000),
  item(CC, 15,
    'Piastrelatura corridoio e cucina 30 m² (fornitura materiale e posa inclusa)',
    'm²', 30, 79.95,
    'Materiale CHF 29.95/m² (Bauhaus art. 31365295 – gres 60×60 Active Beige) + posa CHF 50/m²',
    'https://www.bauhaus.ch/it/p/gres-porcellanato-active-beige-31365295'),

  // ── CUCINA ───────────────────────────────────────────────────────────────
  sec(CU, 16, 'CUCINA – ARREDAMENTO E ELETTRODOMESTICI'),
  item(CU, 17,
    'Cucina componibile 310 cm (montaggio incluso, configurazione ampliata per lavastoviglie)',
    'pz', 1, 2189,
    'IKEA METOD/AXSTAD – base CHF 1.990 + 10% per ampliamento configurazione lavastoviglie = CHF 2.189',
    'https://www.ikea.com/ch/it/cat/cucine-componibili-metod-20024/'),
  item(CU, 18, 'Piano cottura a induzione 4 zone 59 cm', 'pz', 1, 449,
    'IKEA MATMÄSSIG 300 NERO art. 10467093',
    'https://www.ikea.com/ch/it/p/matmaessig-piano-cottura-a-induzione-ikea-300-nero-10467093/'),
  item(CU, 19, 'Cappa aspirante da parete 60 cm', 'pz', 1, 49.95,
    'IKEA LAGAN art. 503.013.97',
    'https://www.ikea.com/ch/it/p/lagan-cappa-da-fissare-alla-parete-bianco-50401397/'),
  item(CU, 20, 'Frigorifero/congelatore freestanding 262 L', 'pz', 1, 479,
    'IKEA LAGAN art. 805.712.94',
    'https://www.ikea.com/ch/it/p/lagan-frigorifero-congelatore-freestanding-bianco-80571294/'),
  item(CU, 21, 'Forno ventilato con funzione grill', 'pz', 1, 429,
    'IKEA STENABY art. 406.139.41',
    'https://www.ikea.com/ch/it/p/stenaby-forno-ventilato-funzione-grill-bianco-ikea-300-40613941/'),
  item(CU, 22, 'Lavello inox a 1 vasca', 'pz', 1, 24.95,
    'IKEA FYNDIG art. 902.021.26',
    'https://www.ikea.com/ch/it/p/fyndig-lavello-da-incasso-a-1-vasca-inox-90202126/'),
  item(CU, 23, 'Miscelatore lavello', 'pz', 1, 59.95,
    'IKEA EDSVIK art. 505.072.09',
    'https://www.ikea.com/ch/it/p/edsvik-miscelatore-lavello-doppio-comando-cromato-50507209/'),
  item(CU, 24, 'Rivestimento parete cucina – backsplash 3 m² (fornitura e posa inclusa)',
    'm²', 3, 140,
    'Materiale CHF 60/m² (gres porcellanato / pannello paraschizzi) + posa CHF 80/m²'),
  item(CU, 25, 'Piano di lavoro laminato 186 cm', 'pz', 2, 59,
    'IKEA EKBACKEN – CHF 59 cad. (×2 = CHF 118)',
    'https://www.ikea.com/ch/it/cat/piani-di-lavoro-24264/'),
  item(CU, 26, 'Montaggio cucina e posa elettrodomestici', 'corpo', 1, 1000),
  item(CU, 27, 'Lavastoviglie da incasso', 'pz', 1, 1200,
    'Stima lavastoviglie da incasso qualità media. Modello e marca da definire con cliente. Verifica spazio in configurazione cucina 310 cm.'),
  item(CU, 28, 'Controparete 11 m² con isolazione', 'corpo', 1, 1600,
    '11 m² × CHF 145/m² ≈ CHF 1.600. Doppio pannello + isolazione lana di roccia + manodopera.'),
  item(CU, 29, 'Rasatura, aggrappante, stabilitura (esclusivamente sulle superfici di cartongesso costruite)',
    'corpo', 1, 600),

  // ── STANZE ───────────────────────────────────────────────────────────────
  sec(ST, 30, 'STANZE'),
  item(ST, 31,
    'Muratura 3 stanze – tracce e installazione cassette elettriche; rimozione armadio e creazione nicchia in cartongesso nel soggiorno',
    'corpo', 1, 2900,
    'CHF 2.000 muratura tracce + CHF 900 rimozione armadio e creazione nicchia cartongesso soggiorno'),

  // ── APERTURA CORRIDOIO – SOGGIORNO ────────────────────────────────────────
  sec(AC, 32, 'APERTURA CORRIDOIO – SOGGIORNO'),
  item(AC, 33, 'Demolizione parete e smaltimento materiale', 'corpo', 1, 1500),
  item(AC, 34, 'Posa putrella (trave metallica)', 'corpo', 1, 2000),
  item(AC, 35, 'Requadratura vano', 'corpo', 1, 500),
  item(AC, 36,
    'Rasatura, aggrappante, rete di armatura, stabilitura (esclusivamente sulle superfici di cartongesso)',
    'corpo', 1, 1000),

  // ── CORRIDOIO D'INGRESSO ──────────────────────────────────────────────────
  sec(CI, 37, 'CORRIDOIO D\'INGRESSO'),
  item(CI, 38, 'Controparete 15 m² doppia lastra con isolazione',
    'm²', 15, 170,
    'CHF 170/m² = doppia lastra + isolazione lana di roccia + manodopera. (Base CHF 120/m² materiale + CHF 50/m² manodopera)'),
  item(CI, 39,
    'Rasatura, aggrappante, stabilitura (esclusivamente sulle superfici di cartongesso costruite)',
    'corpo', 1, 600),

  // ── STANZA PADRONALE ─────────────────────────────────────────────────────
  sec(SP, 40, 'STANZA PADRONALE'),
  item(SP, 41, 'Chiusura porta esistente – muratura e intonaco', 'corpo', 1, 1300),
  item(SP, 42, 'Apertura nuova porta – demolizione', 'corpo', 1, 800),
  item(SP, 43,
    'Rasatura, aggrappante, rete di armatura, stabilitura (esclusivamente sulle superfici di cartongesso)',
    'corpo', 1, 1000),
  item(SP, 44,
    'Creazione corridoio interno – parete in cartongesso 12 m² doppia lastra con isolazione',
    'm²', 12, 170,
    'CHF 170/m² = doppia lastra + isolazione lana di roccia + manodopera'),
  item(SP, 45, 'Porta nuova (fornitura + montaggio)', 'pz', 1, 750,
    'CHF 500 fornitura porta + CHF 250 montaggio'),
  item(SP, 46, 'Porta nuova (fornitura + montaggio)', 'pz', 1, 750,
    'CHF 500 fornitura porta + CHF 250 montaggio'),
  item(SP, 47,
    'Rasatura, aggrappante, stabilitura (esclusivamente sulle superfici di cartongesso costruite)',
    'corpo', 1, 900),

  // ── BAGNO NUOVO ──────────────────────────────────────────────────────────
  sec(BN, 48, 'BAGNO NUOVO'),
  item(BN, 49,
    'Muratura bagno nuovo: base pareti, WC e doccia, rimozione parquet, creazione pavimento in 3 livelli, passaggi idraulici ed elettrici, intonaco, impermeabilizzazione, aggrappante, rasatura e stabilitura',
    'corpo', 1, 5500),
  item(BN, 50, 'Parete interna in cartongesso 12 m² doppia lastra con isolazione',
    'm²', 12, 170,
    'CHF 170/m² = doppia lastra + isolazione lana di roccia + manodopera'),
  item(BN, 51, 'Controparete 4,5 m²', 'corpo', 1, 725,
    '4,5 m² controparete lastra idrofuga + isolazione + manodopera'),
  item(BN, 52,
    'Rasatura, aggrappante, stabilitura (esclusivamente sulle superfici di cartongesso costruite)',
    'corpo', 1, 600),
  item(BN, 53,
    'Sanitario WC Geberit completo: telaio Duofix Sigma, vaso sospeso rimless, placca Sigma, copriwater',
    'pz', 1, 950,
    'Identico al bagno esistente. Geberit Duofix Sigma art. 3612 348.000.000 ≈ CHF 397.80 + vaso rimless ≈ CHF 350 + placca Sigma ≈ CHF 100 + copriwater ≈ CHF 100. Confermare sconto professionale Sanitas Troesch.',
    'https://shop.sanitastroesch.ch'),
  item(BN, 54, 'Mobile lavabo con cassetti, lavabo e rubinetteria (fornitura completa)',
    'pz', 1, 517,
    'IKEA ÄNGSJÖN + BACKSJÖN art. 195.211.23',
    'https://www.ikea.com/ch/it/p/aengsjoen-backsjoen-mobile-lavabo-cassetti-lavabo-misc-s19521123/'),
  item(BN, 55, 'Specchio con armadietto pensile 80 cm', 'pz', 1, 259,
    'IKEA LETTAN art. 805.349.23',
    'https://www.ikea.com/ch/it/p/lettan-mobile-a-specchio-con-ante-effetto-specchio-vetro-a-specchio-80534923/'),
  item(BN, 56, 'Box doccia 70×110 cm', 'pz', 1, 500,
    'Acquisto locale Ticino (Sanitas Troesch o Bagno Design) – dimensioni 70×110 cm, stima CHF 400–600'),
  item(BN, 57,
    'Fornitura sistema doccia completo (colonna doccia, soffione, doccetta, miscelatore)',
    'pz', 1, 450,
    'Stima standard qualità media – Grohe / Hansgrohe o equivalente'),
  item(BN, 58,
    'Installazione sistema doccia completo (collegamenti idraulici, fissaggio, regolazione)',
    'corpo', 1, 250),
  item(BN, 59, 'Fornitura piletta e sistema di scarico doccia (sifone, collegamenti, accessori)', 'pz', 1, 120),
  item(BN, 60, 'Accessori bagno – fornitura standard (porta asciugamani, porta carta igienica, ganci)', 'corpo', 1, 150),
  item(BN, 61, 'Montaggio sanitari e accessori bagno', 'corpo', 1, 1000),
  item(BN, 62, 'Pavimenti e rivestimenti bagno nuovo (fornitura e posa inclusa, materiale a definire)',
    'corpo', 1, 3000,
    'Pavimenti e rivestimenti bagno nuovo. Materiale da definire con cliente (min. 2 opzioni presentate).'),
  item(BN, 63, 'Porta nuova (fornitura + montaggio)', 'pz', 1, 750,
    'CHF 500 fornitura porta + CHF 250 montaggio'),

  // ── PITTURA E FINITURA ────────────────────────────────────────────────────
  sec(PF, 64, 'PITTURA E FINITURA'),
  item(PF, 65, 'Verniciatura 6 persiane', 'corpo', 1, 720),
  item(PF, 66, 'Verniciatura 6 porte interne', 'corpo', 1, 720),
  item(PF, 67,
    'Pittura appartamento – tinteggiatura pareti e soffitti. La stuccatura verrà eseguita esclusivamente nelle zone interessate dalle tracce elettriche; non è prevista la lisciatura completa delle pareti.',
    'corpo', 1, 3950),
  item(PF, 68, 'Fornitura e posa battiscopa (110 ml)', 'corpo', 1, 1045.60,
    'Logoclic Rovere Firenze 2600×58×18mm – CHF 4.96/ml × 110ml = CHF 545.60 (Bauhaus art. 31158811) + posa CHF 500',
    'https://www.bauhaus.ch/it/p/logoclic-battiscopa-rovere-firenze-31158811'),

  // ── IMPIANTO ELETTRICO ────────────────────────────────────────────────────
  sec(EL, 69, 'IMPIANTO ELETTRICO'),
  item(EL, 70, 'Quadro di distribuzione 48 moduli – fornitura e posa', 'corpo', 1, 1200,
    'Hager VOLTA VA48A 48 moduli (CHF 172.95) + interruttore gen. 2P-40A + 4 differenziali 25A/30mA tipo A + 16 magnetotermici 1P-16A + pettine + morsettiera + posa 4h × CHF 115/h',
    'https://www.elettromercato.ch/it/prodotti/id/20334/quadro-hager-4-file-volta-ap-bianco'),
  item(EL, 71, 'Cavi per illuminazione 3×1,5 mm²', 'ml', 270, 1.75,
    'TT Rigid cable 3×1.5mm² LNPE bianco (Elettromercato Bronz art. 42625, CHF 1.75/m) – 8 circuiti: cucina, soggiorno/corridoio, 3 stanze, 2 bagni, ingresso (~30m/circuito + 30m riserva)',
    'https://www.elettromercato.ch/en/browse/id/42625'),
  item(EL, 72, 'Cavi prese standard 3×2,5 mm²', 'ml', 360, 3.40,
    'TT Rigid cable 3×2.5mm² LNPE bianco (Elettromercato Bronz art. 42564, CHF 3.40/m) – 10 circuiti: 2 soggiorno, 3 stanze, 1 corridoio, 2 cucina, 2 bagni (~30m/circuito + 60m riserva)',
    'https://www.elettromercato.ch/en/browse/id/42564'),
  item(EL, 73, 'Cavi circuiti dedicati (piano cottura, lavastoviglie, lavatrice, boiler, forno)',
    'corpo', 1, 520,
    'Piano cottura: 5G6mm² 20m ≈ CHF 160; lavatrice, lavastoviglie, boiler, forno: 4× 3×2.5mm² ~100m = CHF 340; totale CHF 500 + ~4% arrotondamento'),
  item(EL, 74, 'Prese tipo 13 – fornitura', 'pz', 28, 54.10,
    'Feller EDIZIOdue presa T13 art. L87063F61 (Elettromercato Bronz CHF 54.10/pz) – distribuzione: stanze 12 pz, soggiorno 8 pz, cucina 4 pz, corridoio/ingresso 4 pz',
    'https://www.elettromercato.ch/en/browse/id/15575'),
  item(EL, 75, 'Prese IP44 bagno – fornitura', 'pz', 4, 85,
    'Prese tipo 13 con protezione IP44 per zone umide (bagno esistente 2 pz, bagno nuovo 2 pz) – stima CHF 80–90/pz, prezzo da confermare con fornitore locale'),
  item(EL, 76, 'Interruttori e deviatori – fornitura', 'pz', 22, 27,
    'Feller EDIZIOdue: ~15 interruttori schema 1 + 7 deviatori schema 6; prezzo medio CHF 20–35/pz. Fonte: OBI.ch EDIZIOdue CHF 8.95–49.95'),
  item(EL, 77, 'Materiale vario (cassette da incasso, derivazione, tubi corrugati)', 'corpo', 1, 195,
    '65 cassette da incasso ≈ CHF 2.50/pz = CHF 162.50 + 10 cassette derivazione IP40 ≈ CHF 3/pz = CHF 30'),
  item(EL, 78, 'Posa impianto elettrico completo – manodopera', 'corpo', 1, 8500,
    'Stesa cavi, connessioni quadro, montaggio prese/interruttori, cablaggio circuiti dedicati, collaudo interno. Stima ~75h × CHF 113/h. Tariffa elettricista certificato NIN Ticino: CHF 100–130/h (fonte: houzy.ch)'),
  item(EL, 79, 'Dichiarazione di conformità ESTI + collaudo finale', 'corpo', 1, 650,
    'Certificazione obbligatoria per legge (NIN 2020) su tutti gli impianti elettrici in Svizzera. Emessa da elettricista autorizzato ESTI. Stima CHF 500–800 per appartamento completo.'),

  // ── VARIE ────────────────────────────────────────────────────────────────
  sec(VA, 80, 'VARIE'),
  note(VA, 81, 'Impianto idraulico ed eventuale domanda di costruzione: costi separati, non inclusi nel presente preventivo.'),
  item(VA, 82, 'Direzione lavori', 'corpo', 1, 0),
];

// ─── Compute total ────────────────────────────────────────────────────────────
const total = rows.reduce((s, r) => s + (r.totalPrice || 0), 0);
console.log(`Total items: ${rows.length}`);
console.log(`Grand total: CHF ${total.toFixed(2)}`);

const internalNotes = `MARGINE APPLICATO: 0% (preventivo a prezzo di costo – margine da definire)

NOTE OPERATIVE:
• WC entrambi i bagni: sistema Geberit Duofix Sigma – confermare sconto professionale Sanitas Troesch
• Box doccia bagno esistente 120×80 cm, bagno nuovo 70×110 cm: acquisto locale (Sanitas Troesch Mendrisio / Bagno Design Contone)
• Sistema doccia: Grohe / Hansgrohe o equivalente qualità media
• Lavastoviglie: modello da definire, verifica spazio cucina 310 cm
• Edilgroup CH Manno: +41 91 610 02 02 (alternativa locale materiali)
• Sanitas Troesch Mendrisio: Via Borromini 4
• Bagno Design Contone: +41 91 290 81 01
• Impianto elettrico: tracce e cassette incluse nelle rispettive sezioni muratura; sezione IMPIANTO ELETTRICO copre la parte impiantistica completa
• ATTENZIONE: offerta idraulica GC Termo-Idraulica N° 2026.05.002 (18.05.2026) copre tubazioni e allacciamenti – verificare sovrapposizione fornitura Duofix (già incluso nel nostro item WC) e montaggio sanitari`;

const clientNotes = `Tutti i materiali forniti saranno presentati con almeno 2 modelli diversi. In caso di mancato accordo, il valore del materiale sarà detratto e il cliente provvederà autonomamente alla fornitura. Per pavimenti e rivestimenti: in caso di mancato accordo verrà detratto CHF 25/m² (restano inclusi rejunte, silicone, colla e profili in alluminio). Qualora il cliente rifiuti entrambe le opzioni proposte e scelga materiale proprio, la manodopera potrà essere soggetta a revisione.

Condizioni di pagamento:
• 30% all'accettazione del preventivo
• 30% a metà lavori
• 40% al completamento dei lavori

Pagamento entro 30 giorni dalla data fattura. In caso di ritardo si applicano interessi di mora del 5% annuo.`;

async function main() {
  console.log('Deleting existing items...');
  await client.execute({ sql: 'DELETE FROM quote_items WHERE quoteId = ?', args: [QUOTE_ID] });

  console.log(`Inserting ${rows.length} items...`);
  for (const r of rows) {
    await client.execute({
      sql: `INSERT INTO quote_items
        (id, quoteId, itemType, section, sortOrder, description, unit, quantity,
         unitCost, unitPrice, totalCost, totalPrice, marginPercent, sourceNote, sourceUrl, createdAt, updatedAt)
        VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
      args: [r.id, r.quoteId, r.itemType, r.section, r.sortOrder, r.description,
             r.unit, r.quantity, r.unitCost, r.unitPrice, r.totalCost, r.totalPrice,
             r.marginPercent, r.sourceNote, r.sourceUrl, now, now],
    });
  }

  console.log('Updating quote header...');
  await client.execute({
    sql: `UPDATE quotes SET version=3, total=?, subtotalCost=?, subtotalClient=?,
          internalNotes=?, clientNotes=?, updatedAt=? WHERE id=?`,
    args: [total, total, total, internalNotes, clientNotes, now, QUOTE_ID],
  });

  console.log('Done.');
}

main().catch(e => { console.error(e.message); process.exit(1); });
