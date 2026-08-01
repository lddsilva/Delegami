import 'dotenv/config'
import prismaClientModule from '../src/generated/prisma/client.ts'
import { PrismaLibSql } from '@prisma/adapter-libsql'

const { PrismaClient } = prismaClientModule
const adapter = new PrismaLibSql({ url: process.env.DATABASE_URL, authToken: process.env.DATABASE_AUTH_TOKEN })
const prisma = new PrismaClient({ adapter })

const ACTOR = { id: 'usr-1', name: 'Leandro' }
const CLIENT_ID = 'cmobzgzjc0000y0uk328aizqj' // Comunione eredi fu Alda Martini

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
        name: 'Ristrutturazione Appartamento - Via Bernardino Stazio 2, 2° piano',
        referenceCode,
        address: 'Via Bernardino Stazio 2, 2° piano, 6815 Massagno',
        description: 'Riparazioni diverse: materiali, parte elettrica, box doccia, sostituzione aspiratore.',
        status: 'COMPLETED',
        paymentTerms: settings?.paymentTerms ?? undefined,
        notes: 'Creato da messaggio WhatsApp di Marcos del 19.07.2026 (import manuale).',
      },
    })

    // ── Quote ────────────────────────────────────────────────────────────────
    const items = [
      { itemType: 'HEADER', description: 'Riparazioni appartamento 2° piano — Via Bernardino Stazio 2', sortOrder: 0 },
      { itemType: 'SECTION', section: 'Riparazioni', description: 'Riparazioni', sortOrder: 1 },
      {
        itemType: 'ITEM', section: 'Riparazioni', sortOrder: 2,
        description: 'Materiale vario (silicone, colla, pittura, carta vetrata, spazzola d\'acciaio)',
        unit: 'corpo', quantity: 1, unitCost: 90, unitPrice: 90, directPrice: true,
      },
      {
        itemType: 'ITEM', section: 'Riparazioni', sortOrder: 3,
        description: 'Materiale elettrico (presa e interruttore, canalizzazione, cavi)',
        unit: 'corpo', quantity: 1, unitCost: 100, unitPrice: 100, directPrice: true,
      },
      {
        itemType: 'ITEM', section: 'Riparazioni', sortOrder: 4,
        description: 'Mano d\'opera elettricista',
        unit: 'corpo', quantity: 1, unitCost: 250, unitPrice: 250, directPrice: true,
      },
      {
        itemType: 'ITEM', section: 'Riparazioni', sortOrder: 5,
        description: 'Mano d\'opera — riparazioni concordate',
        unit: 'corpo', quantity: 1, unitCost: 350, unitPrice: 350, directPrice: true,
      },
      {
        itemType: 'ITEM', section: 'Riparazioni', sortOrder: 6,
        description: 'Box doccia',
        unit: 'corpo', quantity: 1, unitCost: 600, unitPrice: 600, directPrice: true,
      },
      {
        itemType: 'ITEM', section: 'Riparazioni', sortOrder: 7,
        description: 'Sostituzione aspiratore',
        unit: 'corpo', quantity: 1, unitCost: 480, unitPrice: 480, directPrice: true,
      },
    ]

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
        paymentTerms: settings?.paymentTerms ?? undefined,
        approvedAt: new Date(),
        internalNotes: 'Preventivo creato da messaggio WhatsApp di Marcos del 19.07.2026 (lavoro già eseguito e concordato). Nessuna IVA applicata (ditta individuale, non ancora soggetta a IVA).',
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
            totalCost: i.unitCost != null && i.quantity != null ? i.quantity * i.unitCost : undefined,
            totalPrice: i.unitPrice != null && i.quantity != null ? i.quantity * i.unitPrice : undefined,
          })),
        },
      },
      include: { items: true },
    })

    // ── Invoice (from quote, ITEMS mode, full amount) ────────────────────────
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

    // NOTE: intentionally NOT auto-flipping quote.status to INVOICED here —
    // user asked to keep both statuses manually adjustable (unlike the
    // Saigon Tofu case where the app's normal auto-transition applied).

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
          details: JSON.stringify({ source: 'whatsapp-marcos-19.07.2026', createdAsApproved: true }),
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
