import { createClient } from '@libsql/client'
import { config as loadEnv } from 'dotenv'
import { readFileSync } from 'fs'
import { join } from 'path'

loadEnv({ path: '.env.local' })
loadEnv()

const url = process.env.DATABASE_URL
const authToken = process.env.DATABASE_AUTH_TOKEN

if (!url || url.startsWith('file:')) {
  console.log('⏭️  SQLite locale — migrazioni gestite da Prisma, skip.')
  process.exit(0)
}

const client = createClient({ url, authToken })

const migrationFiles = [
  '20260413151107_init/migration.sql',
  '20260413194127_add_price_catalog/migration.sql',
  '20260413202500_add_users/migration.sql',
  '20260413215654_add_document_type/migration.sql',
  '20260413231848_add_expense_currency_fields_and_settings/migration.sql',
  '20260414111509_add_invoice_payments/migration.sql',
  '20260414113707_expense_optional_project/migration.sql',
  '20260414164217_v2_quote_invoice_versioning_and_margins/migration.sql',
  '20260422201622_add_item_source_fields/migration.sql',
  '20260520000001_quote_version_history/migration.sql',
  '20260522000001_add_quote_item_direct_price/migration.sql',
  '20260522000002_invoice_version_history/migration.sql',
  '20260522000003_invoice_quote_version_unique/migration.sql',
  '20260522000004_project_payment_terms/migration.sql',
  '20260522000005_quote_payment_terms/migration.sql',
  '20260522000006_quote_item_hidden_from_client/migration.sql',
  '20260522000007_supplier_tags_website/migration.sql',
  '20260522000008_quote_templates/migration.sql',
  '20260522000009_price_item_links/migration.sql',
  '20260522000010_quote_template_type/migration.sql',
  '20260522000011_company_default_tax_rate/migration.sql',
  '20260522000012_item_type_header/migration.sql',
  '20260522000013_template_management/migration.sql',
  '20260522000014_price_item_quality_level/migration.sql',
  '20260522000015_partial_invoice_items/migration.sql',
  '20260523000001_quote_signatories_works_director/migration.sql',
  '20260523000002_company_default_quote_notes/migration.sql',
  '20260523000003_payment_receipt_url/migration.sql',
  '20260523000004_price_catalog_refinement/migration.sql',
  '20260524000001_operational_simplification/migration.sql',
  '20260524000002_invoice_billing_mode/migration.sql',
  '20260524000003_deactivate_seed_templates/migration.sql',
  '20260524000004_receipt_inbox/migration.sql',
  '20260524000005_activity_log/migration.sql',
  '20260525000001_receipt_import_batches/migration.sql',
  '20260526000001_activity_log_enrichment/migration.sql',
  '20260526000002_project_placeholder_and_receipt_suggested_project/migration.sql',
  '20260526000003_shopping_lists_and_project_schedule/migration.sql',
  '20260526000004_schedule_tasks/migration.sql',
  '20260527000001_custom_reports/migration.sql',
  '20260616000001_quote_show_client_notes/migration.sql',
  '20260721000001_work_logs/migration.sql',
  '20260721000002_worker_profile_payments/migration.sql',
  '20260721000003_worklog_approval_and_default_rate/migration.sql',
  '20260721000004_work_log_location/migration.sql',
  '20260722000001_worker_employment_and_worklog_revision/migration.sql',
  '20260722000002_worker_identity_number/migration.sql',
  '20260728000001_company_payment_qr/migration.sql',
  '20260731000001_drop_invoice_quote_version_unique/migration.sql',
]

async function run() {
  console.log('🔄  Aplicando migrations no Turso...\n')

  // Create tracking table if it doesn't exist — prevents re-running migrations on every deploy
  await client.execute(`
    CREATE TABLE IF NOT EXISTS _applied_migrations (
      name TEXT PRIMARY KEY,
      applied_at TEXT NOT NULL DEFAULT (datetime('now'))
    )
  `)

  // Fetch already-applied migrations
  const applied = await client.execute('SELECT name FROM _applied_migrations')
  const appliedSet = new Set(applied.rows.map((r) => r.name as string))

  for (const file of migrationFiles) {
    if (appliedSet.has(file)) {
      console.log(`⏭️   ${file} (já aplicada)`)
      continue
    }

    const sql = readFileSync(join(__dirname, 'migrations', file), 'utf-8')
    console.log(`📄  ${file}`)
    try {
      await client.executeMultiple(sql)
      await client.execute({ sql: 'INSERT INTO _applied_migrations (name) VALUES (?)', args: [file] })
      console.log('    ✓')
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e)
      if (msg.includes('already exists') || msg.includes('duplicate')) {
        // Mark as applied so it won't run again
        await client.execute({ sql: 'INSERT OR IGNORE INTO _applied_migrations (name) VALUES (?)', args: [file] })
        console.log('    ✓ (já existia — marcada como aplicada)')
      } else {
        console.error(`    ❌ ${msg}`)
      }
    }
  }

  console.log('\n✅  Migrations aplicadas!')
  await client.close()
}

run().catch(e => { console.error(e); process.exit(1) })
