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

function tierFromQuality(qualityLevel) {
  if (qualityLevel === 'LOW') return 'ESSENTIAL'
  if (qualityLevel === 'MEDIUM') return 'STANDARD'
  if (qualityLevel === 'HIGH') return 'PREMIUM'
  return null
}

function scopeFromQuality(qualityLevel) {
  if (qualityLevel === 'LOW') return 'LIGHT'
  if (qualityLevel === 'MEDIUM') return 'STANDARD'
  if (qualityLevel === 'HIGH') return 'COMPLETE'
  return 'SERVICE'
}

function splitLinks(links) {
  return String(links || '')
    .split('\n')
    .map((url) => url.trim())
    .filter(Boolean)
}

function supplierName(url) {
  try {
    return new URL(url).hostname.replace(/^www\./, '')
  } catch {
    return null
  }
}

function sourceType(url) {
  try {
    const parsed = new URL(url)
    const path = parsed.pathname.toLowerCase()
    if (path === '/' || path.includes('/c/') || path.includes('/search') || path.includes('/categoria')) {
      return 'CATEGORY_URL'
    }
    return 'PRODUCT_URL'
  } catch {
    return 'PRODUCT_URL'
  }
}

function confidenceFor(url, index) {
  if (sourceType(url) === 'PRODUCT_URL' && index === 0) return 'HIGH'
  return 'MEDIUM'
}

async function main() {
  const now = new Date().toISOString()

  const priceItems = await db.execute('SELECT id, description, category, unit, unitCost, qualityLevel, productTier, links, notes FROM price_items')
  const templates = await db.execute('SELECT id, qualityLevel, scopeLevel, itemsJson FROM quote_templates')

  let tiersUpdated = 0
  for (const item of priceItems.rows) {
    if (item.productTier != null) continue
    const tier = tierFromQuality(String(item.qualityLevel))
    if (tier == null) continue
    await db.execute({
      sql: 'UPDATE price_items SET productTier = ?, updatedAt = ? WHERE id = ?',
      args: [tier, now, item.id],
    })
    tiersUpdated++
  }

  let scopesUpdated = 0
  for (const template of templates.rows) {
    if (template.scopeLevel != null) continue
    await db.execute({
      sql: 'UPDATE quote_templates SET scopeLevel = ?, updatedAt = ? WHERE id = ?',
      args: [scopeFromQuality(String(template.qualityLevel)), now, template.id],
    })
    scopesUpdated++
  }

  const existingSources = await db.execute('SELECT priceItemId, sourceType, url FROM price_sources')
  const sourceKeys = new Set(existingSources.rows.map((row) => `${row.priceItemId}|${row.url || row.sourceType}`))

  let sourcesInserted = 0
  for (const item of priceItems.rows) {
    const links = splitLinks(item.links)
    if (links.length > 0) {
      for (const [index, url] of links.entries()) {
        const key = `${item.id}|${url}`
        if (sourceKeys.has(key)) continue
        await db.execute({
          sql: `INSERT INTO price_sources
            (id, priceItemId, supplierName, sourceType, url, observedPrice, currency, vatIncluded, unit, observedAt, confidence, notes, createdAt, updatedAt)
            VALUES (?, ?, ?, ?, ?, ?, 'CHF', NULL, ?, ?, ?, ?, ?, ?)`,
          args: [
            uid(),
            item.id,
            supplierName(url),
            sourceType(url),
            url,
            index === 0 ? item.unitCost : null,
            item.unit,
            now,
            confidenceFor(url, index),
            index === 0 ? item.notes : null,
            now,
            now,
          ],
        })
        sourceKeys.add(key)
        sourcesInserted++
      }
      continue
    }

    const estimateKey = `${item.id}|ESTIMATE`
    if (sourceKeys.has(estimateKey)) continue
    const category = String(item.category || '')
    const isService = category.startsWith('Manodopera') || category.startsWith('Logistica')
    await db.execute({
      sql: `INSERT INTO price_sources
        (id, priceItemId, supplierName, sourceType, observedPrice, currency, vatIncluded, unit, observedAt, confidence, notes, createdAt, updatedAt)
        VALUES (?, ?, NULL, 'ESTIMATE', ?, 'CHF', NULL, ?, ?, ?, ?, ?, ?)`,
      args: [
        uid(),
        item.id,
        item.unitCost,
        item.unit,
        now,
        isService ? 'MEDIUM' : 'LOW',
        item.notes || (isService ? 'Tariffa interna di riferimento.' : 'Stima interna da verificare con fornitore.'),
        now,
        now,
      ],
    })
    sourceKeys.add(estimateKey)
    sourcesInserted++
  }

  const activePrices = await db.execute('SELECT id, description FROM price_items WHERE isActive = 1')
  const priceByDescription = new Map(
    activePrices.rows.map((item) => [String(item.description).toLowerCase().trim(), String(item.id)]),
  )

  const quoteItems = await db.execute("SELECT id, description FROM quote_items WHERE itemType = 'ITEM' AND (priceItemId IS NULL OR priceItemId = '')")
  let quoteItemsLinked = 0
  for (const item of quoteItems.rows) {
    const priceItemId = priceByDescription.get(String(item.description || '').toLowerCase().trim())
    if (!priceItemId) continue
    await db.execute({
      sql: 'UPDATE quote_items SET priceItemId = ?, updatedAt = ? WHERE id = ?',
      args: [priceItemId, now, item.id],
    })
    quoteItemsLinked++
  }

  const templateRows = await db.execute('SELECT id, itemsJson FROM quote_templates')
  let templatesUpdated = 0
  let templateItemsLinked = 0
  for (const template of templateRows.rows) {
    let items
    try {
      items = JSON.parse(String(template.itemsJson || '[]'))
    } catch {
      continue
    }
    if (!Array.isArray(items)) continue
    let changed = 0
    const next = items.map((item) => {
      if ((item.itemType || 'ITEM') !== 'ITEM' || item.priceItemId) return item
      const priceItemId = priceByDescription.get(String(item.description || '').toLowerCase().trim())
      if (!priceItemId) return item
      changed++
      return { ...item, priceItemId }
    })
    if (changed === 0) continue
    await db.execute({
      sql: 'UPDATE quote_templates SET itemsJson = ?, updatedAt = ? WHERE id = ?',
      args: [JSON.stringify(next), now, template.id],
    })
    templatesUpdated++
    templateItemsLinked += changed
  }

  console.log(JSON.stringify({
    tiersUpdated,
    scopesUpdated,
    sourcesInserted,
    quoteItemsLinked,
    templatesUpdated,
    templateItemsLinked,
  }, null, 2))
}

main().catch((error) => {
  console.error(error)
  process.exitCode = 1
}).finally(() => db.close())
