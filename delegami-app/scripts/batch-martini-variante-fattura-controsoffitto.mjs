import 'dotenv/config'
import prismaClientModule from '../src/generated/prisma/client.ts'
import { PrismaLibSql } from '@prisma/adapter-libsql'

const { PrismaClient } = prismaClientModule
const adapter = new PrismaLibSql({ url: process.env.DATABASE_URL, authToken: process.env.DATABASE_AUTH_TOKEN })
const prisma = new PrismaClient({ adapter })

const ACTOR = { id: 'usr-1', name: 'Leandro' }
const PROJECT = 'cmobzgzlk0001y0ukb3hkjyih' // OBR-2026-003 — Comunione eredi fu Alda Martini
const V9_ID = 'cmrc2hjsa00002gukvrfek5wp' // PRE-2026-013 v9 (base consolidata 43'370.50)
const BASE_V8 = 38225.5
const EXTRA = 5145
const TOTALE_CONCORDATO = BASE_V8 + EXTRA // 43'370.50
const ACCONTO_70 = Math.round(TOTALE_CONCORDATO * 0.7 * 100) / 100 // 30'359.35
const ACCONTO_VERSATO = 10000
const SALDO_FATTURA = Math.round((ACCONTO_70 - ACCONTO_VERSATO) * 100) / 100 // 20'359.35

async function reserveNextDocumentNumber(tx, type) {
  const year = new Date().getFullYear()
  const prefix = type === 'QUOTE' ? 'PRE' : type === 'INVOICE' ? 'INV' : 'OBR'
  const existing = await tx.documentSequence.findUnique({ where: { type_year: { type, year } } })
  if (existing) {
    const updated = await tx.documentSequence.update({ where: { type_year: { type, year } }, data: { lastNumber: { increment: 1 } } })
    return `${prefix}-${year}-${String(updated.lastNumber).padStart(3, '0')}`
  }
  const created = await tx.documentSequence.create({ data: { type, year, lastNumber: 1 } })
  return `${prefix}-${year}-${String(created.lastNumber).padStart(3, '0')}`
}

function qItems(items) {
  return items.map((i, idx) => ({
    itemType: i.itemType, section: i.section ?? null, sortOrder: i.sortOrder ?? idx,
    description: i.description, unit: i.unit ?? null, quantity: i.quantity ?? null,
    unitCost: i.unitCost ?? null, unitPrice: i.unitPrice ?? null, directPrice: i.directPrice ?? false,
    hiddenFromClient: i.hiddenFromClient ?? false,
    totalCost: i.unitCost != null && i.quantity != null ? i.quantity * i.unitCost : null,
    totalPrice: i.unitPrice != null && i.quantity != null ? i.quantity * i.unitPrice : null,
  }))
}

async function main() {
  const settings = await prisma.companySettings.findFirst()
  const defaultNotes = settings?.defaultQuoteNotes ?? undefined
  const terms = settings?.paymentTerms ?? undefined
  const dueDays = settings?.defaultInvoiceDueDays ?? 5

  const result = await prisma.$transaction(async (tx) => {
    // ── A) Variante PRE-2026-037 (solo l'extra, per il cliente) ──────────────
    const varNumber = await reserveNextDocumentNumber(tx, 'QUOTE')
    const varItems = qItems([
      { itemType: 'HEADER', description: 'Lavori extra / variante — in aggiunta al preventivo PRE-2026-013 v8 (firmato)', sortOrder: 0 },
      { itemType: 'SECTION', section: 'SALA', description: 'SALA', sortOrder: 1 },
      { itemType: 'ITEM', section: 'SALA', sortOrder: 2, unit: 'm²', quantity: 18, unitCost: 145, unitPrice: 145, directPrice: true,
        description: 'Controparete fonoassorbente 18 m² (lana di roccia), per isolamento acustico tra appartamenti' },
      { itemType: 'SECTION', section: 'BAGNO', description: 'BAGNO', sortOrder: 3 },
      { itemType: 'ITEM', section: 'BAGNO', sortOrder: 4, unit: 'm²', quantity: 13, unitCost: 145, unitPrice: 145, directPrice: true,
        description: 'Controparete 13 m² doppia lastra con isolazione' },
      { itemType: 'ITEM', section: 'BAGNO', sortOrder: 5, unit: 'pz', quantity: 1, unitCost: 500, unitPrice: 500, directPrice: true,
        description: 'Bidet sospeso con rubinetteria (fornitura completa)' },
      { itemType: 'ITEM', section: 'BAGNO', sortOrder: 6, unit: 'corpo', quantity: 1, unitCost: 150, unitPrice: 150, directPrice: true,
        description: 'Sovrapprezzo per WC Geberit (upgrade rispetto al modello a preventivo PRE-2026-013 v8)' },
    ])
    const varClientNotes =
      'In aggiunta e a integrazione del preventivo PRE-2026-013 v8, firmato dalla committenza. ' +
      'I presenti lavori extra sono stati concordati con la committenza.' +
      (defaultNotes ? '\r\n\r\n' + defaultNotes : '')
    const variante = await tx.quote.create({
      data: {
        quoteNumber: varNumber, projectId: PROJECT, type: 'DETAILED', status: 'DRAFT',
        marginPercent: 0, taxRate: 0, subtotalCost: EXTRA, subtotalClient: EXTRA, taxAmount: 0, total: EXTRA,
        clientNotes: varClientNotes, paymentTerms: terms, items: { create: varItems },
      },
    })

    // ── B) Fattura INV-2026-015 — acconto 70% (ligata al v9) ─────────────────
    const invNumber = await reserveNextDocumentNumber(tx, 'INVOICE')
    const issueDate = new Date('2026-07-28')
    const dueDate = new Date(issueDate.getTime() + dueDays * 24 * 60 * 60 * 1000)
    const invNotes =
      `Totale lavori concordati: CHF 43'370.50 (base PRE-2026-013 v8 CHF 38'225.50 + lavori extra CHF 5'145.00).\r\n` +
      `Acconto 70% = CHF 30'359.35.\r\n` +
      `Dedotto acconto già versato CHF 10'000.00 (fattura INV-2026-002).\r\n` +
      `Saldo presente fattura: CHF 20'359.35.`
    const fattura = await tx.invoice.create({
      data: {
        invoiceNumber: invNumber, projectId: PROJECT, quoteId: V9_ID, version: 2, status: 'DRAFT',
        issueDate, dueDate, subtotal: SALDO_FATTURA, taxRate: 0, taxAmount: 0, total: SALDO_FATTURA,
        billingMode: 'MANUAL', quoteBaseTotal: TOTALE_CONCORDATO, notes: invNotes,
        items: {
          create: [
            { description: 'Acconto 70% sul totale lavori concordati (PRE-2026-013 v8 + lavori extra variante ' + varNumber + ') — CHF 43’370.50 × 70%', quantity: 1, unit: 'corpo', unitPrice: ACCONTO_70, total: ACCONTO_70 },
            { description: 'Acconto già versato (fattura INV-2026-002)', quantity: 1, unit: 'corpo', unitPrice: -ACCONTO_VERSATO, total: -ACCONTO_VERSATO },
          ],
        },
      },
    })

    // ── C) Controsoffitto PRE-2026-038 (cartongesso, sala ~30 m²) ────────────
    const csNumber = await reserveNextDocumentNumber(tx, 'QUOTE')
    const csItems = qItems([
      { itemType: 'HEADER', description: 'Controsoffitto in cartongesso — Sala (~30 m²)', sortOrder: 0 },
      { itemType: 'ITEM', sortOrder: 1, unit: 'corpo', quantity: 1, unitCost: 500, unitPrice: 500, directPrice: true,
        description: 'Rimozione controsoffitto/rivestimento esistente e smaltimento' },
      { itemType: 'ITEM', sortOrder: 2, unit: 'm²', quantity: 30, unitCost: 15, unitPrice: 15, directPrice: true,
        description: 'Orditura metallica per controsoffitto (guide perimetrali, montanti, pendini)' },
      { itemType: 'ITEM', sortOrder: 3, unit: 'm²', quantity: 30, unitCost: 12, unitPrice: 12, directPrice: true,
        description: 'Lastra in cartongesso 12,5 mm (singola)' },
      { itemType: 'ITEM', sortOrder: 4, unit: 'm²', quantity: 30, unitCost: 10, unitPrice: 10, directPrice: true,
        description: 'Trattamento giunti (nastro + stucco) e finitura pronta per pittura' },
      { itemType: 'ITEM', sortOrder: 5, unit: 'm²', quantity: 30, unitCost: 40, unitPrice: 40, directPrice: true,
        description: 'Manodopera — posa controsoffitto' },
    ])
    const csTotal = 500 + 30 * 15 + 30 * 12 + 30 * 10 + 30 * 40 // 2810
    const csInternal =
      'Prezzi di riferimento (ricerca Hornbach/mercato) — DA ADEGUARE.\r\n' +
      'Superficie ~30 m². Solo cartongesso, lastra singola, senza isolamento.\r\n' +
      'NON incluso: predisposizione faretti / punti luce (finitura pronta per pittura).\r\n' +
      "Pittura del controsoffitto: inclusa nella voce «Pittura appartamento» del preventivo principale PRE-2026-013."
    const controsoffitto = await tx.quote.create({
      data: {
        quoteNumber: csNumber, projectId: PROJECT, type: 'DETAILED', status: 'DRAFT',
        marginPercent: 0, taxRate: 0, subtotalCost: csTotal, subtotalClient: csTotal, taxAmount: 0, total: csTotal,
        clientNotes: defaultNotes, internalNotes: csInternal, paymentTerms: terms, items: { create: csItems },
      },
    })

    // ── Activity log ─────────────────────────────────────────────────────────
    const now = new Date()
    await tx.activityLog.createMany({
      data: [
        { action: 'CREATE', entityType: 'Preventivo', entityId: variante.id, entityLabel: `${variante.quoteNumber} v${variante.version}`,
          userId: ACTOR.id, userName: ACTOR.name, success: true, createdAt: now,
          details: JSON.stringify({ tipo: 'variante lavori extra su PRE-2026-013 v8', total: EXTRA }) },
        { action: 'CREATE', entityType: 'Fattura', entityId: fattura.id, entityLabel: fattura.invoiceNumber,
          userId: ACTOR.id, userName: ACTOR.name, success: true, createdAt: now,
          details: JSON.stringify({ acconto70: ACCONTO_70, dedottoAcconto: ACCONTO_VERSATO, saldo: SALDO_FATTURA, quote: 'v9', base: TOTALE_CONCORDATO }) },
        { action: 'CREATE', entityType: 'Preventivo', entityId: controsoffitto.id, entityLabel: `${controsoffitto.quoteNumber} v${controsoffitto.version}`,
          userId: ACTOR.id, userName: ACTOR.name, success: true, createdAt: now,
          details: JSON.stringify({ tipo: 'controsoffitto cartongesso sala 30 m²', total: csTotal, prezziDaAdeguare: true }) },
      ],
    })

    return {
      variante: { n: variante.quoteNumber, total: EXTRA },
      fattura: { n: fattura.invoiceNumber, total: SALDO_FATTURA },
      controsoffitto: { n: controsoffitto.quoteNumber, total: csTotal },
    }
  }, { timeout: 20000 })

  console.log('DONE:', JSON.stringify(result, null, 2))
}

main().then(() => prisma.$disconnect()).then(() => process.exit(0)).catch((e) => { console.error(e); process.exit(1) })
