import 'dotenv/config'
import prismaClientModule from '../src/generated/prisma/client.ts'
import { PrismaLibSql } from '@prisma/adapter-libsql'

const { PrismaClient } = prismaClientModule
const adapter = new PrismaLibSql({ url: process.env.DATABASE_URL, authToken: process.env.DATABASE_AUTH_TOKEN })
const prisma = new PrismaClient({ adapter })

const ACTOR = { id: 'usr-1', name: 'Leandro' }

const NEW_RATE = 85
const ORE = 103
const ORE_TOTAL = NEW_RATE * ORE // 8755
const ELETTRICA = 900
const MATERIALI = 2445
const TOTALE = ORE_TOTAL + ELETTRICA + MATERIALI // 12100

const MATERIALI_DESC =
  'Materiali di cantiere (calcestruzzo 2 m³, ghiaia 1,5 m³, sabbia e cemento 35 sacchi, ' +
  'cemento rapido 2 sacchi, telo di plastica protettivo, noleggio rompitore 3 giorni, ' +
  'carrucole per galleggianti, tubo per filo, occhielli per filo, sabbia per fughe, discarica)'

const INTERNAL_NOTES =
  'Note interne — dettaglio manodopera, elettrica e materiali (Saigon Tofu, giugno–luglio 2026)\r\n' +
  'Aggiornato per allineamento alla fattura INV-2026-010 (tariffa 80→85/h; materiali 2’125→2’445).\r\n\r\n' +
  'Manodopera: 85h di lavoro effettivo + 18h di spostamento (1h30 in ciascuno dei 12 giorni) = 103h totali × CHF 85.00/h = CHF 8’755.00\r\n' +
  'Parte elettrica — montaggio pompe: CHF 900.00\r\n\r\n' +
  'Materiali (costo reale, mai mostrato al cliente):\r\n' +
  '- Acquisti diretti (calcestruzzo, ghiaia, telo, cemento rapido, sabbia/cemento, rompitore): CHF 1’275.00\r\n' +
  '- Materiali tramite Rosario (calcestruzzo 1 m³, sabbia/cemento 10 sacchi, ghiaia 1 m³): CHF 850.00\r\n' +
  '- Extra allineati a fattura (rompitore 3° giorno, carrucole galleggianti, tubo/occhielli per filo, sabbia per fughe, discarica): CHF 320.00\r\n' +
  'Totale materiali: CHF 2’445.00\r\n\r\n' +
  'Totale generale: CHF 12’100.00\r\n' +
  'Nota: acconto di CHF 2’000 detratto solo in fattura (INV-2026-010), non nel preventivo.'

async function main() {
  const result = await prisma.$transaction(
    async (tx) => {
      const q = await tx.quote.findFirst({
        where: { quoteNumber: 'PRE-2026-032' },
        include: { items: true },
      })
      if (!q) throw new Error('PRE-2026-032 not found')

      const ore = q.items.find((i) => i.itemType === 'ITEM' && i.unit === 'h')
      const mat = q.items.find((i) => i.itemType === 'ITEM' && (i.description || '').startsWith('Materiali di cantiere'))
      if (!ore || !mat) throw new Error('Voci Ore/Materiali non trovate')

      // update in place — preserva gli id (link fattura via quoteItemId intatto)
      await tx.quoteItem.update({
        where: { id: ore.id },
        data: { unitCost: NEW_RATE, unitPrice: NEW_RATE, totalCost: ORE_TOTAL, totalPrice: ORE_TOTAL },
      })
      await tx.quoteItem.update({
        where: { id: mat.id },
        data: { unitCost: MATERIALI, unitPrice: MATERIALI, totalCost: MATERIALI, totalPrice: MATERIALI, description: MATERIALI_DESC },
      })

      await tx.quote.update({
        where: { id: q.id },
        data: { subtotalCost: TOTALE, subtotalClient: TOTALE, taxAmount: 0, total: TOTALE, internalNotes: INTERNAL_NOTES },
      })

      await tx.activityLog.create({
        data: {
          action: 'UPDATE', entityType: 'Preventivo', entityId: q.id,
          entityLabel: `${q.quoteNumber} v${q.version}`,
          userId: ACTOR.id, userName: ACTOR.name, success: true, createdAt: new Date(),
          details: JSON.stringify({
            change: 'allineamento a INV-2026-010: ore 80→85/h (8755), materiali 2125→2445, totale 11265→12100',
            note: 'edit in-place, v1 INVOICED invariato; acconto -2000 solo in fattura',
          }),
        },
      })

      return { quote: q.quoteNumber, ore: ORE_TOTAL, elettrica: ELETTRICA, materiali: MATERIALI, total: TOTALE }
    },
    { timeout: 20000 },
  )
  console.log('DONE:', JSON.stringify(result, null, 2))
}

main()
  .then(() => prisma.$disconnect())
  .then(() => process.exit(0))
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
