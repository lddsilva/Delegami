import { createClient } from '@libsql/client'
import { del } from '@vercel/blob'
import { config } from 'dotenv'

config({ path: '.env.local' })

const client = createClient({
  url: process.env.DATABASE_URL,
  authToken: process.env.DATABASE_AUTH_TOKEN,
})

async function run() {
  const dryRun = process.argv.includes('--dry-run')
  console.log(`Cleanup orphan RECEIPT documents${dryRun ? ' (dry-run)' : ''}: ${new Date().toISOString()}`)

  const orphans = await client.execute(`
    SELECT id, name, filePath
    FROM documents
    WHERE documentType = 'RECEIPT' AND expenseId IS NULL
  `)

  if (orphans.rows.length === 0) {
    console.log('No orphan RECEIPT documents found.')
    return
  }

  const receiptUrls = await client.execute(`SELECT photoUrl FROM receipt_inbox`)
  const preservedBlobUrls = new Set(receiptUrls.rows.map((r) => r.photoUrl))

  let blobsDeleted = 0
  let blobsPreserved = 0
  let rowsDeleted = 0

  for (const row of orphans.rows) {
    const filePath = String(row.filePath)
    const id = String(row.id)
    const name = String(row.name ?? '')
    const preserved = preservedBlobUrls.has(filePath)
    const isVercelBlob = filePath.includes('blob.vercel-storage.com')

    if (preserved) {
      blobsPreserved++
      console.log(`preserve blob (still in receipt_inbox): ${name} [${id}]`)
    } else if (isVercelBlob) {
      if (!dryRun) {
        try {
          await del(filePath)
        } catch (err) {
          console.warn(`blob delete failed for ${id}: ${err instanceof Error ? err.message : String(err)}`)
        }
      }
      blobsDeleted++
      console.log(`delete blob: ${name} [${id}]`)
    } else {
      console.log(`non-vercel filePath, skip blob: ${name} [${id}]`)
    }

    if (!dryRun) {
      await client.execute({ sql: `DELETE FROM documents WHERE id = ?`, args: [id] })
    }
    rowsDeleted++
  }

  console.log('---')
  console.log(`orphans found:      ${orphans.rows.length}`)
  console.log(`document rows ${dryRun ? 'would delete' : 'deleted'}: ${rowsDeleted}`)
  console.log(`blobs ${dryRun ? 'would delete' : 'deleted'}:        ${blobsDeleted}`)
  console.log(`blobs preserved (linked to receipt_inbox): ${blobsPreserved}`)
}

run()
  .catch((error) => {
    console.error(error)
    process.exitCode = 1
  })
  .finally(() => client.close())
