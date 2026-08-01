import { createClient } from '@libsql/client'
import { config as loadEnv } from 'dotenv'

loadEnv({ path: '.env.local' })
loadEnv()

const url = process.env.DATABASE_URL
const authToken = process.env.DATABASE_AUTH_TOKEN

if (!url) { console.error('DATABASE_URL mancante'); process.exit(1) }

const client = createClient({ url, authToken })

const notes = `Direttore dei lavori: Marcos Zanetti Filho
Incaricato del lavoro: [da definire]
Responsabile sicurezza: [da definire]`

const result = await client.execute({
  sql: "UPDATE company_settings SET defaultQuoteNotes = ? WHERE id = (SELECT id FROM company_settings ORDER BY createdAt ASC LIMIT 1)",
  args: [notes],
})

if (result.rowsAffected === 0) {
  console.log('Nessun record company_settings trovato — niente aggiornato.')
} else {
  console.log('✓ defaultQuoteNotes aggiornato.')
}

await client.close()
