import 'dotenv/config'
import prismaClientModule from '../src/generated/prisma/client.ts'
import { PrismaLibSql } from '@prisma/adapter-libsql'

const { PrismaClient } = prismaClientModule
const adapter = new PrismaLibSql({ url: process.env.DATABASE_URL, authToken: process.env.DATABASE_AUTH_TOKEN })
const prisma = new PrismaClient({ adapter })

const ACTOR = { id: 'usr-1', name: 'Leandro' }

async function main() {
  const result = await prisma.$transaction(async (tx) => {
    // ── Edit INV-2026-012 — specifica i 5 bagni + riga di saldo nella nota ────
    const inv12 = await tx.invoice.findFirst({ where: { invoiceNumber: 'INV-2026-012' }, include: { items: true } })
    if (!inv12) throw new Error('INV-2026-012 not found')

    const newItemDesc = 'Saldo lavori — posa piastrelle 5 bagni: appartamenti 5, 7 (bagno finestrato), 8, 9 e 10.'
    // one single item on this invoice
    await tx.invoiceItem.update({ where: { id: inv12.items[0].id }, data: { description: newItemDesc } })

    const saldoLine = 'Il presente pagamento costituisce il saldo totale dei 5 bagni sopra indicati.'
    const inv12Notes = (inv12.notes ? inv12.notes + '\r\n\r\n' : '') + saldoLine
    await tx.invoice.update({ where: { id: inv12.id }, data: { notes: inv12Notes } })

    // ── Edit PRE-2026-036 — aggiunge battiscopa + condizioni di pagamento faseate
    const q36 = await tx.quote.findFirst({ where: { quoteNumber: 'PRE-2026-036' }, include: { items: true } })
    if (!q36) throw new Error('PRE-2026-036 not found')

    const itemRow = q36.items.find((i) => i.itemType === 'ITEM')
    if (!itemRow) throw new Error('PRE-2026-036 ITEM row not found')
    const newQuoteItemDesc =
      'Scala su 4 piani — requadratura, posa gres porcellanato (pedate e alzate), posa battiscopa, ' +
      'fugatura e siliconatura. Materiale compreso: profili Schlüter, stucco/fuga, silicone e colla.'
    await tx.quoteItem.update({ where: { id: itemRow.id }, data: { description: newQuoteItemDesc } })

    const newPaymentTerms =
      'Modalità di pagamento:\r\n' +
      "• Acconto alla firma del preventivo: CHF 10'000.00\r\n" +
      "• Al termine della posa dei gradini: CHF 5'000.00\r\n" +
      "• Al termine della posa dei battiscopa e di tutte le finiture (fugatura e siliconatura): CHF 3'000.00\r\n\r\n" +
      'Modalità: Bonifico bancario / TWINT / PostFinance\r\n' +
      'Intestatario: Marcos Zanetti Filho'
    await tx.quote.update({ where: { id: q36.id }, data: { paymentTerms: newPaymentTerms } })

    // ── Activity log ─────────────────────────────────────────────────────────
    const now = new Date()
    await tx.activityLog.createMany({
      data: [
        {
          action: 'UPDATE', entityType: 'Fattura', entityId: inv12.id, entityLabel: 'INV-2026-012',
          userId: ACTOR.id, userName: ACTOR.name, success: true, createdAt: now,
          details: JSON.stringify({ change: 'descrizione bagni (ap. 5,7,8,9,10) + riga saldo totale' }),
        },
        {
          action: 'UPDATE', entityType: 'Preventivo', entityId: q36.id, entityLabel: `${q36.quoteNumber} v${q36.version}`,
          userId: ACTOR.id, userName: ACTOR.name, success: true, createdAt: now,
          details: JSON.stringify({ change: 'aggiunto battiscopa + condizioni pagamento faseate 10/5/3' }),
        },
      ],
    })

    return { inv12: inv12.invoiceNumber, q36: q36.quoteNumber }
  }, { timeout: 20000 })

  console.log('DONE:', JSON.stringify(result, null, 2))
}

main()
  .then(() => prisma.$disconnect())
  .then(() => process.exit(0))
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
