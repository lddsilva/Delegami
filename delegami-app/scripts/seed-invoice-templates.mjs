// Seed 20 invoice templates for common construction services
import { createClient } from '@libsql/client'
import { config } from 'dotenv'
config({ path: '.env.local' })

const client = createClient({ url: process.env.DATABASE_URL, authToken: process.env.DATABASE_AUTH_TOKEN })
function uid() { return 'c' + Date.now().toString(36) + Math.random().toString(36).slice(2, 10) }

// Invoice items: { description, unit, quantity, unitPrice }
const IT = (d, unit, qty, price) => ({ description: d, unit, quantity: qty, unitPrice: price })

const templates = [
  {
    name: 'Ristrutturazione Bagno Completo', emoji: '🛁', category: 'Bagno', sortOrder: 1,
    items: [
      IT('Demolizione e smontaggio sanitari esistenti', 'corpo', 1, 320),
      IT('Demolizione rivestimento bagno (pareti + pavimento)', 'm²', 16, 22),
      IT('Rimozione e smaltimento macerie', 'corpo', 1, 280),
      IT('Impermeabilizzazione doccia', 'm²', 8, 57),
      IT('Fornitura e posa piastrelle bagno 60×60', 'm²', 16, 135),
      IT('Fornitura telaio Geberit Duofix + WC sospeso + placca', 'corpo', 1, 685),
      IT('Fornitura lavabo + mobile + specchio LED', 'corpo', 1, 665),
      IT('Fornitura box doccia + piatto + rubinetteria', 'corpo', 1, 1005),
      IT('Installazione impianto idraulico bagno completo', 'corpo', 1, 1800),
      IT('Tinteggiatura pareti e soffitto bagno', 'm²', 16, 14),
      IT('Montaggio accessori bagno (set completo)', 'corpo', 1, 325),
    ],
  },
  {
    name: 'Ristrutturazione Cucina Completa', emoji: '🍳', category: 'Cucina', sortOrder: 2,
    items: [
      IT('Demolizione e sgombero cucina esistente', 'corpo', 1, 560),
      IT('Fornitura e posa pavimento cucina 60×60', 'm²', 14, 79.95),
      IT('Fornitura e montaggio cucina IKEA METOD (fino 5m)', 'corpo', 1, 2400),
      IT('Fornitura piano cucina laminato', 'ml', 5, 95),
      IT('Fornitura e posa lavello + miscelatore', 'corpo', 1, 325),
      IT('Fornitura piano cottura induzione 60cm Bosch', 'pz', 1, 490),
      IT('Fornitura cappa aspirante 60cm Bosch', 'pz', 1, 320),
      IT('Fornitura forno da incasso multifunzione', 'pz', 1, 380),
      IT('Fornitura lavastoviglie da incasso 60cm', 'pz', 1, 520),
      IT('Fornitura frigorifero combinato da incasso', 'pz', 1, 980),
      IT('Allacciamenti elettrici e idraulici cucina', 'corpo', 1, 550),
      IT('Tinteggiatura pareti cucina', 'm²', 20, 12),
    ],
  },
  {
    name: 'Posa Piastrelle', emoji: '🪟', category: 'Pavimenti', sortOrder: 3,
    items: [
      IT('Demolizione pavimento esistente', 'm²', 30, 18),
      IT('Preparazione sottofondo', 'm²', 30, 12),
      IT('Fornitura colla C2 per piastrelle', 'sacco', 7, 24),
      IT('Fornitura gres porcellanato 60×60 (a scelta cliente)', 'm²', 32, 32),
      IT('Posa piastrelle fino 60×60 — manodopera', 'm²', 30, 50),
      IT('Fornitura e posa battiscopa laminato 58mm', 'ml', 40, 9.51),
    ],
  },
  {
    name: 'Tinteggiatura Appartamento', emoji: '🎨', category: 'Pittura', sortOrder: 4,
    items: [
      IT('Stuccatura leggera pareti', 'm²', 120, 6),
      IT('Tinteggiatura pareti — 2 mani', 'm²', 200, 12),
      IT('Tinteggiatura soffitti — 2 mani', 'm²', 80, 14),
      IT('Verniciatura porte interne', 'pz', 5, 120),
      IT('Verniciatura persiane', 'pz', 5, 120),
      IT('Materiali (pittura, primer, smalto)', 'corpo', 1, 650),
    ],
  },
  {
    name: 'Rifacimento Impianto Elettrico', emoji: '⚡', category: 'Impianti', sortOrder: 5,
    items: [
      IT('Rifacimento impianto elettrico appartamento (fino 80m²)', 'corpo', 1, 4500),
      IT('Fornitura e sostituzione quadro elettrico 24 moduli', 'corpo', 1, 980),
      IT('Collaudo e certificazione impianto', 'corpo', 1, 350),
      IT('Raccordo tracce e intonaci', 'corpo', 1, 480),
    ],
  },
  {
    name: 'Opere Murarie Generali', emoji: '🧱', category: 'Muratura', sortOrder: 6,
    items: [
      IT('Apertura nuova porta in muratura portante', 'pz', 1, 1800),
      IT('Chiusura vano porta — muratura e intonaco', 'pz', 1, 1300),
      IT('Tracce impianti a parete', 'ml', 25, 22),
      IT('Intonacatura pareti', 'm²', 20, 28),
      IT('Smaltimento macerie', 'corpo', 1, 280),
    ],
  },
  {
    name: 'Sostituzione Finestre e Infissi', emoji: '🪟', category: 'Infissi', sortOrder: 7,
    items: [
      IT('Fornitura finestre PVC triplo vetro 100×120cm', 'pz', 4, 650),
      IT('Fornitura finestra PVC triplo vetro 80×120cm', 'pz', 1, 580),
      IT('Smontaggio vecchie finestre e posa nuove', 'pz', 5, 280),
      IT('Fornitura e posa davanzali in pietra artificiale', 'pz', 5, 75),
      IT('Fornitura e posa tapparelle motorizzate', 'pz', 5, 320),
      IT('Rappezzi intonaco perimetrale', 'corpo', 1, 350),
    ],
  },
  {
    name: 'Controparete Cartongesso', emoji: '🏗️', category: 'Strutture', sortOrder: 8,
    items: [
      IT('Controparete cartongesso doppia lastra con isolazione', 'm²', 25, 95),
      IT('Fornitura e posa primer aggrappante', 'm²', 25, 8.50),
      IT('Tinteggiatura nuova controparete', 'm²', 25, 12),
    ],
  },
  {
    name: 'Posa Parquet Laminato', emoji: '🪵', category: 'Pavimenti', sortOrder: 9,
    items: [
      IT('Rimozione pavimento esistente', 'm²', 40, 8),
      IT('Preparazione sottofondo', 'm²', 40, 12),
      IT('Fornitura laminato AC5 8mm a scelta cliente', 'm²', 40, 18),
      IT('Posa laminato flottante', 'm²', 40, 25),
      IT('Fornitura e posa battiscopa laminato', 'ml', 50, 9.51),
    ],
  },
  {
    name: 'Installazione Impianto Idraulico Bagno', emoji: '🔧', category: 'Idraulica', sortOrder: 10,
    items: [
      IT('Installazione completa bagno (manodopera idraulico)', 'corpo', 1, 1800),
      IT('Fornitura e montaggio WC sospeso + telaio Geberit', 'corpo', 1, 685),
      IT('Fornitura e montaggio lavabo + rubinetteria', 'corpo', 1, 400),
      IT('Fornitura e installazione doccia completa', 'corpo', 1, 1200),
      IT('Collaudo impianto idrico', 'corpo', 1, 180),
    ],
  },
  {
    name: 'SAL 1 — Avanzamento Lavori 30%', emoji: '📊', category: 'SAL', sortOrder: 11,
    items: [
      IT('Stato avanzamento lavori n° 1 (30% commessa)', 'corpo', 1, 0),
      IT('Demolizioni e preparazione cantiere', 'corpo', 1, 0),
      IT('Opere murarie fase 1', 'corpo', 1, 0),
      IT('Impianti rough-in', 'corpo', 1, 0),
    ],
  },
  {
    name: 'SAL 2 — Avanzamento Lavori 60%', emoji: '📊', category: 'SAL', sortOrder: 12,
    items: [
      IT('Stato avanzamento lavori n° 2 (60% commessa)', 'corpo', 1, 0),
      IT('Completamento opere murarie', 'corpo', 1, 0),
      IT('Posa pavimenti e rivestimenti', 'corpo', 1, 0),
      IT('Completamento impianti', 'corpo', 1, 0),
    ],
  },
  {
    name: 'SAL 3 — Saldo Finale', emoji: '✅', category: 'SAL', sortOrder: 13,
    items: [
      IT('Stato avanzamento lavori n° 3 — saldo finale', 'corpo', 1, 0),
      IT('Finiture e tinteggiatura', 'corpo', 1, 0),
      IT('Pulizia cantiere e consegna', 'corpo', 1, 0),
      IT('Collaudi e certificazioni', 'corpo', 1, 0),
    ],
  },
  {
    name: 'Fornitura Materiali Edili', emoji: '📦', category: 'Fornitura', sortOrder: 14,
    items: [
      IT('Fornitura materiali edili (dettaglio in allegato)', 'corpo', 1, 0),
      IT('Calcestruzzo pronto', 'm³', 0, 0),
      IT('Laterizi e blocchi', 'pz', 0, 0),
      IT('Trasporto e scarico materiali', 'corpo', 1, 180),
    ],
  },
  {
    name: 'Noleggio Attrezzature Cantiere', emoji: '🔨', category: 'Noleggio', sortOrder: 15,
    items: [
      IT('Noleggio ponteggio facciata (al mese)', 'm²', 0, 6.50),
      IT('Noleggio betoniera 140L (al giorno)', 'pz', 0, 55),
      IT('Noleggio compressore (al giorno)', 'pz', 0, 45),
      IT('Noleggio cassone smaltimento 7m³', 'pz', 1, 280),
    ],
  },
  {
    name: 'Consulenza e Direzione Lavori', emoji: '📋', category: 'Consulenza', sortOrder: 16,
    items: [
      IT('Sopralluogo e rilievi', 'h', 2, 90),
      IT('Progettazione e computo metrico', 'corpo', 1, 450),
      IT('Direzione lavori (per mese)', 'mese', 1, 680),
      IT('Coordinamento subappaltatori', 'h', 4, 90),
      IT('Documentazione finale e certificati', 'corpo', 1, 220),
    ],
  },
  {
    name: 'Smaltimento Rifiuti e Bonifica', emoji: '🗑️', category: 'Smaltimento', sortOrder: 17,
    items: [
      IT('Noleggio cassoni smaltimento (pz)', 'pz', 1, 280),
      IT('Smaltimento macerie miste (per cassone)', 'corpo', 1, 380),
      IT('Smaltimento materiali speciali', 'corpo', 1, 0),
      IT('Trasporto rifiuti in discarica', 'corpo', 1, 180),
    ],
  },
  {
    name: 'Cappotto Termico Esterno', emoji: '🏠', category: 'Isolamento', sortOrder: 18,
    items: [
      IT('Fornitura pannelli EPS 100mm', 'm²', 0, 10.50),
      IT('Fornitura malta adesiva e rasante', 'm²', 0, 8),
      IT('Fornitura rete armatura', 'm²', 0, 2.80),
      IT('Fornitura tasselli meccanici', 'pz', 0, 0.80),
      IT('Fornitura intonaco silossanico finale', 'm²', 0, 12),
      IT('Posa cappotto ETICS (manodopera)', 'm²', 0, 55),
    ],
  },
  {
    name: 'Manodopera Giornaliera', emoji: '👷', category: 'Manodopera', sortOrder: 19,
    items: [
      IT('Muratore qualificato (ore)', 'h', 8, 75),
      IT('Operaio specializzato (ore)', 'h', 8, 70),
      IT('Operaio generico (ore)', 'h', 8, 55),
      IT('Trasferta e spese viaggio', 'corpo', 1, 45),
    ],
  },
  {
    name: 'Acconto Lavori', emoji: '💰', category: 'Acconto', sortOrder: 20,
    items: [
      IT('Acconto su preventivo n° ___', 'corpo', 1, 0),
      IT('(Importo da concordare con il cliente)', 'corpo', 1, 0),
    ],
  },
]

async function main() {
  const now = new Date().toISOString()
  let inserted = 0
  for (const t of templates) {
    const id = uid()
    await client.execute({
      sql: `INSERT INTO quote_templates (id, name, description, category, emoji, sortOrder, templateType, itemsJson, isActive, createdAt, updatedAt)
            VALUES (?,?,?,?,?,?,'INVOICE',?,1,?,?)`,
      args: [id, t.name, null, t.category, t.emoji, t.sortOrder, JSON.stringify(t.items), now, now],
    })
    console.log(`  ✓ ${t.emoji} ${t.name} (${t.items.length} voci)`)
    inserted++
  }
  console.log(`\nInseriti: ${inserted} invoice templates`)
}
main().catch(console.error).finally(() => client.close())
