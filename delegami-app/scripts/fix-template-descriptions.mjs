// Fix template descriptions to exactly match prezzario items (for dynamic pricing via resolveItems)
// These are global fixes (not quality-dependent) where template uses a slightly different name.
import { createClient } from '@libsql/client'
import { config } from 'dotenv'
config({ path: '.env.local' })

const c = createClient({ url: process.env.DATABASE_URL, authToken: process.env.DATABASE_AUTH_TOKEN })

// Maps: template description → exact prezzario description
// Quality-dependent items are handled separately in update-template-quality-items.mjs
const GLOBAL_FIX = {
  // Colla / posa
  'Colla C2 per piastrelle (sacco 25kg)':          'Colla per piastrelle C2 – sacco 25kg (Weber col 155)',
  'Colla C1 per piastrelle (sacco 25kg)':          'Colla per piastrelle C1 – sacco 25kg (Bauhaus)',
  'Colla per piastrelle C2 — sacco 25kg':          'Colla per piastrelle C2 – sacco 25kg (Weber col 155)',
  // WC accessori
  'Copriwater soft-close':                          'Copriwater soft-close universale – bianco',
  'Placca di comando Geberit Sigma20 bianco':       'Placca di comando WC Geberit Sigma20 – bianco',
  // Sanitari
  'Lavabo sospeso 55×46cm bianco':                  'Lavabo sospeso 55×46 – bianco',
  'Installazione completa bagno (manodopera idraulico)': 'Installazione completa bagno (WC+lavabo+bidet+doccia)',
  'Collaudo impianto idrico (prova pressione)':     'Collaudo impianto idrico (pressione + tenuta)',
  // Cartongesso
  'Lastra cartongesso BA13 250×120cm (fornitura)':  'Lastra cartongesso standard BA13 – 250×120cm (Knauf)',
  'Lastra cartongesso idrofugo BA13H verde (fornitura)': 'Lastra cartongesso idrofugo BA13H (verde) – 250×120cm',
  'Controparete singola lastra — manodopera':       'Controparete in cartongesso singola lastra – m² (mat + posa)',
  // Battiscopa
  'Battiscopa laminato 58mm':                       'Battiscopa laminato 58×18mm – rovere firenze (Bauhaus 31158811)',
  'Battiscopa laminato 58×18mm Rovere Firenze':     'Battiscopa laminato 58×18mm – rovere firenze (Bauhaus 31158811)',
  'Battiscopa laminato 58×18mm Rovere Firenze (Bauhaus 31158811)': 'Battiscopa laminato 58×18mm – rovere firenze (Bauhaus 31158811)',
  // Cucina mobili
  'Base cucina 60cm 2 ante IKEA METOD':             'Base cucina 60cm 2 ante – IKEA METOD bianco',
  'Base cucina 80cm IKEA METOD':                    'Base cucina 80cm 2 ante – IKEA METOD bianco',
  'Frontali cucina VOXTORP':                        'Frontale cucina 60×70 – IKEA Voxtorp bianco mat',
  // Cucina elettrodomestici
  'Cappa aspirante da incasso 60cm':                'Cappa aspirante da incasso 60cm – inox (Bosch)',
  'Frigorifero combinato da incasso 177cm':         'Frigorifero combinato da incasso 177cm – Bosch KIN86ADD0',
  'Lavastoviglie da incasso 60cm 14 coperti':       'Lavastoviglie da incasso 60cm 14 coperti – Bosch SMS4HCB48E',
  // Infissi
  'Finestra PVC triplo vetro 100×120cm — fornitura': 'Finestra PVC triplo vetro 100×120cm – media qualità',
  'Finestra PVC triplo vetro 80×120cm — fornitura':  'Finestra PVC triplo vetro 100×120cm – media qualità',
  'Davanzale in pietra artificiale 100cm':           'Davanzale in pietra artificiale 100cm – bianco',
  'Davanzale in pietra artificiale 80cm':            'Davanzale in pietra artificiale 100cm – bianco',
  // Muratura
  'Apertura nuova porta in muratura portante':       'Apertura porta in muratura portante – corpo',
  'Apertura nuova porta in parete non portante':     'Apertura porta in parete non portante – corpo',
  'Chiusura vano porta esistente — muratura e intonaco': 'Chiusura vano porta – muratura e intonaco',
  'Intonaco di finitura a grana fine (sacco 25kg)':  'Intonaco di finitura a grana fine – sacco 25kg',
  // Impianti
  'Interruttore semplice con placca Feller EDIZIOdue': 'Interruttore semplice con placca – Feller/Berker',
  'Sostituzione quadro elettrico (fino 24 moduli)':  'Sostituzione quadro elettrico 24 moduli + DIN rail',
  'Allacciamento gas piano cottura (se presente)':   'Allacciamento gas piano cottura (manodopera + collaudo)',
  'Allacciamento elettrico elettrodomestici (manodopera)': 'Allacciamento elettrico piano cottura induzione (manodopera)',
  // Gres: fix em-dash vs en-dash (— vs –)
  'Gres 60×60 Active Beige — fornitura (Bauhaus 31365295)': 'Gres 60×60 – Active Beige (Bauhaus 31365295)',
  // Pavimenti collanti
  'Massetto autolivellante fino 10mm':              'Massetto autolivellante fino 10mm – sacco 25kg',
  'Alimentatore strip LED 24V':                     'Alimentatore strip LED 24V 60W – da incasso',
  'Strip LED sottopensile cucina':                  'Strip LED 5m 24V 4000K – SMD 2835 60LED/m',
}

async function run() {
  const rows = await c.execute("SELECT id, name, qualityLevel, itemsJson FROM quote_templates WHERE templateType='QUOTE'")
  let totalFixed = 0, templatesFixed = 0

  for (const row of rows.rows) {
    const items = JSON.parse(String(row.itemsJson))
    let changed = 0

    const newItems = items.map(item => {
      if (item.itemType !== 'ITEM') return item
      const fix = GLOBAL_FIX[item.description]
      if (!fix) return item
      changed++
      return { ...item, description: fix }
    })

    if (changed === 0) continue

    await c.execute({
      sql: 'UPDATE quote_templates SET itemsJson = ?, updatedAt = ? WHERE id = ?',
      args: [JSON.stringify(newItems), new Date().toISOString(), row.id]
    })
    console.log(`✓ [${String(row.qualityLevel).padEnd(6)}] ${row.name} — ${changed} fix`)
    totalFixed += changed
    templatesFixed++
  }

  console.log(`\nTemplate aggiornati: ${templatesFixed} | Fix totali: ${totalFixed}`)
  c.close()
}

run().catch(e => { console.error(e); c.close() })
