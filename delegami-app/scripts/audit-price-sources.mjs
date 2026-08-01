import { createClient } from '@libsql/client'
import { config } from 'dotenv'
import { writeFileSync } from 'fs'

config({ path: '.env.local' })

const db = createClient({
  url: process.env.DATABASE_URL,
  authToken: process.env.DATABASE_AUTH_TOKEN,
})

function statusFor(item) {
  const sources = item.sources
  if (sources.length === 0) return 'MISSING'
  if (sources.some((source) => source.sourceType === 'PRODUCT_URL')) return 'PRODUCT_EXACT'
  if (sources.some((source) => source.sourceType === 'LEGACY_PRICE')) return 'LEGACY'
  if (sources.every((source) => source.sourceType === 'ESTIMATE')) return 'ESTIMATE'
  if (sources.some((source) => source.sourceType === 'CATEGORY_URL')) return 'CATEGORY_ONLY'
  return 'MIXED'
}

function parentCategory(category) {
  return String(category).split(' – ')[0]
}

function riskScore(item) {
  const statusWeights = {
    MISSING: 35,
    ESTIMATE: 28,
    LEGACY: 24,
    CATEGORY_ONLY: 18,
    MIXED: 12,
    PRODUCT_EXACT: 0,
  }
  const status = statusFor(item)
  if (status === 'PRODUCT_EXACT') {
    return Number((Math.min(item.templateUsage * 2, 10) + Math.min(Number(item.unitCost || 0) / 250, 4)).toFixed(2))
  }
  const usageWeight = item.templateUsage * 9
  const costWeight = Math.min(Number(item.unitCost || 0) / 100, 10)
  const noObservedPriceWeight = item.sources.some((source) => source.observedPrice != null) ? 0 : 4
  return Number((statusWeights[status] + usageWeight + costWeight + noObservedPriceWeight).toFixed(2))
}

async function main() {
  const itemsResult = await db.execute(`
    SELECT id, category, description, unit, unitCost, productTier, notes, links, isActive
    FROM price_items
    WHERE isActive = 1
    ORDER BY category, description
  `)
  const sourcesResult = await db.execute(`
    SELECT priceItemId, supplierName, sourceType, url, observedPrice, currency, confidence, observedAt, notes
    FROM price_sources
  `)
  const templatesResult = await db.execute('SELECT itemsJson FROM quote_templates WHERE isActive = 1')

  const sourcesByItem = new Map()
  for (const source of sourcesResult.rows) {
    const key = String(source.priceItemId)
    if (!sourcesByItem.has(key)) sourcesByItem.set(key, [])
    sourcesByItem.get(key).push(source)
  }

  const usageByItem = new Map()
  for (const template of templatesResult.rows) {
    let parsed = []
    try {
      parsed = JSON.parse(template.itemsJson || '[]')
    } catch {
      parsed = []
    }
    for (const item of parsed) {
      if (!item.priceItemId) continue
      usageByItem.set(item.priceItemId, (usageByItem.get(item.priceItemId) || 0) + 1)
    }
  }

  const audited = itemsResult.rows.map((item) => {
    const sources = sourcesByItem.get(String(item.id)) || []
    const templateUsage = usageByItem.get(String(item.id)) || 0
    const enriched = { ...item, sources, templateUsage }
    const status = statusFor(enriched)
    return {
      id: item.id,
      category: item.category,
      parent: parentCategory(item.category),
      description: item.description,
      unit: item.unit,
      unitCost: item.unitCost,
      productTier: item.productTier,
      templateUsage,
      sourceStatus: status,
      sourceCount: sources.length,
      sourceTypes: [...new Set(sources.map((source) => source.sourceType))],
      riskScore: riskScore(enriched),
    }
  }).sort((a, b) => b.riskScore - a.riskScore)

  const totals = audited.reduce((acc, item) => {
    acc.activeItems += 1
    acc.byStatus[item.sourceStatus] = (acc.byStatus[item.sourceStatus] || 0) + 1
    acc.byParent[item.parent] = (acc.byParent[item.parent] || 0) + 1
    if (item.templateUsage > 0) acc.usedByTemplates += 1
    if (item.sourceStatus !== 'PRODUCT_EXACT') acc.needsReview += 1
    return acc
  }, { activeItems: 0, usedByTemplates: 0, needsReview: 0, byStatus: {}, byParent: {} })

  const report = {
    generatedAt: new Date().toISOString(),
    totals,
    topReviewRisks: audited.filter((item) => item.sourceStatus !== 'PRODUCT_EXACT').slice(0, 80),
    topTemplateDependencies: audited.filter((item) => item.templateUsage > 0).slice(0, 80),
    topRisks: audited.slice(0, 80),
  }

  if (process.argv.includes('--write')) {
    writeFileSync('prezzario-price-audit.json', `${JSON.stringify(report, null, 2)}\n`)
  }

  console.log(JSON.stringify(report, null, 2))
  db.close()
}

main().catch((error) => {
  console.error(error)
  db.close()
  process.exit(1)
})
