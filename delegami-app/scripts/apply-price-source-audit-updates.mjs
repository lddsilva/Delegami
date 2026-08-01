import { createClient } from '@libsql/client'
import { config } from 'dotenv'

config({ path: '.env.local' })

const db = createClient({
  url: process.env.DATABASE_URL,
  authToken: process.env.DATABASE_AUTH_TOKEN,
})

function uid() {
  return `c${Date.now().toString(36)}${Math.random().toString(36).slice(2, 10)}`
}

const observedAt = new Date().toISOString()

const updates = [
  {
    id: 'cmpgv19cjlvzzdcfy',
    links: 'https://www.bauhaus.ch/it/battiscopa/logoclic-zoccolino/p/28574400',
    notes: 'Battiscopa laminato LOGOCLIC 58x18mm. Prodotto verificato su Bauhaus; vecchio riferimento Rovere Firenze/Bauhaus 31158811 da confermare se serve colore esatto.',
    sources: [
      {
        supplierName: 'bauhaus.ch',
        sourceType: 'PRODUCT_URL',
        url: 'https://www.bauhaus.ch/it/battiscopa/logoclic-zoccolino/p/28574400',
        observedPrice: null,
        confidence: 'MEDIUM',
        notes: 'Pagina prodotto LOGOCLIC zoccolino. Prezzo non leggibile via fetch per protezione sito.',
      },
    ],
  },
  {
    id: 'cmphd6ny2l8mse6vf',
    unitCost: 269,
    links: 'https://www.hornbach.ch/fr/p/wc-suspendu-duravit-d-neo-rimless-blanc-45770900a1/10695524/',
    notes: 'Duravit D-Neo WC sospeso Rimless bianco 45770900A1. Hornbach art.10695524, prezzo retail CHF 269.',
    sources: [
      {
        supplierName: 'hornbach.ch',
        sourceType: 'PRODUCT_URL',
        url: 'https://www.hornbach.ch/fr/p/wc-suspendu-duravit-d-neo-rimless-blanc-45770900a1/10695524/',
        observedPrice: 269,
        confidence: 'HIGH',
        notes: 'Prodotto esatto, prezzo indicizzato da ricerca web Hornbach.',
      },
    ],
  },
  {
    id: 'cmpgv4tb4ufyoej02',
    unitCost: 59.9,
    links: 'https://www.hornbach.ch/fr/c/salles-de-bains-sanitaires/ceramique-de-salles-de-bains/couvercle-de-wc/S5546/',
    notes: 'Copriwater soft-close universale bianco. Riferimento retail Hornbach/REIKA MINO circa CHF 59.90.',
    sources: [
      {
        supplierName: 'hornbach.ch',
        sourceType: 'CATEGORY_URL',
        url: 'https://www.hornbach.ch/fr/c/salles-de-bains-sanitaires/ceramique-de-salles-de-bains/couvercle-de-wc/S5546/',
        observedPrice: 59.9,
        confidence: 'MEDIUM',
        notes: 'Categoria con prodotto comparabile soft-close universale; verificare modello finale.',
      },
    ],
  },
  {
    id: 'cmphd6o3euhdpteeo',
    unitCost: 249,
    links: 'https://www.hornbach.ch/fr/c/salles-de-bains-sanitaires/douches/portes-et-parois-de-douche/S23941/f/Serie%3DSAMOA/',
    notes: 'Box doccia angolare 90x90 vetro 6mm qualita media. Riferimento Hornbach serie Samoa circa CHF 249.',
    sources: [
      {
        supplierName: 'hornbach.ch',
        sourceType: 'CATEGORY_URL',
        url: 'https://www.hornbach.ch/fr/c/salles-de-bains-sanitaires/douches/portes-et-parois-de-douche/S23941/f/Serie%3DSAMOA/',
        observedPrice: 249,
        confidence: 'MEDIUM',
        notes: 'Categoria/serie comparabile, non singolo SKU bloccato.',
      },
    ],
  },
  {
    id: 'cmphd6o1le292e9zp',
    unitCost: 283,
    links: 'https://www.hornbach.ch/fr/c/salles-de-bains-sanitaires/douches/portes-et-parois-de-douche/S23941/f/Marque%3DSCHULTE/',
    notes: 'Box doccia angolare SCHULTE 90x90 entry. Riferimento Hornbach SCHULTE Sunny circa CHF 283.',
    sources: [
      {
        supplierName: 'hornbach.ch',
        sourceType: 'CATEGORY_URL',
        url: 'https://www.hornbach.ch/fr/c/salles-de-bains-sanitaires/douches/portes-et-parois-de-douche/S23941/f/Marque%3DSCHULTE/',
        observedPrice: 283,
        confidence: 'MEDIUM',
        notes: 'Prodotto comparabile entry SCHULTE; confermare variante esatta in fase acquisto.',
      },
    ],
  },
  {
    id: 'cmphd6o55a964m83a',
    links: 'https://www.hornbach.ch/fr/p/paroi-de-douche-a-l-italienne-schulte-alexa-style-2-0-90-cm-profil-blanc-transparent/12401811/',
    notes: 'Box doccia walk-in premium Schulte/Alexa Style 2.0 90cm. Prezzo interno mantenuto CHF 799 fino a conferma fornitore.',
    sources: [
      {
        supplierName: 'hornbach.ch',
        sourceType: 'PRODUCT_URL',
        url: 'https://www.hornbach.ch/fr/p/paroi-de-douche-a-l-italienne-schulte-alexa-style-2-0-90-cm-profil-blanc-transparent/12401811/',
        observedPrice: null,
        confidence: 'MEDIUM',
        notes: 'Pagina prodotto comparabile premium; prezzo non leggibile via fetch per protezione sito.',
      },
    ],
  },
  {
    id: 'cmpgv9aj8mymrb860',
    unitCost: 459,
    links: 'https://www.hornbach.ch/fr/c/cuisines/appareils-electromenagers/fours-cuisinieres/fours-encastrables/S20549/',
    notes: 'Forno elettrico da incasso 60cm ventilato multifunzione. Riferimento Hornbach Bosch HBA514BS3 circa CHF 459.',
    sources: [
      {
        supplierName: 'hornbach.ch',
        sourceType: 'CATEGORY_URL',
        url: 'https://www.hornbach.ch/fr/c/cuisines/appareils-electromenagers/fours-cuisinieres/fours-encastrables/S20549/',
        observedPrice: 459,
        confidence: 'MEDIUM',
        notes: 'Categoria con modello Bosch comparabile; verificare SKU finale.',
      },
    ],
  },
  {
    id: 'cmphd6odrq5z0mo53',
    unitCost: 16.5,
    links: 'https://www.hornbach.ch/fr/c/revetements-de-sol-carrelages/carrelages/carrelages-sol/S6058/f/S%C3%A9rie%3DMESSINA/',
    notes: 'Gres porcellanato 60x60 entry bianco/grigio. Riferimento Hornbach serie Messina circa CHF 16.50/m2.',
    sources: [
      {
        supplierName: 'hornbach.ch',
        sourceType: 'CATEGORY_URL',
        url: 'https://www.hornbach.ch/fr/c/revetements-de-sol-carrelages/carrelages/carrelages-sol/S6058/f/S%C3%A9rie%3DMESSINA/',
        observedPrice: 16.5,
        confidence: 'MEDIUM',
        notes: 'Categoria/serie comparabile entry gres 60x60.',
      },
    ],
  },
  {
    id: 'cmphd6osyvgyekle6',
    links: 'https://www.hornbach.ch/fr/projets/choisir-des-fenetres-sur-mesure/',
    notes: 'Finestra PVC doppio vetro 100x120cm entry. Prezzo da verificare con configuratore/fornitore per misura esatta; valore interno mantenuto CHF 250.',
    sources: [
      {
        supplierName: 'hornbach.ch',
        sourceType: 'INDEX',
        url: 'https://www.hornbach.ch/fr/projets/choisir-des-fenetres-sur-mesure/',
        observedPrice: 122.81,
        confidence: 'LOW',
        notes: 'Configuratore finestre su misura: prezzo base indicativo, non misura 100x120 bloccata.',
      },
    ],
  },
  {
    id: 'cmphd6oun4jxrpr3o',
    links: 'https://www.hornbach.ch/fr/projets/choisir-des-fenetres-sur-mesure/',
    notes: 'Finestra PVC triplo vetro 100x120cm media qualita. Prezzo da verificare con configuratore/fornitore per misura esatta; valore interno mantenuto CHF 420.',
    sources: [
      {
        supplierName: 'hornbach.ch',
        sourceType: 'INDEX',
        url: 'https://www.hornbach.ch/fr/projets/choisir-des-fenetres-sur-mesure/',
        observedPrice: 122.81,
        confidence: 'LOW',
        notes: 'Configuratore finestre su misura: prezzo base indicativo, non misura 100x120 bloccata.',
      },
    ],
  },
  {
    id: 'pi-E.01',
    sources: [
      {
        supplierName: 'baunex.ch',
        sourceType: 'INDEX',
        url: 'https://baunex.ch/it/blog/stundenlohn-elektriker-schweiz-kalkulation',
        observedPrice: 110,
        confidence: 'MEDIUM',
        notes: 'Indice tariffario Svizzera: elettricista circa CHF 110-160/h secondo qualificazione/regione.',
      },
    ],
  },
  {
    id: 'cmpgvinkg685gmxve',
    sources: [
      {
        supplierName: 'baunex.ch',
        sourceType: 'INDEX',
        url: 'https://baunex.ch/it/blog/stundenlohn-elektriker-schweiz-kalkulation',
        observedPrice: 90,
        confidence: 'MEDIUM',
        notes: 'Indice tariffario Svizzera; valore interno Zanetti per costo ora mantenuto.',
      },
    ],
  },
  {
    id: 'pi-O.01',
    unitCost: 84.5,
    notes: 'Tariffa SSIC/Ticino 2026 indicativa per muratore qualificato. Verificare ogni anno con contratto collettivo.',
    sources: [
      {
        supplierName: 'appalti.ti.ch',
        sourceType: 'INDEX',
        url: 'https://www4.ti.ch/dfe/dr/ustat/temi/prezzi/prezzi-costruzione',
        observedPrice: 84.5,
        confidence: 'MEDIUM',
        notes: 'Riferimento cantonale/Ticino da verificare su documento aggiornato.',
      },
    ],
  },
  {
    id: 'cmpgvim1846r14jw4',
    unitCost: 84.5,
    notes: 'Muratore qualificato Ticino 2026: riferimento indicativo CHF 84.50/h; da aggiornare con contratto collettivo annuale.',
    sources: [
      {
        supplierName: 'appalti.ti.ch',
        sourceType: 'INDEX',
        url: 'https://www4.ti.ch/dfe/dr/ustat/temi/prezzi/prezzi-costruzione',
        observedPrice: 84.5,
        confidence: 'MEDIUM',
        notes: 'Riferimento cantonale/Ticino da verificare su documento aggiornato.',
      },
    ],
  },
  {
    id: 'pi-H.01',
    sources: [
      {
        supplierName: 'houzy.ch',
        sourceType: 'INDEX',
        url: 'https://it.houzy.ch/post/costi-bagno',
        observedPrice: 112,
        confidence: 'MEDIUM',
        notes: 'Range di mercato per ristrutturazioni bagno in Svizzera; valore orario interno mantenuto.',
      },
    ],
  },
  {
    id: 'cmpgvin5g6fglandj',
    sources: [
      {
        supplierName: 'houzy.ch',
        sourceType: 'INDEX',
        url: 'https://it.houzy.ch/post/costi-bagno',
        observedPrice: 95,
        confidence: 'MEDIUM',
        notes: 'Range di mercato per impianti/idraulica bagno; valore interno Zanetti mantenuto.',
      },
    ],
  },
]

async function upsertSource(priceItemId, source) {
  const existing = await db.execute({
    sql: "SELECT id FROM price_sources WHERE priceItemId = ? AND sourceType = ? AND IFNULL(url, '') = IFNULL(?, '') LIMIT 1",
    args: [priceItemId, source.sourceType, source.url || null],
  })

  const args = [
    source.supplierName || null,
    source.observedPrice ?? null,
    source.unit || null,
    observedAt,
    source.confidence || 'MEDIUM',
    source.notes || null,
  ]

  if (existing.rows.length > 0) {
    await db.execute({
      sql: `UPDATE price_sources
        SET supplierName = ?, observedPrice = ?, unit = ?, observedAt = ?, confidence = ?, notes = ?, updatedAt = ?
        WHERE id = ?`,
      args: [...args, observedAt, existing.rows[0].id],
    })
    return 'updated'
  }

  await db.execute({
    sql: `INSERT INTO price_sources
      (id, priceItemId, supplierName, sourceType, url, observedPrice, currency, vatIncluded, unit, observedAt, confidence, notes, createdAt, updatedAt)
      VALUES (?, ?, ?, ?, ?, ?, 'CHF', NULL, ?, ?, ?, ?, ?, ?)`,
    args: [
      uid(),
      priceItemId,
      source.supplierName || null,
      source.sourceType,
      source.url || null,
      source.observedPrice ?? null,
      source.unit || null,
      observedAt,
      source.confidence || 'MEDIUM',
      source.notes || null,
      observedAt,
      observedAt,
    ],
  })
  return 'inserted'
}

async function markLegacyEstimates() {
  const result = await db.execute(`
    SELECT ps.id, ps.notes AS sourceNotes, pi.notes AS itemNotes
    FROM price_sources ps
    JOIN price_items pi ON pi.id = ps.priceItemId
    WHERE ps.sourceType = 'ESTIMATE'
      AND (
        pi.notes LIKE '%2024%'
        OR pi.notes LIKE '%2025%'
        OR pi.notes LIKE '%NPK%'
        OR pi.notes LIKE '%SSIC%'
        OR pi.notes LIKE '%AITI%'
      )
  `)

  let updated = 0
  for (const row of result.rows) {
    await db.execute({
      sql: `UPDATE price_sources
        SET sourceType = 'LEGACY_PRICE', confidence = 'LOW', notes = ?, updatedAt = ?
        WHERE id = ?`,
      args: [
        `${row.sourceNotes || row.itemNotes || 'Prezzo storico/importato'} | Marcato come prezzo storico da rivedere periodicamente.`,
        observedAt,
        row.id,
      ],
    })
    updated += 1
  }
  return updated
}

async function main() {
  let itemsUpdated = 0
  let sourcesInserted = 0
  let sourcesUpdated = 0

  for (const update of updates) {
    const sets = ['updatedAt = ?']
    const args = [observedAt]
    if (update.unitCost != null) {
      sets.push('unitCost = ?')
      args.push(update.unitCost)
    }
    if (update.links != null) {
      sets.push('links = ?')
      args.push(update.links)
    }
    if (update.notes != null) {
      sets.push('notes = ?')
      args.push(update.notes)
    }

    if (sets.length > 1) {
      await db.execute({
        sql: `UPDATE price_items SET ${sets.join(', ')} WHERE id = ?`,
        args: [...args, update.id],
      })
      itemsUpdated += 1
    }

    for (const source of update.sources || []) {
      const result = await upsertSource(update.id, source)
      if (result === 'inserted') sourcesInserted += 1
      if (result === 'updated') sourcesUpdated += 1
    }
  }

  const legacyMarked = await markLegacyEstimates()

  console.log(JSON.stringify({ itemsUpdated, sourcesInserted, sourcesUpdated, legacyMarked }, null, 2))
  db.close()
}

main().catch((error) => {
  console.error(error)
  db.close()
  process.exit(1)
})
