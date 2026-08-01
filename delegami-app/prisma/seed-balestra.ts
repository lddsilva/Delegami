import { PrismaClient } from '../src/generated/prisma/client'
import { PrismaLibSql } from '@prisma/adapter-libsql'

const url = process.env.DATABASE_URL ?? 'file:./dev.db'
const authToken = process.env.DATABASE_AUTH_TOKEN
const adapter = new PrismaLibSql({ url, authToken })
const prisma = new PrismaClient({ adapter })

async function main() {
  const margin = 0
  const taxRate = 0  // piccola impresa, soglia IVA non raggiunta
  const year = 2026

  // ── 0. Remove previous Balestra data (idempotent) ─────────────────────────
  const existing = await prisma.client.findFirst({ where: { email: 'marco.balestra@gmail.com' } })
  if (existing) {
    const projects = await prisma.project.findMany({ where: { clientId: existing.id } })
    for (const p of projects) {
      const quotes = await prisma.quote.findMany({ where: { projectId: p.id } })
      for (const q of quotes) {
        await prisma.quoteItem.deleteMany({ where: { quoteId: q.id } })
        await prisma.quote.delete({ where: { id: q.id } })
      }
      await prisma.project.delete({ where: { id: p.id } })
    }
    await prisma.client.delete({ where: { id: existing.id } })
    console.log('♻️  Removed existing Balestra data')
  }

  // ── 1. Cliente ────────────────────────────────────────────────────────────
  const client = await prisma.client.create({
    data: {
      name: 'Marco Balestra',
      address: 'Via Cantonale 42',
      city: 'Bellinzona',
      postalCode: '6500',
      country: 'CH',
      email: 'marco.balestra@gmail.com',
      phone: '+41 79 345 67 89',
      notes: 'Appartamento in ristrutturazione totale – 112.74 m²',
    },
  })

  // ── 2. Progetto ───────────────────────────────────────────────────────────
  const project = await prisma.project.create({
    data: {
      clientId: client.id,
      name: 'Ristrutturazione Appartamento Balestra',
      address: 'Via Cantonale 42, 6500 Bellinzona',
      description:
        'Ristrutturazione completa: bagno, cucina, corridoio, stanze e pittura. ' +
        'Appartamento 112.74 m² – 1 bagno, 3 stanze, 2 corridoi.',
      status: 'QUOTING',
      estimatedValue: 28000,
    },
  })

  // ── 3. Numero preventivo ──────────────────────────────────────────────────
  const seq = await prisma.documentSequence.upsert({
    where: { type_year: { type: 'QUOTE', year } },
    update: { lastNumber: { increment: 1 } },
    create: { type: 'QUOTE', year, lastNumber: 1 },
  })
  const quoteNumber = `PRE-${year}-${String(seq.lastNumber).padStart(3, '0')}`

  // ── 4. Calcoli margine ────────────────────────────────────────────────────
  function price(cost: number) {
    if (cost === 0) return 0
    if (margin <= 0) return cost
    return Math.round((cost / (1 - margin / 100)) * 100) / 100
  }

  // [section, sortOrder, tipo, descrizione, unità, qtà, costUnitario, sourceNote?, sourceUrl?]
  type Row = [string, number, string, string, string | null, number | null, number, string?, string?]

  const rows: Row[] = [

    // ── BAGNO – RISTRUTTURAZIONE ──────────────────────────────────────────
    ['Bagno',  0, 'SECTION', 'BAGNO – RISTRUTTURAZIONE', null, null, 0],

    ['Bagno',  1, 'ITEM',
      'Muratura – rimozione vasca e accessori esistenti, passaggio conduit e cassette elettriche, intonaco area box doccia (senza rimozione piastrelle esistenti), impermeabilizzazione box doccia, aggrappante su piastrelle restanti, rasatura in stabilitura (malta fine)',
      'corpo', 1, 2000],

    ['Bagno',  2, 'ITEM',
      'Piastrelatura bagno 25.04 m² (fornitura materiale e posa inclusa)',
      'm²', 25.04, 135,
      'Materiale CHF 35/m² (Bauhaus art. 28795195 – gres 60×60) + posa CHF 100/m²',
      'https://www.bauhaus.ch/it/p/piastrella-in-gres-porcellanato-tribeca-28795195'],

    ['Bagno',  3, 'ITEM',
      'Sanitario WC completo (con sistema di scarico e copriwater)',
      'pz', 1, 600,
      'WC sospeso con telaio Geberit – richiede incasso a parete. Sanitas Troesch Mendrisio / Bagno Design Contone – stima CHF 500–700'],

    ['Bagno',  4, 'ITEM',
      'Mobile lavabo con cassetti, lavabo e rubinetteria (fornitura completa)',
      'pz', 1, 517,
      'IKEA ÄNGSJÖN + BACKSJÖN art. 195.211.23',
      'https://www.ikea.com/ch/it/p/aengsjoen-backsjoen-mobile-lavabo-cassetti-lavabo-misc-s19521123/'],

    ['Bagno',  5, 'ITEM',
      'Specchio con armadietto pensile 80cm',
      'pz', 1, 259,
      'IKEA LETTAN art. 805.349.23',
      'https://www.ikea.com/ch/it/p/lettan-mobile-a-specchio-con-ante-effetto-specchio-vetro-a-specchio-80534923/'],

    ['Bagno',  6, 'ITEM',
      'Box doccia rettangolare 120×80cm',
      'pz', 1, 500,
      'Acquisto locale Ticino (Sanitas Troesch o Bagno Design) – stima CHF 400–600'],

    ['Bagno',  7, 'ITEM',
      'Fornitura sistema doccia completo (colonna doccia, soffione, doccetta, miscelatore)',
      'pz', 1, 450,
      'Stima standard qualità media – Grohe / Hansgrohe o equivalente'],

    ['Bagno',  8, 'ITEM',
      'Installazione sistema doccia completo (collegamenti idraulici, fissaggio, regolazione)',
      'corpo', 1, 250],

    ['Bagno',  9, 'ITEM',
      'Fornitura piletta e sistema di scarico doccia (sifone, collegamenti, accessori)',
      'pz', 1, 120],

    ['Bagno', 10, 'ITEM',
      'Accessori bagno – fornitura standard (porta asciugamani, porta carta igienica, ganci)',
      'corpo', 1, 150],

    ['Bagno', 11, 'ITEM',
      'Montaggio sanitari e accessori bagno',
      'corpo', 1, 1000],

    // ── CORRIDOIO E CUCINA ────────────────────────────────────────────────
    ['Corridoio e Cucina', 12, 'SECTION', 'CORRIDOIO E CUCINA', null, null, 0],

    ['Corridoio e Cucina', 13, 'ITEM',
      'Muratura – demolizione cucina esistente, rimozione pavimento, autolivellante, predisposizione conduit elettrici e installazione cassette',
      'corpo', 1, 3000],

    ['Corridoio e Cucina', 14, 'ITEM',
      'Piastrelatura corridoio e cucina 30 m² (fornitura materiale e posa inclusa)',
      'm²', 30, 79.95,
      'Materiale CHF 29.95/m² (Bauhaus art. 31365295 – gres 60×60 Active Beige) + posa CHF 50/m²',
      'https://www.bauhaus.ch/it/p/gres-porcellanato-active-beige-31365295'],

    // ── CUCINA – ARREDAMENTO E ELETTRODOMESTICI ───────────────────────────
    ['Cucina', 15, 'SECTION', 'CUCINA – ARREDAMENTO E ELETTRODOMESTICI', null, null, 0],

    ['Cucina', 16, 'ITEM',
      'Cucina componibile 310cm (montaggio incluso)',
      'pz', 1, 1990,
      'IKEA METOD/AXSTAD – stima CHF 1.800–2.200 (configurazione 310cm, qualità base-media)',
      'https://www.ikea.com/ch/it/cat/cucine-componibili-metod-20024/'],

    ['Cucina', 17, 'ITEM',
      'Piano cottura a induzione 4 zone 59cm',
      'pz', 1, 449,
      'IKEA MATMÄSSIG 300 NERO art. 10467093',
      'https://www.ikea.com/ch/it/p/matmaessig-piano-cottura-a-induzione-ikea-300-nero-10467093/'],

    ['Cucina', 18, 'ITEM',
      'Cappa aspirante da parete 60cm',
      'pz', 1, 49.95,
      'IKEA LAGAN art. 503.013.97',
      'https://www.ikea.com/ch/it/p/lagan-cappa-da-fissare-alla-parete-bianco-50401397/'],

    ['Cucina', 19, 'ITEM',
      'Frigorifero/congelatore freestanding 262L',
      'pz', 1, 479,
      'IKEA LAGAN art. 805.712.94',
      'https://www.ikea.com/ch/it/p/lagan-frigorifero-congelatore-freestanding-bianco-80571294/'],

    ['Cucina', 20, 'ITEM',
      'Forno ventilato con funzione grill',
      'pz', 1, 429,
      'IKEA STENABY art. 406.139.41',
      'https://www.ikea.com/ch/it/p/stenaby-forno-ventilato-funzione-grill-bianco-ikea-300-40613941/'],

    ['Cucina', 21, 'ITEM',
      'Lavello inox a 1 vasca',
      'pz', 1, 24.95,
      'IKEA FYNDIG art. 902.021.26',
      'https://www.ikea.com/ch/it/p/fyndig-lavello-da-incasso-a-1-vasca-inox-90202126/'],

    ['Cucina', 22, 'ITEM',
      'Miscelatore lavello',
      'pz', 1, 59.95,
      'IKEA EDSVIK art. 505.072.09',
      'https://www.ikea.com/ch/it/p/edsvik-miscelatore-lavello-doppio-comando-cromato-50507209/'],

    ['Cucina', 23, 'ITEM',
      'Rivestimento parete cucina – backsplash 3 m² (fornitura e posa inclusa)',
      'm²', 3, 140,
      'Materiale CHF 60/m² (gres porcellanato / pannello paraschizzi) + posa CHF 80/m²'],

    ['Cucina', 24, 'ITEM',
      'Piano di lavoro laminato 186cm',
      'pz', 2, 59,
      'IKEA EKBACKEN – CHF 59 cad. (×2 = CHF 118)',
      'https://www.ikea.com/ch/it/cat/piani-di-lavoro-24264/'],

    ['Cucina', 25, 'ITEM',
      'Montaggio cucina e posa elettrodomestici',
      'corpo', 1, 1000],

    // ── STANZE ────────────────────────────────────────────────────────────
    ['Stanze', 26, 'SECTION', 'STANZE', null, null, 0],

    ['Stanze', 27, 'ITEM',
      'Muratura 3 stanze – tracce e installazione cassette elettriche',
      'corpo', 1, 2000],

    // ── PITTURA E FINITURA ────────────────────────────────────────────────
    ['Pittura e Finitura', 28, 'SECTION', 'PITTURA E FINITURA', null, null, 0],

    ['Pittura e Finitura', 29, 'ITEM',
      'Verniciatura 6 persiane',
      'corpo', 1, 720],

    ['Pittura e Finitura', 30, 'ITEM',
      'Verniciatura 6 porte interne',
      'corpo', 1, 720],

    ['Pittura e Finitura', 31, 'ITEM',
      'Pittura appartamento – tinteggiatura pareti e soffitti. Nota: la stuccatura verrà eseguita esclusivamente nelle zone interessate dalle tracce elettriche; non è prevista la lisciatura completa delle pareti.',
      'corpo', 1, 3950],

    ['Pittura e Finitura', 32, 'ITEM',
      'Fornitura e posa battiscopa (110 ml)',
      'corpo', 1, 1045.60,
      'Materiale: Logoclic Rovere Firenze 2600×58×18mm – CHF 4.96/ml × 110ml = CHF 545.60 (Bauhaus art. 31158811) + posa CHF 500',
      'https://www.bauhaus.ch/it/p/logoclic-battiscopa-rovere-firenze-31158811'],

    // ── VARIE ────────────────────────────────────────────────────────────
    ['Varie', 33, 'SECTION', 'VARIE', null, null, 0],

    ['Varie', 34, 'NOTE',
      'Impianto idraulico, impianto elettrico ed eventuale domanda di costruzione: costi da definire in una fase successiva.',
      null, null, 0],

    ['Varie', 35, 'ITEM', 'Direzione lavori', 'corpo', 1, 0],
  ]

  let subtotalCost = 0
  let subtotalClient = 0

  const items = rows.map(([section, sortOrder, itemType, description, unit, quantity, unitCost, sourceNote, sourceUrl]) => {
    if (itemType === 'SECTION') {
      return { itemType: 'SECTION' as const, section, sortOrder, description, unit: null, quantity: null, unitCost: null, unitPrice: null, totalCost: null, totalPrice: null, marginPercent: null, sourceNote: null, sourceUrl: null }
    }
    if (itemType === 'NOTE') {
      return { itemType: 'NOTE' as const, section, sortOrder, description, unit: null, quantity: null, unitCost: null, unitPrice: null, totalCost: null, totalPrice: null, marginPercent: null, sourceNote: null, sourceUrl: null }
    }
    const q = quantity!
    const c = unitCost
    const p = price(c)
    const tc = Math.round(q * c * 100) / 100
    const tp = Math.round(q * p * 100) / 100
    subtotalCost += tc
    subtotalClient += tp
    return { itemType: 'ITEM' as const, section, sortOrder, description, unit, quantity: q, unitCost: c, unitPrice: p, totalCost: tc, totalPrice: tp, marginPercent: null, sourceNote: sourceNote ?? null, sourceUrl: sourceUrl ?? null }
  })

  subtotalCost = Math.round(subtotalCost * 100) / 100
  subtotalClient = Math.round(subtotalClient * 100) / 100
  const taxAmount = 0
  const total = subtotalClient

  const clientNotes =
    'Preventivo preliminare per ristrutturazione appartamento. ' +
    'Prezzi indicativi soggetti a sopralluogo definitivo.\n\n' +
    'Condizioni di pagamento:\n' +
    '• 30% all\'accettazione del preventivo\n' +
    '• 30% a metà lavori\n' +
    '• 40% al completamento dei lavori'

  const internalNotes =
    'MARGINE APPLICATO: 0% (preventivo a prezzo di costo – margine da definire)\n\n' +
    'NOTE OPERATIVE:\n' +
    '• WC: modello sospeso con telaio Geberit – richiede incasso a parete\n' +
    '• Box doccia 120×80: acquisto da rivenditore locale Ticino\n' +
    '• Sistema doccia: Grohe / Hansgrohe o equivalente qualità media\n' +
    '• Edilgroup CH Manno: +41 91 610 02 02 (alternativa locale piastrelle)\n' +
    '• Sanitas Troesch Mendrisio: Via Borromini 4\n' +
    '• Bagno Design Contone: +41 91 290 81 01'

  // ── 5. Preventivo ────────────────────────────────────────────────────────
  const quote = await prisma.quote.create({
    data: {
      quoteNumber,
      version: 1,
      projectId: project.id,
      type: 'PRELIMINARY',
      status: 'DRAFT',
      marginPercent: margin,
      subtotalCost,
      subtotalClient,
      taxRate,
      taxAmount,
      total,
      internalNotes,
      clientNotes,
      items: { create: items },
    } as any,
  })

  console.log(`\n✅ Cliente:    ${client.name} (${client.id})`)
  console.log(`✅ Progetto:   ${project.name} (${project.id})`)
  console.log(`✅ Preventivo: ${quoteNumber} (${quote.id})`)
  console.log(`   Subtot. costi:   CHF ${subtotalCost.toFixed(2)}`)
  console.log(`   Subtot. cliente: CHF ${subtotalClient.toFixed(2)}`)
  console.log(`   IVA ${taxRate}%:          CHF ${taxAmount.toFixed(2)}`)
  console.log(`   Totale:          CHF ${total.toFixed(2)}\n`)
}

main().catch(console.error).finally(() => prisma.$disconnect())
