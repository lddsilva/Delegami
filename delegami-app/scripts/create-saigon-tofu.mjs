import 'dotenv/config'
import prismaClientModule from '../src/generated/prisma/client.ts'
import { PrismaLibSql } from '@prisma/adapter-libsql'

const { PrismaClient } = prismaClientModule
const adapter = new PrismaLibSql({ url: process.env.DATABASE_URL, authToken: process.env.DATABASE_AUTH_TOKEN })
const prisma = new PrismaClient({ adapter })

const ACTOR = { id: 'usr-1', name: 'Leandro' }
const CLIENT_ID = 'cmqgzm0eq000004kzeys50asr' // Mr. Phuoc Hoi Nguyen

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

async function main() {
  const settings = await prisma.companySettings.findFirst()

  const result = await prisma.$transaction(async (tx) => {
    // ── Project ──────────────────────────────────────────────────────────────
    const year = new Date().getFullYear()
    const prefix = `OBR-${year}-`
    const [seq, lastProject] = await Promise.all([
      tx.documentSequence.findUnique({ where: { type_year: { type: 'PROJECT', year } } }),
      tx.project.findFirst({
        where: { referenceCode: { startsWith: prefix } },
        orderBy: { referenceCode: 'desc' },
        select: { referenceCode: true },
      }),
    ])
    const lastFromProjects = lastProject?.referenceCode ? parseInt(lastProject.referenceCode.slice(prefix.length), 10) : 0
    const nextNumber = Math.max(seq?.lastNumber ?? 0, Number.isNaN(lastFromProjects) ? 0 : lastFromProjects) + 1
    await tx.documentSequence.upsert({
      where: { type_year: { type: 'PROJECT', year } },
      update: { lastNumber: nextNumber },
      create: { type: 'PROJECT', year, lastNumber: nextNumber },
    })
    const referenceCode = `${prefix}${String(nextNumber).padStart(3, '0')}`

    const project = await tx.project.create({
      data: {
        clientId: CLIENT_ID,
        name: 'Saigon Tofu — Manodopera, parte elettrica e materiali',
        referenceCode,
        address: 'Via Résiga 2, 6883 Novazzano',
        description: 'Manodopera, parte elettrica (montaggio pompe) e materiali. Periodo 08.06.2026 – 10.07.2026.',
        status: 'COMPLETED',
        startDate: new Date('2026-06-08'),
        endDate: new Date('2026-07-10'),
        paymentTerms: settings?.paymentTerms ?? undefined,
        notes: 'Creato da rapporto lavori del 20.07.2026 (import manuale).',
      },
    })

    // ── Quote ────────────────────────────────────────────────────────────────
    const items = [
      { itemType: 'HEADER', description: 'Manodopera, parte elettrica e materiali — Saigon Tofu', sortOrder: 0 },
      { itemType: 'SECTION', section: 'Manodopera', description: 'Manodopera', sortOrder: 1 },
      {
        itemType: 'ITEM', section: 'Manodopera', sortOrder: 2,
        description: 'Ore di lavoro — 08.06.2026 7,5h · 09.06.2026 10,5h · 10.06.2026 17,5h · 11.06.2026 9,5h · 13.06.2026 6,5h · 20.06.2026 5,5h · 26.06.2026 4,5h · 04.07.2026 7,5h · 06.07.2026 8,5h · 07.07.2026 7,5h · 08.07.2026 8,5h · 10.07.2026 9,5h — Totale 103 ore',
        unit: 'h', quantity: 103, unitCost: 80, unitPrice: 80, directPrice: true,
      },
      {
        itemType: 'ITEM', section: 'Manodopera', sortOrder: 3,
        description: 'Parte elettrica — montaggio pompe',
        unit: 'corpo', quantity: 1, unitCost: 900, unitPrice: 900, directPrice: true,
      },
      { itemType: 'SECTION', section: 'Materiali', description: 'Materiali', sortOrder: 4 },
      {
        itemType: 'ITEM', section: 'Materiali', sortOrder: 5,
        description: 'Materiali di cantiere (calcestruzzo 2 m³, ghiaia 1,5 m³, sabbia e cemento 35 sacchi, cemento rapido 2 sacchi, telo di plastica protettivo, noleggio rompitore 2 giorni)',
        unit: 'corpo', quantity: 1, unitCost: 2125, unitPrice: 2125, directPrice: true,
      },
    ]

    const internalNotesText = `Note interne — dettaglio manodopera, elettrica e materiali (Saigon Tofu, giugno–luglio 2026)

Manodopera: 85h di lavoro effettivo + 18h di spostamento (1h30 incluse in ciascuno dei 12 giorni lavorati) = 103h totali × CHF 80.00/h = CHF 8'240.00

Parte elettrica — montaggio pompe: CHF 900.00

Materiali (costo reale, mai mostrato al cliente):
- Calcestruzzo 1 m³ — CHF 400.00
- Ghiaia 0,5 m³ — CHF 150.00
- Telo di plastica protettivo (1) — CHF 40.00
- Cemento rapido (2 sacchi) — CHF 60.00
- Sabbia/cemento (25 sacchi) — CHF 375.00
- Noleggio rompitore (2 giorni) — CHF 250.00
Subtotale acquisti diretti: CHF 1'275.00

Materiali acquistati tramite Rosario, conteggiati come propri:
- Calcestruzzo 1 m³ — CHF 400.00
- Sabbia/cemento (10 sacchi) — CHF 150.00
- Ghiaia 1 m³ — CHF 300.00
Subtotale materiali Rosario: CHF 850.00

Totale materiali: CHF 2'125.00
Totale generale: CHF 11'265.00`

    const lineItems = items.filter((i) => i.itemType === 'ITEM')
    const subtotalCost = lineItems.reduce((s, i) => s + (i.quantity ?? 0) * (i.unitCost ?? 0), 0)
    const subtotalClient = lineItems.reduce((s, i) => s + (i.quantity ?? 0) * (i.unitPrice ?? 0), 0)
    const taxRate = 0
    const taxAmount = subtotalClient * (taxRate / 100)
    const total = subtotalClient + taxAmount

    const quoteNumber = await reserveNextDocumentNumber(tx, 'QUOTE')
    const quote = await tx.quote.create({
      data: {
        quoteNumber,
        projectId: project.id,
        type: 'DETAILED',
        status: 'APPROVED',
        marginPercent: 0,
        taxRate,
        subtotalCost,
        subtotalClient,
        taxAmount,
        total,
        clientNotes: settings?.defaultQuoteNotes ?? undefined,
        paymentTerms: settings?.paymentTerms ?? undefined,
        approvedAt: new Date(),
        internalNotes: internalNotesText,
        items: {
          create: items.map((i, idx) => ({
            itemType: i.itemType,
            section: i.section,
            sortOrder: i.sortOrder ?? idx,
            description: i.description,
            unit: i.unit,
            quantity: i.quantity,
            unitCost: i.unitCost,
            unitPrice: i.unitPrice,
            directPrice: i.directPrice ?? false,
            hiddenFromClient: false,
            sourceNote: i.sourceNote,
            totalCost: i.unitCost != null && i.quantity != null ? i.quantity * i.unitCost : undefined,
            totalPrice: i.unitPrice != null && i.quantity != null ? i.quantity * i.unitPrice : undefined,
          })),
        },
      },
      include: { items: true },
    })

    // ── Invoice (from quote, ITEMS mode, full remaining quantity) ────────────
    const invoiceItems = quote.items
      .filter((i) => i.itemType === 'ITEM' && !i.hiddenFromClient)
      .map((i) => ({
        quoteItemId: i.id,
        description: i.description,
        unit: i.unit ?? undefined,
        quantity: i.quantity ?? 1,
        unitPrice: i.unitPrice ?? 0,
        total: (i.quantity ?? 1) * (i.unitPrice ?? 0),
      }))

    const invSubtotal = invoiceItems.reduce((s, i) => s + i.total, 0)
    const invTaxAmount = invSubtotal * (quote.taxRate / 100)
    const issueDate = new Date()
    const dueDate = new Date(issueDate.getTime() + (settings?.defaultInvoiceDueDays ?? 5) * 24 * 60 * 60 * 1000)

    const invoiceNumber = await reserveNextDocumentNumber(tx, 'INVOICE')
    const invoice = await tx.invoice.create({
      data: {
        invoiceNumber,
        projectId: project.id,
        quoteId: quote.id,
        status: 'DRAFT',
        issueDate,
        dueDate,
        subtotal: invSubtotal,
        taxRate: quote.taxRate,
        taxAmount: invTaxAmount,
        total: invSubtotal + invTaxAmount,
        billingMode: 'ITEMS',
        quoteBaseTotal: quote.total,
        items: { create: invoiceItems },
      },
    })

    // All quote items fully invoiced in one shot -> quote status INVOICED
    await tx.quote.update({ where: { id: quote.id }, data: { status: 'INVOICED' } })

    // ── Activity log (best-effort, mirrors logActivity) ─────────────────────
    const now = new Date()
    await tx.activityLog.createMany({
      data: [
        {
          action: 'CREATE', entityType: 'Opera', entityId: project.id,
          entityLabel: `${project.referenceCode} – ${project.name}`,
          userId: ACTOR.id, userName: ACTOR.name, success: true, createdAt: now,
        },
        {
          action: 'CREATE', entityType: 'Preventivo', entityId: quote.id,
          entityLabel: `${quote.quoteNumber} v${quote.version}`,
          userId: ACTOR.id, userName: ACTOR.name, success: true, createdAt: now,
          details: JSON.stringify({ source: 'rapporto-lavori-20.07.2026', createdAsApproved: true }),
        },
        {
          action: 'CREATE', entityType: 'Fattura', entityId: invoice.id,
          entityLabel: `${invoice.invoiceNumber}`,
          userId: ACTOR.id, userName: ACTOR.name, success: true, createdAt: now,
          details: JSON.stringify({ fromQuote: quote.id }),
        },
      ],
    })

    return { project, quote, invoice }
  })

  console.log('✓ Progetto:', result.project.referenceCode, '-', result.project.name, '(id:', result.project.id + ')')
  console.log('✓ Preventivo:', `${result.quote.quoteNumber} v${result.quote.version}`, '- status', result.quote.status, '- totale CHF', result.quote.total.toFixed(2))
  console.log('✓ Fattura:', result.invoice.invoiceNumber, '- status', result.invoice.status, '- totale CHF', result.invoice.total.toFixed(2))
}

main()
  .catch((e) => { console.error(e); process.exit(1) })
  .finally(() => prisma.$disconnect())
