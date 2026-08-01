// Fase 1 — Pavimenti e Rivestimenti (~100 items)
// Prezzi di riferimento mercato Ticino/Nord Italia 2025-2026
import { createClient } from '@libsql/client'
import { config } from 'dotenv'
config({ path: '.env.local' })

const client = createClient({ url: process.env.DATABASE_URL, authToken: process.env.DATABASE_AUTH_TOKEN })
function uid() { return 'c' + Date.now().toString(36) + Math.random().toString(36).slice(2, 10) }

const items = [
  // ─── GRES PORCELLANATO ────────────────────────────────────────────────────────
  { category: 'Gres Porcellanato', description: 'Gres 30×30 – effetto cemento grigio (Bauhaus)', unit: 'm²', unitCost: 14.90, code: 'GP-3030-CEM', notes: 'Bauhaus art. 30028XXX – qualità base, buon rapporto q/p. Sito: https://www.bauhaus.ch' },
  { category: 'Gres Porcellanato', description: 'Gres 45×45 – effetto pietra beige', unit: 'm²', unitCost: 18.50, code: 'GP-4545-PIE', notes: 'Uso: bagni, corridoi, cucine. Disponibile Bauhaus/Leroy Merlin.' },
  { category: 'Gres Porcellanato', description: 'Gres 60×60 – effetto cemento antracite', unit: 'm²', unitCost: 28.90, code: 'GP-6060-ANT', notes: 'Formato standard. Bauhaus art. 31365295 area.' },
  { category: 'Gres Porcellanato', description: 'Gres 60×60 – Active Beige (Bauhaus 31365295)', unit: 'm²', unitCost: 29.95, code: '31365295', notes: 'Gres porcellanato Active Beige 60×60. Link: https://www.bauhaus.ch/it/p/gres-porcellanato-active-beige-31365295' },
  { category: 'Gres Porcellanato', description: 'Gres 60×60 – Tribeca (Bauhaus 28795195)', unit: 'm²', unitCost: 35.00, code: '28795195', notes: 'Gres 60×60 effetto marmo leggero. Link: https://www.bauhaus.ch/it/p/piastrella-in-gres-porcellanato-tribeca-28795195' },
  { category: 'Gres Porcellanato', description: 'Gres 60×60 – effetto marmo bianco lucido', unit: 'm²', unitCost: 42.00, code: 'GP-6060-MAR', notes: 'Qualità media-alta, uso soggiorno/bagno. Supergres/Marazzi.' },
  { category: 'Gres Porcellanato', description: 'Gres 60×120 – grande formato effetto cemento', unit: 'm²', unitCost: 52.00, code: 'GP-60120-CEM', notes: 'Formato grande, meno fughe. Marazzi/Supergres. Posa richiede piano perfetto.' },
  { category: 'Gres Porcellanato', description: 'Gres 60×120 – effetto pietra grigia levigata', unit: 'm²', unitCost: 58.00, code: 'GP-60120-PIE', notes: 'Premium. Supergres, Marazzi, Atlas Concorde.' },
  { category: 'Gres Porcellanato', description: 'Gres 80×80 – effetto marmo statuario', unit: 'm²', unitCost: 65.00, code: 'GP-8080-STA', notes: 'Segmento alto. Marazzi Evolutionmarble. Link: https://www.marazzigroup.com' },
  { category: 'Gres Porcellanato', description: 'Gres 120×120 – effetto marmo grande formato', unit: 'm²', unitCost: 85.00, code: 'GP-120120-MAR', notes: 'Formato maxi, showroom di lusso. Resis, Atlas Concorde.' },
  { category: 'Gres Porcellanato', description: 'Gres antisdrucciolo R11 – per doccia/terrazzo', unit: 'm²', unitCost: 32.00, code: 'GP-ANTI-R11', notes: 'Certificato antiscivolo R11. Obbligatorio in docce e terrazzi.' },
  { category: 'Gres Porcellanato', description: 'Gres effetto legno rovere chiaro 20×120', unit: 'm²', unitCost: 38.00, code: 'GP-LEG-ROV', notes: 'Aspetto parquet, resistenza gres. Marazzi Treverkhome. Link: https://www.marazzigroup.com' },
  { category: 'Gres Porcellanato', description: 'Gres effetto legno noce scuro 15×90', unit: 'm²', unitCost: 36.00, code: 'GP-LEG-NOC', notes: 'Effetto legno noce, formato listello classico.' },
  { category: 'Gres Porcellanato', description: 'Mosaico gres 30×30 (chip 5×5) – bagno/doccia', unit: 'm²', unitCost: 55.00, code: 'GP-MOS-30', notes: 'Antiscivolo naturale per pavimento doccia. Disponibile Bauhaus/Sanitas.' },
  { category: 'Gres Porcellanato', description: 'Rivestimento bagno 30×60 – effetto beton grigio', unit: 'm²', unitCost: 24.00, code: 'RIV-3060-BET', notes: 'Piastrelle per pareti bagno, formato classico.' },
  { category: 'Gres Porcellanato', description: 'Rivestimento cucina 10×30 – metro bianco', unit: 'm²', unitCost: 18.00, code: 'RIV-1030-MET', notes: 'Classico metro brick per cucine. Facilissimo posa, trend stabile.' },
  { category: 'Gres Porcellanato', description: 'Rivestimento 60×120 – effetto marmo per pareti', unit: 'm²', unitCost: 48.00, code: 'RIV-60120-PAR', notes: 'Uso parete bagno doccia o cucina. Spessore 9mm.' },

  // ─── PARQUET E PAVIMENTI LEGNO ────────────────────────────────────────────────
  { category: 'Parquet e Laminato', description: 'Parquet prefinito rovere spazzolato 14mm – finitura olio', unit: 'm²', unitCost: 65.00, code: 'PAR-ROV-14', notes: 'Parquet prefinito qualità media-alta. Listone Giordano, Quick-Step.' },
  { category: 'Parquet e Laminato', description: 'Parquet massello rovere 22mm – olio bianco', unit: 'm²', unitCost: 95.00, code: 'PAR-MAS-22', notes: 'Parquet massello, rilevigabile più volte. Prezzo materiale solo.' },
  { category: 'Parquet e Laminato', description: 'Laminato AC5 8mm – effetto rovere chiaro', unit: 'm²', unitCost: 18.00, code: 'LAM-AC5-8', notes: 'Quick-Step, Pergo, Bauhaus. Buona resistenza uso intensivo.' },
  { category: 'Parquet e Laminato', description: 'Laminato AC4 10mm – effetto noce', unit: 'm²', unitCost: 22.00, code: 'LAM-AC4-10', notes: 'Qualità media, ottimo per uso residenziale.' },
  { category: 'Parquet e Laminato', description: 'LVT (Luxury Vinyl Tile) click 5mm – effetto legno', unit: 'm²', unitCost: 28.00, code: 'LVT-5-LEG', notes: 'Impermeabile, ideale cucina/bagno. Gerflor, Forbo, Pergo.' },
  { category: 'Parquet e Laminato', description: 'LVT click 6mm SPC – effetto cemento', unit: 'm²', unitCost: 32.00, code: 'LVT-6-CEM', notes: 'SPC = rigid core, massima stabilità. Ideale sopra pavimento esistente.' },
  { category: 'Parquet e Laminato', description: 'Pavimento vinilico in rotolo 2m – uso commerciale', unit: 'm²', unitCost: 15.00, code: 'VIN-ROT-2M', notes: 'Gerflor/Tarkett. Rapido da posare, ideale garage/lavanderia.' },
  { category: 'Parquet e Laminato', description: 'Parquet teak da esterno 21mm – deck', unit: 'm²', unitCost: 85.00, code: 'PAR-TEAK-EXT', notes: 'Per terrazzi/logge. Teak naturale trattato.' },

  // ─── BATTISCOPA E PROFILI ──────────────────────────────────────────────────────
  { category: 'Battiscopa e Profili', description: 'Battiscopa laminato 58×18mm – Rovere Firenze (Bauhaus 31158811)', unit: 'ml', unitCost: 4.96, code: '31158811', notes: 'Logoclic Rovere Firenze. Link: https://www.bauhaus.ch/it/p/logoclic-battiscopa-rovere-firenze-31158811' },
  { category: 'Battiscopa e Profili', description: 'Battiscopa laminato 58×18mm – Rovere chiaro', unit: 'ml', unitCost: 4.50, code: 'BAT-LAM-58', notes: 'Bauhaus/Jumbo. Vari colori disponibili.' },
  { category: 'Battiscopa e Profili', description: 'Battiscopa MDF laccato bianco 70×14mm', unit: 'ml', unitCost: 6.50, code: 'BAT-MDF-70', notes: 'Classico bianco per abbinare qualsiasi pavimento.' },
  { category: 'Battiscopa e Profili', description: 'Battiscopa gres 7×60cm – in abbinamento al pavimento', unit: 'ml', unitCost: 8.50, code: 'BAT-GRE-7', notes: 'Finitura continua pavimento-parete, look professionale.' },
  { category: 'Battiscopa e Profili', description: 'Battiscopa PVC flessibile adesivo 50mm – bianco', unit: 'ml', unitCost: 3.20, code: 'BAT-PVC-50', notes: 'Soluzione economica per ambienti secondari. Bauhaus.' },
  { category: 'Battiscopa e Profili', description: 'Profilo di transizione pavimento alluminio 38mm', unit: 'ml', unitCost: 5.50, code: 'PRO-ALL-38', notes: 'Raccordo tra due pavimenti diversi di uguale altezza.' },
  { category: 'Battiscopa e Profili', description: 'Profilo riduzione rampa alluminio – cambio quota', unit: 'ml', unitCost: 6.80, code: 'PRO-RID-ALL', notes: 'Per dislivelli fino a 8mm. Bauhaus.' },
  { category: 'Battiscopa e Profili', description: 'Profilo angolo esterno gres 9mm', unit: 'ml', unitCost: 4.20, code: 'PRO-ANG-9', notes: 'Protezione spigoli piastrellatura, acciaio inox.' },
  { category: 'Battiscopa e Profili', description: 'Cornice in stucco 5cm – decorazione soffitto/parete', unit: 'ml', unitCost: 7.50, code: 'COR-STU-5', notes: 'Cornice decorativa. Posa con colla a stucco.' },

  // ─── COLLANTI E MASSETTI ──────────────────────────────────────────────────────
  { category: 'Collanti e Malte', description: 'Colla per piastrelle C2 – sacco 25kg (Weber col 155)', unit: 'sacco', unitCost: 22.00, code: 'COL-C2-25', notes: 'Weber webercol 155. C2 = migliorata. Per gres grande formato. Sito: https://www.it.weber' },
  { category: 'Collanti e Malte', description: 'Colla per piastrelle C1 – sacco 25kg (Bauhaus)', unit: 'sacco', unitCost: 14.50, code: 'COL-C1-25', notes: 'Qualità standard, per piastrelle piccolo formato. Resa ~4-5m²/sacco.' },
  { category: 'Collanti e Malte', description: 'Colla per piastrelle bianca C2 – 25kg (bagno/cucina)', unit: 'sacco', unitCost: 24.00, code: 'COL-C2-B-25', notes: 'Bianca, per piastrelle chiare senza effetto trasparente.' },
  { category: 'Collanti e Malte', description: 'Colla flessibile per parquet su riscaldamento – 5kg', unit: 'sacco', unitCost: 38.00, code: 'COL-PAR-5', notes: 'Mapei Adesilex P9 o Bostik. Per parquet prefinito su impianto radiante.' },
  { category: 'Collanti e Malte', description: 'Massetto autolivellante – sacco 25kg', unit: 'sacco', unitCost: 18.00, code: 'MAS-AUTO-25', notes: 'Weber floor 4050 o simile. Per livellare sottofondi. Resa ~8mm/m²/sacco.' },
  { category: 'Collanti e Malte', description: 'Massetto tradizionale fibrorinforzato – sacco 25kg', unit: 'sacco', unitCost: 12.00, code: 'MAS-FIBR-25', notes: 'Per sottofondi spessi. Holcim/Weber.' },
  { category: 'Collanti e Malte', description: 'Stucco per fughe 2-12mm grigio – 5kg (Bauhaus)', unit: 'sacco', unitCost: 8.90, code: 'STU-FUG-5', notes: 'Fughe standard grigio cemento. Mapei Keracolor, Weber jungfix.' },
  { category: 'Collanti e Malte', description: 'Stucco per fughe 1-5mm bianco – 5kg', unit: 'sacco', unitCost: 9.50, code: 'STU-FUG-B-5', notes: 'Per fughe strette, piastrelle chiare.' },
  { category: 'Collanti e Malte', description: 'Stucco fughe epossidico 2 componenti – 5kg', unit: 'sacco', unitCost: 42.00, code: 'STU-EPO-5', notes: 'Mapei Kerapoxy. Impermeabile, per cucine/docce. Resistente a macchie.' },
  { category: 'Collanti e Malte', description: 'Primer consolidante sottofondi porosi – 1L', unit: 'l', unitCost: 12.50, code: 'PRI-CON-1L', notes: 'Prima di massetto autolivellante o colla. Weber prim 801.' },
  { category: 'Collanti e Malte', description: 'Fissativo muri e soffitti – 10L', unit: 'l', unitCost: 18.00, code: 'FIS-MUR-10L', notes: 'Prima di pittura su intonaco nuovo. Caparol Tiefgrund.' },

  // ─── IMPERMEABILIZZAZIONE ─────────────────────────────────────────────────────
  { category: 'Impermeabilizzazione', description: 'Guaina impermeabilizzante per doccia in pasta – 10L', unit: 'l', unitCost: 38.00, code: 'GUA-PAS-10', notes: 'Mapei Mapelastic, Weber waterproof. Obbligatorio sotto piastrelle doccia.' },
  { category: 'Impermeabilizzazione', description: 'Nastro impermeabilizzante per angoli doccia – 5m', unit: 'pz', unitCost: 12.50, code: 'NAS-ANG-5', notes: 'Nastro flessibile per angoli e giunti. Mapei/Ardex.' },
  { category: 'Impermeabilizzazione', description: 'Guaina bituminosa autoprotetta – m²', unit: 'm²', unitCost: 22.00, code: 'GUA-BIT-M2', notes: 'Per terrazzi e balconi. Spessore 4mm. Posa a fiamma.' },
  { category: 'Impermeabilizzazione', description: 'Guaina liquida poliuretanica per terrazzo – 1L', unit: 'l', unitCost: 28.00, code: 'GUA-LIQ-1L', notes: 'Applicazione a pennello. Resa 1-1.5kg/m² per 2 mani. Bauhaus/Weber.' },
  { category: 'Impermeabilizzazione', description: 'Membrana impermeabilizzante sottile (Schlüter Kerdi) – m²', unit: 'm²', unitCost: 18.00, code: 'MEM-KER-M2', notes: 'Sistema professionale per doccia. Schlüter Systems.' },

  // ─── FONDI E PRIMER ───────────────────────────────────────────────────────────
  { category: 'Fondi e Primer', description: 'Primer acrilico universale per pareti – 5L', unit: 'l', unitCost: 3.50, code: 'PRI-ACR-5', notes: 'Prima di pittura su gesso/intonaco. Bauhaus/Caparol. Resa 8-10m²/L.' },
  { category: 'Fondi e Primer', description: 'Aggrappante per superfici difficili – 1L', unit: 'l', unitCost: 18.00, code: 'AGR-1L', notes: 'Prima di intonacare su cartongesso o piastrelle. Mapei Primer G, Caparol Haftgrund.' },
  { category: 'Fondi e Primer', description: 'Primer isolante per macchie/umidità – 1L', unit: 'l', unitCost: 22.00, code: 'PRI-ISO-1L', notes: 'Blocca macchie, muffa, nicotina. Caparol Indeko Plus.' },
  { category: 'Fondi e Primer', description: 'Impregnante per legno esterno – 1L', unit: 'l', unitCost: 15.00, code: 'IMP-LEG-1L', notes: 'Protezione legno da intemperie. Sikkens Cetol BL. Bauhaus.' },

  // ─── SOTTOFONDO E ISOLAMENTO ACUSTICO ─────────────────────────────────────────
  { category: 'Sottofondi e Isolamento', description: 'Pannello isolamento acustico sotto parquet 3mm (PE)', unit: 'm²', unitCost: 1.80, code: 'ISO-ACU-3', notes: 'Polietilene espanso 3mm. Riduzione rumori da calpestio. Bauhaus.' },
  { category: 'Sottofondi e Isolamento', description: 'Pannello isolamento acustico 5mm (fibra di legno)', unit: 'm²', unitCost: 3.20, code: 'ISO-ACU-5', notes: 'Migliore performance acustica, 5mm. Quick-Step, Pergo.' },
  { category: 'Sottofondi e Isolamento', description: 'Materassino anticalpestio 10mm – EPS fonoisolante', unit: 'm²', unitCost: 5.50, code: 'MAT-EPS-10', notes: 'Per massetto galleggiante su solaio. Riduzione calpestio classe A.' },
  { category: 'Sottofondi e Isolamento', description: 'Telo barriera vapore PE 0.2mm – rotolo 50m²', unit: 'm²', unitCost: 0.90, code: 'TEL-BV-50', notes: 'Sotto parquet su massetto. Evita umidità. Bauhaus.' },

  // ─── PIASTRELLE SPECIALI ─────────────────────────────────────────────────────
  { category: 'Piastrelle Speciali', description: 'Piastrella cotto fatto a mano 25×25 – terracotta', unit: 'm²', unitCost: 45.00, code: 'COT-MAN-25', notes: 'Cotto artigianale toscano/portoghese. Reso a mano, irregolare.' },
  { category: 'Piastrelle Speciali', description: 'Cemento decorativo encaustica 20×20 – motivo geometrico', unit: 'm²', unitCost: 75.00, code: 'CEM-ENC-20', notes: 'Pavimentazioni di design. Produzione artigianale. Fragile al gelo.' },
  { category: 'Piastrelle Speciali', description: 'Mosaico vetro 2.5×2.5cm – per piscina/bagno blu', unit: 'm²', unitCost: 95.00, code: 'MOS-VET-25', notes: 'Resistente cloro, ideale piscine e docce. Bisazza area.' },
  { category: 'Piastrelle Speciali', description: 'Piastrella 3D effetto rilievo ondulato – parete', unit: 'm²', unitCost: 68.00, code: 'PIX-3D-OND', notes: 'Decorativa, per parete principale soggiorno/bagno.' },
  { category: 'Piastrelle Speciali', description: 'Mattone faccia a vista – rivestimento parete', unit: 'm²', unitCost: 32.00, code: 'MAT-FV-M2', notes: 'Effetto mattone industriale. Bauhaus area, Leroy Merlin.' },

  // ─── POSA PAVIMENTI (MANODOPERA) ─────────────────────────────────────────────
  { category: 'Posa Pavimenti', description: 'Posa piastrelle su massetto – fino 60×60cm', unit: 'm²', unitCost: 50.00, code: 'POS-PIA-60', notes: 'Manodopera posa standard. Include stucco fughe. Esclude colla.' },
  { category: 'Posa Pavimenti', description: 'Posa piastrelle formato grande >60×60cm', unit: 'm²', unitCost: 70.00, code: 'POS-PIA-GR', notes: 'Maggiore difficoltà, livellatori, lama da taglio grande formato.' },
  { category: 'Posa Pavimenti', description: 'Posa piastrelle bagno con impermeabilizzazione doccia', unit: 'm²', unitCost: 100.00, code: 'POS-PIA-BAG', notes: 'Include impermeabilizzazione Mapelastic + posa + fughe.' },
  { category: 'Posa Pavimenti', description: 'Posa parquet prefinito flottante', unit: 'm²', unitCost: 25.00, code: 'POS-PAR-FLO', notes: 'Sistema click, rapido. Esclude materassino.' },
  { category: 'Posa Pavimenti', description: 'Posa parquet massello incollato', unit: 'm²', unitCost: 45.00, code: 'POS-PAR-MAS', notes: 'Incollato su massetto. Più stabile, richiede massetto piano a 0.2%.' },
  { category: 'Posa Pavimenti', description: 'Posa LVT click', unit: 'm²', unitCost: 18.00, code: 'POS-LVT', notes: 'Rapida posa sistema click. Ideale sopra pavimento esistente.' },
  { category: 'Posa Pavimenti', description: 'Posa battiscopa – qualsiasi materiale', unit: 'ml', unitCost: 4.55, code: 'POS-BAT', notes: 'Incluso taglio e colla. Stima CHF 500 per 110ml.' },
  { category: 'Posa Pavimenti', description: 'Rimozione pavimento esistente (demolizione)', unit: 'm²', unitCost: 18.00, code: 'RIM-PAV-M2', notes: 'Include carico su camion/cassonetto. Escluso smaltimento.' },
  { category: 'Posa Pavimenti', description: 'Preparazione sottofondo – livellamento e stuccatura', unit: 'm²', unitCost: 12.00, code: 'PRE-SOT-M2', notes: 'Stuccatura crepe, livellamento fino 5mm, primer.' },
  { category: 'Posa Pavimenti', description: 'Massetto autolivellante – posa compresa (fino 10mm)', unit: 'm²', unitCost: 22.00, code: 'MAS-POS-10', notes: 'Materiale + posa. Per livellare prima del pavimento finale.' },
  { category: 'Posa Pavimenti', description: 'Lucidatura/levigatura parquet esistente', unit: 'm²', unitCost: 18.00, code: 'LUC-PAR-M2', notes: 'Con levigatrice, 2 passaggi carta + olio finale.' },

  // ─── PAVIMENTI ESTERNI ────────────────────────────────────────────────────────
  { category: 'Pavimenti Esterni', description: 'Piastrella gres per esterno 40×40 antiscivolo R11', unit: 'm²', unitCost: 22.00, code: 'EXT-GRE-40', notes: 'Per terrazzi, giardini, garage. Spessore 10-12mm.' },
  { category: 'Pavimenti Esterni', description: 'Piastrella gres spessa 2cm per posa su ghiaia', unit: 'm²', unitCost: 38.00, code: 'EXT-GRE-2CM', notes: 'Per posa su letto di ghiaia senza colla. Moderna.' },
  { category: 'Pavimenti Esterni', description: 'Decking WPC composito – terrazzo', unit: 'm²', unitCost: 42.00, code: 'EXT-WPC', notes: 'Legno plastica composito, manutenzione zero. Varie finiture.' },
  { category: 'Pavimenti Esterni', description: 'Posa piastrelle terrazzo/esterno (incollato)', unit: 'm²', unitCost: 65.00, code: 'POS-EXT-INC', notes: 'Include colla C2 frost-proof + fughe + primer. Esclusa impermeabilizzazione.' },
  { category: 'Pavimenti Esterni', description: 'Bordo in cemento per separazione prato/pavimento – ml', unit: 'ml', unitCost: 12.00, code: 'BOR-CEM-ML', notes: 'Cordolo in calcestruzzo prefabbricato. Per giardini.' },

  // ─── ZOCCOLINI E RIVESTIMENTI SCALA ──────────────────────────────────────────
  { category: 'Scale e Gradini', description: 'Gradino in gres 120×30cm – rivestimento scala', unit: 'pz', unitCost: 45.00, code: 'GRA-GRE-120', notes: 'Gradino completo con alzata. Antiscivolo frontale.' },
  { category: 'Scale e Gradini', description: 'Bordo antiscivolo alluminio per scalino – 120cm', unit: 'pz', unitCost: 18.00, code: 'BOR-ANTI-120', notes: 'Profilo antiscivolo, riduce rischio cadute. Obbligatorio in edifici pubblici.' },
  { category: 'Scale e Gradini', description: 'Rivestimento scalino in legno massello rovere 120×30', unit: 'pz', unitCost: 75.00, code: 'GRA-LEG-120', notes: 'Gradino in rovere massello per scala in legno.' },
  { category: 'Scale e Gradini', description: 'Posa gradini scala – per gradino', unit: 'pz', unitCost: 35.00, code: 'POS-GRA-PZ', notes: 'Manodopera posa singolo gradino, incluso taglio e stucco.' },

  // ─── ACCESSORI POSA ───────────────────────────────────────────────────────────
  { category: 'Accessori e Strumenti', description: 'Crocette distanziatrici 2mm – busta 500pz', unit: 'pz', unitCost: 3.50, code: 'CRO-2MM-500', notes: 'Per fughe standard. Bauhaus.' },
  { category: 'Accessori e Strumenti', description: 'Crocette distanziatrici 5mm – busta 200pz', unit: 'pz', unitCost: 3.80, code: 'CRO-5MM-200', notes: 'Per fughe larghe stile rustico.' },
  { category: 'Accessori e Strumenti', description: 'Sistema livellazione piastrelle Raimondi – kit 100pz', unit: 'pz', unitCost: 28.00, code: 'LIV-RAI-100', notes: 'Riduce difetto lippage su grande formato. Essenziale per 60×120+.' },
  { category: 'Accessori e Strumenti', description: 'Lama taglio piastrelle manuali fino 60cm', unit: 'pz', unitCost: 45.00, code: 'TAG-PIA-60', notes: 'Tagliapiastrelle manuale. Bauhaus.' },
  { category: 'Accessori e Strumenti', description: 'Disco diamantato per flex – piastrelle ceramica 125mm', unit: 'pz', unitCost: 12.00, code: 'DIS-DIA-125', notes: 'Consumabile. Bauhaus/Jumbo.' },
  { category: 'Accessori e Strumenti', description: 'Spugna per fughe – grande', unit: 'pz', unitCost: 4.50, code: 'SPU-FUG', notes: 'Per pulizia fughe durante la posa.' },
  { category: 'Accessori e Strumenti', description: 'Frattazzo dentato inox 10mm – colla piastrelle', unit: 'pz', unitCost: 8.50, code: 'FRA-DEN-10', notes: 'Per stendere colla con dente 10mm su formato 60×60.' },
  { category: 'Accessori e Strumenti', description: 'Miscelatore a frusta per colla – per trapano 710W', unit: 'pz', unitCost: 22.00, code: 'MIS-FRU', notes: 'Mescolatore a elica per massetti e colle in polvere.' },
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
  console.log(`Fase 1 — inseriti: ${inserted} articoli`)
}
main().catch(console.error).finally(() => client.close())
