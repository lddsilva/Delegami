import { createClient } from '@libsql/client'
import { config } from 'dotenv'

config({ path: '.env.local' })

const client = createClient({
  url: process.env.DATABASE_URL,
  authToken: process.env.DATABASE_AUTH_TOKEN,
})

async function run() {
  const now = new Date().toISOString()
  const updates = [
    {
      label: 'quote attachments',
      sql: `
        UPDATE documents
        SET projectId = (
          SELECT projectId FROM quotes WHERE quotes.id = documents.quoteId
        )
        WHERE projectId IS NULL
          AND quoteId IS NOT NULL
          AND EXISTS (SELECT 1 FROM quotes WHERE quotes.id = documents.quoteId)
      `,
    },
    {
      label: 'invoice documents',
      sql: `
        UPDATE documents
        SET projectId = (
          SELECT projectId FROM invoices WHERE invoices.id = documents.invoiceId
        )
        WHERE projectId IS NULL
          AND invoiceId IS NOT NULL
          AND EXISTS (SELECT 1 FROM invoices WHERE invoices.id = documents.invoiceId)
      `,
    },
    {
      label: 'expense receipts',
      sql: `
        UPDATE documents
        SET projectId = (
          SELECT projectId FROM expenses WHERE expenses.id = documents.expenseId
        )
        WHERE projectId IS NULL
          AND expenseId IS NOT NULL
          AND EXISTS (SELECT 1 FROM expenses WHERE expenses.id = documents.expenseId AND expenses.projectId IS NOT NULL)
      `,
    },
  ]

  console.log(`Backfill document projects: ${now}`)
  for (const update of updates) {
    const result = await client.execute(update.sql)
    console.log(`${update.label}: ${result.rowsAffected ?? 0}`)
  }

  const denigris = await client.execute({
    sql: `
      SELECT d.id, d.name, d.projectId, p.name AS projectName
      FROM documents d
      LEFT JOIN projects p ON p.id = d.projectId
      WHERE d.name LIKE ?
    `,
    args: ['%Fattura_DeNigris_2026-001.docx.pdf%'],
  })
  for (const row of denigris.rows) {
    console.log(`check: ${row.name} -> ${row.projectName ?? 'senza opera'} (${row.projectId ?? 'null'})`)
  }
}

run()
  .catch((error) => {
    console.error(error)
    process.exitCode = 1
  })
  .finally(() => client.close())
