// Fase 5 — Impianti e Manodopera (~100 items)
import { createClient } from '@libsql/client'
import { config } from 'dotenv'
config({ path: '.env.local' })

const client = createClient({ url: process.env.DATABASE_URL, authToken: process.env.DATABASE_AUTH_TOKEN })
function uid() { return 'c' + Date.now().toString(36) + Math.random().toString(36).slice(2, 10) }

const items = [
  // ─── MANODOPERA MURATURA ──────────────────────────────────────────────────────
  { category: 'Manodopera – Muratura', description: 'Muratore – ora lavorativa', unit: 'h', unitCost: 75.00, code: 'MOD-MUR-H', notes: 'Tariffa oraria muratore qualificato Ticino 2025-2026. Per calcoli generici.' },
  { category: 'Manodopera – Muratura', description: 'Apertura porta in muratura portante – corpo', unit: 'corpo', unitCost: 1800.00, code: 'APE-POR-POR', notes: 'Include puntellamento, demolizione, architrave, rappezzi. Solaio non portante.' },
  { category: 'Manodopera – Muratura', description: 'Apertura porta in parete non portante – corpo', unit: 'corpo', unitCost: 800.00, code: 'APE-POR-NPO', notes: 'Parete in laterizio/cartongesso. Più rapido, senza puntellamento.' },
  { category: 'Manodopera – Muratura', description: 'Chiusura vano porta – muratura e intonaco', unit: 'corpo', unitCost: 1300.00, code: 'CHI-VAN-POR', notes: 'Include demolizione telaio, muratura, intonaco, raccordo pavimento.' },
  { category: 'Manodopera – Muratura', description: 'Tracce impianti a parete – ml', unit: 'ml', unitCost: 22.00, code: 'TRA-IMP-ML', notes: 'Tracce per tubi/cavi con fresa. Include rappezzi stucco.' },
  { category: 'Manodopera – Muratura', description: 'Tracce impianti a pavimento – ml', unit: 'ml', unitCost: 28.00, code: 'TRA-IMP-PAV', notes: 'Taglio massetto/pavimento. Include rappezzi.' },
  { category: 'Manodopera – Muratura', description: 'Installazione cassetta elettrica da incasso – pz', unit: 'pz', unitCost: 25.00, code: 'INS-CAS-ELE', notes: 'Muratore: foratura, sigillatura cassetta.' },
  { category: 'Manodopera – Muratura', description: 'Rappezzi intonaco dopo tracce (fino 2m²)', unit: 'corpo', unitCost: 180.00, code: 'RAP-INT-2M2', notes: 'Stuccatura e intonacatura per ripristino dopo lavori.' },
  { category: 'Manodopera – Muratura', description: 'Demolizione parete non portante (laterizio/cartongesso) – m²', unit: 'm²', unitCost: 28.00, code: 'DEM-PAR-M2', notes: 'Include rimozione macerie. Escluso smaltimento.' },
  { category: 'Manodopera – Muratura', description: 'Costruzione parete in laterizio 12cm – m²', unit: 'm²', unitCost: 95.00, code: 'COS-PAR-LAT', notes: 'Mattone forato 12cm + intonaco doppio lato. Chiave in mano.' },
  { category: 'Manodopera – Muratura', description: 'Fissaggio tasselli chimici M10 (anti-sismici)', unit: 'pz', unitCost: 22.00, code: 'FIS-TAS-CHI', notes: 'Per fissaggi strutturali a parete. Include tassello+resina.' },

  // ─── MANODOPERA IDRAULICA ─────────────────────────────────────────────────────
  { category: 'Manodopera – Idraulica', description: 'Idraulico – ora lavorativa', unit: 'h', unitCost: 95.00, code: 'MOD-IDR-H', notes: 'Tariffa oraria idraulico abilitato Ticino 2025-2026.' },
  { category: 'Manodopera – Idraulica', description: 'Spostamento punto acqua (distanza fino 2m)', unit: 'pz', unitCost: 280.00, code: 'SPO-ACQ-2M', notes: 'Modifica impianto per spostamento lavabo/wc/doccia.' },
  { category: 'Manodopera – Idraulica', description: 'Installazione completa bagno (WC+lavabo+bidet+doccia)', unit: 'corpo', unitCost: 1800.00, code: 'INS-BAG-COM', notes: 'Solo manodopera idraulica. Esclude materiali e piastrellatura.' },
  { category: 'Manodopera – Idraulica', description: 'Sostituzione rubinetteria (miscelatore+sifone)', unit: 'pz', unitCost: 120.00, code: 'SOS-RUB-PZ', notes: 'Smontaggio vecchio + montaggio nuovo. Per singolo punto.' },
  { category: 'Manodopera – Idraulica', description: 'Riparazione perdita tubo (senza apertura muro)', unit: 'corpo', unitCost: 320.00, code: 'RIP-PER-TUB', notes: 'Localizzazione e riparazione con raccordo. Urgenza +30%.' },
  { category: 'Manodopera – Idraulica', description: 'Installazione scaldasalviette elettrico', unit: 'pz', unitCost: 150.00, code: 'INS-SCA-ELE', notes: 'Idraulico: fissaggio + allacciamento idrico o elettrico.' },
  { category: 'Manodopera – Idraulica', description: 'Installazione rubinetto giardino – esterno', unit: 'pz', unitCost: 220.00, code: 'INS-RUB-GIA', notes: 'Include foratura muro esterno, valvola, rubinetto antigelivo.' },
  { category: 'Manodopera – Idraulica', description: 'Collaudo impianto idrico (pressione + tenuta)', unit: 'corpo', unitCost: 180.00, code: 'COL-IMP-IDR', notes: 'Prova idrostatica 10 bar. Certificato incluso.' },

  // ─── MANODOPERA ELETTRICA ─────────────────────────────────────────────────────
  { category: 'Manodopera – Elettrica', description: 'Elettricista – ora lavorativa', unit: 'h', unitCost: 90.00, code: 'MOD-ELE-H', notes: 'Tariffa oraria elettricista abilitato Ticino 2025-2026.' },
  { category: 'Manodopera – Elettrica', description: 'Installazione punto luce + interruttore', unit: 'pz', unitCost: 95.00, code: 'INS-PUN-LUC', notes: 'Completo: cavo, scatola, interruttore, punto luce. Presa esistente.' },
  { category: 'Manodopera – Elettrica', description: 'Installazione presa elettrica 220V', unit: 'pz', unitCost: 85.00, code: 'INS-PRE-220', notes: 'Da quadro esistente. Include cavo, scatola, presa.' },
  { category: 'Manodopera – Elettrica', description: 'Installazione presa TV/rete dati CAT6', unit: 'pz', unitCost: 95.00, code: 'INS-PRE-TV', notes: 'Presa TV o RJ45 cablata.' },
  { category: 'Manodopera – Elettrica', description: 'Sostituzione quadro elettrico (fino 12 moduli)', unit: 'corpo', unitCost: 580.00, code: 'SOS-QUA-12', notes: 'Nuovo quadro con interruttori magnetotermici e differenziali.' },
  { category: 'Manodopera – Elettrica', description: 'Sostituzione quadro elettrico (fino 24 moduli)', unit: 'corpo', unitCost: 980.00, code: 'SOS-QUA-24', notes: 'Quadro appartamento completo, CEI conforme.' },
  { category: 'Manodopera – Elettrica', description: 'Rifacimento impianto elettrico appartamento (fino 80m²)', unit: 'corpo', unitCost: 4500.00, code: 'RIF-IMP-80M', notes: 'Completo: tracce, cavi, scatole, interruttori, prese, quadro. Escluso tinteggiatura.' },
  { category: 'Manodopera – Elettrica', description: 'Installazione interruttore differenziale (salvavita)', unit: 'pz', unitCost: 120.00, code: 'INS-DIF-SAL', notes: 'Montaggio in quadro esistente.' },
  { category: 'Manodopera – Elettrica', description: 'Installazione plafoniera/lampadario (da soffitto)', unit: 'pz', unitCost: 65.00, code: 'INS-PLA-SOF', notes: 'Sostituzione su punto esistente.' },
  { category: 'Manodopera – Elettrica', description: 'Installazione ventilatore soffitto con luce', unit: 'pz', unitCost: 120.00, code: 'INS-VEN-SOF', notes: 'Su punto luce esistente. Include comando variatore.' },

  // ─── MATERIALI ELETTRICI ──────────────────────────────────────────────────────
  { category: 'Materiali Elettrici', description: 'Cavo elettrico NY-M 3×1.5mm² – metro', unit: 'ml', unitCost: 1.80, code: 'CAV-NYM-15', notes: 'Per illuminazione (16A). Bauhaus.' },
  { category: 'Materiali Elettrici', description: 'Cavo elettrico NY-M 3×2.5mm² – metro', unit: 'ml', unitCost: 2.20, code: 'CAV-NYM-25', notes: 'Per prese 16A. Bauhaus.' },
  { category: 'Materiali Elettrici', description: 'Cavo elettrico NY-M 3×4mm² – metro', unit: 'ml', unitCost: 3.20, code: 'CAV-NYM-40', notes: 'Per prese/forni 20A.' },
  { category: 'Materiali Elettrici', description: 'Interruttore semplice con placca – Feller/Berker', unit: 'pz', unitCost: 18.00, code: 'INT-SEM-FEL', notes: 'Interruttore unipolare + placca bianca. Feller EDIZIOdue.' },
  { category: 'Materiali Elettrici', description: 'Doppio interruttore/deviatore con placca', unit: 'pz', unitCost: 28.00, code: 'INT-DOP-FEL', notes: 'Feller. Per punti luce da 2 posizioni.' },
  { category: 'Materiali Elettrici', description: 'Presa bipasso + terra con placca – Feller', unit: 'pz', unitCost: 22.00, code: 'PRE-BIP-FEL', notes: 'Presa tipo 13 CH + bipasso. Standard svizzero.' },
  { category: 'Materiali Elettrici', description: 'Presa USB-C + presa CH – Feller', unit: 'pz', unitCost: 45.00, code: 'PRE-USB-FEL', notes: 'USB-C 45W + presa standard. Moderno.' },
  { category: 'Materiali Elettrici', description: 'Tubo corrugato Ø20mm per cavi – metro', unit: 'ml', unitCost: 0.95, code: 'TUB-COR-20', notes: 'Tubo flessibile per protezione cavi in traccia.' },
  { category: 'Materiali Elettrici', description: 'Cassetta da incasso 3 moduli – pz', unit: 'pz', unitCost: 3.80, code: 'CAS-3M-INC', notes: 'Scatola da incasso 60mm. Bauhaus.' },
  { category: 'Materiali Elettrici', description: 'Faretto LED da incasso 6W 3000K – GU10', unit: 'pz', unitCost: 22.00, code: 'FAR-LED-6W', notes: 'Faretto LED 600lm. Bianco/cromato. Bauhaus.' },
  { category: 'Materiali Elettrici', description: 'Dimmer LED compatibile 200W – incasso', unit: 'pz', unitCost: 65.00, code: 'DIM-LED-200', notes: 'Feller/ABB. Per regolazione intensità luci LED.' },
  { category: 'Materiali Elettrici', description: 'Sensore presenza movimento – per luce automatica', unit: 'pz', unitCost: 45.00, code: 'SEN-MOV-LUC', notes: 'PIR. Per corridoi/bagni. Bauhaus.' },
  { category: 'Materiali Elettrici', description: 'Campanello wireless con suoneria – Grothe', unit: 'pz', unitCost: 55.00, code: 'CAM-WIR-GRO', notes: 'Campanello senza fili, portata 150m.' },

  // ─── IMPIANTO RISCALDAMENTO ───────────────────────────────────────────────────
  { category: 'Riscaldamento', description: 'Radiatore in acciaio doppio pannello 600×1000mm', unit: 'pz', unitCost: 180.00, code: 'RAD-ACC-60', notes: 'Purmo/Kermi. 1500W a 70/55°C. Include staffaggio.' },
  { category: 'Riscaldamento', description: 'Radiatore in acciaio doppio pannello 600×1400mm', unit: 'pz', unitCost: 240.00, code: 'RAD-ACC-140', notes: 'Purmo/Kermi. 2100W. Grande superficie.' },
  { category: 'Riscaldamento', description: 'Valvola termostatica per radiatore (TRV) – Danfoss', unit: 'pz', unitCost: 28.00, code: 'VAL-TER-RAD', notes: 'Danfoss RA. Regolazione temperatura per ambiente.' },
  { category: 'Riscaldamento', description: 'Testa termostatica elettronica per radiatore – Salus', unit: 'pz', unitCost: 45.00, code: 'TES-TER-ELE', notes: 'Salus TRV10. Programmabile, LCD.' },
  { category: 'Riscaldamento', description: 'Tubo multicrestrato Ø16 per riscaldamento – metro', unit: 'ml', unitCost: 4.80, code: 'TUB-MUL-16', notes: 'Rehau/Uponor. Per distribuzione riscaldamento.' },
  { category: 'Riscaldamento', description: 'Termostato ambiente programmabile – settimanale', unit: 'pz', unitCost: 95.00, code: 'TER-AMB-PRO', notes: 'Honeywell/Salus. Programmazione 7 giorni.' },
  { category: 'Riscaldamento', description: 'Termostato smart WiFi (integra Alexa/Google)', unit: 'pz', unitCost: 145.00, code: 'TER-SMT-WIF', notes: 'Nest/Tado/Bosch EasyControl. App smartphone.' },
  { category: 'Riscaldamento', description: 'Sostituzione pompa circolazione riscaldamento', unit: 'pz', unitCost: 380.00, code: 'SOS-POM-RIS', notes: 'Grundfos ALPHA2. Include manodopera sostituzione.' },
  { category: 'Riscaldamento', description: 'Scarico impianto riscaldamento + ricarica', unit: 'corpo', unitCost: 280.00, code: 'SCA-IMP-RIS', notes: 'Per manutenzione o sostituzione radiatori.' },
  { category: 'Riscaldamento', description: 'Installazione radiatore (manodopera)', unit: 'pz', unitCost: 180.00, code: 'INS-RAD-PZ', notes: 'Staffaggio, allacciamento, collaudo. Per ogni radiatore.' },

  // ─── DEMOLIZIONI E SMALTIMENTO ────────────────────────────────────────────────
  { category: 'Demolizioni e Smaltimento', description: 'Noleggio cassone da 7m³ per macerie', unit: 'pz', unitCost: 280.00, code: 'NLC-CAS-7M3', notes: 'Nolo + trasporto + smaltimento macerie miste. Ticino.' },
  { category: 'Demolizioni e Smaltimento', description: 'Noleggio cassone da 10m³ per macerie', unit: 'pz', unitCost: 380.00, code: 'NLC-CAS-10M', notes: 'Per cantieri medi-grandi.' },
  { category: 'Demolizioni e Smaltimento', description: 'Smaltimento speciale amianto – m²', unit: 'm²', unitCost: 180.00, code: 'SME-AMI-M2', notes: 'Solo da ditte autorizzate. Richiede perizia e certificati.' },
  { category: 'Demolizioni e Smaltimento', description: 'Manodopera carico macerie su cassone – ora', unit: 'h', unitCost: 65.00, code: 'CAR-MAC-H', notes: 'Operaio carico/scarico.' },
  { category: 'Demolizioni e Smaltimento', description: 'Demolizione rivestimento bagno (piastrelle) – m²', unit: 'm²', unitCost: 22.00, code: 'DEM-RIV-BAG', notes: 'Include rimozione piastrelle + carico. Escluso cassone.' },
  { category: 'Demolizioni e Smaltimento', description: 'Smontaggio sanitari (WC+lavabo+doccia) – corpo', unit: 'corpo', unitCost: 320.00, code: 'SMO-SAN-BAG', notes: 'Idraulico: disconnessione + smontaggio + carico.' },
  { category: 'Demolizioni e Smaltimento', description: 'Smontaggio cucina completa – corpo', unit: 'corpo', unitCost: 280.00, code: 'SMO-CUC-COM', notes: 'Falegname + idraulico. Incluse porte e pensili.' },
  { category: 'Demolizioni e Smaltimento', description: 'Smontaggio pavimento laminato/parquet – m²', unit: 'm²', unitCost: 8.00, code: 'SMO-PAV-LAM', notes: 'Rimozione rapida click. Escluso smaltimento.' },

  // ─── PONTEGGI E ATTREZZATURE ──────────────────────────────────────────────────
  { category: 'Ponteggi e Attrezzature', description: 'Noleggio ponteggio facciata – m² al mese', unit: 'm²', unitCost: 6.50, code: 'PON-FAC-M2M', notes: 'Per facciate, montaggio + smontaggio incluso. Min 1 mese.' },
  { category: 'Ponteggi e Attrezzature', description: 'Ponteggio interno a torre 3m – noleggio settimana', unit: 'pz', unitCost: 85.00, code: 'PON-INT-SIM', notes: 'Torre mobile interna. Sicurezza conforme.' },
  { category: 'Ponteggi e Attrezzature', description: 'Noleggio compressore 50L – giorno', unit: 'pz', unitCost: 45.00, code: 'NLC-CMP-50', notes: 'Per spargi-intonaco, pneumatici. Bauhaus/Noleggio.' },
  { category: 'Ponteggi e Attrezzature', description: 'Noleggio betoniera 140L – giorno', unit: 'pz', unitCost: 55.00, code: 'NLC-BET-140', notes: 'Per massetti, murature. Include consumabili.' },
  { category: 'Ponteggi e Attrezzature', description: 'Noleggio taglierina a disco per tracce – giorno', unit: 'pz', unitCost: 65.00, code: 'NLC-TAG-DIS', notes: 'Per tracce muri. Aspirazione integrata.' },
  { category: 'Ponteggi e Attrezzature', description: 'Noleggio lucidatrice pavimento – giorno', unit: 'pz', unitCost: 75.00, code: 'NLC-LUC-PAV', notes: 'Per levigatura/lucidatura parquet/cemento.' },

  // ─── IMPIANTO GAS ─────────────────────────────────────────────────────────────
  { category: 'Impianto Gas', description: 'Tubo gas flessibile 1m – DN15', unit: 'pz', unitCost: 22.00, code: 'TUB-GAS-1M', notes: 'Allacciamento piano cottura/forno. Con raccordi.' },
  { category: 'Impianto Gas', description: 'Rubinetto a sfera DN15 per gas', unit: 'pz', unitCost: 28.00, code: 'RUB-GAS-DN15', notes: 'Valvola di intercettazione gas. Certificata.' },
  { category: 'Impianto Gas', description: 'Rivelatore gas da parete – Ei Electronics', unit: 'pz', unitCost: 55.00, code: 'RIV-GAS-PAR', notes: 'Obbligatorio in CH in locali con apparecchi gas. Certificato.' },
  { category: 'Impianto Gas', description: 'Prova tenuta impianto gas (certificato)', unit: 'corpo', unitCost: 220.00, code: 'PRO-TEN-GAS', notes: 'Da ditta abilitata. Rilascio certificato controllo gas.' },

  // ─── MANODOPERA PULIZIA FINE LAVORI ──────────────────────────────────────────
  { category: 'Pulizia Fine Lavori', description: 'Pulizia fine cantiere – m²', unit: 'm²', unitCost: 8.50, code: 'PUL-FIN-M2', notes: 'Pulizia approfondita a fine lavori. Include rimozione residui, lucidatura superfici.' },
  { category: 'Pulizia Fine Lavori', description: 'Pulizia appartamento completa (dopo ristrutturazione)', unit: 'corpo', unitCost: 480.00, code: 'PUL-APP-COM', notes: 'Per appartamento fino 80m². Ditta specializzata.' },
  { category: 'Pulizia Fine Lavori', description: 'Rimozione film di cantiere/protezioni pavimenti', unit: 'm²', unitCost: 3.50, code: 'RIM-FIL-PAV', notes: 'Stacco pellicole protettive con solvente se necessario.' },
  { category: 'Pulizia Fine Lavori', description: 'Detersione piastrelle dopo posa (acido)', unit: 'm²', unitCost: 4.50, code: 'DET-PIA-ACI', notes: 'Rimozione residui cemento/stucco. Acido diluito. Entro 24h posa.' },

  // ─── VARIE ────────────────────────────────────────────────────────────────────
  { category: 'Varie', description: 'Cassetta di derivazione stagna IP55 – 100×100mm', unit: 'pz', unitCost: 8.50, code: 'CAS-DER-IP55', notes: 'Per derivazioni in ambienti umidi.' },
  { category: 'Varie', description: 'Silicone neutro trasparente – 310ml', unit: 'pz', unitCost: 9.50, code: 'SIL-NEU-310', notes: 'Per sigillatura universale. Bagni, cucine, finestre.' },
  { category: 'Varie', description: 'Silicone acetico sanitario bianco – 310ml', unit: 'pz', unitCost: 8.00, code: 'SIL-SAN-310', notes: 'Antibatterico per bagni. Durata 15+ anni.' },
  { category: 'Varie', description: 'Sigillante poliuretanico grigio – 600ml (pistola)', unit: 'pz', unitCost: 18.00, code: 'SIG-PU-600', notes: 'Per giunti di dilatazione, davanzali, bocchette.' },
  { category: 'Varie', description: 'Rete fibra di vetro per intonaco – rotolo 50m²', unit: 'm²', unitCost: 2.80, code: 'RET-FIB-50', notes: 'Armatura per intonaci e rasanti su giunti. Evita crepe.' },
  { category: 'Varie', description: 'Telo di protezione pavimento – rotolo 50m²', unit: 'm²', unitCost: 1.20, code: 'TEL-PRO-PAV', notes: 'Film protettivo durante lavori. Polietilene.' },
  { category: 'Varie', description: 'Nastro in carta per mascheratura – 50mm × 50m', unit: 'pz', unitCost: 3.50, code: 'NAS-MAS-50', notes: 'Bauhaus. Per pittura e protezione bordi.' },
  { category: 'Varie', description: 'Disinfezione e trattamento antiumidità – m²', unit: 'm²', unitCost: 18.00, code: 'DIS-ANT-UM', notes: 'Trattamento muri con umidità saliente. Include prodotti biocidi.' },
  { category: 'Varie', description: 'Trattamento antimuffa preventivo – m²', unit: 'm²', unitCost: 12.00, code: 'TRA-ANT-MUF', notes: 'Prima di pittura in zone a rischio (bagni, cantine).' },
]

async function main() {
  const now = new Date().toISOString()
  let inserted = 0
  for (const item of items) {
    const id = uid()
    await client.execute({
      sql: 'INSERT INTO price_items (id, code, category, description, unit, unitCost, notes, isActive, createdAt, updatedAt) VALUES (?,?,?,?,?,?,?,1,?,?)',
      args: [id, item.code ?? null, item.category, item.description, item.unit, item.unitCost, item.notes ?? null, now, now],
    })
    inserted++
  }
  console.log(`Fase 5 — inseriti: ${inserted} articoli`)
}
main().catch(console.error).finally(() => client.close())
