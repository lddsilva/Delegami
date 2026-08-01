/**
 * Restauração da fatura INV-2026-002 (deletada acidentalmente).
 * Dados extraídos do PDF original — execução única, idempotente.
 * Uso: npx tsx scripts/restore-inv-2026-002.ts
 */
import { PrismaClient } from '../src/generated/prisma/client'
import { PrismaLibSql } from '@prisma/adapter-libsql'

const url = process.env.DATABASE_URL ?? 'file:./dev.db'
const authToken = process.env.DATABASE_AUTH_TOKEN
const adapter = new PrismaLibSql({ url, authToken })
const prisma = new PrismaClient({ adapter })

const PROJECT_ID = 'cmobzgzlk0001y0ukb3hkjyih' // Ristrutturazione Appartamento - Via Bernardino Stazio 2
const QUOTE_ID   = 'cmobzgzsh0003y0ukbly36k3q' // PRE-2026-013 v8 (APPROVED)

async function main() {
  // Idempotência — aborta se já existir
  const existing = await prisma.invoice.findFirst({ where: { invoiceNumber: 'INV-2026-002', version: 1 } })
  if (existing) {
    console.log('⚠️  INV-2026-002 já existe:', existing.id, '— nenhuma alteração feita.')
    return
  }

  const invoice = await prisma.invoice.create({
    data: {
      invoiceNumber: 'INV-2026-002',
      version:       1,
      projectId:     PROJECT_ID,
      quoteId:       QUOTE_ID,
      status:        'DRAFT',
      issueDate:     new Date('2026-05-21'),
      dueDate:       new Date('2026-06-20'),
      subtotal:      11467.65,
      taxRate:       0,
      taxAmount:     0,
      total:         11467.65,
      notes: [
        'Acconto 30% — Preventivo PRE-2026-013 v8',
        'Ristrutturazione appartamento — Via Bernardino Stazio 2, 3° piano, 6815 Massagno',
      ].join('\n'),
      items: {
        create: [
          {
            description: 'Acconto 30% — Preventivo PRE-2026-013 v8 (Ristrutturazione appartamento Via Bernardino Stazio 2, Massagno)',
            quantity:    1,
            unitPrice:   11467.65,
            total:       11467.65,
          },
        ],
      },
    },
  })

  console.log('✅  INV-2026-002 ricreata:', invoice.id)
  console.log('   Progetto: Ristrutturazione Appartamento - Via Bernardino Stazio 2')
  console.log('   Preventivo: PRE-2026-013 v8')
  console.log('   Totale: CHF', invoice.total.toFixed(2))
  console.log('   Stato: DRAFT — aggiornare a SENT se necessario dall\'app')
}

main()
  .catch((e) => { console.error('❌ Errore:', e); process.exit(1) })
  .finally(() => prisma.$disconnect())
