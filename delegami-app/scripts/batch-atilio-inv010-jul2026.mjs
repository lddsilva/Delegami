import 'dotenv/config'
import prismaClientModule from '../src/generated/prisma/client.ts'
import { PrismaLibSql } from '@prisma/adapter-libsql'

const { PrismaClient } = prismaClientModule
const adapter = new PrismaLibSql({ url: process.env.DATABASE_URL, authToken: process.env.DATABASE_AUTH_TOKEN })
const prisma = new PrismaClient({ adapter })

const ACTOR = { id: 'usr-1', name: 'Leandro' }
const PROJECT_ATTILIO = 'cmrg2la2f00037cukty5pqyzr' // OBR-2026-011 — Posa piastrelle e parquet
const INV010_ID = 'cmrui76uj0009qk7dokou1nf5' // Saigon Tofu — OBR-2026-012

async function reserveNextDocumentNumber(tx, type) {
  const year = new Date().getFullYear()
  const prefix = type === 'QUOTE' ? 'PRE' : type === 'INVOICE' ? 'INV' : 'OBR'
  const existing = await tx.documentSequence.findUnique({ where: { type_year: { type, year } } })
  if (existing) {
    const updated = await tx.documentSequence.update({
      where: { type_year: { type, year } },
      data: { lastNumber: { increment: 1 } },
    })
    return `${prefix}-${year}-${String(updated.lastNumber).padStart(3, '0')}`
  }
  const created = await tx.documentSequence.create({ data: { type, year, lastNumber: 1 } })
  return `${prefix}-${year}-${String(created.lastNumber).padStart(3, '0')}`
}

function mapQuoteItems(items) {
  return items.map((i, idx) => ({
    itemType: i.itemType,
    section: i.section,
    sortOrder: i.sortOrder ?? idx,
    description: i.description,
    unit: i.unit,
    quantity: i.quantity ?? null,
    unitCost: i.unitCost ?? null,
    unitPrice: i.unitPrice ?? null,
    directPrice: i.directPrice ?? false,
    hiddenFromClient: false,
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
    // ── Op 1: INV-2026-012 — Saldo 5 bagni (Attilio) ─────────────────────────
    const attNote =
      "Con il pagamento della presente fattura, la committenza attesta di aver verificato la posa delle " +
      "piastrelle dei 5 bagni e la riconosce eseguita a regola d'arte: nessuna piastrella rotta, incrinata " +
      "o a rischio. Eventuali danni di tale natura riscontrati in seguito saranno fatturati separatamente e " +
      "non sono compresi nei bagni già ultimati."
    const inv12Number = await reserveNextDocumentNumber(tx, 'INVOICE')
    const issueDate = new Date('2026-07-25')
    const dueDate = new Date(issueDate.getTime() + dueDays * 24 * 60 * 60 * 1000)
    const inv12 = await tx.invoice.create({
      data: {
        invoiceNumber: inv12Number,
        projectId: PROJECT_ATTILIO,
        status: 'DRAFT',
        issueDate,
        dueDate,
        subtotal: 4000,
        taxRate: 0,
        taxAmount: 0,
        total: 4000,
        notes: attNote,
        items: {
          create: [
            {
              description: 'Saldo lavori — posa piastrelle 5 bagni al primo piano',
              quantity: 1,
              unit: 'corpo',
              unitPrice: 4000,
              total: 4000,
            },
          ],
        },
      },
    })

    // ── Op 2: PRE-2026-035 — Bettoncino a presa rapida (metratura in bianco) ──
    const q35Number = await reserveNextDocumentNumber(tx, 'QUOTE')
    const q35 = await tx.quote.create({
      data: {
        quoteNumber: q35Number,
        projectId: PROJECT_ATTILIO,
        type: 'DETAILED',
        status: 'DRAFT',
        marginPercent: 0,
        taxRate: 0,
        subtotalCost: 0,
        subtotalClient: 0,
        taxAmount: 0,
        total: 0,
        clientNotes: defaultNotes,
        paymentTerms: terms,
        items: {
          create: mapQuoteItems([
            { itemType: 'HEADER', description: 'Massetto/bettoncino a presa rapida — spessore 7 cm', sortOrder: 0 },
            {
              itemType: 'ITEM',
              sortOrder: 1,
              description:
                'Massetto/bettoncino a presa rapida, spessore 7 cm — compreso: telo barriera vapore, rete ' +
                'elettrosaldata di armatura, banda perimetrale in schiuma su tutto il perimetro e posa. ' +
                'A presa rapida, piastrellabile entro 10 giorni.',
              unit: 'm²',
              quantity: null, // metratura da definire — Marcos la compila poi
              unitCost: 50,
              unitPrice: 50,
              directPrice: true,
            },
          ]),
        },
      },
    })

    // ── Op 3: PRE-2026-036 — Scala 4 piani (corpo 18'000) ────────────────────
    const escadaNotes =
      "Non è compresa alcuna opera strutturale (carpenteria, ferro/armatura, getto di calcestruzzo, ecc.), " +
      "che sarà eseguita e fatturata a parte.\r\n" +
      "In particolare, al piano terra / piano interrato è prevista un'opera strutturale separata, non " +
      "compresa nel presente preventivo." +
      (defaultNotes ? '\r\n\r\n' + defaultNotes : '')
    const q36Number = await reserveNextDocumentNumber(tx, 'QUOTE')
    const q36 = await tx.quote.create({
      data: {
        quoteNumber: q36Number,
        projectId: PROJECT_ATTILIO,
        type: 'DETAILED',
        status: 'DRAFT',
        marginPercent: 0,
        taxRate: 0,
        subtotalCost: 18000,
        subtotalClient: 18000,
        taxAmount: 0,
        total: 18000,
        clientNotes: escadaNotes,
        paymentTerms: terms,
        items: {
          create: mapQuoteItems([
            { itemType: 'HEADER', description: 'Scala su 4 piani — rivestimento in gres porcellanato', sortOrder: 0 },
            {
              itemType: 'ITEM',
              sortOrder: 1,
              description:
                'Scala su 4 piani — requadratura, posa gres porcellanato (pedate e alzate), fugatura e ' +
                'siliconatura. Materiale compreso: profili Schlüter, stucco/fuga, silicone e colla.',
              unit: 'corpo',
              quantity: 1,
              unitCost: 18000,
              unitPrice: 18000,
              directPrice: true,
            },
          ]),
        },
      },
    })

    // ── Op 4: aggiorna INV-2026-010 (Saigon Tofu) — detrai acconto 2'000 ─────
    const inv10 = await tx.invoice.findUnique({ where: { id: INV010_ID } })
    if (!inv10) throw new Error('INV-2026-010 not found: ' + INV010_ID)
    await tx.invoiceItem.create({
      data: {
        invoiceId: INV010_ID,
        description: 'Acconto già versato — detratto dal totale',
        quantity: 1,
        unit: 'corpo',
        unitPrice: -2000,
        total: -2000,
      },
    })
    const newSubtotal = inv10.subtotal - 2000
    const newTaxAmount = newSubtotal * (inv10.taxRate / 100)
    const newTotal = newSubtotal + newTaxAmount
    const newNotes =
      (inv10.notes ? inv10.notes + '\r\n\r\n' : '') +
      "Acconto di CHF 2'000.00 già versato dalla committenza, detratto dal presente totale. " +
      "Saldo da pagare: CHF 10'100.00."
    await tx.invoice.update({
      where: { id: INV010_ID },
      data: { subtotal: newSubtotal, taxAmount: newTaxAmount, total: newTotal, notes: newNotes },
    })

    // ── Activity log ─────────────────────────────────────────────────────────
    const now = new Date()
    await tx.activityLog.createMany({
      data: [
        {
          action: 'CREATE', entityType: 'Fattura', entityId: inv12.id, entityLabel: inv12.invoiceNumber,
          userId: ACTOR.id, userName: ACTOR.name, success: true, createdAt: now,
          details: JSON.stringify({ obra: 'OBR-2026-011', total: 4000, note: 'saldo 5 bagni + attestazione posa' }),
        },
        {
          action: 'CREATE', entityType: 'Preventivo', entityId: q35.id, entityLabel: `${q35.quoteNumber} v${q35.version}`,
          userId: ACTOR.id, userName: ACTOR.name, success: true, createdAt: now,
          details: JSON.stringify({ obra: 'OBR-2026-011', voce: 'bettoncino 7cm', pricePerM2: 50, quantita: 'in bianco' }),
        },
        {
          action: 'CREATE', entityType: 'Preventivo', entityId: q36.id, entityLabel: `${q36.quoteNumber} v${q36.version}`,
          userId: ACTOR.id, userName: ACTOR.name, success: true, createdAt: now,
          details: JSON.stringify({ obra: 'OBR-2026-011', voce: 'scala 4 piani', total: 18000 }),
        },
        {
          action: 'UPDATE', entityType: 'Fattura', entityId: INV010_ID, entityLabel: 'INV-2026-010',
          userId: ACTOR.id, userName: ACTOR.name, success: true, createdAt: now,
          details: JSON.stringify({ acconto: 2000, totalPrima: inv10.total, totalDopo: newTotal }),
        },
      ],
    })

    return {
      inv12: inv12.invoiceNumber,
      q35: q35.quoteNumber,
      q36: q36.quoteNumber,
      inv10: { from: inv10.total, to: newTotal },
    }
  })

  console.log('DONE:', JSON.stringify(result, null, 2))
}

main()
  .then(() => prisma.$disconnect())
  .then(() => process.exit(0))
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
