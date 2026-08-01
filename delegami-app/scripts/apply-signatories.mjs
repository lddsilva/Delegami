import { createClient } from '@libsql/client'

const client = createClient({
  url: 'libsql://zanetti-office-lddsilva.aws-eu-west-1.turso.io',
  authToken: 'eyJhbGciOiJFZERTQSIsInR5cCI6IkpXVCJ9.eyJhIjoicnciLCJpYXQiOjE3NzYxMTI5MTYsImlkIjoiMDE5ZDg4OTMtNzkwMS03Nzk4LWJkMDgtZWYxZmEyOTQ3OWYzIiwicmlkIjoiMWRkNzZkZTYtMDE0Ny00NWE2LWJjOTUtZWE4NmY5OWE5OTYzIn0.jBk6mu40unMp57tC9t751uiwsh-I9yPUNLvH3Q_IL8jDU9i9stlMi4EcKecXes0hM9fkJZFfomvcFTxYMqBzAQ'
})

// Apply migration
console.log('Applying migration...')
try {
  await client.execute('ALTER TABLE company_settings ADD COLUMN worksDirector TEXT')
  console.log('  ✓ company_settings.worksDirector')
} catch (e) {
  if (e.message?.includes('duplicate') || e.message?.includes('already exists')) {
    console.log('  ✓ company_settings.worksDirector (already exists)')
  } else throw e
}

try {
  await client.execute('ALTER TABLE quotes ADD COLUMN signatories TEXT')
  console.log('  ✓ quotes.signatories')
} catch (e) {
  if (e.message?.includes('duplicate') || e.message?.includes('already exists')) {
    console.log('  ✓ quotes.signatories (already exists)')
  } else throw e
}

// Set worksDirector in company_settings
const cs = await client.execute('SELECT id FROM company_settings LIMIT 1')
if (cs.rows.length > 0) {
  await client.execute({
    sql: 'UPDATE company_settings SET worksDirector = ? WHERE id = ?',
    args: ['Marcos Zanetti Filho', cs.rows[0].id]
  })
  console.log('  ✓ worksDirector = "Marcos Zanetti Filho"')
}

// Set signatories on PRE-2026-013 (latest version = id cmobzgzsh0003y0ukbly36k3q)
await client.execute({
  sql: "UPDATE quotes SET signatories = ? WHERE quoteNumber = 'PRE-2026-013' AND version = 8",
  args: ['Dr. Franco Martini\nMuriel Martini']
})
console.log('  ✓ PRE-2026-013 signatories = "Dr. Franco Martini / Muriel Martini"')

// Verify
const check = await client.execute("SELECT quoteNumber, version, signatories FROM quotes WHERE quoteNumber = 'PRE-2026-013' AND version = 8")
console.log('\nVerifica:', JSON.stringify(check.rows[0]))

await client.close()
console.log('\nDone.')
