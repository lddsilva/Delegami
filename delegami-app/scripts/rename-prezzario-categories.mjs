// Rename all prezzario categories to "Parent – Subcategoria" format
import { createClient } from '@libsql/client'
import { config } from 'dotenv'
config({ path: '.env.local' })

const client = createClient({ url: process.env.DATABASE_URL, authToken: process.env.DATABASE_AUTH_TOKEN })

// Map: old category → new "Parent – Sub" category
const MAP = {
  // ── BAGNO ────────────────────────────────────────────────────────────────────
  'Sanitari – WC':            'Bagno – WC',
  'Sanitari – Lavabi':        'Bagno – Lavabi e Bidet',
  'Sanitari – Bidet':         'Bagno – Lavabi e Bidet',
  'Docce e Box':              'Bagno – Docce e Box',
  'Rubinetteria':             'Bagno – Rubinetteria',
  'Mobili Bagno':             'Bagno – Mobili',
  'Accessori Bagno':          'Bagno – Accessori',
  'Ventilazione Bagno':       'Bagno – Ventilazione',
  'Impianto Idraulico Bagno': 'Bagno – Impianto Idraulico',
  'Riscaldamento Bagno':      'Bagno – Riscaldamento',

  // ── CUCINA ───────────────────────────────────────────────────────────────────
  'Cucina – Mobili':          'Cucina – Mobili e Piani',
  'Cucina – Lavello':         'Cucina – Lavello e Rubinetteria',
  'Cucina – Piano Cottura':   'Cucina – Cottura',
  'Cucina – Forno':           'Cucina – Cottura',
  'Cucina – Cappa':           'Cucina – Cottura',
  'Cucina – Lavastoviglie':   'Cucina – Elettrodomestici',
  'Cucina – Frigorifero':     'Cucina – Elettrodomestici',
  'Cucina – Elettrodomestici':'Cucina – Elettrodomestici',
  'Illuminazione Cucina':     'Cucina – Accessori e Illuminazione',
  'Accessori Cucina':         'Cucina – Accessori e Illuminazione',
  'Cucina – Finiture':        'Cucina – Accessori e Illuminazione',
  'Cantina e Dispensa':       'Cucina – Accessori e Illuminazione',

  // ── PAVIMENTI ────────────────────────────────────────────────────────────────
  'Gres Porcellanato':        'Pavimenti – Gres Porcellanato',
  'Piastrelle Speciali':      'Pavimenti – Piastrelle Speciali',
  'Parquet e Laminato':       'Pavimenti – Parquet e Laminato',
  'Parquet':                  'Pavimenti – Parquet e Laminato',
  'Battiscopa e Profili':     'Pavimenti – Battiscopa e Profili',
  'Posa Pavimenti':           'Pavimenti – Posa e Collanti',
  'Sottofondi e Isolamento':  'Pavimenti – Posa e Collanti',
  'Pavimenti e rivestimenti': 'Pavimenti – Posa e Collanti',
  'Collanti e Malte':         'Pavimenti – Posa e Collanti',
  'Pavimenti Esterni':        'Pavimenti – Esterni',
  'Scale e Gradini':          'Strutture – Scale',

  // ── STRUTTURE ────────────────────────────────────────────────────────────────
  'Muratura':                 'Strutture – Muratura',
  'Strutture':                'Strutture – Muratura',
  'Cartongesso':              'Strutture – Cartongesso',
  'Isolamento Termoacustico': 'Strutture – Isolamento',
  'Impermeabilizzazione':     'Strutture – Impermeabilizzazione',
  'Impermeabilizzazioni':     'Strutture – Impermeabilizzazione',
  'Porte Interne':            'Strutture – Porte e Finestre',
  'Porte Blindate':           'Strutture – Porte e Finestre',
  'Finestre e Serramenti':    'Strutture – Porte e Finestre',
  'Serramenti':               'Strutture – Porte e Finestre',
  'Falegnameria':             'Strutture – Porte e Finestre',
  'Soglie e Cornici':         'Strutture – Finiture Edili',
  'Controsoffitti':           'Strutture – Finiture Edili',
  'Scale':                    'Strutture – Scale',

  // ── FINITURE ─────────────────────────────────────────────────────────────────
  'Intonaci':                 'Finiture – Intonaci e Rasanti',
  'Intonaci e Rasanti':       'Finiture – Intonaci e Rasanti',
  'Pittura':                  'Finiture – Pittura',
  'Pittura e Verniciatura':   'Finiture – Pittura',
  'Fondi e Primer':           'Finiture – Fondi e Primer',

  // ── IMPIANTI ─────────────────────────────────────────────────────────────────
  'Impianti elettrici':       'Impianti – Elettrica',
  'Impianti idraulici':       'Impianti – Idraulica',
  'Materiali Elettrici':      'Impianti – Elettrica',
  'Riscaldamento':            'Impianti – Riscaldamento',
  'Impianto Gas':             'Impianti – Gas',

  // ── MANODOPERA ───────────────────────────────────────────────────────────────
  'Manodopera – Muratura':    'Manodopera – Muratura',
  'Manodopera – Idraulica':   'Manodopera – Idraulica',
  'Manodopera – Elettrica':   'Manodopera – Elettrica',
  "Mano d'opera":             'Manodopera – Generale',
  'Demolizione':              'Manodopera – Demolizioni',
  'Demolizioni e Smaltimento':'Manodopera – Demolizioni',

  // ── LOGISTICA ────────────────────────────────────────────────────────────────
  'Trasporto e smaltimento':  'Logistica – Trasporto e Smaltimento',
  'Noleggio attrezzature':    'Logistica – Noleggio Attrezzature',
  'Noleggio Attrezzature':    'Logistica – Noleggio Attrezzature',
  'Ponteggi e Attrezzature':  'Logistica – Ponteggi e Noleggio',
  'Pulizia Fine Lavori':      'Logistica – Pulizia',

  // ── UTENSILI ─────────────────────────────────────────────────────────────────
  'Accessori e Strumenti':    'Utensili – Accessori e Strumenti',

  // ── VARIE ────────────────────────────────────────────────────────────────────
  'Generale':                 'Varie – Generale',
  'Varie':                    'Varie – Generale',
}

async function main() {
  // Show current unique categories
  const cats = await client.execute('SELECT DISTINCT category, COUNT(*) as n FROM price_items GROUP BY category ORDER BY category')
  console.log(`\nCategorie attuali (${cats.rows.length} univoche):\n`)

  let updated = 0
  let skipped = 0
  const unmapped = []

  for (const row of cats.rows) {
    const oldCat = row.category
    const newCat = MAP[oldCat]
    if (!newCat) {
      // If already in "Parent – Sub" format, skip
      if (String(oldCat).includes(' – ')) {
        console.log(`  ✓ già formattata: ${oldCat} (${row.n})`)
        skipped++
      } else {
        unmapped.push(String(oldCat))
        console.log(`  ⚠  non mappata: ${oldCat} (${row.n})`)
      }
      continue
    }
    if (newCat === oldCat) { skipped++; continue }

    await client.execute({
      sql: 'UPDATE price_items SET category = ? WHERE category = ?',
      args: [newCat, oldCat],
    })
    console.log(`  → ${oldCat}  →  ${newCat}  (${row.n} articoli)`)
    updated += Number(row.n)
  }

  console.log(`\n✅  Aggiornati: ${updated} articoli`)
  console.log(`⏭   Saltati (già ok): ${skipped}`)
  if (unmapped.length) console.log(`⚠   Non mappate (${unmapped.length}):`, unmapped)
}

main().catch(console.error).finally(() => client.close())
