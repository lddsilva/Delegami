import 'dotenv/config'
import prismaClientModule from '../src/generated/prisma/client.ts'
import { PrismaLibSql } from '@prisma/adapter-libsql'

const { PrismaClient } = prismaClientModule
const adapter = new PrismaLibSql({ url: process.env.DATABASE_URL, authToken: process.env.DATABASE_AUTH_TOKEN })
const prisma = new PrismaClient({ adapter })

const ACTOR = { id: 'usr-1', name: 'Leandro' }

const NOTES = [
  'DETTAGLIO ORE E LAVORI — Aprile/Maggio 2026',
  'Cantieri: Ascona, Chiasso, Cadenazzo, Taverne',
  '',
  'ORE APRILE (03, 07, 08/04 a CHF 40/h — resto a CHF 45/h)',
  '03/04 — 9,00 h — Ascona — CHF 360,00',
  '07/04 — 8,50 h — Ascona — CHF 340,00',
  '08/04 — 8,00 h — Ascona — CHF 320,00',
  '17/04 — 4,00 h — Doccia + taglio balcone (Ascona) — CHF 180,00',
  '20/04 — 8,00 h — Balcone + metà bagno (Ascona) — CHF 360,00',
  '21/04 — 8,00 h — Bagno, imperm., piastrelle (Ascona) — CHF 360,00',
  '22/04 — 5,00 h — Muratura vasca + pulizia (Chiasso) — CHF 225,00',
  '23/04 — 8,00 h — Mosaico/parquet rappezzi (Cadenazzo) — CHF 360,00',
  '24/04 — 10,00 h — Appt. architetto/piastrellista (Chiasso) — CHF 450,00',
  '27/04 — 8,00 h — Bagno (Chiasso) — CHF 360,00',
  '28/04 — 8,00 h — Bagno (Chiasso) — CHF 360,00',
  '29/04 — 9,00 h — Bagno (Chiasso) — CHF 405,00',
  '30/04 — 9,00 h — Bagno (Chiasso) — CHF 405,00',
  "Subtotale aprile: 102,50 h — CHF 4'485,00",
  '',
  'ORE MAGGIO (tutte a CHF 45/h)',
  '04/05 — 8,00 h — Bagno (Chiasso) — CHF 360,00',
  '05/05 — 9,00 h — Stucco/pulizie/parquet (Chiasso) — CHF 405,00',
  '06/05 — 8,00 h — Parquet (Chiasso) — CHF 360,00',
  '07/05 — 9,50 h — Parquet (Chiasso) — CHF 427,50',
  '09/05 — 3,00 h — Silicone (Chiasso) — CHF 135,00',
  '11/05 — 8,00 h — Parquet (Chiasso) — CHF 360,00',
  '12/05 — 11,00 h — Piastrelle (Taverne) — CHF 495,00',
  '13/05 — 8,00 h — Parquet (Chiasso) — CHF 360,00',
  '15/05 — 8,50 h — Parquet (Chiasso) — CHF 382,50',
  '18/05 — 8,00 h — Parquet (Chiasso) — CHF 360,00',
  '19/05 — 6,50 h — Parquet (Chiasso) — CHF 292,50',
  '20/05 — 8,00 h — Taverne — CHF 360,00',
  '21/05 — 4,00 h — Piastrelle vasca (Chiasso) — CHF 180,00',
  '22/05 — 8,00 h — Battiscopa (Chiasso) — CHF 360,00',
  '26/05 — 6,50 h — Parquet (Chiasso) — CHF 292,50',
  '27/05 — 9,00 h — Battiscopa (Chiasso) — CHF 405,00',
  '28/05 — 8,00 h — Rappezzi (Chiasso) — CHF 360,00',
  "Subtotale maggio: 131,00 h — CHF 5'895,00",
  '',
  "POSA PARQUET (mano d'opera) — Ascona: 76,19 m² × CHF 30,00/m² = CHF 2'285,70",
  '',
  'RIEPILOGO',
  "Ore aprile (102,50 h): CHF 4'485,00",
  "Ore maggio (131,00 h): CHF 5'895,00",
  "Posa parquet (76,19 m²): CHF 2'285,70",
  "Totale lavori (233,50 h + posa): CHF 12'665,70",
  "Acconti ricevuti: − CHF 7'000,00",
  "- 20.04.2026 — CHF 1'000,00 (PostFinance rif. 489102566)",
  "- 28.04.2026 — CHF 2'000,00 (PostFinance rif. 490124684)",
  "- 11.05.2026 — CHF 2'000,00 (PostFinance rif. 491452304)",
  "- 28.05.2026 — CHF 2'000,00 (PostFinance rif. 493183879)",
  "Saldo dovuto: CHF 5'665,70",
].join('\r\n')

async function main() {
  const inv = await prisma.invoice.findFirst({ where: { invoiceNumber: 'INV-2026-013' } })
  if (!inv) throw new Error('INV-2026-013 not found')

  await prisma.invoice.update({ where: { id: inv.id }, data: { notes: NOTES } })

  await prisma.activityLog.create({
    data: {
      action: 'UPDATE', entityType: 'Fattura', entityId: inv.id, entityLabel: 'INV-2026-013',
      userId: ACTOR.id, userName: ACTOR.name, success: true, createdAt: new Date(),
      details: JSON.stringify({ change: 'note: dettaglio ore aprile/maggio (maggio 131h) + riepilogo + acconti; totale invariato 5665.70' }),
    },
  })

  console.log('DONE: INV-2026-013 notes updated. total invariato =', inv.total)
}

main()
  .then(() => prisma.$disconnect())
  .then(() => process.exit(0))
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
