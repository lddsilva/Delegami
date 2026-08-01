import { createClient } from '@libsql/client'

const url = process.env.DATABASE_URL
const authToken = process.env.DATABASE_AUTH_TOKEN

if (!url) { console.error('❌  DATABASE_URL não definida'); process.exit(1) }

const client = createClient({ url, authToken })

async function run() {
  console.log('🔄  Adicionando coluna documentType...')

  try {
    await client.execute(`ALTER TABLE documents ADD COLUMN "documentType" TEXT NOT NULL DEFAULT 'ATTACHMENT'`)
    console.log('✅  Coluna documentType adicionada com sucesso!')
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e)
    if (msg.toLowerCase().includes('duplicate') || msg.toLowerCase().includes('already exists')) {
      console.log('✓  Coluna já existia — OK')
    } else {
      console.error('❌', msg)
    }
  }

  await client.close()
}

run().catch(e => { console.error(e); process.exit(1) })
