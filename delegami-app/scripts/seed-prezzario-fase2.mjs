// Fase 2 — Bagno completo (~100 items)
import { createClient } from '@libsql/client'
import { config } from 'dotenv'
config({ path: '.env.local' })

const client = createClient({ url: process.env.DATABASE_URL, authToken: process.env.DATABASE_AUTH_TOKEN })
function uid() { return 'c' + Date.now().toString(36) + Math.random().toString(36).slice(2, 10) }

const items = [
  // ─── WC ──────────────────────────────────────────────────────────────────────
  { category: 'Sanitari – WC', description: 'WC sospeso monoblocco qualità base – bianco', unit: 'pz', unitCost: 280.00, code: 'WC-SOS-BASE', notes: 'Geberit/Laufen/Ideal Standard entry level. Escluso telaio Duofix.' },
  { category: 'Sanitari – WC', description: 'WC sospeso Geberit Acanto – bianco', unit: 'pz', unitCost: 420.00, code: 'WC-GEB-ACA', notes: 'Geberit Acanto. Link: https://www.geberit.it/prodotti/prodotti-per-l-arredobagno/wc/wc-sospeso-acanto/' },
  { category: 'Sanitari – WC', description: 'WC a pavimento monoblocco con cassetta – standard', unit: 'pz', unitCost: 320.00, code: 'WC-PAV-MON', notes: 'Soluzione economica, installazione più semplice. No telaio.' },
  { category: 'Sanitari – WC', description: 'WC a pavimento con cassetta alta a zaino', unit: 'pz', unitCost: 280.00, code: 'WC-PAV-ZAI', notes: 'Cassetta a zaino, senza cisterna a vista.' },
  { category: 'Sanitari – WC', description: 'WC sospeso Villeroy & Boch Subway 2.0', unit: 'pz', unitCost: 580.00, code: 'WC-VB-SUB2', notes: 'Premium. Villeroy & Boch. Rimless (senza bordo interno). Link: https://www.villeroy-boch.com' },
  { category: 'Sanitari – WC', description: 'WC sospeso Duravit D-Neo – Rimless', unit: 'pz', unitCost: 490.00, code: 'WC-DUR-DNE', notes: 'Duravit D-Neo. Rimless. Fissaggio nascosto. Link: https://www.duravit.it' },
  { category: 'Sanitari – WC', description: 'Copriwater soft-close universale – bianco', unit: 'pz', unitCost: 65.00, code: 'CPW-SC-UNI', notes: 'Compatibile con la maggior parte dei WC. Bauhaus/Amazon.' },
  { category: 'Sanitari – WC', description: 'Copriwater Geberit Acanto soft-close', unit: 'pz', unitCost: 120.00, code: 'CPW-GEB-ACA', notes: 'Originale Geberit, abbinato alla serie Acanto.' },
  { category: 'Sanitari – WC', description: 'Telaio Geberit Duofix per WC sospeso – h112cm', unit: 'pz', unitCost: 280.00, code: 'TEL-GEB-DUO', notes: 'Standard de facto CH. Altezza 112cm. Include cassetta ad incasso. Link: https://www.geberit.it/prodotti/sistemi-di-installazione/geberit-duofix/' },
  { category: 'Sanitari – WC', description: 'Telaio Geberit Duofix per WC sospeso – h82cm', unit: 'pz', unitCost: 265.00, code: 'TEL-GEB-82', notes: 'Versione ridotta h82, per spazi bassi.' },
  { category: 'Sanitari – WC', description: 'Cassetta di risciacquo ad incasso Geberit Sigma', unit: 'pz', unitCost: 180.00, code: 'CAS-GEB-SIG', notes: 'Solo cassetta (senza telaio). Doppio tasto risparmio acqua.' },
  { category: 'Sanitari – WC', description: 'Placca di comando WC Geberit Sigma20 – bianco', unit: 'pz', unitCost: 85.00, code: 'PLA-GEB-S20', notes: 'Placca a 2 pulsanti, montaggio su telaio Duofix. Link: https://www.geberit.it' },
  { category: 'Sanitari – WC', description: 'Placca di comando WC Geberit Sigma30 – cromo', unit: 'pz', unitCost: 145.00, code: 'PLA-GEB-S30', notes: 'Versione premium cromata.' },
  { category: 'Sanitari – WC', description: 'Montaggio WC sospeso (incluso telaio, collaudo)', unit: 'pz', unitCost: 280.00, code: 'POS-WC-SOS', notes: 'Manodopera idraulico: montaggio telaio + WC + collaudo scarico.' },
  { category: 'Sanitari – WC', description: 'Montaggio WC a pavimento', unit: 'pz', unitCost: 180.00, code: 'POS-WC-PAV', notes: 'Manodopera idraulico. Più rapido del sospeso.' },

  // ─── LAVABI ───────────────────────────────────────────────────────────────────
  { category: 'Sanitari – Lavabi', description: 'Lavabo da incasso rettangolare 60×46 – bianco', unit: 'pz', unitCost: 180.00, code: 'LAV-INC-60', notes: 'Ceramica standard. Ideal Standard/Laufen.' },
  { category: 'Sanitari – Lavabi', description: 'Lavabo sospeso 55×46 – bianco', unit: 'pz', unitCost: 160.00, code: 'LAV-SOS-55', notes: 'Senza piano, look minimalista.' },
  { category: 'Sanitari – Lavabi', description: 'Lavabo da appoggio tondo Ø38 – design', unit: 'pz', unitCost: 220.00, code: 'LAV-APP-38', notes: 'Da appoggio su piano mobile. Duravit, Villeroy.' },
  { category: 'Sanitari – Lavabi', description: 'Mobile lavabo IKEA ÄNGSJÖN + lavabo BACKSJÖN 80cm', unit: 'pz', unitCost: 517.00, code: '195.211.23', notes: 'IKEA ÄNGSJÖN + BACKSJÖN 80cm. Link: https://www.ikea.com/ch/it/p/aengsjoen-backsjoen-mobile-lavabo-cassetti-lavabo-misc-s19521123/' },
  { category: 'Sanitari – Lavabi', description: 'Mobile lavabo IKEA GODMORGON + lavabo 60cm', unit: 'pz', unitCost: 380.00, code: 'IK-GOD-60', notes: 'IKEA GODMORGON, 2 cassetti, bianco. Link: https://www.ikea.com/ch/it/cat/godmorgon-serie-07583/' },
  { category: 'Sanitari – Lavabi', description: 'Colonna lavabo – copri sifone ceramica', unit: 'pz', unitCost: 95.00, code: 'COL-LAV', notes: 'Per lavabo a colonna classico.' },
  { category: 'Sanitari – Lavabi', description: 'Montaggio lavabo sospeso', unit: 'pz', unitCost: 120.00, code: 'POS-LAV-SOS', notes: 'Idraulico: fissaggio, allacciamento acqua calda/fredda, sifone.' },
  { category: 'Sanitari – Lavabi', description: 'Montaggio lavabo da incasso su piano', unit: 'pz', unitCost: 95.00, code: 'POS-LAV-INC', notes: 'Su mobile esistente.' },

  // ─── BIDET ────────────────────────────────────────────────────────────────────
  { category: 'Sanitari – Bidet', description: 'Bidet a pavimento ceramica – bianco', unit: 'pz', unitCost: 220.00, code: 'BID-PAV-CER', notes: 'Serie abbinata al WC. Ideal Standard/Laufen.' },
  { category: 'Sanitari – Bidet', description: 'Bidet sospeso – bianco', unit: 'pz', unitCost: 280.00, code: 'BID-SOS-CER', notes: 'Sospeso, abbinabile a WC sospeso.' },
  { category: 'Sanitari – Bidet', description: 'Telaio Geberit Duofix per bidet sospeso', unit: 'pz', unitCost: 240.00, code: 'TEL-GEB-BID', notes: 'Telaio specifico per bidet sospeso.' },
  { category: 'Sanitari – Bidet', description: 'Montaggio bidet a pavimento', unit: 'pz', unitCost: 150.00, code: 'POS-BID-PAV', notes: 'Idraulico. Include allacciamento rubinetteria.' },

  // ─── BOX DOCCIA E PIATTI ──────────────────────────────────────────────────────
  { category: 'Docce e Box', description: 'Piatto doccia ceramica rettangolare 80×80 – bianco', unit: 'pz', unitCost: 180.00, code: 'PIA-DOC-80', notes: 'Ceramica smaltata. Altezza 5.5cm.' },
  { category: 'Docce e Box', description: 'Piatto doccia ultrasottile 90×90 – acrilico rinforzato', unit: 'pz', unitCost: 240.00, code: 'PIA-DOC-90', notes: 'Spessore 3cm. Filo pavimento con scarico. Kaldewei, Laufen.' },
  { category: 'Docce e Box', description: 'Piatto doccia 120×80 – acrilico rinforzato', unit: 'pz', unitCost: 290.00, code: 'PIA-DOC-120', notes: 'Grande formato. Kaldewei/Ideal Standard.' },
  { category: 'Docce e Box', description: 'Box doccia 80×80 scorrevole – vetro 6mm', unit: 'pz', unitCost: 380.00, code: 'BOX-DOC-80', notes: 'Box ante scorrevoli, vetro temperato 6mm. Sanitas/Bagno Design.' },
  { category: 'Docce e Box', description: 'Box doccia 90×90 porta battente – vetro 8mm', unit: 'pz', unitCost: 450.00, code: 'BOX-DOC-90', notes: 'Profilo alluminio cromato. Vetro 8mm sicurezza.' },
  { category: 'Docce e Box', description: 'Box doccia 120×80 – porta battente vetro 8mm', unit: 'pz', unitCost: 520.00, code: 'BOX-DOC-120', notes: 'Dimensione confortevole per doccia principale. Sanitas Troesch area.' },
  { category: 'Docce e Box', description: 'Parete doccia Walk-in 90cm – vetro 8mm anticalcare', unit: 'pz', unitCost: 420.00, code: 'WAL-IN-90', notes: 'Design minimale, senza profili laterali. Trend moderno.' },
  { category: 'Docce e Box', description: 'Parete doccia Walk-in 120cm – vetro 10mm', unit: 'pz', unitCost: 580.00, code: 'WAL-IN-120', notes: 'Premium. Vetro extra-spesso 10mm, più stabile.' },
  { category: 'Docce e Box', description: 'Doccia a pioggia a filo pavimento – scarico lineare', unit: 'pz', unitCost: 650.00, code: 'DOC-FIL-PAV', notes: 'Soluzione walk-in senza box. Richiede impermeabilizzazione estesa.' },
  { category: 'Docce e Box', description: 'Piletta scarico doccia Geberit – bordo rete inox', unit: 'pz', unitCost: 85.00, code: 'PIL-GEB-RET', notes: 'Geberit. Griglia inox estraibile. Sifone sifonato.' },
  { category: 'Docce e Box', description: 'Scarico lineare 80cm inox – per doccia filo pavimento', unit: 'pz', unitCost: 180.00, code: 'SCA-LIN-80', notes: 'Canale doccia a fessura. ACO/Geberit/Schlüter Kerdi-Line.' },
  { category: 'Docce e Box', description: 'Sifone scarico doccia Ø90 – universale', unit: 'pz', unitCost: 45.00, code: 'SIF-DOC-90', notes: 'Compatibile con piatto standard. Geberit/Viega.' },
  { category: 'Docce e Box', description: 'Montaggio box doccia + piatto', unit: 'pz', unitCost: 320.00, code: 'POS-BOX-DOC', notes: 'Idraulico: posizionamento piatto, montaggio box, silicone perimetrale, collaudo.' },
  { category: 'Docce e Box', description: 'Vasca da bagno acrilica 170×75 – bianco', unit: 'pz', unitCost: 480.00, code: 'VAS-ACR-170', notes: 'Vasca standard. Kaldewei, Laufen, Ideal Standard.' },
  { category: 'Docce e Box', description: 'Vasca freestanding ovale 170×80 – qualità design', unit: 'pz', unitCost: 1200.00, code: 'VAS-FRE-170', notes: 'Vasca isolata centro bagno. Kaldewei Meisterstück.' },
  { category: 'Docce e Box', description: 'Pannello laterale vasca 170cm – acrilico', unit: 'pz', unitCost: 95.00, code: 'PAN-VAS-170', notes: 'Chiusura laterale vasca incassata.' },
  { category: 'Docce e Box', description: 'Montaggio vasca da bagno', unit: 'pz', unitCost: 250.00, code: 'POS-VAS-BAG', notes: 'Idraulico: posizionamento, scarico, rubinetteria, collaudo.' },

  // ─── RUBINETTERIA ─────────────────────────────────────────────────────────────
  { category: 'Rubinetteria', description: 'Miscelatore lavabo monocomando – cromato (Grohe Eurosmart)', unit: 'pz', unitCost: 120.00, code: 'MIS-LAV-EUS', notes: 'Grohe Eurosmart. Standard qualità. Link: https://www.grohe.it' },
  { category: 'Rubinetteria', description: 'Miscelatore lavabo monocomando – cromato (entry)', unit: 'pz', unitCost: 65.00, code: 'MIS-LAV-ENT', notes: 'Qualità base. Hansgrohe Logis/Ideal Standard.' },
  { category: 'Rubinetteria', description: 'Miscelatore lavabo alto – per lavabo freestanding', unit: 'pz', unitCost: 220.00, code: 'MIS-LAV-ALT', notes: 'Bocca alta per lavabi da appoggio. Hansgrohe/Grohe.' },
  { category: 'Rubinetteria', description: 'Miscelatore bidet monocomando – cromato', unit: 'pz', unitCost: 110.00, code: 'MIS-BID-MON', notes: 'Abbinabile al miscelatore lavabo della stessa serie.' },
  { category: 'Rubinetteria', description: 'Miscelatore vasca/doccia a parete – Grohe Eurostyle', unit: 'pz', unitCost: 185.00, code: 'MIS-VAS-PAR', notes: 'Corpo incasso non incluso (separato). Solo parte vista.' },
  { category: 'Rubinetteria', description: 'Corpo incasso per miscelatore a parete', unit: 'pz', unitCost: 75.00, code: 'COR-INC-PAR', notes: 'Corpo meccanico da murare. Geberit/Grohe.' },
  { category: 'Rubinetteria', description: 'Colonna doccia termostatica Grohe Rainshower', unit: 'pz', unitCost: 420.00, code: 'COL-DOC-TER', notes: 'Termostatica, soffione + doccetta. Grohe Rainshower System 400. Link: https://www.grohe.it' },
  { category: 'Rubinetteria', description: 'Soffione doccia tondo Ø25cm – cromato', unit: 'pz', unitCost: 85.00, code: 'SOF-DOC-25', notes: 'Soffione a soffitto o braccio. Grohe/Hansgrohe.' },
  { category: 'Rubinetteria', description: 'Braccio doccia a soffitto 30cm – cromato', unit: 'pz', unitCost: 45.00, code: 'BRA-DOC-SOF', notes: 'Per soffione da soffitto.' },
  { category: 'Rubinetteria', description: 'Set doccia (soffione, doccetta, asta, flessibile) – Grohe', unit: 'pz', unitCost: 185.00, code: 'SET-DOC-GRO', notes: 'Grohe Vitalio Comfort System. Tutto incluso.' },
  { category: 'Rubinetteria', description: 'Flessibile doccia 150cm – inox antitorcitura', unit: 'pz', unitCost: 18.00, code: 'FLE-DOC-150', notes: 'Ricambio standard. Bauhaus.' },
  { category: 'Rubinetteria', description: 'Portasapone liquido da parete – inox', unit: 'pz', unitCost: 28.00, code: 'POR-SAP-PAR', notes: 'Dispenser da fissare a parete. Sanitas/Bauhaus.' },

  // ─── SPECCHI E MOBILI BAGNO ───────────────────────────────────────────────────
  { category: 'Mobili Bagno', description: 'Specchio bagno 80×60cm – bordo lucido', unit: 'pz', unitCost: 85.00, code: 'SPE-80-60', notes: 'Specchio semplice. Bauhaus/Jumbo.' },
  { category: 'Mobili Bagno', description: 'Specchio con armadietto 80cm – 2 ante (IKEA LETTAN)', unit: 'pz', unitCost: 259.00, code: '805.349.23', notes: 'IKEA LETTAN 80cm. Link: https://www.ikea.com/ch/it/p/lettan-mobile-a-specchio-con-ante-effetto-specchio-vetro-a-specchio-80534923/' },
  { category: 'Mobili Bagno', description: 'Specchio con retroilluminazione LED 80×60cm', unit: 'pz', unitCost: 185.00, code: 'SPE-LED-80', notes: 'Specchio illuminato a LED. Luce bianca 4000K. Bauhaus.' },
  { category: 'Mobili Bagno', description: 'Specchio con retroilluminazione LED 100×70cm', unit: 'pz', unitCost: 240.00, code: 'SPE-LED-100', notes: 'Formato maggiore, ottimo per bagno principale.' },
  { category: 'Mobili Bagno', description: 'Mobile sottolavabo IKEA GODMORGON 80cm – bianco', unit: 'pz', unitCost: 280.00, code: 'IK-GOD-80-BAS', notes: 'IKEA GODMORGON 2 cassetti 80cm. Solo base, senza lavabo.' },
  { category: 'Mobili Bagno', description: 'Mobile sottolavabo sospeso 60cm – bianco laccato', unit: 'pz', unitCost: 320.00, code: 'MOB-SOS-60', notes: 'Qualità media. Burgbad/Duravit area.' },
  { category: 'Mobili Bagno', description: 'Colonna pensile bagno 160cm – bianco lucido', unit: 'pz', unitCost: 280.00, code: 'COL-PEN-160', notes: 'Spazio contenitore verticale. Abbinabile ai mobili GODMORGON.' },
  { category: 'Mobili Bagno', description: 'Piano di lavoro per bagno in quarzo bianco 100×50', unit: 'pz', unitCost: 380.00, code: 'PIA-QUA-100', notes: 'Top in quarzo lavorato, con ritaglio per lavabo da incasso.' },
  { category: 'Mobili Bagno', description: 'Montaggio mobile bagno (2-4 cassetti)', unit: 'pz', unitCost: 180.00, code: 'POS-MOB-BAG', notes: 'Montaggio, livellamento, fissaggio a parete.' },

  // ─── ACCESSORI BAGNO ──────────────────────────────────────────────────────────
  { category: 'Accessori Bagno', description: 'Porta asciugamani singolo – cromato', unit: 'pz', unitCost: 28.00, code: 'POR-ASC-SIN', notes: 'Fissaggio a parete. Bauhaus/Jumbo.' },
  { category: 'Accessori Bagno', description: 'Porta asciugamani doppio – cromato', unit: 'pz', unitCost: 42.00, code: 'POR-ASC-DOP', notes: 'Doppio braccio, portata doppia.' },
  { category: 'Accessori Bagno', description: 'Porta carta igienica – cromato', unit: 'pz', unitCost: 22.00, code: 'POR-CAR-CRO', notes: 'A parete. Bauhaus.' },
  { category: 'Accessori Bagno', description: 'Portasciugamani scaldasalviette elettrico 45×70cm', unit: 'pz', unitCost: 180.00, code: 'SCA-SAL-45', notes: 'Termosifone elettrico 60W. Cromato. Bauhaus/Jumbo.' },
  { category: 'Accessori Bagno', description: 'Portasciugamani scaldasalviette idraulico 50×100cm', unit: 'pz', unitCost: 320.00, code: 'SCA-SAL-IDR', notes: 'Allacciato al circuito riscaldamento. Più efficiente.' },
  { category: 'Accessori Bagno', description: 'Ganci appendiabiti da parete – set 3 pezzi cromato', unit: 'set', unitCost: 32.00, code: 'GAC-APP-3', notes: 'Set 3 ganci inox/cromati. Bauhaus.' },
  { category: 'Accessori Bagno', description: 'Porta sapone da appoggio – inox', unit: 'pz', unitCost: 18.00, code: 'POR-SAP-APP', notes: 'Su piano lavabo.' },
  { category: 'Accessori Bagno', description: 'Contenitore Q-tips/cotton – vetro con coperchio', unit: 'pz', unitCost: 15.00, code: 'CON-QTI', notes: 'Accessorio decorativo bagno.' },
  { category: 'Accessori Bagno', description: 'Set accessori bagno 5 pezzi – cromato (porta carta, porta asciugamani, ganci, porta sapone, portascopino)', unit: 'set', unitCost: 145.00, code: 'ACC-BAG-5PZ', notes: 'Set completo coordinato. Bauhaus/Sanitas.' },
  { category: 'Accessori Bagno', description: 'Specchio ingranditore ×5 con ventosa – cromato', unit: 'pz', unitCost: 35.00, code: 'SPE-ING-X5', notes: 'Per make-up/rasatura. Con luce LED.' },
  { category: 'Accessori Bagno', description: 'Montaggio set accessori bagno (5 pezzi)', unit: 'corpo', unitCost: 180.00, code: 'POS-ACC-BAG', notes: 'Foratura, tassellatura, fissaggio. Incluso set 5 pezzi.' },
  { category: 'Accessori Bagno', description: 'Portascopino WC – cromato o bianco', unit: 'pz', unitCost: 25.00, code: 'POR-SCO-WC', notes: 'Con supporto a parete o da pavimento.' },
  { category: 'Accessori Bagno', description: 'Tenda doccia impermeabile + asta 120-200cm', unit: 'pz', unitCost: 45.00, code: 'TEN-DOC-AST', notes: 'Alternativa economica al box doccia. Bauhaus/IKEA.' },

  // ─── VENTILAZIONE BAGNO ───────────────────────────────────────────────────────
  { category: 'Ventilazione Bagno', description: 'Ventilatore bagno Ø100mm – silenzioso 25dB', unit: 'pz', unitCost: 55.00, code: 'VEN-BAG-100', notes: 'Aerazione bagno senza finestra. Timer 15min. Bauhaus.' },
  { category: 'Ventilazione Bagno', description: 'Ventilatore bagno Ø150mm – con valvola antiritorno', unit: 'pz', unitCost: 75.00, code: 'VEN-BAG-150', notes: 'Portata maggiore per bagni grandi. Vortice.' },
  { category: 'Ventilazione Bagno', description: 'Tubo rigido aerazione PVC Ø100mm – metro', unit: 'ml', unitCost: 8.50, code: 'TUB-AER-100', notes: 'Per canalizzazione aerazione bagno.' },
  { category: 'Ventilazione Bagno', description: 'Griglia aerazione Ø100mm – plastica bianca', unit: 'pz', unitCost: 6.50, code: 'GRI-AER-100', notes: 'Griglia di chiusura esterna o interna.' },

  // ─── SISTEMI SCARICO E COLONNE ────────────────────────────────────────────────
  { category: 'Impianto Idraulico Bagno', description: 'Colonna scarico Geberit Silent-PP Ø110 – metro', unit: 'ml', unitCost: 38.00, code: 'COL-SCA-GEB', notes: 'Geberit Silent-PP. Fonoassorbente. Standard CH. Link: https://www.geberit.it/prodotti/sistemi-di-evacuazione/geberit-silent-pp/' },
  { category: 'Impianto Idraulico Bagno', description: 'Tubo PP scarico Ø50 – metro', unit: 'ml', unitCost: 12.00, code: 'TUB-PP-50', notes: 'Per scarichi lavabo/bidet. Polipropilene grigio.' },
  { category: 'Impianto Idraulico Bagno', description: 'Sifone lavabo Ø40mm – bottiglia', unit: 'pz', unitCost: 18.00, code: 'SIF-LAV-40', notes: 'Sifone a bottiglia, accesso ispezione. Geberit.' },
  { category: 'Impianto Idraulico Bagno', description: 'Tubo multicrestrato Ø20 per adduzione acqua – metro', unit: 'ml', unitCost: 8.50, code: 'TUB-MUL-20', notes: 'Acqua calda e fredda. Rehau/Uponor.' },
  { category: 'Impianto Idraulico Bagno', description: 'Valvola sottolavabo Ø1/2" – cromata', unit: 'pz', unitCost: 22.00, code: 'VAL-SOT-LAV', notes: 'Valvola d\'arresto individuale. Per ogni punto acqua.' },
  { category: 'Impianto Idraulico Bagno', description: 'Isolamento termico tubo acqua calda – metro', unit: 'ml', unitCost: 4.50, code: 'ISO-TUB-ACQ', notes: 'Guaina Armaflex/Kaimann. Riduce dispersione calorica.' },

  // ─── RISCALDAMENTO BAGNO ──────────────────────────────────────────────────────
  { category: 'Riscaldamento Bagno', description: 'Riscaldamento a pavimento elettrico sotto piastrella – m²', unit: 'm²', unitCost: 45.00, code: 'RIS-ELE-M2', notes: 'Cavo riscaldante o mat elettrico. Devi Warmup/nVent. Solo materiale.' },
  { category: 'Riscaldamento Bagno', description: 'Termostato programmabile per riscaldamento pavimento', unit: 'pz', unitCost: 85.00, code: 'TER-RIS-PAV', notes: 'Con sensore pavimento, programmazione settimanale.' },
  { category: 'Riscaldamento Bagno', description: 'Posa riscaldamento a pavimento elettrico', unit: 'm²', unitCost: 25.00, code: 'POS-RIS-ELE', notes: 'Manodopera posa cavo+termostat.' },
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
  console.log(`Fase 2 — inseriti: ${inserted} articoli`)
}
main().catch(console.error).finally(() => client.close())
