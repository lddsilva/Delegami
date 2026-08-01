// Fase 4 — Strutture, Finiture, Porte e Finestre (~100 items)
import { createClient } from '@libsql/client'
import { config } from 'dotenv'
config({ path: '.env.local' })

const client = createClient({ url: process.env.DATABASE_URL, authToken: process.env.DATABASE_AUTH_TOKEN })
function uid() { return 'c' + Date.now().toString(36) + Math.random().toString(36).slice(2, 10) }

const items = [
  // ─── CARTONGESSO ──────────────────────────────────────────────────────────────
  { category: 'Cartongesso', description: 'Lastra cartongesso standard BA13 – 250×120cm (Knauf)', unit: 'pz', unitCost: 9.80, code: 'CG-BA13-250', notes: 'Knauf GKB 13mm. Per pareti e soffitti interni. Link: https://www.knauf.it' },
  { category: 'Cartongesso', description: 'Lastra cartongesso idrofugo BA13H (verde) – 250×120cm', unit: 'pz', unitCost: 12.50, code: 'CG-BA13H-250', notes: 'Knauf GKBI. Per bagni e cucine. Resistente umidità.' },
  { category: 'Cartongesso', description: 'Lastra cartongesso antifuoco BA15F (rosa) – 250×120cm', unit: 'pz', unitCost: 14.80, code: 'CG-BA15F-250', notes: 'Knauf GKF. REI 60-120 a seconda dei strati. Per vani tecnici.' },
  { category: 'Cartongesso', description: 'Lastra cartongesso ad alta densità 12.5mm – 250×120', unit: 'pz', unitCost: 16.50, code: 'CG-HD-250', notes: 'Per applicazioni acustiche/pesanti. Fermacell area.' },
  { category: 'Cartongesso', description: 'Profilo C 75/50 – metro (Knauf)', unit: 'ml', unitCost: 2.20, code: 'PRF-C-75', notes: 'Profilo anima in acciaio zincato 75mm per controplafoni.' },
  { category: 'Cartongesso', description: 'Profilo U 75mm – metro (guida)', unit: 'ml', unitCost: 1.80, code: 'PRF-U-75', notes: 'Guida in acciaio zincato. Per fissaggio a pavimento/soffitto.' },
  { category: 'Cartongesso', description: 'Profilo CD 60 per controsoffitto – metro', unit: 'ml', unitCost: 1.50, code: 'PRF-CD-60', notes: 'Profilo portante per controsoffitti a soffitto.' },
  { category: 'Cartongesso', description: 'Staffa a molla per controsoffitto – pz', unit: 'pz', unitCost: 1.20, code: 'STA-MOL', notes: 'Per ancoraggio profilo CD al solaio.' },
  { category: 'Cartongesso', description: 'Vite per cartongesso 3.5×35mm – box 1000pz', unit: 'pz', unitCost: 8.50, code: 'VIT-CG-35', notes: 'Viti fosfatate. Bauhaus.' },
  { category: 'Cartongesso', description: 'Nastro di carta per giunti cartongesso – rotolo 50m', unit: 'pz', unitCost: 4.80, code: 'NAS-GIU-50', notes: 'Knauf. Per stuccatura giunti tra lastre.' },
  { category: 'Cartongesso', description: 'Stucco per giunti cartongesso – secchio 5kg', unit: 'pz', unitCost: 14.50, code: 'STU-GIU-5', notes: 'Knauf Fugenfüller HP. Per stuccatura e primer.' },
  { category: 'Cartongesso', description: 'Controparete in cartongesso singola lastra – m² (mat + posa)', unit: 'm²', unitCost: 65.00, code: 'CPR-SIN-M2', notes: 'Materiale + manodopera. Profili U+C, lastra BA13, stuccatura.' },
  { category: 'Cartongesso', description: 'Controparete in cartongesso doppia lastra – m² (mat + posa)', unit: 'm²', unitCost: 95.00, code: 'CPR-DOP-M2', notes: 'Doppia lastra, maggiore acustica. Include lana di roccia 50mm.' },
  { category: 'Cartongesso', description: 'Controsoffitto cartongesso piano – m² (mat + posa)', unit: 'm²', unitCost: 55.00, code: 'CTF-PIA-M2', notes: 'Controsoffitto piano standard. Include profili CD+UD, lastra.' },
  { category: 'Cartongesso', description: 'Controsoffitto cartongesso con isolazione acustica – m²', unit: 'm²', unitCost: 75.00, code: 'CTF-ACU-M2', notes: 'Include lana di roccia 60mm sopra cartongesso.' },
  { category: 'Cartongesso', description: 'Aggrappante stabilizzante su cartongesso – m²', unit: 'm²', unitCost: 8.50, code: 'AGR-CG-M2', notes: 'Prima di intonacare o piastrellare su cartongesso nuovo.' },

  // ─── ISOLAMENTO ───────────────────────────────────────────────────────────────
  { category: 'Isolamento Termoacustico', description: 'Lana di roccia 50mm – pannello 60×100cm (Rockwool)', unit: 'm²', unitCost: 12.00, code: 'LDR-50-M2', notes: 'Rockwool Rockboard 035. Per contropareti. Link: https://www.rockwool.com/it' },
  { category: 'Isolamento Termoacustico', description: 'Lana di roccia 80mm – pannello per copertura', unit: 'm²', unitCost: 16.50, code: 'LDR-80-M2', notes: 'Rockwool Monrock MAX E. Cappotto tetto/soffitto.' },
  { category: 'Isolamento Termoacustico', description: 'Pannello EPS 60mm (polistirene espanso) – m²', unit: 'm²', unitCost: 6.80, code: 'EPS-60-M2', notes: 'Cappotto esterno. Densità 15-20kg/m³. Bauhaus.' },
  { category: 'Isolamento Termoacustico', description: 'Pannello EPS 100mm per cappotto esterno – m²', unit: 'm²', unitCost: 10.50, code: 'EPS-100-M2', notes: 'Standard cappotto ETICS. Isopan/Bauhaus.' },
  { category: 'Isolamento Termoacustico', description: 'Pannello XPS 50mm (estruso) – terrazzo/fondazioni', unit: 'm²', unitCost: 14.00, code: 'XPS-50-M2', notes: 'Resistente umidità. Sotto massetto su terreno. Styrodur.' },
  { category: 'Isolamento Termoacustico', description: 'Telo barriera vapore rifrangente – m²', unit: 'm²', unitCost: 3.50, code: 'TEL-BV-RIF', notes: 'Multifoil riflettente. Per tetti e pareti. Bauhaus.' },
  { category: 'Isolamento Termoacustico', description: 'Schiuma poliuretanica espandente – bomboletta 750ml', unit: 'pz', unitCost: 8.50, code: 'SCH-PU-750', notes: 'Per sigillatura interstizi, fissaggio telai porte/finestre. Bauhaus.' },

  // ─── INTONACI E RASANTI ───────────────────────────────────────────────────────
  { category: 'Intonaci e Rasanti', description: 'Intonaco di fondo calce-cemento – sacco 25kg', unit: 'sacco', unitCost: 15.00, code: 'INT-FON-25', notes: 'Weber/Holcim. Primo strato. Resa ~12m²/sacco a 12mm.' },
  { category: 'Intonaci e Rasanti', description: 'Intonaco di finitura a grana fine – sacco 25kg', unit: 'sacco', unitCost: 18.00, code: 'INT-FIN-25', notes: 'Stabilitura. Resa ~8m²/sacco a 5mm.' },
  { category: 'Intonaci e Rasanti', description: 'Rasante cementizio fine 0-4mm – sacco 25kg', unit: 'sacco', unitCost: 22.00, code: 'RAS-CEM-25', notes: 'Per finitura levigata prima di pittura. Weber therm.' },
  { category: 'Intonaci e Rasanti', description: 'Rasante in pasta pronto all\'uso – secchio 20kg', unit: 'pz', unitCost: 28.00, code: 'RAS-PAS-20', notes: 'Pronto uso, per piccole stuccature e finiture.' },
  { category: 'Intonaci e Rasanti', description: 'Intonaco al gesso interiore (proiettato) – sacco 30kg', unit: 'sacco', unitCost: 16.00, code: 'INT-GES-30', notes: 'Knauf MP75. Per intonacatura interna rapida.' },
  { category: 'Intonaci e Rasanti', description: 'Intonaco esterno siloxanico colorato – sacco 25kg', unit: 'sacco', unitCost: 38.00, code: 'INT-SIL-25', notes: 'Idrorepellente. Colore personalizzabile. Weber thouse 150.' },
  { category: 'Intonaci e Rasanti', description: 'Posa intonaco interno – m² (manodopera)', unit: 'm²', unitCost: 28.00, code: 'POS-INT-M2', notes: 'Comprende preparazione superficie, 2 mani, allisciatura.' },

  // ─── PITTURA E VERNICIATURA ───────────────────────────────────────────────────
  { category: 'Pittura e Verniciatura', description: 'Pittura lavabile pareti interne bianca – 5L (Caparol Tex)', unit: 'l', unitCost: 5.50, code: 'PIT-LAV-5', notes: 'Caparol Tex Color Weiss. Resa 8-10m²/L. Bauhaus.' },
  { category: 'Pittura e Verniciatura', description: 'Pittura lavabile extra-coprente bianca – 10L', unit: 'l', unitCost: 6.20, code: 'PIT-EXT-10', notes: 'Caparol Indeko plus. Altissima coprenza, 1 mano.' },
  { category: 'Pittura e Verniciatura', description: 'Pittura colorata (tinte personalizzate) – 5L', unit: 'l', unitCost: 9.80, code: 'PIT-COL-5', notes: 'Colore su richiesta. Bauhaus Colorificio. Resa 8m²/L.' },
  { category: 'Pittura e Verniciatura', description: 'Pittura soffitto bianca opaca – 5L', unit: 'l', unitCost: 5.00, code: 'PIT-SOF-5', notes: 'Caparol Disbopaint Weiss. Finissima, coprente.' },
  { category: 'Pittura e Verniciatura', description: 'Pittura per esterni silossanica – 10L', unit: 'l', unitCost: 12.50, code: 'PIT-EST-10', notes: 'Caparol Amphisilan NQG. Resistente UV e pioggia.' },
  { category: 'Pittura e Verniciatura', description: 'Smalto bianco satinato per legno/ferro – 1L', unit: 'l', unitCost: 18.00, code: 'SMA-BIA-1', notes: 'Caparol Capacryl PU-Satin. Per porte, finestre, radiatori.' },
  { category: 'Pittura e Verniciatura', description: 'Tinteggiatura pareti – m² (manodopera 2 mani)', unit: 'm²', unitCost: 12.00, code: 'TIN-PAR-M2', notes: 'Include stuccatura leggera, primer, 2 mani pittura.' },
  { category: 'Pittura e Verniciatura', description: 'Tinteggiatura soffitto – m² (manodopera)', unit: 'm²', unitCost: 14.00, code: 'TIN-SOF-M2', notes: 'Include preparazione, 2 mani. Più impegnativo.' },
  { category: 'Pittura e Verniciatura', description: 'Verniciatura porta interna – pz (2 mani)', unit: 'pz', unitCost: 120.00, code: 'VER-POR-PZ', notes: 'Smalto bianco satinato. Comprende telaio e 2 lati anta.' },
  { category: 'Pittura e Verniciatura', description: 'Verniciatura persiana legno – pz (2 mani)', unit: 'pz', unitCost: 120.00, code: 'VER-PER-PZ', notes: 'Include primer antiruggine + 2 mani smalto.' },
  { category: 'Pittura e Verniciatura', description: 'Verniciatura radiatore – pz', unit: 'pz', unitCost: 65.00, code: 'VER-RAD-PZ', notes: 'Smalto termoresistente. Include carteggiatura.' },
  { category: 'Pittura e Verniciatura', description: 'Stuccatura completa pareti (ciclo completo prima di pittura)', unit: 'm²', unitCost: 18.00, code: 'STU-PAR-M2', notes: 'Stucco vinilico 2 mani, carteggio, primer. Per finitura fine.' },

  // ─── PORTE INTERNE ────────────────────────────────────────────────────────────
  { category: 'Porte Interne', description: 'Porta interna tamburata 80×210cm – bianco laccato (con telaio)', unit: 'pz', unitCost: 420.00, code: 'POR-INT-80', notes: 'Porta tamburata standard. Include telaio fisso e cerniere.' },
  { category: 'Porte Interne', description: 'Porta interna tamburata 90×210cm – bianco (con telaio)', unit: 'pz', unitCost: 450.00, code: 'POR-INT-90', notes: 'Formato bagno/camera principale.' },
  { category: 'Porte Interne', description: 'Porta interna in legno massello rovere 80×210cm', unit: 'pz', unitCost: 850.00, code: 'POR-MAS-80', notes: 'Rovere naturale o tinto. Qualità medio-alta. Include telaio.' },
  { category: 'Porte Interne', description: 'Porta a scorrimento a parete 80×210 – bianco (con controtelaio)', unit: 'pz', unitCost: 680.00, code: 'POR-SCO-80', notes: 'Scompare nella parete. Include controtelaio Eclisse/Scrigno.' },
  { category: 'Porte Interne', description: 'Porta scorrevole binario esterno 80×210 – vetro smerigliato', unit: 'pz', unitCost: 520.00, code: 'POR-VET-80', notes: 'Binario in alluminio a vista. Vetro opaco.' },
  { category: 'Porte Interne', description: 'Maniglia porta interna – set (rosetta + maniglia pz)', unit: 'pz', unitCost: 45.00, code: 'MAN-POR-INT', notes: 'Maniglia in acciaio satinato o cromato. Bauhaus.' },
  { category: 'Porte Interne', description: 'Serratura porta interna a bussola – pz', unit: 'pz', unitCost: 28.00, code: 'SER-POR-INT', notes: 'Catenaccio standard. Bauhaus.' },
  { category: 'Porte Interne', description: 'Montaggio porta interna (con telaio esistente)', unit: 'pz', unitCost: 180.00, code: 'POS-POR-INT', notes: 'Falegname. Regolazione telaio, installazione cerniere, collaudo.' },
  { category: 'Porte Interne', description: 'Montaggio porta interna (nuova muratura + telaio)', unit: 'pz', unitCost: 350.00, code: 'POS-POR-NUO', notes: 'Include muratura apertura + telaio + porta.' },
  { category: 'Porte Interne', description: 'Porta bagno con griglie ventilazione – 80×210', unit: 'pz', unitCost: 380.00, code: 'POR-BAG-GRI', notes: 'Porta con griglia bassa per areazione bagno cieco.' },

  // ─── PORTE BLINDATE ───────────────────────────────────────────────────────────
  { category: 'Porte Blindate', description: 'Porta blindata classe 3 – bianco 90×210 (Dierre)', unit: 'pz', unitCost: 1650.00, code: 'PBL-CL3-90', notes: 'Dierre/Alias. Classe WK3, certificata. Include installazione.' },
  { category: 'Porte Blindate', description: 'Porta blindata classe 4 – noce 90×210', unit: 'pz', unitCost: 2200.00, code: 'PBL-CL4-90', notes: 'Massima sicurezza residenziale. Include controtelaio.' },
  { category: 'Porte Blindate', description: 'Serratura europea aggiuntiva per porta esistente', unit: 'pz', unitCost: 180.00, code: 'SER-AGG-EU', notes: 'Mul-T-Lock/EVVA. Montaggio su porta esistente.' },

  // ─── FINESTRE ─────────────────────────────────────────────────────────────────
  { category: 'Finestre e Serramenti', description: 'Finestra PVC doppio vetro 100×120cm – bianco', unit: 'pz', unitCost: 480.00, code: 'FIN-PVC-100', notes: 'Uw ≤1.4. 2 ante. Include posa e sigillatura.' },
  { category: 'Finestre e Serramenti', description: 'Finestra PVC triplo vetro 100×120cm – bianco', unit: 'pz', unitCost: 650.00, code: 'FIN-PVC-TRI', notes: 'Uw ≤0.9. Ideale per riqualificazione energetica.' },
  { category: 'Finestre e Serramenti', description: 'Finestra alluminio taglio termico 100×120cm', unit: 'pz', unitCost: 780.00, code: 'FIN-ALL-100', notes: 'Alluminio a taglio termico. Più robusto, finitura migliore.' },
  { category: 'Finestre e Serramenti', description: 'Finestra legno-alluminio 100×120cm – high-end', unit: 'pz', unitCost: 1100.00, code: 'FIN-LEA-100', notes: 'Interno legno, esterno alluminio. Standard svizzero top.' },
  { category: 'Finestre e Serramenti', description: 'Velux finestra tetto 78×118cm – doppio vetro', unit: 'pz', unitCost: 780.00, code: 'VEL-TET-78', notes: 'Velux GGL MK04. Include Flash KIT impermeabilizzazione.' },
  { category: 'Finestre e Serramenti', description: 'Davanzale in pietra artificiale 100cm – bianco', unit: 'pz', unitCost: 85.00, code: 'DAV-PIE-100', notes: 'Sporgenza 3cm, con gocciolatoio. Bauhaus area.' },
  { category: 'Finestre e Serramenti', description: 'Davanzale in alluminio verniciato 100cm', unit: 'pz', unitCost: 65.00, code: 'DAV-ALL-100', notes: 'Leggero, anticorrosione.' },
  { category: 'Finestre e Serramenti', description: 'Sostituzione finestra + posa (manodopera)', unit: 'pz', unitCost: 280.00, code: 'POS-FIN-SOI', notes: 'Muratore + falegname. Rimozione vecchia, posa nuova, sigillatura.' },
  { category: 'Finestre e Serramenti', description: 'Zanzariera a rullo per finestra 100×120cm', unit: 'pz', unitCost: 85.00, code: 'ZAN-RUL-100', notes: 'Laterale o frontale. Bauhaus/Jumbo.' },
  { category: 'Finestre e Serramenti', description: 'Tapparella avvolgibile PVC 100×120cm – manuale', unit: 'pz', unitCost: 180.00, code: 'TAP-PVC-100', notes: 'Avvolgibile standard. Include cassonetto.' },
  { category: 'Finestre e Serramenti', description: 'Tapparella avvolgibile motorizzata 100×120cm', unit: 'pz', unitCost: 320.00, code: 'TAP-MOT-100', notes: 'Motore Somfy/Rolladenmotor. Telecomando.' },
  { category: 'Finestre e Serramenti', description: 'Persiana in legno 100×120cm – verniciata', unit: 'pz', unitCost: 280.00, code: 'PER-LEG-100', notes: 'Persiana tradizionale. Include cerniere e fermo.' },

  // ─── SOGLIE E CORNICI ─────────────────────────────────────────────────────────
  { category: 'Soglie e Cornici', description: 'Soglia in marmo/pietra 100cm – bianco', unit: 'pz', unitCost: 65.00, code: 'SOG-MAR-100', notes: 'Soglia d\'ingresso. Marmo bianco levigato.' },
  { category: 'Soglie e Cornici', description: 'Cornice decorativa in gesso 7cm – ml', unit: 'ml', unitCost: 7.50, code: 'COR-GES-7', notes: 'Cornice stucco per soffitto. Posa con colla speciale.' },
  { category: 'Soglie e Cornici', description: 'Coprifilo porta MDF bianco 8cm – ml', unit: 'ml', unitCost: 5.50, code: 'COP-FIL-8', notes: 'Coprigiunto tra telaio porta e parete.' },

  // ─── CONTROSOFFITTI ───────────────────────────────────────────────────────────
  { category: 'Controsoffitti', description: 'Controsoffitto Armstrong tegola 60×60 – m²', unit: 'm²', unitCost: 32.00, code: 'CTF-ARM-60', notes: 'Sistema smontabile. Per locali commerciali/uffici.' },
  { category: 'Controsoffitti', description: 'Travetti in legno decorativi – finti travi ml', unit: 'ml', unitCost: 38.00, code: 'TRA-DEC-ML', notes: 'Travi decorative in poliuretano effetto legno. Leggere.' },
  { category: 'Controsoffitti', description: 'Bussola porta faretti cartongesso – pz', unit: 'pz', unitCost: 4.50, code: 'BUS-FAR-CG', notes: 'Bussola da incasso per faretti LED nel cartongesso.' },

  // ─── SCALE ────────────────────────────────────────────────────────────────────
  { category: 'Scale', description: 'Ringhiera acciaio inox satinato – ml', unit: 'ml', unitCost: 280.00, code: 'RIN-INO-ML', notes: 'Include montanti + corrimano + fissaggi. Produzione su misura.' },
  { category: 'Scale', description: 'Corrimano in legno rovere su parete – ml', unit: 'ml', unitCost: 85.00, code: 'COR-LEG-ML', notes: 'Corrimano legno massello fissato a parete.' },
  { category: 'Scale', description: 'Struttura scala in ferro (interna, dritto)', unit: 'corpo', unitCost: 3200.00, code: 'SCA-FER-INT', notes: 'Struttura portante scala interna. Verniciata a polvere.' },
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
  console.log(`Fase 4 — inseriti: ${inserted} articoli`)
}
main().catch(console.error).finally(() => client.close())
