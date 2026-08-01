import { createClient } from '@libsql/client'
import { config } from 'dotenv'
config({ path: '.env.local' })

const c = createClient({ url: process.env.DATABASE_URL, authToken: process.env.DATABASE_AUTH_TOKEN })

// Per ogni famiglia di template, mappa la descrizione generica → descrizione prezzario specifica
// per livello qualità. Solo item MATERIALI (non manodopera/servizi) con unità compatibili.
const QUALITY_REMAP = {
  'quote-bagno-ristrutturazione-completa': {
    LOW: {
      'Telaio Geberit Duofix per WC sospeso h112cm':    'Telaio Geberit Duofix Basic h112 + cassetta Delta – LOW',
      'WC sospeso — fornitura (serie base)':             'WC sospeso entry level – bianco rimless sans bride',
      'Gres porcellanato 60×60 — fornitura':            'Gres porcellanato 60×60 entry – bianco/grigio liscio',
      'Box doccia 80×80 porta battente vetro 6mm':      'Box doccia angolare SCHULTE 90×90cm – vetro entry',
      'Miscelatore lavabo monocomando cromato':          'Miscelatore lavabo monocomando – cromato (entry)',
    },
    MEDIUM: {
      'Telaio Geberit Duofix per WC sospeso h112cm':    'Telaio Geberit Duofix per WC sospeso – h112cm',
      'WC sospeso — fornitura (serie base)':             'WC sospeso Duravit D-Neo Rimless bianco',
      'Gres porcellanato 60×60 — fornitura':            'Gres 60×60 – Active Beige (Bauhaus 31365295)',
      'Box doccia 80×80 porta battente vetro 6mm':      'Box doccia angolare 90×90cm – vetro 6mm qualità media',
      'Miscelatore lavabo monocomando cromato':          'Miscelatore lavabo Hansgrohe Logis cromato con scarico',
    },
    HIGH: {
      'Telaio Geberit Duofix per WC sospeso h112cm':    'Telaio Geberit Duofix per WC sospeso – h82cm',
      'WC sospeso — fornitura (serie base)':             'WC sospeso Geberit Acanto – bianco',
      'Gres porcellanato 60×60 — fornitura':            'Gres 60×60 – effetto marmo bianco lucido',
      'Box doccia 80×80 porta battente vetro 6mm':      'Box doccia walk-in Schulte Trend 2.0 90cm – vetro 6mm antikal',
      'Miscelatore lavabo monocomando cromato':          'Miscelatore lavabo monocomando – cromato (Grohe Eurosmart)',
    },
  },

  'quote-cucina-ristrutturazione-completa': {
    LOW: {
      'Gres 60×60 Active Beige — fornitura (Bauhaus 31365295)': 'Gres porcellanato 60×60 entry – bianco/grigio liscio',
      'Piano cottura a induzione 60cm 4 zone':                   'Piano cottura vitroceramica 60cm 4 zone – entry level',
      'Forno elettrico da incasso 60cm multifunzione':           'Forno elettrico da incasso 60cm – ventilato multifunzione',
    },
    MEDIUM: {
      'Piano cottura a induzione 60cm 4 zone':         'Piano cottura a induzione 60cm 4 zone – Bosch',
      'Forno elettrico da incasso 60cm multifunzione': 'Forno elettrico da incasso 60cm – ventilato multifunzione',
    },
    HIGH: {
      'Gres 60×60 Active Beige — fornitura (Bauhaus 31365295)': 'Gres 60×60 – effetto cemento antracite',
      'Piano cottura a induzione 60cm 4 zone':                   'Piano cottura induzione 60cm Siemens EH645BFB6E – 4 zone',
      'Forno elettrico da incasso 60cm multifunzione':           'Forno elettrico da incasso 60cm – pirolisi (Bosch HBG5780)',
    },
  },

  'quote-pavimenti-posa-piastrelle': {
    LOW: {
      'Gres 60×60 Active Beige — fornitura (Bauhaus 31365295)': 'Gres porcellanato 60×60 entry – bianco/grigio liscio',
    },
    MEDIUM: {
      // già corretto — "Gres 60×60 Active Beige" matcha prezzario MEDIUM
    },
    HIGH: {
      'Gres 60×60 Active Beige — fornitura (Bauhaus 31365295)': 'Gres 60×60 – effetto marmo bianco lucido',
    },
  },

  'quote-pavimenti-parquet-laminato': {
    LOW: {
      'Laminato AC5 8mm effetto rovere chiaro — fornitura': 'Laminato AC5 8mm – effetto rovere chiaro',
    },
    MEDIUM: {
      'Laminato AC5 8mm effetto rovere chiaro — fornitura': 'Laminato AC4 10mm – effetto noce',
    },
    HIGH: {
      'Laminato AC5 8mm effetto rovere chiaro — fornitura': 'Parquet prefinito rovere spazzolato 14mm – finitura olio',
    },
  },

  'quote-infissi-sostituzione': {
    LOW: {
      'Finestra PVC triplo vetro 100×120cm — fornitura': 'Finestra PVC doppio vetro 100×120cm – entry',
      'Finestra PVC triplo vetro 80×120cm — fornitura':  'Finestra PVC doppio vetro 100×120cm – entry',
    },
    MEDIUM: {
      'Finestra PVC triplo vetro 100×120cm — fornitura': 'Finestra PVC triplo vetro 100×120cm – media qualità',
      'Finestra PVC triplo vetro 80×120cm — fornitura':  'Finestra PVC triplo vetro 100×120cm – media qualità',
    },
    HIGH: {
      // lascia le descrizioni HIGH così come sono (prezzi già premium nel template)
    },
  },

  'quote-muratura-porte': {
    LOW: {
      'Porta interna tamburata 80×210cm bianco con telaio': 'Porta interna Pertura laccata bianca base – 80cm',
      'Porta interna tamburata 90×210cm bianco con telaio': 'Porta interna Pertura laccata bianca base – 80cm',
    },
    MEDIUM: {
      'Porta interna tamburata 80×210cm bianco con telaio': 'Porta interna + telaio – media qualità laccata bianca',
      'Porta interna tamburata 90×210cm bianco con telaio': 'Porta interna + telaio – media qualità laccata bianca',
    },
    HIGH: {
      'Porta interna tamburata 80×210cm bianco con telaio': 'Porta interna set completo design – alta qualità con vetro',
      'Porta interna tamburata 90×210cm bianco con telaio': 'Porta interna set completo design – alta qualità con vetro',
    },
  },

  'quote-strutture-cartongesso': {
    LOW: {
      'Lana di roccia 50mm (isolazione acustica)': 'Pannello lana di roccia Knauf 60mm – pareti/soffitto',
    },
    MEDIUM: {
      'Lana di roccia 50mm (isolazione acustica)': 'Pannello lana di roccia 100mm – acustico/termico',
    },
    HIGH: {
      'Lana di roccia 50mm (isolazione acustica)': 'Pannello lana di roccia 100mm – acustico/termico',
    },
  },

  'quote-completa-ristrutturazione-appartamento': {
    LOW: {
      'Laminato AC5 8mm fornitura':                              'Laminato AC5 8mm – effetto rovere chiaro',
      'Gres 60×60 fornitura (bagno+cucina)':                    'Gres porcellanato 60×60 entry – bianco/grigio liscio',
      'Telaio Geberit Duofix + WC sospeso + placca':            'Telaio Geberit Duofix Basic h112 + cassetta Delta – LOW',
    },
    MEDIUM: {
      'Laminato AC5 8mm fornitura':                              'Laminato AC4 10mm – effetto noce',
      'Gres 60×60 fornitura (bagno+cucina)':                    'Gres 60×60 – Active Beige (Bauhaus 31365295)',
      'Telaio Geberit Duofix + WC sospeso + placca':            'Telaio Geberit Duofix per WC sospeso – h112cm',
      'Elettrodomestici cucina (induzione+forno+cappa+lavastovig+frigo)': 'Piano cottura a induzione 60cm 4 zone – Bosch',
    },
    HIGH: {
      'Laminato AC5 8mm fornitura':                              'Parquet prefinito rovere spazzolato 14mm – finitura olio',
      'Gres 60×60 fornitura (bagno+cucina)':                    'Gres 60×60 – effetto marmo bianco lucido',
      'Telaio Geberit Duofix + WC sospeso + placca':            'Telaio Geberit Duofix per WC sospeso – h82cm',
      'Elettrodomestici cucina (induzione+forno+cappa+lavastovig+frigo)': 'Piano cottura induzione 60cm Siemens EH645BFB6E – 4 zone',
    },
  },

  // Pittura: le descrizioni del template (m²) non sono compatibili con prezzario (litri)
  // Lasciare i prezzi hardcoded nel template per ora
  'quote-pittura-tinteggiatura': {},

  // Impianti: nessun item materiale significativo da remappare (tutto manodopera/certificazione)
  'quote-impianti-elettrico': {},
}

async function run() {
  const r = await c.execute("SELECT id, name, templateGroupKey, qualityLevel, itemsJson FROM quote_templates WHERE templateType='QUOTE'")
  let updated = 0, skipped = 0, remapped = 0

  for (const row of r.rows) {
    const groupKey = String(row.templateGroupKey || '')
    const quality = String(row.qualityLevel)
    const familyMap = QUALITY_REMAP[groupKey]
    if (!familyMap) { skipped++; continue }

    const qMap = familyMap[quality] || {}
    const items = JSON.parse(String(row.itemsJson))
    let changed = 0

    const newItems = items.map(item => {
      if (item.itemType !== 'ITEM') return item
      const desc = item.description || ''
      const newDesc = qMap[desc]
      if (!newDesc || newDesc === desc) return item
      changed++
      return { ...item, description: newDesc }
    })

    if (changed === 0) { skipped++; continue }

    const now = new Date().toISOString()
    await c.execute({
      sql: 'UPDATE quote_templates SET itemsJson = ?, updatedAt = ? WHERE id = ?',
      args: [JSON.stringify(newItems), now, row.id]
    })
    console.log(`✓ [${quality.padEnd(6)}] ${String(row.name)} — ${changed} item(s) remappati`)
    updated++
    remapped += changed
  }

  console.log(`\nTemplate aggiornati: ${updated} | Saltati: ${skipped} | Item remappati: ${remapped}`)
  c.close()
}

run().catch(e => { console.error(e); c.close() })
