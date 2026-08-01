import 'dotenv/config'
import prismaClientModule from '../src/generated/prisma/client.ts'
import { PrismaLibSql } from '@prisma/adapter-libsql'

const { PrismaClient } = prismaClientModule
const adapter = new PrismaLibSql({ url: process.env.DATABASE_URL, authToken: process.env.DATABASE_AUTH_TOKEN })
const prisma = new PrismaClient({ adapter })

const ACTOR = { id: 'usr-1', name: 'Leandro' }

/**
 * Repairs quote↔invoice links that were only ever recorded in free text.
 *
 * 1. INV-008/009/012 referenced PRE-2026-031 in their notes but carried
 *    quoteId = NULL, so the rate agreement always looked unbilled.
 * 2. INV-002/015 pointed at PRE-2026-013 v9 — an internal consolidation that
 *    duplicated the extra works already covered by the separate variante
 *    PRE-2026-037. They belong to v8, the version the client actually signed.
 * 3. v9 is then deleted; it is removed only after the invoices have been moved
 *    off it, so no invoice is ever left dangling.
 */
async function main() {
  const result = await prisma.$transaction(
    async (tx) => {
      const pre031 = await tx.quote.findFirst({ where: { quoteNumber: 'PRE-2026-031' } })
      if (!pre031) throw new Error('PRE-2026-031 not found')

      const v8 = await tx.quote.findFirst({ where: { quoteNumber: 'PRE-2026-013', version: 8 } })
      const v9 = await tx.quote.findFirst({ where: { quoteNumber: 'PRE-2026-013', version: 9 } })
      if (!v8) throw new Error('PRE-2026-013 v8 not found')
      if (!v9) throw new Error('PRE-2026-013 v9 not found')

      // ── 1. Attilio rate agreement ─────────────────────────────────────────
      const attilioNumbers = ['INV-2026-008', 'INV-2026-009', 'INV-2026-012']
      const attilio = await tx.invoice.updateMany({
        where: { invoiceNumber: { in: attilioNumbers } },
        data: { quoteId: pre031.id },
      })

      // ── 2. Martini invoices back onto the signed v8 ───────────────────────
      const martiniNumbers = ['INV-2026-002', 'INV-2026-015']
      const martini = await tx.invoice.updateMany({
        where: { invoiceNumber: { in: martiniNumbers } },
        data: { quoteId: v8.id },
      })

      // ── 3. Delete v9, now that nothing points at it ───────────────────────
      const stillLinked = await tx.invoice.count({ where: { quoteId: v9.id } })
      if (stillLinked > 0) throw new Error(`v9 still has ${stillLinked} invoices linked — aborting`)
      const v9Snapshot = {
        id: v9.id, quoteNumber: v9.quoteNumber, version: v9.version,
        status: v9.status, total: v9.total,
      }
      await tx.quote.delete({ where: { id: v9.id } })

      // ── Activity log ──────────────────────────────────────────────────────
      const now = new Date()
      await tx.activityLog.createMany({
        data: [
          {
            action: 'UPDATE', entityType: 'Fattura', entityId: pre031.id,
            entityLabel: attilioNumbers.join(', '),
            userId: ACTOR.id, userName: ACTOR.name, success: true, createdAt: now,
            details: JSON.stringify({ change: 'collegate a PRE-2026-031 (accordo a misura); prima quoteId era NULL', count: attilio.count }),
          },
          {
            action: 'UPDATE', entityType: 'Fattura', entityId: v8.id,
            entityLabel: martiniNumbers.join(', '),
            userId: ACTOR.id, userName: ACTOR.name, success: true, createdAt: now,
            details: JSON.stringify({ change: 'ricollegate da PRE-2026-013 v9 a v8 (versione firmata)', count: martini.count }),
          },
          {
            action: 'DELETE', entityType: 'Preventivo', entityId: v9Snapshot.id,
            entityLabel: `${v9Snapshot.quoteNumber} v${v9Snapshot.version}`,
            userId: ACTOR.id, userName: ACTOR.name, success: true, createdAt: now,
            details: JSON.stringify({ reason: 'consolidazione interna duplicata: gli extra sono già nella variante PRE-2026-037', snapshot: v9Snapshot }),
          },
        ],
      })

      return { attilio: attilio.count, martini: martini.count, deleted: `v${v9Snapshot.version}` }
    },
    { timeout: 20000 },
  )
  console.log('DONE:', JSON.stringify(result, null, 2))
}

main().then(() => prisma.$disconnect()).then(() => process.exit(0)).catch((e) => { console.error(e); process.exit(1) })
