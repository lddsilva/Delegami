// Normalize quote/invoice template metadata and create LOW/HIGH variants.
// Existing construction templates become MEDIUM so the picker can show
// Basso / Medio / Alto as one family instead of unrelated cards.
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

function round(value) {
  return Math.round((Number(value) || 0) * 100) / 100
}

const QUALITY_LABEL = {
  LOW: 'Basso',
  MEDIUM: 'Medio',
  HIGH: 'Alto',
  STANDARD: 'Standard',
}

function qualityName(baseName, qualityLevel) {
  if (qualityLevel === 'STANDARD') return baseName
  return `${baseName} - ${QUALITY_LABEL[qualityLevel]}`
}

function stripQualitySuffix(name) {
  return String(name)
    .replace(/\s+-\s+(Basso|Medio|Alto|Standard)$/i, '')
    .trim()
}

function scaleItems(items, factor, qualityLevel) {
  const label = QUALITY_LABEL[qualityLevel]
  return items.map((item) => {
    const next = { ...item }

    if (next.itemType === 'HEADER') {
      next.description = qualityName(stripQualitySuffix(next.description || ''), qualityLevel)
      return next
    }

    if (next.itemType && next.itemType !== 'ITEM') return next

    for (const key of ['unitCost', 'unitPrice', 'totalCost', 'totalPrice', 'total']) {
      if (typeof next[key] === 'number') next[key] = round(next[key] * factor)
    }

    if (next.sourceNote) {
      next.sourceNote = `${next.sourceNote} | Variante qualita: ${label}`
    } else if (next.itemType === 'ITEM') {
      next.sourceNote = `Variante qualita: ${label}`
    }

    return next
  })
}

const TEMPLATE_META = [
  // Quote templates
  ['QUOTE', 'Ristrutturazione Bagno Completo', 'Bagno', 'Ristrutturazione completa', 'quote-bagno-ristrutturazione-completa', true, 0.82, 1.35, 'Template bagno con tre livelli di finitura: economico, medio e alto.'],
  ['QUOTE', 'Ristrutturazione Cucina Completa', 'Cucina', 'Ristrutturazione completa', 'quote-cucina-ristrutturazione-completa', true, 0.78, 1.45, 'Template cucina con tre livelli di arredo, elettrodomestici e finiture.'],
  ['QUOTE', 'Posa Piastrelle', 'Pavimenti', 'Posa piastrelle', 'quote-pavimenti-posa-piastrelle', true, 0.75, 1.4, 'Template posa piastrelle con materiali economici, medi o premium.'],
  ['QUOTE', 'Tinteggiatura Appartamento', 'Pittura', 'Tinteggiatura', 'quote-pittura-tinteggiatura', true, 0.85, 1.25, 'Template tinteggiatura con qualita vernice e preparazione variabile.'],
  ['QUOTE', 'Rifacimento Impianto Elettrico', 'Impianti', 'Impianto elettrico', 'quote-impianti-elettrico', true, 0.9, 1.25, 'Template elettrico con dotazione standard o ampliata.'],
  ['QUOTE', 'Opere Murarie - Apertura/Chiusura Porte', 'Muratura', 'Apertura/chiusura porte', 'quote-muratura-porte', true, 0.9, 1.2, 'Template opere murarie con complessita e finiture diverse.'],
  ['QUOTE', 'Opere Murarie — Apertura/Chiusura Porte', 'Muratura', 'Apertura/chiusura porte', 'quote-muratura-porte', true, 0.9, 1.2, 'Template opere murarie con complessita e finiture diverse.'],
  ['QUOTE', 'Sostituzione Finestre e Infissi', 'Infissi', 'Sostituzione infissi', 'quote-infissi-sostituzione', true, 0.8, 1.45, 'Template infissi con gamme differenti di vetro, profili e accessori.'],
  ['QUOTE', 'Controparete Cartongesso', 'Strutture', 'Cartongesso', 'quote-strutture-cartongesso', true, 0.85, 1.25, 'Template cartongesso con isolamento e finiture variabili.'],
  ['QUOTE', 'Posa Parquet Laminato', 'Pavimenti', 'Posa parquet/laminato', 'quote-pavimenti-parquet-laminato', true, 0.78, 1.35, 'Template parquet/laminato con tre livelli di materiale.'],
  ['QUOTE', 'Ristrutturazione Completa Appartamento', 'Completa', 'Ristrutturazione appartamento', 'quote-completa-ristrutturazione-appartamento', true, 0.85, 1.35, 'Template appartamento completo con livello finiture selezionabile.'],

  // Invoice templates
  ['INVOICE', 'Ristrutturazione Bagno Completo', 'Bagno', 'Ristrutturazione completa', 'invoice-bagno-ristrutturazione-completa', true, 0.82, 1.35, 'Fattura bagno con tre livelli di finitura.'],
  ['INVOICE', 'Ristrutturazione Cucina Completa', 'Cucina', 'Ristrutturazione completa', 'invoice-cucina-ristrutturazione-completa', true, 0.78, 1.45, 'Fattura cucina con tre livelli di arredo e finiture.'],
  ['INVOICE', 'Posa Piastrelle', 'Pavimenti', 'Posa piastrelle', 'invoice-pavimenti-posa-piastrelle', true, 0.75, 1.4, 'Fattura posa piastrelle con livelli materiale.'],
  ['INVOICE', 'Tinteggiatura Appartamento', 'Pittura', 'Tinteggiatura', 'invoice-pittura-tinteggiatura', true, 0.85, 1.25, 'Fattura tinteggiatura con qualita vernice variabile.'],
  ['INVOICE', 'Rifacimento Impianto Elettrico', 'Impianti', 'Impianto elettrico', 'invoice-impianti-elettrico', true, 0.9, 1.25, 'Fattura impianto elettrico con dotazione variabile.'],
  ['INVOICE', 'Opere Murarie Generali', 'Muratura', 'Opere murarie', 'invoice-muratura-generale', true, 0.9, 1.2, 'Fattura opere murarie con complessita variabile.'],
  ['INVOICE', 'Sostituzione Finestre e Infissi', 'Infissi', 'Sostituzione infissi', 'invoice-infissi-sostituzione', true, 0.8, 1.45, 'Fattura infissi con livello di gamma.'],
  ['INVOICE', 'Controparete Cartongesso', 'Strutture', 'Cartongesso', 'invoice-strutture-cartongesso', true, 0.85, 1.25, 'Fattura cartongesso con isolamento e finiture variabili.'],
  ['INVOICE', 'Posa Parquet Laminato', 'Pavimenti', 'Posa parquet/laminato', 'invoice-pavimenti-parquet-laminato', true, 0.78, 1.35, 'Fattura parquet/laminato con livelli materiale.'],
  ['INVOICE', 'Installazione Impianto Idraulico Bagno', 'Idraulica', 'Bagno', 'invoice-idraulica-bagno', true, 0.9, 1.2, 'Fattura idraulica bagno con dotazione variabile.'],
  ['INVOICE', 'Cappotto Termico Esterno', 'Isolamento', 'Cappotto termico', 'invoice-isolamento-cappotto', true, 0.85, 1.3, 'Fattura cappotto con materiali e spessori diversi.'],

  ['INVOICE', 'SAL 1 - Avanzamento Lavori 30%', 'SAL', 'Avanzamento lavori', 'invoice-sal', false, 1, 1, 'Template contabile per stato avanzamento lavori.'],
  ['INVOICE', 'SAL 1 — Avanzamento Lavori 30%', 'SAL', 'Avanzamento lavori', 'invoice-sal', false, 1, 1, 'Template contabile per stato avanzamento lavori.'],
  ['INVOICE', 'SAL 2 - Avanzamento Lavori 60%', 'SAL', 'Avanzamento lavori', 'invoice-sal', false, 1, 1, 'Template contabile per stato avanzamento lavori.'],
  ['INVOICE', 'SAL 2 — Avanzamento Lavori 60%', 'SAL', 'Avanzamento lavori', 'invoice-sal', false, 1, 1, 'Template contabile per stato avanzamento lavori.'],
  ['INVOICE', 'SAL 3 - Saldo Finale', 'SAL', 'Saldo finale', 'invoice-sal', false, 1, 1, 'Template contabile per saldo finale.'],
  ['INVOICE', 'SAL 3 — Saldo Finale', 'SAL', 'Saldo finale', 'invoice-sal', false, 1, 1, 'Template contabile per saldo finale.'],
  ['INVOICE', 'Fornitura Materiali Edili', 'Fornitura', 'Materiali edili', 'invoice-fornitura-materiali-edili', false, 1, 1, 'Template fornitura materiali, senza livello finiture.'],
  ['INVOICE', 'Noleggio Attrezzature Cantiere', 'Noleggio', 'Attrezzature cantiere', 'invoice-noleggio-attrezzature', false, 1, 1, 'Template noleggio attrezzature.'],
  ['INVOICE', 'Consulenza e Direzione Lavori', 'Consulenza', 'Direzione lavori', 'invoice-consulenza-direzione-lavori', false, 1, 1, 'Template consulenza e direzione lavori.'],
  ['INVOICE', 'Smaltimento Rifiuti e Bonifica', 'Smaltimento', 'Rifiuti e bonifica', 'invoice-smaltimento-rifiuti', false, 1, 1, 'Template smaltimento rifiuti e bonifica.'],
  ['INVOICE', 'Manodopera Giornaliera', 'Manodopera', 'Giornaliera', 'invoice-manodopera-giornaliera', false, 1, 1, 'Template manodopera a tariffa.'],
  ['INVOICE', 'Acconto Lavori', 'Acconto', 'Acconto', 'invoice-acconto-lavori', false, 1, 1, 'Template acconto lavori.'],
].map(([templateType, baseName, category, subcategory, groupKey, variants, lowFactor, highFactor, description], idx) => ({
  templateType,
  baseName,
  category,
  subcategory,
  groupKey,
  variants,
  lowFactor,
  highFactor,
  description,
  sortOrder: idx + 1,
}))

async function findTemplateRows(meta) {
  const names = [
    meta.baseName,
    qualityName(meta.baseName, 'LOW'),
    qualityName(meta.baseName, 'MEDIUM'),
    qualityName(meta.baseName, 'HIGH'),
    meta.baseName.replace('—', '-'),
    meta.baseName.replace('-', '—'),
  ]
  const placeholders = names.map(() => '?').join(',')
  const result = await db.execute({
    sql: `SELECT * FROM quote_templates
          WHERE templateType = ?
            AND (templateGroupKey = ? OR name IN (${placeholders}))`,
    args: [meta.templateType, meta.groupKey, ...names],
  })
  return result.rows
}

async function normalizeExisting() {
  const now = new Date().toISOString()
  for (const meta of TEMPLATE_META) {
    const rows = await findTemplateRows(meta)
    for (const row of rows) {
      let qualityLevel = row.qualityLevel
      if (!['LOW', 'MEDIUM', 'HIGH'].includes(qualityLevel)) {
        qualityLevel = meta.variants ? 'MEDIUM' : 'STANDARD'
      }
      const name = meta.variants ? qualityName(meta.baseName, qualityLevel) : stripQualitySuffix(row.name)
      await db.execute({
        sql: `UPDATE quote_templates
              SET name = ?, category = ?, subcategory = ?, templateGroupKey = ?,
                  qualityLevel = ?, description = COALESCE(NULLIF(description, ''), ?),
                  sortOrder = ?, updatedAt = ?
              WHERE id = ?`,
        args: [
          name,
          meta.category,
          meta.subcategory,
          meta.groupKey,
          qualityLevel,
          meta.description,
          meta.sortOrder,
          now,
          row.id,
        ],
      })
    }
  }
}

async function createMissingVariants() {
  const now = new Date().toISOString()
  let created = 0
  for (const meta of TEMPLATE_META.filter((m) => m.variants)) {
    const medium = await db.execute({
      sql: `SELECT * FROM quote_templates
            WHERE templateType = ? AND templateGroupKey = ? AND qualityLevel = 'MEDIUM'
            LIMIT 1`,
      args: [meta.templateType, meta.groupKey],
    })
    if (medium.rows.length === 0) continue
    const base = medium.rows[0]
    const baseItems = JSON.parse(base.itemsJson || '[]')

    for (const [qualityLevel, factor] of [
      ['LOW', meta.lowFactor],
      ['HIGH', meta.highFactor],
    ]) {
      const exists = await db.execute({
        sql: `SELECT id FROM quote_templates
              WHERE templateType = ? AND templateGroupKey = ? AND qualityLevel = ?
              LIMIT 1`,
        args: [meta.templateType, meta.groupKey, qualityLevel],
      })
      if (exists.rows.length > 0) continue

      await db.execute({
        sql: `INSERT INTO quote_templates
              (id, name, description, category, subcategory, emoji, sortOrder,
               templateType, qualityLevel, templateGroupKey, version, sourceQuoteId,
               itemsJson, isActive, createdAt, updatedAt)
              VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
        args: [
          uid(),
          qualityName(meta.baseName, qualityLevel),
          `${meta.description} Variante ${QUALITY_LABEL[qualityLevel].toLowerCase()}.`,
          meta.category,
          meta.subcategory,
          base.emoji,
          meta.sortOrder,
          meta.templateType,
          qualityLevel,
          meta.groupKey,
          base.version ?? 1,
          base.sourceQuoteId ?? null,
          JSON.stringify(scaleItems(baseItems, factor, qualityLevel)),
          1,
          now,
          now,
        ],
      })
      created++
      console.log(`+ ${meta.templateType} ${qualityName(meta.baseName, qualityLevel)}`)
    }
  }
  return created
}

async function main() {
  await normalizeExisting()
  const created = await createMissingVariants()
  const stats = await db.execute(`SELECT templateType, qualityLevel, COUNT(*) AS count
                                  FROM quote_templates
                                  GROUP BY templateType, qualityLevel
                                  ORDER BY templateType, qualityLevel`)
  console.log(`\nCreated variants: ${created}`)
  console.log(JSON.stringify(stats.rows, null, 2))
}

main().catch((error) => {
  console.error(error)
  process.exitCode = 1
}).finally(() => db.close())
