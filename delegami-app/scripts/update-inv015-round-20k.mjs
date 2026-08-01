import 'dotenv/config'
import prismaClientModule from '../src/generated/prisma/client.ts'
import { PrismaLibSql } from '@prisma/adapter-libsql'

const { PrismaClient } = prismaClientModule
const adapter = new PrismaLibSql({ url: process.env.DATABASE_URL, authToken: process.env.DATABASE_AUTH_TOKEN })
const prisma = new PrismaClient({ adapter })

const ACTOR = { id: 'usr-1', name: 'Leandro' }
const ROUND = 20000

const NOTES =
  'Acconto sui lavori concordati (preventivo PRE-2026-013 v8 + lavori extra, variante PRE-2026-037).\r\n' +
  "Totale lavori concordati: CHF 43'370.50.\r\n" +
  "Importo del presente acconto concordato con la committenza: CHF 20'000.00.\r\n" +
  "Acconto precedentemente versato: CHF 10'000.00 (fattura INV-2026-002)."

async function main() {
  const result = await prisma.$transaction(
    async (tx) => {
      const inv = await tx.invoice.findFirst({ where: { invoiceNumber: 'INV-2026-015' }, include: { items: true } })
      if (!inv) throw new Error('INV-2026-015 not found')
      // NOTE: invoice is SENT — override intenzionale (richiesta cliente: importo arrotondato, verrà rinviata)

      await tx.invoiceItem.deleteMany({ where: { invoiceId: inv.id } })
      await tx.invoiceItem.create({
        data: {
          invoiceId: inv.id,
          description: 'Acconto lavori (importo concordato) — totale lavori PRE-2026-013 v8 + lavori extra (variante PRE-2026-037)',
          quantity: 1, unit: 'corpo', unitPrice: ROUND, total: ROUND,
        },
      })
      await tx.invoice.update({
        where: { id: inv.id },
        data: { subtotal: ROUND, taxAmount: 0, total: ROUND, notes: NOTES },
      })

      await tx.activityLog.create({
        data: {
          action: 'UPDATE', entityType: 'Fattura', entityId: inv.id, entityLabel: 'INV-2026-015',
          userId: ACTOR.id, userName: ACTOR.name, success: true, createdAt: new Date(),
          details: JSON.stringify({ change: 'importo arrotondato a 20000 (richiesta cliente); da 20359.35 a voce singola', statoPrecedente: inv.status, override: 'SENT' }),
        },
      })
      return { total: ROUND, statoPrecedente: inv.status }
    },
    { timeout: 20000 },
  )
  console.log('DONE: INV-2026-015 total =', result.total, '| stato era', result.statoPrecedente)
}

main().then(() => prisma.$disconnect()).then(() => process.exit(0)).catch((e) => { console.error(e); process.exit(1) })
