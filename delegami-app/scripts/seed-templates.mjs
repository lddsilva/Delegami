// Seed quote templates — items ordered logically, grouped by SECTION
import { createClient } from '@libsql/client'
import { config } from 'dotenv'
config({ path: '.env.local' })

const client = createClient({ url: process.env.DATABASE_URL, authToken: process.env.DATABASE_AUTH_TOKEN })
function uid() { return 'c' + Date.now().toString(36) + Math.random().toString(36).slice(2, 10) }
const SEC = (d) => ({ itemType: 'SECTION', description: d, sortOrder: 0 })
const IT = (d, unit, qty, cost, note, url) => ({ itemType: 'ITEM', description: d, unit, quantity: qty, unitCost: cost, unitPrice: cost, directPrice: false, sortOrder: 0, ...(note ? { sourceNote: note } : {}), ...(url ? { sourceUrl: url } : {}) })

// Re-index sortOrder automatically
function items(...rows) {
  return rows.map((r, i) => ({ ...r, sortOrder: i }))
}

const templates = [

  // ─────────────────────────────────────────────────────────────────────────────
  {
    name: 'Ristrutturazione Bagno Completo',
    description: 'Demolizione, impianti, posa piastrelle, sanitari, rubinetteria, finiture',
    category: 'Bagno', emoji: '🛁', sortOrder: 1,
    items: items(
      SEC('Demolizione e Preparazione'),
      IT('Smontaggio sanitari esistenti (WC, lavabo, vasca/doccia)', 'corpo', 1, 320, 'GC Termo-Idraulica — disconnessione idraulica inclusa'),
      IT('Demolizione rivestimento bagno (pareti + pavimento)', 'm²', 16, 22, 'Martello demolitore. Resa ~1.5m²/h'),
      IT('Rimozione e smaltimento macerie', 'corpo', 1, 280, 'Cassonetto 7m³ — Noleggio Attrezzi Ticino SA'),
      IT('Tracce per impianto idraulico e cassette elettriche', 'corpo', 1, 600, 'Include rappezzi stucco'),

      SEC('Impermeabilizzazione e Posa'),
      IT('Impermeabilizzazione doccia (Mapelastic 2 mani)', 'm²', 8, 38, 'Weber Mapelastic — obbligatorio sotto piastrelle doccia. Resa 1L = 1.5m²'),
      IT('Nastro impermeabilizzante angoli doccia', 'pz', 4, 12.50, 'Mapei — angoli e giunti parete-pavimento'),
      IT('Colla C2 per piastrelle (sacco 25kg)', 'sacco', 4, 24, '1 sacco ≈ 4m². C2 bianca per bagno'),
      IT('Posa piastrelle bagno — manodopera', 'm²', 16, 100, 'Include stucco fughe e impermeabilizzazione. Formato fino 60×60'),
      IT('Gres porcellanato 60×60 — fornitura', 'm²', 17, 35, '+6% scarto. Tribeca Bauhaus art. 28795195', 'https://www.bauhaus.ch/it/p/piastrella-in-gres-porcellanato-tribeca-28795195'),
      IT('Stucco fughe 5kg (grigio)', 'sacco', 2, 8.90, 'Mapei Keracolor — fughe 2–12mm. Bauhaus'),

      SEC('Sanitari e Rubinetteria'),
      IT('Telaio Geberit Duofix per WC sospeso h112cm', 'pz', 1, 280, 'Standard CH. Include cassetta ad incasso.', 'https://www.geberit.it/prodotti/sistemi-di-installazione/geberit-duofix/'),
      IT('WC sospeso — fornitura (serie base)', 'pz', 1, 320, 'Geberit Acanto o equivalente. Rimless. Escluso telaio.'),
      IT('Copriwater soft-close', 'pz', 1, 65, 'Universale — Bauhaus'),
      IT('Placca di comando Geberit Sigma20 bianco', 'pz', 1, 85, 'Doppio tasto — risparmio acqua', 'https://www.geberit.it'),
      IT('Lavabo sospeso 55×46cm bianco', 'pz', 1, 160, 'Ideal Standard/Laufen entry'),
      IT('Mobile sottolavabo sospeso 60cm bianco', 'pz', 1, 280, 'IKEA GODMORGON 2 cassetti', 'https://www.ikea.com/ch/it/cat/godmorgon-serie-07583/'),
      IT('Specchio con armadietto LED 80cm', 'pz', 1, 185, 'Illuminazione 4000K — Bauhaus'),
      IT('Box doccia 80×80 porta battente vetro 6mm', 'pz', 1, 380, 'Sanitas Troesch o Bagno Design Lugano', 'https://www.sanitas-troesch.ch'),
      IT('Piatto doccia ultrasottile 80×80 acrilico rinforzato', 'pz', 1, 240, 'Kaldewei/Laufen — spessore 3cm'),
      IT('Miscelatore lavabo monocomando cromato', 'pz', 1, 120, 'Grohe Eurosmart', 'https://www.grohe.it'),
      IT('Set doccia completo (soffione, asta, flessibile)', 'pz', 1, 185, 'Grohe Vitalio Comfort'),
      IT('Piletta scarico doccia Geberit — griglia inox', 'pz', 1, 85, 'Geberit. Sifone sifonato.'),
      IT('Valvola sottolavabo Ø1/2" cromata', 'pz', 2, 22, 'Una per acqua calda, una fredda'),

      SEC('Impianto Idraulico'),
      IT('Installazione completa bagno (manodopera idraulico)', 'corpo', 1, 1800, 'GC Termo-Idraulica — montaggio tutto + collaudo. Solo manodopera, esclusi materiali sopra'),
      IT('Collaudo impianto idrico (prova pressione)', 'corpo', 1, 180, 'Certificato incluso — obbligatorio'),

      SEC('Finiture e Accessori'),
      IT('Aggrappante stabilitura su superfici cartongesso/nuove', 'm²', 16, 8.50, 'Caparol Haftgrund — prima di pittura'),
      IT('Tinteggiatura pareti bagno (2 mani)', 'm²', 16, 12, 'Include primer. Pittura traspirante antimuffa'),
      IT('Set accessori bagno (porta asciugamani, porta carta, ganci)', 'corpo', 1, 145, 'Set coordinato inox — Bauhaus/Sanitas'),
      IT('Montaggio accessori bagno', 'corpo', 1, 180, 'Include foratura, tassellatura, fissaggio'),
      IT('Ventilatore bagno Ø100mm silenzioso (25dB)', 'pz', 1, 55, 'Con timer 15min — Bauhaus'),
      IT('Silicone sanitario bianco (sigillatura perimetri)', 'pz', 3, 8, 'Antibatterico. Doccia, lavabo, WC'),
    ),
  },

  // ─────────────────────────────────────────────────────────────────────────────
  {
    name: 'Ristrutturazione Cucina Completa',
    description: 'Demolizione, impianti, pavimento, montaggio cucina, elettrodomestici, finiture',
    category: 'Cucina', emoji: '🍳', sortOrder: 2,
    items: items(
      SEC('Demolizione e Preparazione'),
      IT('Smontaggio cucina esistente (mobili, piano, elettrodomestici)', 'corpo', 1, 280, 'Falegname + idraulico. Include disconnessione utenze'),
      IT('Rimozione pavimento cucina esistente', 'm²', 14, 18, 'Include trasporto al cassonetto'),
      IT('Rimozione e smaltimento macerie', 'corpo', 1, 280, 'Cassonetto 7m³'),
      IT('Preparazione sottofondo (livellamento + primer)', 'm²', 14, 12, 'Stuccatura crepe, livellamento fino 5mm'),

      SEC('Impianti — Tracce e Rough-in'),
      IT('Tracce impianto elettrico cucina (linee dedicate)', 'corpo', 1, 500, 'Induzione 32A + prese + illuminazione. Include rappezzi'),
      IT('Allacciamento gas piano cottura (se presente)', 'corpo', 1, 180, 'Idraulico abilitato gas. Include collaudo tenuta'),
      IT('Rivelatore gas da parete', 'pz', 1, 55, 'Obbligatorio in CH con apparecchi gas. Ei Electronics'),

      SEC('Pavimenti Cucina'),
      IT('Colla C1 per piastrelle (sacco 25kg)', 'sacco', 3, 14.50, '1 sacco ≈ 5m². Standard per formato 60×60'),
      IT('Posa piastrelle pavimento cucina — manodopera', 'm²', 14, 50, 'Include stucco fughe'),
      IT('Gres 60×60 Active Beige — fornitura (Bauhaus 31365295)', 'm²', 15, 29.95, '+7% scarto. Resistente, facile pulizia', 'https://www.bauhaus.ch/it/p/gres-porcellanato-active-beige-31365295'),
      IT('Stucco fughe grigio 5kg', 'sacco', 1, 8.90, 'Mapei Keracolor — Bauhaus'),
      IT('Paraschizzi piastrelle metro 10×30 (fornitura + posa)', 'ml', 3, 35, 'Stile metro bianco classico. 30cm altezza × lunghezza piano'),

      SEC('Mobili e Piano Cucina'),
      IT('Base cucina 60cm 2 ante IKEA METOD', 'pz', 4, 75, 'Struttura base 60×37×80cm', 'https://www.ikea.com/ch/it/cat/basi-cucina-19218/'),
      IT('Base cucina 80cm IKEA METOD', 'pz', 1, 95, 'Struttura 80cm'),
      IT('Pensile cucina 60cm IKEA METOD', 'pz', 4, 55, 'Altezza 40cm'),
      IT('Frontali basi e pensili IKEA VOXTORP bianco mat', 'pz', 9, 55, 'Per basi 60cm + pensili'),
      IT('Piano cucina laminato 240×60×3.8cm', 'pz', 2, 95, 'Bauhaus — bianco o grigio. Taglio incluso'),
      IT('Alzatina inox o PVC tra piano e parete', 'ml', 5, 25, 'Profilo coprigiunto'),
      IT('Montaggio cucina completa (fino 5m lineari)', 'corpo', 1, 1200, 'Falegname: basi + pensili + piano + frontali + maniglie'),

      SEC('Lavello e Rubinetteria'),
      IT('Lavello inox 1.5 vasche 80×50cm da incasso', 'pz', 1, 180, 'Franke/Blanco — standard'),
      IT('Miscelatore cucina con doccetta estraibile', 'pz', 1, 145, 'Grohe — bocca alta. 2 getti', 'https://www.grohe.it'),
      IT('Montaggio lavello + miscelatore', 'corpo', 1, 150, 'Idraulico: posa, allacciamento, silicone'),

      SEC('Elettrodomestici'),
      IT('Piano cottura a induzione 60cm 4 zone', 'pz', 1, 490, 'Bosch PVS651FB1E — silenzioso, preciso', 'https://www.bosch-home.it'),
      IT('Cappa aspirante da incasso 60cm', 'pz', 1, 320, 'Bosch DWB96DM50 — 660m³/h'),
      IT('Forno elettrico da incasso 60cm multifunzione', 'pz', 1, 380, 'AEG/Electrolux — 70L, 8 funzioni'),
      IT('Lavastoviglie da incasso 60cm 14 coperti', 'pz', 1, 520, 'Bosch SMS4HCB48E — Classe A, 42dB'),
      IT('Frigorifero combinato da incasso 177cm', 'pz', 1, 980, 'Bosch KIN86ADD0 — NoFrost'),
      IT('Allacciamento elettrico elettrodomestici (manodopera)', 'corpo', 1, 300, 'Elettricista: linee dedicate, collaudo'),

      SEC('Finiture'),
      IT('Strip LED sottopensile cucina', 'ml', 3, 22, 'Bianco 4000K, dimmerabile — Bauhaus/IKEA OMLOPP'),
      IT('Alimentatore strip LED 24V', 'pz', 1, 38, 'Per strip sottopensile'),
      IT('Tinteggiatura pareti cucina (2 mani)', 'm²', 20, 12, 'Include primer'),
      IT('Silicone trasparente sigillatura piano e lavello', 'pz', 2, 9.50, 'Neutro — Bauhaus'),
    ),
  },

  // ─────────────────────────────────────────────────────────────────────────────
  {
    name: 'Posa Piastrelle',
    description: 'Preparazione sottofondo, fornitura e posa gres, battiscopa',
    category: 'Pavimenti', emoji: '🪟', sortOrder: 3,
    items: items(
      SEC('Preparazione'),
      IT('Rimozione pavimento esistente', 'm²', 30, 18, 'Include trasporto al cassonetto. Escluso smaltimento'),
      IT('Preparazione sottofondo (livellamento + stuccatura)', 'm²', 30, 12, 'Stuccatura crepe, livellamento fino 5mm, primer'),
      IT('Primer consolidante sottofondi', 'l', 4, 12.50, 'Weber prim 801. Resa ~8m²/L'),

      SEC('Posa e Collanti'),
      IT('Colla per piastrelle C2 — sacco 25kg', 'sacco', 7, 24, '1 sacco ≈ 4–5m². C2 migliorata per grande formato. Weber/Mapei'),
      IT('Sistema livellazione piastrelle Raimondi (kit 100pz)', 'pz', 1, 28, 'Essenziale per formato >60×60 — riduce lippage'),
      IT('Posa piastrelle fino 60×60cm — manodopera', 'm²', 30, 50, 'Include stucco fughe. Corridoi e locali standard'),
      IT('Stucco fughe 5kg grigio', 'sacco', 3, 8.90, 'Mapei Keracolor — fughe 2–12mm'),

      SEC('Materiale (da personalizzare)'),
      IT('Gres 60×60 Active Beige — fornitura (Bauhaus 31365295)', 'm²', 32, 29.95, '+7% scarto. Prezzo riferimento', 'https://www.bauhaus.ch/it/p/gres-porcellanato-active-beige-31365295'),

      SEC('Battiscopa e Finiture'),
      IT('Battiscopa laminato 58×18mm Rovere Firenze (Bauhaus 31158811)', 'ml', 40, 4.96, 'Logoclic. Link prodotto', 'https://www.bauhaus.ch/it/p/logoclic-battiscopa-rovere-firenze-31158811'),
      IT('Posa battiscopa', 'ml', 40, 4.55, 'Incluso taglio e colla. CHF 500 per 110ml'),
      IT('Profili di transizione alluminio 38mm', 'pz', 2, 5.50, 'Raccordo tra due pavimenti diversi'),
    ),
  },

  // ─────────────────────────────────────────────────────────────────────────────
  {
    name: 'Tinteggiatura Appartamento',
    description: 'Pareti, soffitti, porte e persiane — ciclo completo',
    category: 'Pittura', emoji: '🎨', sortOrder: 4,
    items: items(
      SEC('Preparazione Superfici'),
      IT('Stuccatura leggera (raccordi, crepe, tracce elettriche)', 'm²', 120, 6, 'Solo zone interessate da lavorazioni. Stucco vinilico'),
      IT('Primer acrilico universale pareti', 'l', 15, 3.50, 'Caparol Tiefgrund. Resa 8–10m²/L. Prima mano su intonaco nuovo'),

      SEC('Tinteggiatura Pareti e Soffitti'),
      IT('Pittura lavabile bianca pareti (2 mani)', 'm²', 200, 5.50, 'Caparol Tex Color. Resa 8m²/L. Prezzo materiale/m²'),
      IT('Tinteggiatura pareti — manodopera (2 mani)', 'm²', 200, 12, 'Include protezione pavimenti e mobili'),
      IT('Pittura soffitto bianca opaca (2 mani)', 'm²', 80, 5, 'Caparol Disbopaint. Resa 8m²/L'),
      IT('Tinteggiatura soffitti — manodopera (2 mani)', 'm²', 80, 14, 'Più impegnativa delle pareti (+20%)'),

      SEC('Porte Interne e Infissi'),
      IT('Verniciatura porta interna — smalto satinato (2 mani)', 'pz', 6, 120, 'Include telaio e 2 lati anta. Caparol Capacryl PU-Satin'),
      IT('Verniciatura persiana legno (2 mani)', 'pz', 6, 120, 'Include primer antiruggine + 2 mani smalto'),

      SEC('Materiali Pittura'),
      IT('Smalto bianco satinato per legno 1L', 'l', 4, 18, 'Caparol Capacryl PU-Satin. Per porte, finestre, battiscopa'),
      IT('Nastro mascheratura 50mm', 'pz', 6, 3.50, 'Per protezione bordi e cornici — Bauhaus'),
      IT('Teli protezione pavimento', 'm²', 100, 1.20, 'Film polietilene'),
    ),
  },

  // ─────────────────────────────────────────────────────────────────────────────
  {
    name: 'Rifacimento Impianto Elettrico',
    description: 'Sostituzione tubazioni esistenti, ricablaggio, quadro',
    category: 'Impianti', emoji: '⚡', sortOrder: 5,
    items: items(
      SEC('Demolizione e Tracce'),
      IT('Apertura tracce a parete per nuove tubazioni', 'corpo', 1, 800, 'Include rappezzi stucco dopo passaggio cavi'),
      IT('Rimozione impianto elettrico esistente', 'corpo', 1, 400, 'Smontaggio vecchi cavi, cassette, interruttori'),

      SEC('Tubazioni e Cavi'),
      IT('Tubo corrugato Ø20mm per cavi — fornitura', 'ml', 200, 0.95, 'Protezione cavi in traccia. Bauhaus'),
      IT('Cavo NY-M 3×1.5mm² (illuminazione)', 'ml', 150, 1.80, 'Per circuiti luce 16A. Bauhaus'),
      IT('Cavo NY-M 3×2.5mm² (prese 16A)', 'ml', 200, 2.20, 'Per prese standard. Bauhaus'),
      IT('Cavo NY-M 3×4mm² (prese pesanti/forno)', 'ml', 50, 3.20, 'Per prese 20A, piano cottura, lavatrice'),

      SEC('Apparecchi e Quadro'),
      IT('Cassette da incasso 3 moduli (fornitura)', 'pz', 20, 3.80, 'Scatole incasso 60mm — Bauhaus'),
      IT('Interruttore semplice con placca Feller EDIZIOdue', 'pz', 12, 18, 'Standard CH. Feller'),
      IT('Presa bipasso+terra con placca Feller', 'pz', 15, 22, 'Presa tipo 13 CH + bipasso. Feller'),
      IT('Sostituzione quadro elettrico (fino 24 moduli)', 'corpo', 1, 980, 'Nuovo quadro: interruttori magnetotermici + differenziali. CEI conforme'),

      SEC('Manodopera'),
      IT('Rifacimento impianto elettrico appartamento (fino 80m²)', 'corpo', 1, 4500, 'Elettricista abilitato. Comprende tracce, cavi, scatole, interruttori, prese, quadro. Esclusa tinteggiatura'),
      IT('Collaudo e certificazione impianto elettrico', 'corpo', 1, 350, 'Certificato di conformità — obbligatorio in CH'),
    ),
  },

  // ─────────────────────────────────────────────────────────────────────────────
  {
    name: 'Opere Murarie — Apertura/Chiusura Porte',
    description: 'Apertura nuove porte, chiusura esistenti, intonaco e finiture',
    category: 'Muratura', emoji: '🧱', sortOrder: 6,
    items: items(
      SEC('Demolizione'),
      IT('Apertura nuova porta in parete non portante', 'corpo', 1, 800, 'Include demolizione, telaio metallico, rappezzi intonaco'),
      IT('Apertura nuova porta in muratura portante', 'corpo', 1, 1800, 'Include puntellamento, demolizione, architrave, rappezzi'),
      IT('Chiusura vano porta esistente — muratura e intonaco', 'corpo', 1, 1300, 'Include demolizione telaio, muratura laterizio, intonaco, raccordo pavimento'),
      IT('Rimozione e smaltimento macerie', 'corpo', 1, 180, 'Carico e trasporto — piccola quantità'),

      SEC('Porte Interne'),
      IT('Porta interna tamburata 80×210cm bianco con telaio', 'pz', 1, 420, 'Include telaio fisso e cerniere'),
      IT('Porta interna tamburata 90×210cm bianco con telaio', 'pz', 1, 450, 'Formato bagno/camera principale'),
      IT('Maniglia porta interna — set (rosetta + maniglia)', 'pz', 1, 45, 'Acciaio satinato — Bauhaus'),
      IT('Montaggio porta interna con telaio esistente', 'pz', 1, 180, 'Falegname: regolazione telaio, cerniere, collaudo'),

      SEC('Intonaci e Finiture'),
      IT('Intonaco di finitura a grana fine (sacco 25kg)', 'sacco', 3, 18, 'Stabilitura. Resa ~8m²/sacco a 5mm'),
      IT('Rasante cementizio fine (sacco 25kg)', 'sacco', 2, 22, 'Per finitura levigata prima di pittura'),
      IT('Primer acrilico prima di pittura', 'l', 3, 3.50, 'Caparol Tiefgrund'),
      IT('Tinteggiatura zona (2 mani)', 'm²', 20, 12, 'Solo zone interessate dai lavori'),
    ),
  },

  // ─────────────────────────────────────────────────────────────────────────────
  {
    name: 'Sostituzione Finestre e Infissi',
    description: 'Rimozione infissi, nuove finestre PVC triplo vetro, davanzali',
    category: 'Infissi', emoji: '🪟', sortOrder: 7,
    items: items(
      SEC('Rimozione'),
      IT('Rimozione finestre esistenti', 'pz', 5, 80, 'Include sigillatura provvisoria durante attesa consegna'),
      IT('Rimozione persiane/tapparelle esistenti', 'pz', 5, 60, ''),

      SEC('Nuove Finestre'),
      IT('Finestra PVC triplo vetro 100×120cm — fornitura', 'pz', 4, 650, 'Uw ≤0.9. Classe energetica A. 2 ante'),
      IT('Finestra PVC triplo vetro 80×120cm — fornitura', 'pz', 1, 580, 'Formato bagno'),
      IT('Posa finestra + sigillatura (manodopera)', 'pz', 5, 280, 'Muratore + falegname: rimozione vecchia, posa nuova, schiuma poliuretanica, sigillatura'),
      IT('Schiuma poliuretanica espandente 750ml', 'pz', 5, 8.50, 'Sigillatura interstizi. Bauhaus'),

      SEC('Accessori e Finiture'),
      IT('Davanzale in pietra artificiale 100cm', 'pz', 4, 85, 'Sporgenza 3cm, gocciolatoio'),
      IT('Davanzale in pietra artificiale 80cm', 'pz', 1, 70, ''),
      IT('Zanzariera a rullo 100×120cm', 'pz', 4, 85, 'Bauhaus/Jumbo'),
      IT('Tapparella avvolgibile PVC motorizzata 100×120cm', 'pz', 5, 320, 'Motore Somfy. Telecomando'),
      IT('Rappezzi intonaco intorno ai nuovi telai', 'corpo', 1, 350, 'Muratore: stuccatura perimetrale interno + esterno'),
      IT('Tinteggiatura zona finestre (2 mani)', 'm²', 30, 12, ''),
    ),
  },

  // ─────────────────────────────────────────────────────────────────────────────
  {
    name: 'Controparete Cartongesso',
    description: 'Controparete singola o doppia lastra con isolazione acustica',
    category: 'Strutture', emoji: '🏗️', sortOrder: 8,
    items: items(
      SEC('Materiali Struttura'),
      IT('Profilo U 75mm — guida (fornitura)', 'ml', 40, 1.80, 'Acciaio zincato — Knauf', 'https://www.knauf.it'),
      IT('Profilo C 75mm — anima (fornitura)', 'ml', 80, 2.20, 'Knauf — passo 60cm'),
      IT('Lastra cartongesso BA13 250×120cm (fornitura)', 'pz', 20, 9.80, 'Knauf GKB 13mm — parete standard'),
      IT('Lastra cartongesso idrofugo BA13H verde (fornitura)', 'pz', 8, 12.50, 'Knauf GKBI — per bagni e cucine'),
      IT('Lana di roccia 50mm (isolazione acustica)', 'm²', 25, 12, 'Rockwool Rockboard 035 — tra le lastre', 'https://www.rockwool.com/it'),

      SEC('Materiali Finitura'),
      IT('Viti per cartongesso 3.5×35mm — box 1000pz', 'pz', 2, 8.50, 'Viti fosfatate — Bauhaus'),
      IT('Nastro carta per giunti 50m', 'pz', 2, 4.80, 'Knauf — per stuccatura giunti'),
      IT('Stucco per giunti cartongesso 5kg', 'pz', 3, 14.50, 'Knauf Fugenfüller HP'),

      SEC('Manodopera'),
      IT('Controparete singola lastra — manodopera', 'm²', 25, 65, 'Include profili U+C, lastra, stuccatura'),
      IT('Aggrappante su cartongesso nuovo', 'm²', 25, 8.50, 'Prima di pittura — Caparol Haftgrund'),
      IT('Tinteggiatura nuova controparete (2 mani)', 'm²', 25, 12, ''),
    ),
  },

  // ─────────────────────────────────────────────────────────────────────────────
  {
    name: 'Posa Parquet Laminato',
    description: 'Rimozione vecchio pavimento, sottofondo, laminato e battiscopa',
    category: 'Pavimenti', emoji: '🪵', sortOrder: 9,
    items: items(
      SEC('Preparazione'),
      IT('Rimozione pavimento esistente (laminato/vinile)', 'm²', 40, 8, 'Rimozione rapida click — include trasporto'),
      IT('Preparazione sottofondo (livellamento e stuccatura)', 'm²', 40, 12, 'Stuccatura crepe, livellamento fino 5mm'),
      IT('Massetto autolivellante fino 10mm', 'm²', 40, 22, 'Solo se piano molto irregolare — include materiale + posa'),
      IT('Telo barriera vapore PE 0.2mm', 'm²', 42, 0.90, 'Sotto laminato su massetto. Bauhaus'),

      SEC('Materiale Pavimento'),
      IT('Laminato AC5 8mm effetto rovere chiaro — fornitura', 'm²', 40, 18, 'Quick-Step/Pergo. Resistente uso intensivo. Bauhaus'),
      IT('Pannello isolamento acustico 3mm PE', 'm²', 42, 1.80, 'Polietilene espanso — riduzione calpestio. +5% su m²'),

      SEC('Posa'),
      IT('Posa laminato flottante — manodopera', 'm²', 40, 25, 'Sistema click, rapido'),

      SEC('Battiscopa e Finiture'),
      IT('Battiscopa laminato 58×18mm Rovere Firenze', 'ml', 50, 4.96, 'Logoclic Bauhaus art. 31158811', 'https://www.bauhaus.ch/it/p/logoclic-battiscopa-rovere-firenze-31158811'),
      IT('Posa battiscopa', 'ml', 50, 4.55, 'Incluso taglio e colla'),
      IT('Profilo transizione alluminio 38mm', 'pz', 3, 5.50, 'Raccordo tra pavimenti diversi'),
    ),
  },

  // ─────────────────────────────────────────────────────────────────────────────
  {
    name: 'Ristrutturazione Completa Appartamento',
    description: 'Template completo: bagno, cucina, pavimenti, pittura, impianti',
    category: 'Completa', emoji: '🏠', sortOrder: 10,
    items: items(
      SEC('Demolizioni Generali'),
      IT('Smontaggio sanitari bagno', 'corpo', 1, 320, ''),
      IT('Smontaggio cucina esistente', 'corpo', 1, 280, ''),
      IT('Rimozione pavimenti (tutto appartamento)', 'm²', 60, 18, ''),
      IT('Rimozione macerie (cassonetto 10m³)', 'corpo', 1, 380, 'Noleggio Attrezzi Ticino SA'),

      SEC('Impianti Rough-in'),
      IT('Tracce impianto elettrico appartamento', 'corpo', 1, 1200, 'Tutti gli ambienti — include rappezzi'),
      IT('Tracce e spostamenti impianto idraulico', 'corpo', 1, 800, 'Bagno + cucina'),
      IT('Nuovo quadro elettrico 24 moduli', 'corpo', 1, 980, 'CEI conforme + certificazione'),

      SEC('Pavimenti — Tutto Appartamento'),
      IT('Posa piastrelle bagno + cucina', 'm²', 25, 75, 'Media pesata (bagno 100/m², cucina 50/m²)'),
      IT('Gres 60×60 fornitura (bagno+cucina)', 'm²', 27, 32, '+7% scarto — media tra tipi'),
      IT('Posa parquet laminato (soggiorno+camere)', 'm²', 35, 25, 'Sistema click'),
      IT('Laminato AC5 8mm fornitura', 'm²', 37, 18, ''),
      IT('Battiscopa laminato 58mm', 'ml', 80, 4.96, 'Logoclic Bauhaus', 'https://www.bauhaus.ch/it/p/logoclic-battiscopa-rovere-firenze-31158811'),
      IT('Posa battiscopa', 'ml', 80, 4.55, ''),

      SEC('Bagno'),
      IT('Impermeabilizzazione doccia', 'm²', 8, 38, 'Mapelastic'),
      IT('Posa piastrelle bagno (manodopera)', 'm²', 16, 100, ''),
      IT('Telaio Geberit Duofix + WC sospeso + placca', 'corpo', 1, 685, 'Geberit: telaio 280 + WC 320 + placca Sigma20 85'),
      IT('Lavabo + mobile 60cm + specchio LED', 'corpo', 1, 665, 'IKEA GODMORGON + Bauhaus'),
      IT('Box doccia 80×80 + piatto + rubinetteria', 'corpo', 1, 1005, 'Box 380 + piatto 240 + Grohe 185 + piletta 85 + valvole 85 + ..'),
      IT('Installazione impianto idraulico bagno', 'corpo', 1, 1800, 'GC Termo-Idraulica'),

      SEC('Cucina'),
      IT('Cucina IKEA METOD completa (basi + pensili + piani)', 'corpo', 1, 1500, 'Fornitura struttura — esclusi frontali'),
      IT('Frontali cucina VOXTORP', 'corpo', 1, 600, 'Fornitura — per ~10 ante'),
      IT('Elettrodomestici cucina (induzione+forno+cappa+lavastovig+frigo)', 'corpo', 1, 2690, 'Bosch: 490+380+320+520+980'),
      IT('Montaggio cucina completa', 'corpo', 1, 1200, 'Falegname — fino 5m lineari'),
      IT('Allacciamenti cucina (elettrico+idraulico)', 'corpo', 1, 550, 'Elettricista 300 + Idraulico 250'),

      SEC('Pittura'),
      IT('Tinteggiatura pareti + soffitti appartamento (2 mani)', 'm²', 280, 12, 'Include primer — tutto l\'appartamento'),
      IT('Verniciatura porte interne', 'pz', 5, 120, 'Smalto satinato'),

      SEC('Finiture e Complementi'),
      IT('Silicone e sigillature varie', 'corpo', 1, 150, 'Bagno, cucina, finestre'),
      IT('Pulizia fine cantiere', 'corpo', 1, 480, 'Appartamento fino 80m² — ditta specializzata'),
    ),
  },
]

async function main() {
  const now = new Date().toISOString()
  let inserted = 0
  for (const t of templates) {
    const id = uid()
    await client.execute({
      sql: `INSERT INTO quote_templates (id, name, description, category, emoji, sortOrder, itemsJson, isActive, createdAt, updatedAt)
            VALUES (?,?,?,?,?,?,?,1,?,?)`,
      args: [id, t.name, t.description ?? null, t.category, t.emoji, t.sortOrder, JSON.stringify(t.items), now, now],
    })
    console.log(`  ✓ ${t.emoji} ${t.name} (${t.items.length} voci)`)
    inserted++
  }
  console.log(`\nInseriti: ${inserted} templates`)
}
main().catch(console.error).finally(() => client.close())
