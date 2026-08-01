import { createClient } from '@libsql/client'
import { config } from 'dotenv'
import { readFileSync } from 'fs'
config({ path: '.env.local' })

const c = createClient({ url: process.env.DATABASE_URL, authToken: process.env.DATABASE_AUTH_TOKEN })
const data = JSON.parse(readFileSync('scripts/prezzario-update.json', 'utf-8'))

function uid() { return 'c' + Date.now().toString(36) + Math.random().toString(36).slice(2, 10) }

const hornbachUpdates = [
  { desc: 'Telaio Geberit Duofix per WC sospeso – h112cm', unitCost: 229, qualityLevel: 'MEDIUM', links: 'https://www.hornbach.ch/de/p/geberit-vorwandelement-duofix-fuer-wand-wc-1120-mm-ch-version-111-309-00-5/5185482/', notes: 'Geberit Duofix Sigma UP320 h112cm CH 111.309.00.5 · Hornbach art.5185482' },
  { desc: 'Telaio Geberit Duofix per WC sospeso – h82cm', unitCost: 320, qualityLevel: 'HIGH', links: 'https://www.hornbach.ch/de/p/vorwandelement-geberit-duofix-fuer-wand-wc-82cm-111-005-00-1/5735481/', notes: 'Geberit Duofix h82cm ristrutturazione 111.005.00.1 · Hornbach art.5735481' },
  { desc: 'Miscelatore lavabo monocomando – cromato (entry)', unitCost: 54, qualityLevel: 'LOW', links: 'https://www.hornbach.ch/fr/p/robinet-de-lavabo-avec-mitigeur-hansgrohe-vernis-blend-chrome-71558000/10501171/', notes: 'Hansgrohe Vernis Blend 70 71558000 · Hornbach art.10501171' },
  { desc: 'Miscelatore lavabo monocomando – cromato (Grohe Eurosmart)', unitCost: 150, qualityLevel: 'HIGH', links: 'https://hornbach.ch/fr/p/mitigeur-de-lavabo-grohe-essence-new-23589001-chrome/6123367', notes: 'Grohe Essence 23589001 · Hornbach art.6123367' },
  { desc: 'Piano cottura a induzione 60cm 4 zone – Bosch', unitCost: 525, qualityLevel: 'MEDIUM', links: 'https://www.hornbach.ch/de/p/siemens-eh645bfb6e-induktionskochfeld-mit-rahmen-60-cm-4-kochzonen-autark/12035950/', notes: 'Siemens EH645BFB6E 60cm 4 zone 7.4kW · Hornbach art.12035950' },
  { desc: 'Forno elettrico da incasso 60cm – pirolisi (Bosch HBG5780)', unitCost: 885, qualityLevel: 'HIGH', links: 'https://www.hornbach.ch/fr/p/four-encastrable-siemens-hb578gfs7-60x60-cm/12311111/', notes: 'Siemens HB578GFS7 pirolisi 60cm 71L A+ activeClean · Hornbach art.12311111' },
  { desc: 'Forno elettrico da incasso 60cm – ventilato multifunzione', unitCost: 397, qualityLevel: 'MEDIUM', links: 'https://www.hornbach.ch/de/c/kueche/kuechengeraete/backoefen-herde/einbaubackoefen/S20549/', notes: 'Forno ventilato 60cm multifunzione classe A · Hornbach ~397 CHF' },
  { desc: 'Gres 30×30 – effetto cemento grigio (Bauhaus)', unitCost: 13.83, qualityLevel: 'LOW', notes: 'Gres 30x30 cemento grigio entry · Bauhaus 13.83 CHF/m2' },
  { desc: 'Gres 45×45 – effetto pietra beige', unitCost: 18.5, qualityLevel: 'LOW' },
  { desc: 'Gres 60×60 – Active Beige (Bauhaus 31365295)', unitCost: 27.71, qualityLevel: 'MEDIUM', notes: 'Gres 60x60 Active Beige art.31365295 · Bauhaus 27.71 CHF/m2' },
  { desc: 'Gres 60×60 – Tribeca (Bauhaus 28795195)', unitCost: 32.28, qualityLevel: 'MEDIUM', notes: 'Gres 60x60 Tribeca art.28795195 · Bauhaus 32.28 CHF/m2' },
  { desc: 'Gres 60×60 – effetto cemento antracite', unitCost: 28.9, qualityLevel: 'MEDIUM' },
  { desc: 'Gres 80×80 – effetto marmo statuario', unitCost: 65, qualityLevel: 'HIGH' },
  { desc: 'Gres 120×120 – effetto marmo grande formato', unitCost: 85, qualityLevel: 'HIGH' },
  { desc: 'Laminato AC5 8mm – effetto rovere chiaro', unitCost: 18, qualityLevel: 'LOW', links: 'https://www.hornbach.ch/de/c/bodenbelaege-fliesen/laminat/S5087/', notes: 'Laminato AC5 8mm rovere chiaro · Hornbach 11.90-19.90 CHF/m2' },
  { desc: 'Laminato AC4 10mm – effetto noce', unitCost: 22, qualityLevel: 'MEDIUM' },
  { desc: 'Parquet prefinito rovere spazzolato 14mm – finitura olio', unitCost: 65, qualityLevel: 'MEDIUM', links: 'https://www.hornbach.ch/fr/c/revetements-de-sol-carrelages/parquet/S5637/', notes: 'Parquet prefinito rovere 14mm olio · Hornbach 37.90-65.90 CHF/m2' },
  { desc: 'Parquet massello rovere 22mm – olio bianco', unitCost: 95, qualityLevel: 'HIGH' },
]

const nuovi = [
  { category: 'Bagno – WC', description: 'Telaio Geberit Duofix Basic h112 + cassetta Delta – LOW', unit: 'pz', unitCost: 129.90, qualityLevel: 'LOW', links: 'https://www.hornbach.ch/de/p/geberit-vorwandelement-duofix-basic-fuer-wc-bauhoehe-1120-mm-mit-delta-spuelkasten-458-103-00-2/12465928/', notes: 'Geberit Duofix Basic + cassetta Delta 458.103.00.2 · Hornbach art.12465928 · 129.90 CHF' },
  { category: 'Bagno – WC', description: 'WC sospeso entry level – bianco rimless sans bride', unit: 'pz', unitCost: 90, qualityLevel: 'LOW', links: 'https://www.hornbach.ch/fr/c/salles-de-bains-sanitaires/ceramique-de-salles-de-bains/wc/wc-suspendu/S28182/', notes: 'WC sospeso entry level sans bride ~90 CHF · Hornbach' },
  { category: 'Bagno – WC', description: 'WC sospeso Duravit D-Neo Rimless bianco', unit: 'pz', unitCost: 269, qualityLevel: 'MEDIUM', links: 'https://www.hornbach.ch/fr/c/salles-de-bains-sanitaires/ceramique-de-salles-de-bains/wc/wc-suspendu/S28182/f/Marque=DURAVIT', notes: 'Duravit D-Neo WC sospeso Rimless bianco · Hornbach 269 CHF' },
  { category: 'Bagno – Rubinetteria', description: 'Miscelatore lavabo Hansgrohe Logis cromato con scarico', unit: 'pz', unitCost: 80.90, qualityLevel: 'MEDIUM', links: 'https://hornbach.ch/shop/Mitigeur-de-lavabo-hansgrohe-Logis-chrome-avec-garniture-de-vidage-a-tirette-71222000/5747679/article.html', notes: 'Hansgrohe Logis 71222000 cromato · Hornbach art.5747679 · 80.90 CHF' },
  { category: 'Bagno – Docce e Box', description: 'Box doccia angolare SCHULTE 90×90cm – vetro entry', unit: 'pz', unitCost: 227, qualityLevel: 'LOW', links: 'https://www.hornbach.ch/fr/c/salles-de-bains-sanitaires/douches/portes-et-parois-de-douche/S23941/', notes: 'SCHULTE Toura 90x90 angolare entry · Hornbach ~226.90 CHF' },
  { category: 'Bagno – Docce e Box', description: 'Box doccia angolare 90×90cm – vetro 6mm qualità media', unit: 'pz', unitCost: 314, qualityLevel: 'MEDIUM', links: 'https://www.hornbach.ch/de/c/bad-sanitaer/duschen/duschkabinen/S7086/', notes: 'form&style Samoa 90cm angolare porta scorrevole · Hornbach ~314 CHF' },
  { category: 'Bagno – Docce e Box', description: 'Box doccia walk-in Schulte Trend 2.0 90cm – vetro 6mm antikal', unit: 'pz', unitCost: 799, qualityLevel: 'HIGH', links: 'https://www.hornbach.ch/de/c/bad-sanitaer/duschen/duschkabinen/S7086/', notes: 'SCHULTE Trend 2.0 90x90 walk-in premium · Hornbach 799 CHF' },
  { category: 'Cucina – Cottura', description: 'Piano cottura vitroceramica 60cm 4 zone – entry level', unit: 'pz', unitCost: 149, qualityLevel: 'LOW', links: 'https://www.hornbach.ch/de/c/kueche/kuechengeraete/kochfelder/S6632/', notes: 'Piano vitroceramica 60cm entry ~149 CHF · Hornbach' },
  { category: 'Cucina – Cottura', description: 'Piano cottura induzione 60cm Siemens EH645BFB6E – 4 zone', unit: 'pz', unitCost: 525, qualityLevel: 'HIGH', links: 'https://www.hornbach.ch/de/p/siemens-eh645bfb6e-induktionskochfeld-mit-rahmen-60-cm-4-kochzonen-autark/12035950/', notes: 'Siemens EH645BFB6E induzione 60cm 4 zone 7.4kW · Hornbach art.12035950 · 525 CHF' },
  { category: 'Pavimenti – Gres Porcellanato', description: 'Gres porcellanato 60×60 entry – bianco/grigio liscio', unit: 'm²', unitCost: 16, qualityLevel: 'LOW', links: 'https://www.hornbach.ch/fr/c/revetements-de-sol-carrelages/carrelages/S6055/f/Mat%C3%A9riau=Gr%C3%A8s-c%C3%A9rame', notes: 'Gres 60x60 entry ~16 CHF/m2 (es. Dalven marble) · Hornbach' },
  { category: 'Strutture – Porte e Finestre', description: 'Porta interna Pertura laccata bianca base – 80cm', unit: 'pz', unitCost: 119, qualityLevel: 'LOW', links: 'https://www.hornbach.ch/fr/c/bois-fenetres-portes/portes-interieures-cadres/portes-interieures/S9337/f/Marque=Pertura', notes: 'Pertura porta interna laccata bianca base · Hornbach 105-129 CHF' },
  { category: 'Strutture – Porte e Finestre', description: 'Porta interna + telaio – media qualità laccata bianca', unit: 'pz', unitCost: 260, qualityLevel: 'MEDIUM', links: 'https://www.hornbach.ch/fr/c/bois-fenetres-portes/portes-interieures-cadres/S4041/', notes: 'Porta interna + telaio media qualità · Hornbach ~250-300 CHF' },
  { category: 'Strutture – Porte e Finestre', description: 'Porta interna set completo design – alta qualità con vetro', unit: 'pz', unitCost: 480, qualityLevel: 'HIGH', links: 'https://www.hornbach.ch/fr/c/bois-fenetres-portes/portes-interieures-cadres/portes-fenetres-loft/S27491/', notes: 'Porta interna set completo alta qualità Loft · Hornbach 460-499 CHF' },
  { category: 'Strutture – Porte e Finestre', description: 'Finestra PVC doppio vetro 100×120cm – entry', unit: 'pz', unitCost: 250, qualityLevel: 'LOW', links: 'https://www.hornbach.ch/fr/c/bois-fenetres-portes/fenetres/fenetres-en-plastique/S8885/', notes: 'Finestra PVC doppio vetro entry · Hornbach ~122-250 CHF' },
  { category: 'Strutture – Porte e Finestre', description: 'Finestra PVC triplo vetro 100×120cm – media qualità', unit: 'pz', unitCost: 420, qualityLevel: 'MEDIUM', links: 'https://www.hornbach.ch/fr/c/bois-fenetres-portes/fenetres/fenetres-en-plastique/S8885/', notes: 'Finestra PVC triplo vetro media qualità · Hornbach' },
  { category: 'Finiture – Pittura', description: 'Pittura murale bianca entry – 1L', unit: 'l', unitCost: 2.90, qualityLevel: 'LOW', links: 'https://hornbach.ch/fr/c/peintures-papiers-peints-revetement-mural/peintures/peintures-pour-murs-enduits/peintures-blanches-pour-murs/S5293', notes: 'Pittura murale bianca entry ~1-3 CHF/L · Hornbach' },
  { category: 'Finiture – Pittura', description: 'Pittura murale Hornbach Meister 2 mani – 1L', unit: 'l', unitCost: 5.00, qualityLevel: 'MEDIUM', links: 'https://www.hornbach.ch/fr/c/peintures-papiers-peints-revetement-mural/peintures/peintures-pour-murs-enduits/S5287/', notes: 'Hornbach Meister pittura 2 mani ~4.83-5 CHF/L · Hornbach' },
  { category: 'Finiture – Pittura', description: 'Pittura lavabile premium – colori personalizzati – 1L', unit: 'l', unitCost: 13.50, qualityLevel: 'HIGH', links: 'https://www.hornbach.ch/fr/c/peintures-papiers-peints-revetement-mural/peintures/peintures-pour-murs-enduits/S5287/', notes: 'Pittura premium lavabile personalizzata ~13-14 CHF/L · Hornbach' },
  { category: 'Bagno – Riscaldamento', description: 'Scaldasalviette elettrico entry cromato 45×60cm', unit: 'pz', unitCost: 109, qualityLevel: 'LOW', links: 'https://www.hornbach.ch/fr/c/chauffage-climatisation-aeration/radiateurs-accessoires/radiateur-de-salle-de-bains-et-radiateur-design/S5767/', notes: 'Scaldasalviette elettrico entry ~109 CHF · Hornbach' },
  { category: 'Bagno – Riscaldamento', description: 'Scaldasalviette idraulico medio cromato 50×100cm', unit: 'pz', unitCost: 249, qualityLevel: 'MEDIUM', links: 'https://www.hornbach.ch/fr/c/chauffage-climatisation-aeration/radiateurs-accessoires/radiateur-de-salle-de-bains-et-radiateur-design/S5767/', notes: 'Scaldasalviette idraulico medio 199-299 CHF · Hornbach' },
  { category: 'Bagno – Riscaldamento', description: 'Scaldasalviette design premium inox 60×120cm', unit: 'pz', unitCost: 399, qualityLevel: 'HIGH', links: 'https://www.hornbach.ch/fr/c/chauffage-climatisation-aeration/radiateurs-accessoires/radiateur-de-salle-de-bains-et-radiateur-design/S5767/', notes: 'Scaldasalviette design premium ~399 CHF · Hornbach' },
  { category: 'Strutture – Isolamento', description: 'Pannello lana di roccia Knauf 60mm – pareti/soffitto', unit: 'm²', unitCost: 7.50, qualityLevel: 'LOW', links: 'https://www.hornbach.ch/fr/p/panneau-isolant-laine-de-roche-fps-l-knauf-insulation-1200-x-625-x-60-mm/10292243/', notes: 'Knauf Insulation FPS-L 60mm · Hornbach art.10292243 · 7.43 CHF/m2' },
  { category: 'Strutture – Isolamento', description: 'Pannello lana di roccia 100mm – acustico/termico', unit: 'm²', unitCost: 14.00, qualityLevel: 'MEDIUM', links: 'https://www.hornbach.ch/fr/p/plaque-isolante-de-serrage-knauf-insulation-epaisseur-1200x625x100-mm/6610601/', notes: 'Knauf Insulation 100mm · Hornbach art.6610601 · ~14 CHF/m2' },
  { category: 'Strutture – Isolamento', description: 'Pannello EPS 100mm cappotto esterno ETICS facciata', unit: 'm²', unitCost: 25.00, qualityLevel: 'HIGH', links: 'https://www.hornbach.ch/fr/c/materiaux-de-construction/isolation/isolation-par-lexterieur/S4076/', notes: 'EPS 100mm cappotto ETICS facciata ~23-26 CHF/m2 · Hornbach' },
]

async function run() {
  const now = new Date().toISOString()
  let coworkOk = 0, hornbachOk = 0, insertOk = 0, err = 0

  // 1. Cowork updates
  const coworkUpdates = data.items_da_aggiornare.filter(i =>
    i.newUnitCost !== null || i.newLinks !== null || i.newNotes !== null || i.qualityLevel !== null || i.newDescription !== null
  )
  for (const u of coworkUpdates) {
    const sets = [], args = []
    if (u.newUnitCost !== null)    { sets.push('unitCost = ?');    args.push(u.newUnitCost) }
    if (u.newLinks !== null)       { sets.push('links = ?');       args.push(u.newLinks) }
    if (u.newNotes !== null)       { sets.push('notes = ?');       args.push(u.newNotes) }
    if (u.qualityLevel !== null)   { sets.push('qualityLevel = ?');args.push(u.qualityLevel) }
    if (u.newDescription !== null) { sets.push('description = ?'); args.push(u.newDescription) }
    if (sets.length === 0) continue
    sets.push('updatedAt = ?'); args.push(now); args.push(u.id)
    try { await c.execute({ sql: 'UPDATE price_items SET ' + sets.join(', ') + ' WHERE id = ?', args }); coworkOk++ }
    catch(e) { console.error('ERR cowork', u.id, e.message); err++ }
  }

  // 2. Hornbach updates by description
  for (const u of hornbachUpdates) {
    const sets = ['updatedAt = ?'], args = [now]
    if (u.unitCost !== undefined)    { sets.push('unitCost = ?');    args.push(u.unitCost) }
    if (u.qualityLevel !== undefined){ sets.push('qualityLevel = ?');args.push(u.qualityLevel) }
    if (u.links !== undefined)       { sets.push('links = ?');       args.push(u.links) }
    if (u.notes !== undefined)       { sets.push('notes = ?');       args.push(u.notes) }
    args.push(u.desc)
    try {
      const r = await c.execute({ sql: 'UPDATE price_items SET ' + sets.join(', ') + ' WHERE description = ? AND isActive = 1', args })
      if (r.rowsAffected > 0) hornbachOk++; else console.log('  NOT FOUND:', u.desc)
    } catch(e) { console.error('ERR hornbach', u.desc, e.message); err++ }
  }

  // 3. Insert new items
  for (const n of nuovi) {
    const id = uid()
    try {
      await c.execute({
        sql: 'INSERT INTO price_items (id, category, description, unit, unitCost, qualityLevel, notes, links, isActive, createdAt, updatedAt) VALUES (?,?,?,?,?,?,?,?,1,?,?)',
        args: [id, n.category, n.description, n.unit, n.unitCost, n.qualityLevel, n.notes || null, n.links || null, now, now]
      })
      insertOk++
    } catch(e) { console.error('ERR insert', n.description, e.message); err++ }
  }

  console.log('Cowork:', coworkOk, '| Hornbach:', hornbachOk, '| Inseriti:', insertOk, '| Errori:', err)

  const tot = await c.execute('SELECT COUNT(*) as n FROM price_items WHERE isActive = 1')
  const byQ = await c.execute('SELECT qualityLevel, COUNT(*) as n FROM price_items WHERE isActive = 1 GROUP BY qualityLevel ORDER BY qualityLevel')
  console.log('Totale attivi:', tot.rows[0].n)
  byQ.rows.forEach(r => console.log(' ', r.qualityLevel, ':', r.n))
  c.close()
}
run().catch(e => { console.error(e); c.close() })
