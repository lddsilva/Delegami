import { createClient } from '@libsql/client'
import { config } from 'dotenv'

config({ path: '.env.local' })

const client = createClient({
  url: process.env.DATABASE_URL,
  authToken: process.env.DATABASE_AUTH_TOKEN,
})

const now = new Date().toISOString()
const uid = () => 'c' + Date.now().toString(36) + Math.random().toString(36).slice(2, 10)
const item = (description, unit, quantity, unitPrice) => ({ description, unit, quantity, unitPrice })

const templates = [
  {
    name: 'Manodopera Muratore — giornata',
    emoji: '👷',
    category: 'Manodopera',
    sortOrder: 1,
    items: [
      item('Muratore qualificato — giornata 8h', 'h', 8, 75),
      item('Operaio generico di supporto — giornata 8h', 'h', 8, 55),
      item('Trasferta e preparazione attrezzatura', 'corpo', 1, 45),
    ],
  },
  {
    name: 'Posa piastrelle — manodopera',
    emoji: '◫',
    category: 'Manodopera',
    sortOrder: 2,
    items: [
      item('Posa piastrelle fino 60×60cm — manodopera', 'm²', 20, 50),
      item('Tagli e finiture perimetrali', 'ml', 20, 12),
      item('Pulizia finale fughe e superficie', 'corpo', 1, 90),
    ],
  },
  {
    name: 'Cartongesso — posa parete/controparete',
    emoji: '🏗️',
    category: 'Manodopera',
    sortOrder: 3,
    items: [
      item('Controparete in cartongesso singola lastra – m² (mat + posa)', 'm²', 15, 95),
      item('Stuccatura giunti e rasatura base', 'm²', 15, 18),
      item('Pulizia e protezione area lavoro', 'corpo', 1, 80),
    ],
  },
  {
    name: 'Demolizioni leggere — giornata',
    emoji: '🔨',
    category: 'Manodopera',
    sortOrder: 4,
    items: [
      item('Ora operaio edile qualificato (muratore)', 'h', 8, 75),
      item('Ora operaio generico (aiuto)', 'h', 8, 55),
      item('Carico macerie e pulizia area', 'corpo', 1, 160),
    ],
  },
  {
    name: 'Idraulico — intervento bagno',
    emoji: '🔧',
    category: 'Manodopera',
    sortOrder: 5,
    items: [
      item('Installazione completa bagno (WC+lavabo+bidet+doccia)', 'corpo', 1, 1800),
      item('Collaudo impianto idrico (pressione + tenuta)', 'corpo', 1, 180),
    ],
  },
  {
    name: 'Elettricista — giornata',
    emoji: '⚡',
    category: 'Manodopera',
    sortOrder: 6,
    items: [
      item('Ora elettricista qualificato', 'h', 8, 95),
      item('Ora aiuto elettricista', 'h', 8, 65),
      item('Collaudo e verifica linee', 'corpo', 1, 180),
    ],
  },
  {
    name: 'Pittura — appartamento giornata',
    emoji: '🎨',
    category: 'Manodopera',
    sortOrder: 7,
    items: [
      item('Tinteggiatura pareti — manodopera (2 mani)', 'm²', 80, 12),
      item('Tinteggiatura soffitti — manodopera (2 mani)', 'm²', 40, 14),
      item('Protezione pavimenti e nastratura', 'corpo', 1, 120),
    ],
  },
  {
    name: 'Montaggio cucina — manodopera',
    emoji: '🍳',
    category: 'Manodopera',
    sortOrder: 8,
    items: [
      item('Montaggio cucina completa (fino 5m lineari)', 'corpo', 1, 900),
      item('Montaggio lavello + miscelatore', 'corpo', 1, 180),
      item('Allacciamento elettrico piano cottura induzione (manodopera)', 'corpo', 1, 160),
    ],
  },
  {
    name: 'Posa infissi — manodopera',
    emoji: '🪟',
    category: 'Manodopera',
    sortOrder: 9,
    items: [
      item('Posa finestra + sigillatura (manodopera)', 'pz', 4, 280),
      item('Rappezzi intonaco intorno ai nuovi telai', 'corpo', 1, 350),
      item('Smaltimento vecchi infissi', 'corpo', 1, 180),
    ],
  },
  {
    name: 'Pulizia fine cantiere',
    emoji: '🧹',
    category: 'Manodopera',
    sortOrder: 10,
    items: [
      item('Pulizia fine cantiere', 'corpo', 1, 320),
      item('Trasporto materiali residui in discarica', 'corpo', 1, 180),
    ],
  },
  {
    name: 'Acconto lavori',
    emoji: '💰',
    category: 'Acconto',
    sortOrder: 11,
    items: [
      item('Acconto su preventivo approvato', 'corpo', 1, 0),
    ],
  },
  {
    name: 'SAL — avanzamento lavori',
    emoji: '📊',
    category: 'SAL',
    sortOrder: 12,
    items: [
      item('Stato avanzamento lavori da preventivo approvato', 'corpo', 1, 0),
      item('Manodopera e lavorazioni eseguite nel periodo', 'corpo', 1, 0),
    ],
  },
  {
    name: 'Rasatura e intonaco — manodopera',
    emoji: '🧱',
    category: 'Manodopera',
    sortOrder: 13,
    items: [
      item('Rasatura parete con gesso (strato di finitura 3-5mm)', 'm²', 25, 26),
      item('Intonaco civile su parete (12-15mm)', 'm²', 15, 44),
    ],
  },
  {
    name: 'Posa battiscopa e profili',
    emoji: '📏',
    category: 'Manodopera',
    sortOrder: 14,
    items: [
      item('Posa battiscopa', 'ml', 40, 8),
      item('Profilo transizione alluminio 38mm', 'ml', 6, 12),
    ],
  },
  {
    name: 'Impermeabilizzazione doccia',
    emoji: '🚿',
    category: 'Manodopera',
    sortOrder: 15,
    items: [
      item('Impermeabilizzazione zona doccia con membrana liquida', 'm²', 8, 58),
      item('Sigillatura angoli e scarichi', 'corpo', 1, 120),
    ],
  },
  {
    name: 'Montaggio porte interne',
    emoji: '🚪',
    category: 'Manodopera',
    sortOrder: 16,
    items: [
      item('Montaggio porta interna con telaio esistente', 'pz', 3, 180),
      item('Regolazione cerniere e maniglie', 'pz', 3, 35),
    ],
  },
  {
    name: 'Ore extra cantiere',
    emoji: '⏱️',
    category: 'Manodopera',
    sortOrder: 17,
    items: [
      item('Ora capo cantiere / tecnico', 'h', 2, 90),
      item('Ora operaio edile qualificato (muratore)', 'h', 4, 75),
      item('Ora operaio generico (aiuto)', 'h', 4, 55),
    ],
  },
  {
    name: 'Smaltimento macerie',
    emoji: '🗑️',
    category: 'Smaltimento',
    sortOrder: 18,
    items: [
      item('Trasporto e smaltimento macerie in discarica autorizzata', 'corpo', 1, 280),
      item('Pulizia area e carico manuale', 'h', 4, 55),
    ],
  },
  {
    name: 'Coordinamento e sopralluogo',
    emoji: '📋',
    category: 'Consulenza',
    sortOrder: 19,
    items: [
      item('Sopralluogo e rilievi', 'h', 2, 90),
      item('Coordinamento cantiere e fornitori', 'h', 3, 90),
    ],
  },
  {
    name: 'Noleggio attrezzatura con operatore',
    emoji: '🔩',
    category: 'Noleggio',
    sortOrder: 20,
    items: [
      item('Noleggio attrezzatura leggera con operatore', 'giorno', 1, 280),
      item('Trasporto attrezzatura in cantiere', 'corpo', 1, 90),
    ],
  },
]

async function run() {
  const deactivate = await client.execute(`
    UPDATE quote_templates
    SET isActive = 0, updatedAt = '${now}'
    WHERE templateType = 'INVOICE'
  `)
  console.log(`invoice templates precedenti disattivati: ${deactivate.rowsAffected ?? 0}`)

  let inserted = 0
  for (const template of templates) {
    const exists = await client.execute({
      sql: 'SELECT id FROM quote_templates WHERE templateType = ? AND name = ? LIMIT 1',
      args: ['INVOICE', template.name],
    })
    if (exists.rows.length > 0) {
      await client.execute({
        sql: 'UPDATE quote_templates SET isActive = 1, category = ?, sortOrder = ?, itemsJson = ?, updatedAt = ? WHERE id = ?',
        args: [template.category, template.sortOrder, JSON.stringify(template.items), now, exists.rows[0].id],
      })
      continue
    }
    await client.execute({
      sql: `
        INSERT INTO quote_templates
          (id, name, description, category, emoji, sortOrder, templateType, qualityLevel, templateGroupKey, version, itemsJson, isActive, createdAt, updatedAt)
        VALUES
          (?, ?, ?, ?, ?, ?, 'INVOICE', 'STANDARD', ?, 1, ?, 1, ?, ?)
      `,
      args: [
        uid(),
        template.name,
        'Template fattura sintetico per manodopera/SAL. Preferire fatturazione da preventivo approvato quando disponibile.',
        template.category,
        template.emoji,
        template.sortOrder,
        `invoice-${template.category.toLowerCase()}-${template.sortOrder}`,
        JSON.stringify(template.items),
        now,
        now,
      ],
    })
    inserted++
  }
  console.log(`invoice templates manodopera/SAL inseriti: ${inserted}`)
}

run()
  .catch((error) => {
    console.error(error)
    process.exitCode = 1
  })
  .finally(() => client.close())
