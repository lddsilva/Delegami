import 'dotenv/config'
import prismaClientModule from '../src/generated/prisma/client.ts'
import { PrismaLibSql } from '@prisma/adapter-libsql'

const { PrismaClient } = prismaClientModule
const adapter = new PrismaLibSql({ url: process.env.DATABASE_URL, authToken: process.env.DATABASE_AUTH_TOKEN })
const prisma = new PrismaClient({ adapter })

const ACTOR = { id: 'usr-1', name: 'Leandro' }

// ── Costi Edilgroup (senza margine) ─────────────────────────────────────────
const MAT_MASSETTO = 150 * 8.45 // VAGA Turbomass rapido 25kg
const MAT_ISOLANTE = 22 * 12.95 // Polymant 35 Special 5mm
const MAT_BANDA = 2 * 87.0 // KNAUF 60x3x2000, 2 conf (20 m)
const MAT_RETE = 11 * 3.7 // rete elettrosaldata 55x55x1.8, pann. 2x1 m
const r2 = (n) => Math.round(n * 100) / 100
const MATERIALI = r2(MAT_MASSETTO + MAT_ISOLANTE + MAT_BANDA + MAT_RETE) // 1767.10
const MANODOPERA = 1800
const TOTALE = r2(MATERIALI + MANODOPERA) // 3567.10

const internalNotes =
  'Dettaglio costi (Edilgroup, margine 0) — superficie 4,60 × 4,35 ≈ 20 m²\r\n' +
  `Massetto VAGA Turbomass rapido 25 kg (A1510_00005): 150 sacchi × CHF 8.45 = CHF ${MAT_MASSETTO.toFixed(2)}\r\n` +
  `Manto anticalpestio Polymant 35 Special 5 mm (A2405_00002): 22 m² × CHF 12.95 = CHF ${MAT_ISOLANTE.toFixed(2)}\r\n` +
  `Banda perimetrale KNAUF 60×3×2000 (A2575_00048): 2 conf. (20 m) × CHF 87.00 = CHF ${MAT_BANDA.toFixed(2)}\r\n` +
  `Rete elettrosaldata zincata 55×55×1.8, pann. 2×1 m (100_02164): 11 pz × CHF 3.70 = CHF ${MAT_RETE.toFixed(2)}\r\n` +
  `Subtotale materiali: CHF ${MATERIALI.toFixed(2)}\r\n` +
  `Manodopera (posa): CHF ${MANODOPERA.toFixed(2)}\r\n` +
  `TOTALE (senza IVA, margine 0): CHF ${TOTALE.toFixed(2)}`

function item(o, idx) {
  return {
    itemType: o.itemType,
    sortOrder: o.sortOrder ?? idx,
    description: o.description,
    unit: o.unit ?? null,
    quantity: o.quantity ?? null,
    unitCost: o.unitCost ?? null,
    unitPrice: o.unitPrice ?? null,
    directPrice: o.directPrice ?? false,
    hiddenFromClient: o.hiddenFromClient ?? false,
    totalCost: o.unitCost != null && o.quantity != null ? o.quantity * o.unitCost : null,
    totalPrice: o.unitPrice != null && o.quantity != null ? o.quantity * o.unitPrice : null,
  }
}

async function main() {
  const result = await prisma.$transaction(
    async (tx) => {
      const q = await tx.quote.findFirst({ where: { quoteNumber: 'PRE-2026-035' } })
      if (!q) throw new Error('PRE-2026-035 not found')
      if (q.status !== 'DRAFT') throw new Error('PRE-2026-035 non è DRAFT: ' + q.status)

      // wipe existing items (placeholder m² line)
      await tx.quoteItem.deleteMany({ where: { quoteId: q.id } })

      const items = [
        // ── visibili al cliente (high-level) ──
        {
          itemType: 'HEADER',
          description: 'Massetto a essiccazione rapida — spessore 7 cm (~20 m²)',
          sortOrder: 0,
        },
        {
          itemType: 'ITEM',
          sortOrder: 1,
          description:
            'Fornitura e posa massetto a essiccazione rapida, spessore 7 cm (superficie ca. 20 m²), ' +
            'compreso manto anticalpestio, rete elettrosaldata di armatura e banda perimetrale. ' +
            'Massetto piastrellabile entro 10 giorni.',
          unit: 'corpo',
          quantity: 1,
          unitCost: MATERIALI,
          unitPrice: MATERIALI,
          directPrice: true,
        },
        {
          itemType: 'ITEM',
          sortOrder: 2,
          description: 'Manodopera — posa massetto',
          unit: 'corpo',
          quantity: 1,
          unitCost: MANODOPERA,
          unitPrice: MANODOPERA,
          directPrice: true,
        },
        // ── dettaglio interno (NOTE, mai nel PDF cliente) ──
        {
          itemType: 'NOTE', sortOrder: 3, hiddenFromClient: true,
          description: 'Massetto VAGA Turbomass rapido 25 kg (Edilgroup A1510_00005) — 150 sacchi × CHF 8.45 = CHF 1’267.50',
        },
        {
          itemType: 'NOTE', sortOrder: 4, hiddenFromClient: true,
          description: 'Manto anticalpestio Polymant 35 Special 5 mm (A2405_00002) — 22 m² × CHF 12.95 = CHF 284.90',
        },
        {
          itemType: 'NOTE', sortOrder: 5, hiddenFromClient: true,
          description: 'Banda perimetrale KNAUF 60×3×2000 mm (A2575_00048) — 2 conf. (20 m) × CHF 87.00 = CHF 174.00',
        },
        {
          itemType: 'NOTE', sortOrder: 6, hiddenFromClient: true,
          description: 'Rete elettrosaldata zincata 55×55×1.8 mm, pann. 2×1 m (100_02164) — 11 pz × CHF 3.70 = CHF 40.70',
        },
        {
          itemType: 'NOTE', sortOrder: 7, hiddenFromClient: true,
          description: `Subtotale materiali CHF 1’767.10 + manodopera CHF 1’800.00 = CHF 3’567.10. Superficie 4,60 × 4,35 ≈ 20 m². Fornitore: Edilgroup. Margine: 0%.`,
        },
      ]

      await tx.quoteItem.createMany({ data: items.map((o, i) => ({ quoteId: q.id, ...item(o, i) })) })

      await tx.quote.update({
        where: { id: q.id },
        data: {
          marginPercent: 0,
          taxRate: 0,
          subtotalCost: TOTALE,
          subtotalClient: TOTALE,
          taxAmount: 0,
          total: TOTALE,
          internalNotes,
        },
      })

      await tx.activityLog.create({
        data: {
          action: 'UPDATE', entityType: 'Preventivo', entityId: q.id,
          entityLabel: `${q.quoteNumber} v${q.version}`,
          userId: ACTOR.id, userName: ACTOR.name, success: true, createdAt: new Date(),
          details: JSON.stringify({
            change: 'bettoncino: 2 voci cliente (materiali 1767.10 + manodopera 1800) + dettaglio interno',
            total: TOTALE, margine: 0,
          }),
        },
      })

      return { quote: q.quoteNumber, materiali: MATERIALI, manodopera: MANODOPERA, total: TOTALE }
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
