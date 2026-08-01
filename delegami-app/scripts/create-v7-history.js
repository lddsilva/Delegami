require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@libsql/client');
const { randomUUID } = require('crypto');
const client = createClient({ url: process.env.DATABASE_URL, authToken: process.env.DATABASE_AUTH_TOKEN });
const now = new Date().toISOString();

const PROJECT_ID = 'cmobzgzlk0001y0ukb3hkjyih';
const Q8 = 'cmobzgzsh0003y0ukbly36k3q'; // v8 (current)

async function run() {
  // Get v2 ID (already created)
  const { rows: v2rows } = await client.execute({ sql: "SELECT id FROM quotes WHERE quoteNumber='PRE-2026-013' AND version=2", args: [] });
  const V2_ID = v2rows[0].id;
  console.log('v2 ID:', V2_ID);

  const v7Id = randomUUID();

  const CLIENT_NOTES_V7 = `Per i materiali forniti potranno essere presentate fino a 2 opzioni tra cui scegliere. I materiali saranno concordati prima dell'inizio lavori. In caso di mancato accordo, il valore del materiale sarà detratto e il cliente provvederà autonomamente alla fornitura. Per pavimenti e rivestimenti: in caso di mancato accordo verrà detratto CHF 25/m² (restano inclusi stucco, silicone, colla e profili in alluminio). Qualora il cliente rifiuti entrambe le opzioni proposte e scelga materiale proprio, la manodopera potrà essere soggetta a revisione.

Non incluso nel presente preventivo:
• Impianto idraulico: offerta separata GC Termo-Idraulica N° 2026.05.002.
• Eventuale domanda di costruzione per lavori strutturali.
• Corpi illuminanti (lampadari, plafoniere, faretti), citofono/videocitofono, cavi rete dati e TV.
• Adeguamento impianto di terra ed eventuale upgrade potenza di ingresso: da verificare in loco; se necessari, oggetto di offerta separata.

N.B.: Eventuali opere supplementari verranno comunicate e approvate dalla committenza prima dell'esecuzione.`;

  const INTERNAL_NOTES_V7 = `PREVENTIVO RIFIUTATO DAL CLIENTE (troppo costoso) — v8 è la versione ridotta a ~CHF 40k.

MARGINE APPLICATO: 0% (preventivo a prezzo di costo – margine da definire)

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
• Elettricista: tariffa CHF 100/h`;

  // Create v7 quote
  await client.execute({
    sql: `INSERT INTO quotes (id,quoteNumber,version,projectId,type,status,marginPercent,subtotalCost,subtotalClient,taxRate,taxAmount,total,clientNotes,internalNotes,parentQuoteId,sentAt,createdAt,updatedAt)
          VALUES (?,?,7,?,'DETAILED','SENT',0,79137.85,79137.85,0,0,79137.85,?,?,?,?,?,?)`,
    args: [v7Id,'PRE-2026-013',PROJECT_ID, CLIENT_NOTES_V7, INTERNAL_NOTES_V7, V2_ID,
           '2026-05-20T00:00:00.000Z','2026-05-20T00:00:00.000Z', now]
  });
  console.log('v7 created:', v7Id);

  // Items — all 64 from internal PDF
  const items = [
    // STANZE
    ['SECTION','Stanze',0,'STANZE',null,null,null,null,null,null,null],
    ['ITEM','Stanze',1,'Muratura 3 stanze – tracce e installazione cassette elettriche; rimozione armadio e creazione nicchia in cartongesso nel soggiorno','corpo',1,2900,2900,2900,2900,'CHF 2.000 muratura tracce + CHF 900 rimozione armadio e creazione nicchia cartongesso soggiorno'],
    // APERTURA CORRIDOIO-SOGGIORNO
    ['SECTION','Apertura Corridoio – Soggiorno',2,'APERTURA CORRIDOIO – SOGGIORNO',null,null,null,null,null,null,null],
    ['ITEM','Apertura Corridoio – Soggiorno',3,'Demolizione parete e smaltimento materiale','corpo',1,1500,1500,1500,1500,null],
    ['ITEM','Apertura Corridoio – Soggiorno',4,'Posa putrella (trave metallica) su parete non strutturale','corpo',1,2000,2000,2000,2000,null],
    ['ITEM','Apertura Corridoio – Soggiorno',5,'Requadratura vano','corpo',1,500,500,500,500,null],
    ['ITEM','Apertura Corridoio – Soggiorno',6,'Aggrappante, rasatura con cola e rete e stabilitura sulla parete oggetto dell\'intervento','corpo',1,1000,1000,1000,1000,null],
    // CORRIDOIO D'INGRESSO
    ['SECTION','Corridoio d\'Ingresso',7,'CORRIDOIO D\'INGRESSO',null,null,null,null,null,null,null],
    ['ITEM','Corridoio d\'Ingresso',8,'Controparete 15 m² doppia lastra con isolazione','m²',15,145,2175,145,2175,'CHF 145/m² = doppia lastra + isolazione lana di roccia + manodopera. (Base CHF 95/m² materiale + CHF 50/m² manodopera)'],
    ['ITEM','Corridoio d\'Ingresso',9,'Aggrappante e stabilitura sulla superficie di cartongesso','corpo',1,600,600,600,600,null],
    // NUOVO CORRIDOIO INTERNO
    ['SECTION','Nuovo Corridoio Interno',10,'NUOVO CORRIDOIO INTERNO',null,null,null,null,null,null,null],
    ['ITEM','Nuovo Corridoio Interno',11,'Chiusura porta esistente – muratura e intonaco','corpo',1,1300,1300,1300,1300,null],
    ['ITEM','Nuovo Corridoio Interno',12,'Apertura nuova porta – demolizione','corpo',1,800,800,800,800,null],
    ['ITEM','Nuovo Corridoio Interno',13,'Aggrappante e stabilitura sulle superfici di cartongesso del corridoio interno','corpo',1,1900,1900,1900,1900,null],
    ['ITEM','Nuovo Corridoio Interno',14,'Creazione corridoio interno – parete in cartongesso 12 m² doppia lastra con isolazione','m²',12,170,2040,170,2040,'CHF 170/m² = doppia lastra + isolazione lana di roccia + manodopera'],
    ['ITEM','Nuovo Corridoio Interno',15,'Porta nuova (fornitura + montaggio)','pz',2,750,1500,750,1500,'CHF 500 fornitura porta + CHF 250 montaggio'],
    // BAGNO
    ['SECTION','Bagno',16,'BAGNO – RISTRUTTURAZIONE',null,null,null,null,null,null,null],
    ['ITEM','Bagno',17,'Muratura – smontaggio fisico, rimozione e smaltimento vasca e accessori esistenti; passaggio conduit e cassette elettriche; impermeabilizzazione box doccia; aggrappante su piastrelle restanti; rasatura in stabilitura (malta fine)','corpo',1,2000,2000,2000,2000,'Incluso: smontaggio fisico, rimozione e smaltimento vasca e accessori (opera edile). La disconnessione idraulica (taglio tubazioni acqua) è a cura di GC Termo-Idraulica (offerta N° 2026.05.002 — «Smontaggio apparecchi sanitari» CHF 140). Nessuna sovrapposizione.'],
    ['ITEM','Bagno',18,'Piastrelatura bagno 25,04 m² (fornitura materiale e posa inclusa)','m²',25.04,135,3380.4,135,3380.4,'Materiale CHF 35/m² (Bauhaus art. 28795195 – gres 60×60) + posa CHF 100/m²'],
    ['ITEM','Bagno',19,'Sanitario WC Geberit: vaso sospeso rimless, placca Sigma, copriwater (telaio Duofix escluso – fornito da GC Termo-Idraulica)','pz',1,550,550,550,550,'Vaso rimless ≈ CHF 350 + placca Sigma ≈ CHF 100 + copriwater ≈ CHF 100 = CHF 550. Telaio Duofix ESCLUSO: fornito da GC Termo-Idraulica offerta N° 2026.05.002.'],
    ['ITEM','Bagno',20,'Mobile lavabo con cassetti, lavabo e rubinetteria (fornitura completa)','pz',1,517,517,517,517,'IKEA ÄNGSJÖN + BACKSJÖN art. 195.211.23'],
    ['ITEM','Bagno',21,'Specchio con armadietto pensile 80 cm','pz',1,259,259,259,259,'IKEA LETTAN art. 805.349.23'],
    ['ITEM','Bagno',22,'Box doccia rettangolare 120×80 cm','pz',1,500,500,500,500,'Acquisto locale Ticino (Sanitas Troesch o Bagno Design) – stima CHF 400–600'],
    ['ITEM','Bagno',23,'Fornitura sistema doccia completo (colonna doccia, soffione, doccetta, miscelatore)','pz',1,450,450,450,450,'Stima standard qualità media – Grohe / Hansgrohe o equivalente'],
    ['ITEM','Bagno',24,'Installazione sistema doccia completo (collegamenti idraulici, fissaggio, regolazione)','corpo',1,250,250,250,250,null],
    ['ITEM','Bagno',25,'Fornitura piletta e sistema di scarico doccia (sifone, collegamenti, accessori)','pz',1,120,120,120,120,null],
    ['ITEM','Bagno',26,'Accessori bagno – fornitura standard (porta asciugamani, porta carta igienica, ganci)','corpo',1,150,150,150,150,null],
    ['ITEM','Bagno',27,'Montaggio accessori bagno','corpo',1,1000,1000,1000,1000,'Incluso: posa porta asciugamani, porta carta igienica, ganci, specchio e complementi. Escluso: montaggio WC e bidet (a carico di GC Termo-Idraulica).'],
    ['ITEM','Bagno',28,'Controparete 10 m² doppio pannello idrofugo con isolazione','m²',10,145,1450,145,1450,'Doppio pannello (2° idrofugo, es. Rigips impregnato) + isolazione lana di roccia 100mm (Swisspor ROC Tipo 1 ≈ CHF 15/m²) + manodopera'],
    ['ITEM','Bagno',29,'Bidet sospeso con rubinetteria (fornitura)','pz',1,320,320,320,320,'Bidet ceramico sospeso Duravit D-Code art. 2143 192.100.000 ≈ CHF 193.50 + miscelatore monocomando Hansgrohe Logis ≈ CHF 120 = CHF 313.50, arrotondato CHF 320. Telaio Duofix e posa a carico di GC Termo-Idraulica.'],
    // BAGNO NUOVO
    ['SECTION','Bagno Nuovo',30,'BAGNO NUOVO',null,null,null,null,null,null,null],
    ['ITEM','Bagno Nuovo',31,'Muratura bagno nuovo: base pareti, WC e doccia, rimozione parquet, creazione pavimento in 3 livelli, passaggi idraulici ed elettrici, intonaco, impermeabilizzazione','corpo',1,4900,4900,4900,4900,null],
    ['ITEM','Bagno Nuovo',32,'Parete in cartongesso idrofugo 12 m² doppia lastra con isolazione','m²',12,170,2040,170,2040,'CHF 170/m² = doppia lastra + isolazione lana di roccia + manodopera'],
    ['ITEM','Bagno Nuovo',33,'Controparete 4,5 m² lastra idrofuga con isolazione','corpo',1,725,725,725,725,'4,5 m² controparete lastra idrofuga + isolazione lana di roccia + manodopera'],
    ['ITEM','Bagno Nuovo',34,'Aggrappante e stabilitura sulle pareti interne ed esterne del bagno (superfici oggetto di intervento)','corpo',1,1200,1200,1200,1200,null],
    ['ITEM','Bagno Nuovo',35,'Sanitario WC Geberit: vaso sospeso rimless, placca Sigma, copriwater (telaio Duofix escluso – fornito da GC Termo-Idraulica)','pz',1,550,550,550,550,'Identico al bagno esistente. Vaso rimless ≈ CHF 350 + placca Sigma ≈ CHF 100 + copriwater ≈ CHF 100. Telaio Duofix ESCLUSO: fornito da GC Termo-Idraulica.'],
    ['ITEM','Bagno Nuovo',36,'Mobile lavabo con cassetti, lavabo e rubinetteria (fornitura completa)','pz',1,517,517,517,517,'IKEA ÄNGSJÖN + BACKSJÖN art. 195.211.23'],
    ['ITEM','Bagno Nuovo',37,'Specchio con armadietto pensile 80 cm','pz',1,259,259,259,259,'IKEA LETTAN art. 805.349.23'],
    ['ITEM','Bagno Nuovo',38,'Box doccia 70×110 cm','pz',1,500,500,500,500,'Acquisto locale Ticino (Sanitas Troesch o Bagno Design) – dimensioni 70×110 cm, stima CHF 400–600'],
    ['ITEM','Bagno Nuovo',39,'Fornitura sistema doccia completo (colonna doccia, soffione, doccetta, miscelatore)','pz',1,450,450,450,450,'Stima standard qualità media – Grohe / Hansgrohe o equivalente'],
    ['ITEM','Bagno Nuovo',40,'Installazione sistema doccia completo (collegamenti idraulici, fissaggio, regolazione)','corpo',1,250,250,250,250,null],
    ['ITEM','Bagno Nuovo',41,'Fornitura piletta e sistema di scarico doccia (sifone, collegamenti, accessori)','pz',1,120,120,120,120,null],
    ['ITEM','Bagno Nuovo',42,'Accessori bagno – fornitura standard (porta asciugamani, porta carta igienica, ganci)','corpo',1,150,150,150,150,null],
    ['ITEM','Bagno Nuovo',43,'Montaggio accessori bagno','corpo',1,1000,1000,1000,1000,'Incluso: posa porta asciugamani, porta carta igienica, ganci, specchio e complementi. Escluso: montaggio WC e bidet (a carico di GC Termo-Idraulica).'],
    ['ITEM','Bagno Nuovo',44,'Pavimenti e rivestimenti bagno nuovo — piastrella 60×60 (fornitura e posa inclusa)','corpo',1,3000,3000,3000,3000,'Pavimenti e rivestimenti bagno nuovo. Materiale da definire con cliente (min. 2 opzioni presentate).'],
    ['ITEM','Bagno Nuovo',45,'Porta nuova (fornitura + montaggio)','pz',1,750,750,750,750,'CHF 500 fornitura porta + CHF 250 montaggio'],
    // CORRIDOIO E CUCINA
    ['SECTION','Corridoio e Cucina',46,'CORRIDOIO E CUCINA',null,null,null,null,null,null,null],
    ['ITEM','Corridoio e Cucina',47,'Muratura – rimozione pavimento del corridoio, levigatura e aggrappante sul pavimento della cucina (il pavimento della cucina non viene rimosso), predisposizione conduit elettrici e installazione cassette','corpo',1,3000,3000,3000,3000,null],
    ['ITEM','Corridoio e Cucina',48,'Piastrelatura corridoio e cucina 30 m² (fornitura materiale e posa inclusa)','m²',30,79.95,2398.5,79.95,2398.5,'Materiale CHF 29.95/m² (Bauhaus art. 31365295 – gres 60×60 Active Beige) + posa CHF 50/m²'],
    // CUCINA
    ['SECTION','Cucina',49,'CUCINA – ARREDAMENTO E ELETTRODOMESTICI',null,null,null,null,null,null,null],
    ['ITEM','Cucina',50,'Cucina componibile 310cm (montaggio incluso)','pz',1,1990,1990,1990,1990,'IKEA METOD/Veddinge bianco – combinazione ME K16 307×60×228 cm, art. 896.149.20. Include colonna alta per forno, spazio lavastoviglie, piano lavoro JÄRSTORP.'],
    ['ITEM','Cucina',51,'Piano cottura a induzione 4 zone 59 cm','pz',1,449,449,449,449,'IKEA MATMÄSSIG 300 NERO art. 10467093'],
    ['ITEM','Cucina',52,'Cappa aspirante da parete 60 cm','pz',1,49.95,49.95,49.95,49.95,'IKEA LAGAN art. 503.013.97'],
    ['ITEM','Cucina',53,'Frigorifero/congelatore freestanding 262 L','pz',1,479,479,479,479,'IKEA LAGAN art. 805.712.94'],
    ['ITEM','Cucina',54,'Forno ventilato con funzione grill','pz',1,429,429,429,429,'IKEA STENABY art. 406.139.41'],
    ['ITEM','Cucina',55,'Lavello inox a 1 vasca','pz',1,24.95,24.95,24.95,24.95,'IKEA FYNDIG art. 902.021.26'],
    ['ITEM','Cucina',56,'Miscelatore lavello','pz',1,59.95,59.95,59.95,59.95,'IKEA EDSVIK art. 505.072.09'],
    ['ITEM','Cucina',57,'Rivestimento parete cucina – backsplash 3 m² (fornitura e posa inclusa)','m²',3,140,420,140,420,'Materiale CHF 60/m² (gres porcellanato / pannello paraschizzi) + posa CHF 80/m²'],
    ['ITEM','Cucina',58,'Piano di lavoro laminato 186 cm','pz',2,59,118,59,118,'IKEA EKBACKEN – CHF 59 cad. (×2 = CHF 118)'],
    ['ITEM','Cucina',59,'Montaggio cucina e posa elettrodomestici','corpo',1,1000,1000,1000,1000,null],
    ['ITEM','Cucina',60,'Lavastoviglie da incasso','pz',1,1200,1200,1200,1200,'Stima lavastoviglie da incasso qualità media. Modello e marca da definire con cliente. Verifica spazio in configurazione cucina 310 cm.'],
    ['ITEM','Cucina',61,'Controparete 11 m² con isolazione','corpo',1,1600,1600,1600,1600,'11 m² × CHF 145/m² ≈ CHF 1.600. Doppio pannello + isolazione lana di roccia + manodopera.'],
    ['ITEM','Cucina',62,'Rasatura, aggrappante, stabilitura (esclusivamente sulle superfici di cartongesso costruite)','corpo',1,600,600,600,600,null],
    // PITTURA E FINITURA
    ['SECTION','Pittura e Finitura',63,'PITTURA E FINITURA',null,null,null,null,null,null,null],
    ['ITEM','Pittura e Finitura',64,'Verniciatura 6 persiane','corpo',1,720,720,720,720,null],
    ['ITEM','Pittura e Finitura',65,'Verniciatura 6 porte interne','corpo',1,720,720,720,720,null],
    ['ITEM','Pittura e Finitura',66,'Pittura appartamento – tinteggiatura pareti e soffitti. La stuccatura verrà eseguita esclusivamente nelle zone interessate dalle tracce elettriche; non è prevista la lisciatura completa delle pareti.','corpo',1,3950,3950,3950,3950,null],
    ['ITEM','Pittura e Finitura',67,'Fornitura e posa battiscopa (110 ml)','corpo',1,1045.6,1045.6,1045.6,1045.6,'Logoclic Rovere Firenze 2600×58×18mm – CHF 4.96/ml × 110ml = CHF 545.60 (Bauhaus art. 31158811) + posa CHF 500'],
    // IMPIANTO ELETTRICO
    ['SECTION','Impianto Elettrico',68,'IMPIANTO ELETTRICO',null,null,null,null,null,null,null],
    ['ITEM','Impianto Elettrico',69,'Quadro di distribuzione — fornitura e posa','corpo',1,1200,1200,1200,1200,'Hager VOLTA VA48A 48 moduli (CHF 172.95) + interruttore gen. 2P-40A + 4 differenziali 25A/30mA tipo A + 16 magnetotermici 1P-16A + pettine + morsettiera + posa 4h × CHF 115/h.'],
    ['ITEM','Impianto Elettrico',70,'Cavi e tubazioni — fornitura','corpo',1,2411.5,2411.5,2411.5,2411.5,'Cavi illuminazione 3×1,5mm² (CHF 1.75/m × 270m = CHF 472.50) — 8 circuiti. Cavi prese 3×2,5mm² (CHF 3.40/m × 360m = CHF 1.224.00) — 10 circuiti. Cavi dedicati CHF 520. Materiale vario CHF 195.'],
    ['ITEM','Impianto Elettrico',71,'Prese, interruttori e materiale elettrico — fornitura','corpo',1,1550,1550,1550,1550,'Prese tipo 13 ABB Basic55 T13 ~CHF 22/pz × 28 pz = CHF 616. Prese IP44 bagno ~CHF 85/pz × 4 pz = CHF 340. Interruttori e deviatori Feller EDIZIOdue ~CHF 27/pz × 22 pz = CHF 594.'],
    ['ITEM','Impianto Elettrico',72,'Posa impianto elettrico completo — manodopera','corpo',1,7500,7500,7500,7500,'Stesa cavi, connessioni quadro, montaggio prese/interruttori, cablaggio circuiti dedicati, collaudo interno. Stima ~75h × CHF 100/h. Tariffa elettricista certificato NIN Ticino: CHF 100–130/h.'],
    ['ITEM','Impianto Elettrico',73,'Rapporto di sicurezza RASI e collaudo finale','corpo',1,650,650,650,650,'Certificazione obbligatoria NIN 2020, emessa da elettricista autorizzato. Stima CHF 500–800 per appartamento completo.'],
  ];

  for (const [type, section, order, desc, unit, qty, uc, tc, up, tp, note] of items) {
    await client.execute({
      sql: `INSERT INTO quote_items (id,quoteId,itemType,section,sortOrder,description,unit,quantity,unitCost,totalCost,unitPrice,totalPrice,sourceNote,createdAt,updatedAt)
            VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
      args: [randomUUID(), v7Id, type, section, order, desc,
             unit||null, qty||null, uc||null, tc||null, up||null, tp||null,
             note||null, now, now]
    });
  }
  console.log('v7 items inserted:', items.length);

  // Update v8 parentQuoteId to point to v2 (chain: v2 → v7 → v8 via rootId)
  // v7 already has parentQuoteId=v2, v8 already has parentQuoteId=v2
  // The query finds: WHERE id=v2 OR parentQuoteId=v2 → finds v2, v7, v8 ✓

  // Update v2 internalNotes to note rejection
  await client.execute({
    sql: "UPDATE quotes SET internalNotes='PREVENTIVO RIFIUTATO DAL CLIENTE. Prima versione inviata (CHF 28.080,35) — cliente ha richiesto revisione completa.', updatedAt=? WHERE version=2 AND quoteNumber='PRE-2026-013'",
    args: [now]
  });

  // Verify chain
  const { rows } = await client.execute({
    sql: `SELECT quoteNumber, version, status, total FROM quotes WHERE id=? OR parentQuoteId=? ORDER BY version`,
    args: [V2_ID, V2_ID]
  });
  console.log('\nVersion chain:');
  rows.forEach(r => console.log(' v' + r.version, r.status, 'CHF', Number(r.total).toFixed(2)));
}

run().catch(e => { console.error(e.message); process.exit(1); });
