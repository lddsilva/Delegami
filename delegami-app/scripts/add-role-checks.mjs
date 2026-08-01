import fs from 'fs'

const AUTH_IMPORT = "import { getSession, canMutate } from '@/lib/auth'"
const FORM_CHECK = "\n  const session = await getSession()\n  if (!session || !canMutate(session.role)) return { message: 'Non autorizzato' }\n"
const VOID_CHECK = "\n  const session = await getSession()\n  if (!session || !canMutate(session.role)) return\n"

const FORM_FUNCS = new Set([
  'createClient','updateClient','createProject','updateProject',
  'createSupplier','updateSupplier','upsertSettings','createPriceItem','updatePriceItem',
  'createExpense','updateExpense','createInvoice','updateInvoice','createQuote','updateQuote'
])

const files = [
  { path: 'src/modules/clients/actions.ts', anchor: "import { prisma } from '@/lib/db'", fns: ['createClient','updateClient','deleteClient'] },
  { path: 'src/modules/projects/actions.ts', anchor: "import { prisma } from '@/lib/db'", fns: ['createProject','updateProject','deleteProject'] },
  { path: 'src/modules/suppliers/actions.ts', anchor: "import { prisma } from '@/lib/db'", fns: ['createSupplier','updateSupplier','deleteSupplier'] },
  { path: 'src/modules/settings/actions.ts', anchor: "import { prisma } from '@/lib/db'", fns: ['upsertSettings'] },
  { path: 'src/modules/price-catalog/actions.ts', anchor: "import { prisma } from '@/lib/db'", fns: ['createPriceItem','updatePriceItem','deletePriceItem','togglePriceItemActive'] },
  { path: 'src/modules/expenses/actions.ts', anchor: "import { ExpenseType, PaymentStatus } from '@/generated/prisma/enums'", fns: ['createExpense','updateExpense','deleteExpense'] },
  { path: 'src/modules/invoices/actions.ts', anchor: "import { InvoiceStatus } from '@/generated/prisma/enums'", fns: ['createInvoice','updateInvoice','deleteInvoice','markInvoicePaid','createInvoiceFromQuote'] },
  { path: 'src/modules/quotes/actions.ts', anchor: "import { QuoteType, QuoteStatus, ItemType } from '@/generated/prisma/enums'", fns: ['createQuote','updateQuote','deleteQuote','updateQuoteStatus'] },
]

// Build the regex without string escaping issues: use charCodeAt / fromCharCode approach
// We need [\s\S] in the regex. Build it as a character class from parts.
function makeFnRegex(fnName) {
  // Match: export async function fnName ... {
  // Using a proper multiline approach
  return new RegExp('(export async function ' + fnName + '[^]*?\\{)')
}

for (const cfg of files) {
  let content = fs.readFileSync(cfg.path, 'utf8')

  // Add import if not already there
  if (!content.includes(AUTH_IMPORT)) {
    content = content.replace(cfg.anchor, cfg.anchor + '\n' + AUTH_IMPORT)
    console.log(`  + import added to ${cfg.path}`)
  }

  // Add role check to each function
  for (const fn of cfg.fns) {
    const check = FORM_FUNCS.has(fn) ? FORM_CHECK : VOID_CHECK
    const re = makeFnRegex(fn)
    const match = content.match(re)
    if (match) {
      const afterBrace = content.indexOf(match[0]) + match[0].length
      const snippet = content.slice(afterBrace, afterBrace + 150)
      if (!snippet.includes('getSession')) {
        content = content.replace(match[0], match[0] + check)
        console.log(`  ✓ ${fn}`)
      } else {
        console.log(`  ~ ${fn} (already has check)`)
      }
    } else {
      console.log(`  ? ${fn} (not found)`)
    }
  }

  fs.writeFileSync(cfg.path, content, 'utf8')
  console.log(`✅ ${cfg.path}`)
}

// Also fix documents actions (already has session check but not canMutate)
const docPath = 'src/modules/documents/actions.ts'
let docContent = fs.readFileSync(docPath, 'utf8')
docContent = docContent.replace(
  "if (!session) return { error: 'Non autorizzato' }",
  "if (!session || !canMutate(session.role)) return { error: 'Non autorizzato' }"
)
fs.writeFileSync(docPath, docContent, 'utf8')
console.log('✅ documents/actions.ts (canMutate added)')

console.log('\nAll done!')
