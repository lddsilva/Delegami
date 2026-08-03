# CLAUDE.md

## App: Delegami

Gestione cantieri e preventivi per **the client firm** (the client Delegami Filho, <città> TI).
App usata per creare preventivi, fatture, gestire spese, fornitori e prezzario.

---

## Objective

Smallest safe change. Working code over architecture. No alternatives — one solution.

---

## Stack

* Next.js 16 App Router · TypeScript · Tailwind CSS 4
* Prisma 7 — SQLite local / **Turso** (`libsql://<your-database>.turso.io`)
* Server Components (reads) · Server Actions (mutations) · No API routes for CRUD
* Vercel project: **delegami** at `delegami-omega.vercel.app`
* Auth: HMAC-SHA256 signed cookie (`zs_session`), no middleware file — uses `src/proxy.ts` (Next 16)

---

## Language

* Code → English · Client docs → Italian · Internal comms → Portuguese
* Currency: CHF default · VAT: 8.1% · Also supports EUR (expense currency with auto-conversion)

---

## Architecture

```
src/app        → routes / pages (thin — no business logic)
src/components → UI (client components)
src/modules    → queries + actions (server-only)
src/lib        → shared utilities (auth, utils, numbering)
src/generated  → Prisma client (never edit manually)
```

* Reads → `modules/*/queries.ts`
* Mutations → `modules/*/actions.ts` (Server Actions, `'use server'`)
* Do NOT create API routes · Do NOT add fetch layers

---

## Auth & Roles

```ts
const session = await getSession()   // re-validates user.active in DB every request
if (!session || !canMutate(session.role)) return { message: 'Non autorizzato' }
// delete: canDelete(session.role)
```
- `canMutate`: ADMIN + MANAGER — **MANAGER cannot delete anything**
- `canDelete`: ADMIN only
- VIEWER: read-only, no mutations
- `WORKER`: operaio account — restricted to `/rapportino` only. `layout.tsx` redirects any other route back there (and the login action redirects straight to `/rapportino` on this role, instead of `/`, to avoid a double-redirect). Sidebar for WORKER shows only "Il mio rapportino" + logout. See **Rapportino** section below.

---

## Prisma

* Import ONLY from `@/generated/prisma/...` — NEVER `@prisma/client`
* Schema changes: update schema → create migration SQL → add to `migrate-turso.ts` → `prisma generate`
* **Raw SQL uses lowercase table names** — LibSQL is case-sensitive (`quotes`, not `Quote`)
* Migrations auto-apply on Vercel build via `postinstall` → `tsx prisma/migrate-turso.ts`
* Current migrations: 000001–000015 + 20260523000001–000004 + 20260524000001–000005 + 20260525000001 + 20260526000001–000004 + 20260527000001 + 20260616000001 + 20260721000001–000004 (rapportino: work_logs, worker_payments/documents, approval workflow + default rate, work log location) + 20260722000001 (worker employment model DIRECT/AGENCY + agency cost rate + minimal contract fields; WorkLog cost-rate snapshot + revision-request flow) + 20260722000002 (worker identityNumber — printed on the agency hours report) (see `prisma/migrations/`)
* **`_applied_migrations` table** tracks which migrations have already run on Turso — prevents re-execution on every deploy. NEVER skip adding a migration to this tracking: always add to the list in `migrate-turso.ts` AND ensure it's recorded in `_applied_migrations` when first applied.
* **CRITICAL — Prisma SQLite table-rebuild migrations**: when Prisma generates a migration that drops+recreates a table (e.g. to add a column), the `INSERT INTO new_X SELECT ... FROM X` statement may omit existing columns — causing data loss on re-run. The `_applied_migrations` guard prevents this. Do NOT remove it.

---

## AI Chat — Direct DB Access (no UI/API needed)

The app has **no API routes**, and every Server Action requires a browser session cookie (`getSession()` reads `next/headers`). That means Server Actions in `modules/*/actions.ts` **cannot be invoked directly from a standalone script** — there's no request context outside a running Next.js server, and there's no login endpoint to curl.

To read or write data directly from a chat session (bypassing the UI), the established pattern already used throughout `scripts/`:

* **Credentials**: `.env.local` (gitignored, never committed) holds `DATABASE_URL` + `DATABASE_AUTH_TOKEN` (Turso/libsql) and `BLOB_READ_WRITE_TOKEN` (Vercel Blob). **This is the live production database — there is no separate staging DB.** `node scripts/read-company-settings.mjs` is a quick connectivity check.
* **How to write a script**: use `@libsql/client` for raw SQL (simplest for reads/small writes) or `PrismaClient` from `@/generated/prisma/client` for typed writes. Load credentials from `.env.local` via `dotenv/config` — do **not** hardcode the token inside the script file. (Several older scripts in this repo do hardcode it and are already committed to git — that's tech debt, not a pattern to copy. If asked to touch one of those files, prefer switching it to `dotenv` over leaving another hardcoded token behind.)
* **Prisma 7 generated client is TS source, not compiled JS** — `src/generated/prisma/client.ts` must be run through `tsx`, not plain `node`. Two gotchas when importing it from a standalone script:
  1. Run scripts with `npx tsx scripts/foo.mjs` (not `node scripts/foo.mjs`) whenever the script uses Prisma directly.
  2. `import prismaClientModule from '../src/generated/prisma/client.ts'` (**default** import) then `const { PrismaClient } = prismaClientModule` — a named `import { PrismaClient } from '...'` silently resolves to only a `default` export under tsx's CJS/ESM interop and errors with "does not provide an export named 'PrismaClient'".
  3. No default DB connection — must pass an adapter explicitly, same as `src/lib/db.ts`: `new PrismaClient({ adapter: new PrismaLibSql({ url: process.env.DATABASE_URL, authToken: process.env.DATABASE_AUTH_TOKEN }) })` (`import { PrismaLibSql } from '@prisma/adapter-libsql'`).
  4. If `node_modules`/generated client aren't present yet in a fresh session: `npm install` then `npx prisma generate` before running any script that imports the Prisma client.
* **Mirror the real business rules — don't reinvent them**: before writing to a table, read the matching `src/modules/<x>/actions.ts` first and replicate what it does (Zod validation, defaults from `CompanySettings`, `logActivity()`, etc.). Quote/invoice numbers MUST be issued via `reserveNextDocumentNumber()` (`src/lib/numbering.ts`) inside a `prisma.$transaction` — never invent a number by hand.
* **Reference scripts already in the repo**: `scripts/seed-denigris.mjs` / `scripts/import-preventivo.js` / `scripts/create-v8.js` (client + quote creation, incl. numbering), `scripts/read-quote.mjs` / `scripts/read-company-settings.mjs` (reads). More recent, fuller examples using the Prisma-client pattern above (project + quote + invoice creation in one transaction, with `activityLog.createMany`): `scripts/create-saigon-tofu.mjs`, `scripts/create-balestra-2piano.mjs`, `scripts/create-angelo.mjs` (worker account + work logs).
* **After creating a migration in a chat session**: run `npx prisma generate && npx tsx prisma/migrate-turso.ts` immediately — this applies it to the live Turso DB right away (not just on next Vercel deploy), so a script in the same session can use the new columns/tables right after.
* **Safety**: this hits real business data (see "Production Data — DO NOT DELETE" below). Before creating a record, check for an existing one first (e.g. search `clients` by name) to avoid duplicates, and confirm with the user before running any write script.
* **Deploy**: Vercel CLI is installed and authenticated locally (`vercel --version` works); Vercel project `delegami` auto-deploys `main` from GitHub (`lddsilva/delegami-app`, private repo). A direct DB write via script needs no deploy — it hits the same Turso DB the live app reads from immediately.

---

## Key Models (Prisma schema)

| Model | Table | Notes |
|---|---|---|
| Client | clients | Has address, city, postalCode |
| Project | projects | Has `paymentTerms`, `referenceCode` (unique), `isPlaceholder` (true only for the "Da classificare" sentinel) |
| Quote | quotes | `quoteNumber+version` unique; `hiddenFromClient` on items; `paymentTerms` |
| QuoteItem | quote_items | `directPrice`, `hiddenFromClient`, `sourceNote`, `sourceUrl` |
| Invoice | invoices | `invoiceNumber+version` unique; `quoteId` links to quote; multiple invoices per quote allowed |
| InvoiceItem | invoice_items | Optional `quoteItemId` tracks partial invoicing from quote lines |
| InvoicePayment | invoice_payments | Partial payments; `receiptUrl` (Vercel Blob) for payment comprovante/receipt |
| Expense | expenses | `projectId` nullable; `amountChf` for EUR→CHF; `isItalianPurchase` flag; `exchangeRateUpdatedAt` stores rate snapshot date |
| Supplier | suppliers | `tags` (comma-separated), `website`, `category`; tags shown as chips in supplier detail; category/tags are now controlled lists |
| PriceItem | price_items | `category` = "Parent – Sub" format (closed list — 44 subcats); `links` (newline-separated URLs); `productTier` = ESSENTIAL\|STANDARD\|PREMIUM or null for services; `qualityLevel` is legacy; `code` is auto-generated per category prefix |
| PriceSource | price_sources | Auditable price references per `priceItemId`: supplier, URL, observed price, confidence, source type |
| QuoteTemplate | quote_templates | `templateType` = QUOTE\|INVOICE; `scopeLevel`, `templateGroupKey`, `itemsJson`; dynamic pricing from prezzario; seeded templates deactivated — new ones created from real quotes only |
| Invoice | invoices | `billingMode` = ITEMS\|PERCENTAGE\|MANUAL; `billingPercent`, `quoteBaseTotal` — tracks how a quote was consumed |
| Document | documents | Polymorphic (projectId, quoteId, invoiceId, expenseId) |
| CompanySettings | company_settings | Singleton; `paymentTerms`, `iban`, `defaultMargin`, `worksDirector`, `defaultQuoteNotes`, `defaultQuoteValidityDays` (default 30), `defaultInvoiceDueDays` (default 5), `eurChfRate` (default 0.9119), `eurChfRateUpdatedAt`, `defaultWorkerHourlyRate` (default 25, pre-fills new WORKER accounts) |
| ReceiptInbox | receipt_inbox | Quick photo capture of scontrini in the field; `suggestedProjectId` set at upload time pre-fills the processing form; processed later into expenses via `/receipts/[id]/process` |
| ReceiptImportBatch / ReceiptImportItem | receipt_import_batches / receipt_import_items | ZIP import history for externally analyzed scontrini; creates expenses + receipt documents + archived receipt inbox rows |
| ActivityLog | activity_logs | Audit trail of every mutation; `action`, `entityType`, `entityId`, `entityLabel`, `userId`, `userName`, `details` (JSON string), `ipAddress`, `userAgent` (browser·OS), `path`, `success`, `errorMessage`, `durationMs`, `createdAt` |
| User | users | `role` incl. `WORKER`; `phone`, `address`, `hourlyRate` (worker's agreed wage/h, snapshotted onto new WorkLogs), `notes`; `employmentType` DIRECT\|AGENCY, `agencySupplierId` (plain FK to the staffing agency Supplier), `costRate` (agency's hourly bill rate — snapshotted onto WorkLog), `contractStart`, `contractType`, `identityNumber` (ID/permit/agency matricola — printed on the hours report) — worker fields, mainly for operai |
| WorkLog | work_logs | Rapportino giornaliero: `userId`+`userName`, `projectId?` (opera, admin-only to set), `workDate`, `hours`, `hourlyRate` (worker earn) + `costRate` (agency company cost) + `amountOverride` (all snapshot at creation), `location` (free-text workplace), `description`, `status` DRAFT\|SUBMITTED\|APPROVED, `submittedAt`, `approvedAt`, `revisionRequestedAt`/`revisionReason` (worker asks to edit a locked log), `createdById`/`createdByName` (worker or admin registering on their behalf) |
| WorkLogPhoto | work_log_photos | Photos attached to a WorkLog (Vercel Blob) |
| WorkerPayment | worker_payments | Compenso pagato to a worker; `amount`, `paidAt`, `method`, `receiptUrl` (Blob, image or PDF) |
| WorkerDocument | worker_documents | Worker's own documents (contratto, ID, permesso, foto, altro); `category`, `url` (Blob) |

---

## Business Rules

* Margin/cost NEVER in client PDFs — only `?variant=internal`
* `sourceUrl`/`sourceNote`/`hiddenFromClient` on QuoteItem — internal, never in client PDF
* `hiddenFromClient=true` items excluded from `subtotalClient` and client PDF entirely
* Quotes lock after SENT/APPROVED — clone to create new version; approved quote can generate partial invoices by selected line items
* **New version of quote** is only allowed when quote is in APPROVED or REJECTED status; not allowed while SENT without a decision
* Invoice auto-PAID when fully paid via `addInvoicePayment()` — returns `{ paymentId }` so caller can upload receipt
* Receipt upload: `uploadPaymentReceipt(paymentId, invoiceId, formData)` in `modules/documents/actions.ts` → stores in Vercel Blob at `invoices/{id}/payments/` → updates `InvoicePayment.receiptUrl`
* `InvoicePaymentList` component handles receipt upload at creation time and retroactively per payment row
* `reserveNextDocumentNumber()` always called inside transaction
* `getSession()` re-validates `user.active` in DB on every request
* Expenses: `projectId` nullable; totals use `expenseAmountChf(e)` = `amountChf ?? amount`
* Uploads: Vercel Blob · types: PHOTO, ATTACHMENT, RECEIPT, LEGAL, PERMIT, CONTRACT, TECHNICAL
* Media archive: `/media` has "Archivio normativo & aziendale" for laws, licenses, permits, contracts and technical documents
* Document uploads linked to quotes/invoices/expenses must backfill/store `projectId` so media grouping never falls into "Senza opera" when an entity has a project
* **Invoice versioning removed from UI** — invoices are unique and immutable once sent/paid; no clone/version flow in UI
* **Invoice billing mode locked after first invoice**: if a quote's first invoice uses ITEMS mode, all subsequent invoices for that quote must use ITEMS; if PERCENTAGE, all must use PERCENTAGE. This prevents double-billing.
* **Preventivo collegato filter**: when creating an invoice from a project, only quotes belonging to that project are selectable — validated both in UI and on the server
* **`defaultQuoteNotes`** in CompanySettings is pre-loaded into `clientNotes` when creating a new quote — includes Direttore dei lavori / Incaricato del lavoro / Responsabile sicurezza block
* **Quote `tipo` (PRELIMINARY/DETAILED) removed** from UI — all new quotes default to DETAILED internally; field kept in DB for compatibility
* **Quote PDF variants**: `?variant=client` (default), `?variant=internal` only — Banca variant removed

---

## Quote Items — Types

| ItemType | Visual | Purpose |
|---|---|---|
| HEADER | 🔵 Dark blue, bold white text, ▶ icon | Scope title (template name, overall work description) — visually distinct from sections |
| SECTION | ⬜ Slate background, § prefix | Work phase grouping (Demolizione, Sanitari, etc.) |
| ITEM | White row | Billable line item with qty, cost, price |
| NOTE | 🟡 Amber background, 📝 | Internal annotation, never in client PDF |
| SUBTOTAL | ─ | Auto-injected between sections |

## Quote Items — Units

`m²`, `m³`, `ml`, `h`, `pz`, `kg`, `t`, `l`, `set`, `corpo`

* **corpo** = global task price (no unit of measure) — for labor, subcontracts
* **pz** = individual product · **ml** = linear meter

---

## Prezzario

* **496 items** across 44 subcategories in format **"Parent – Sub"**
* Parents: Bagno · Cucina · Pavimenti · Strutture · Finiture · Impianti · Manodopera · Logistica · Utensili · Varie
* `links` field: newline-separated product URLs — **empty for Manodopera** (no product links)
* `productTier`: `ESSENTIAL` · `STANDARD` · `PREMIUM`; null = service/manodopera/logistica without material tier
  * `qualityLevel` remains only as legacy/backward compatibility (`LOW/MEDIUM/HIGH/STANDARD`)
  * Material tier does **not** mean template complexity. A light job can still use premium materials.
  * Each product-family subcategory may have multiple tier options when materially useful; it is not mandatory for every item.
* `price_sources`: one or more auditable references per item (`PRODUCT_URL`, `CATEGORY_URL`, `SUPPLIER_QUOTE`, `RECEIPT`, `ESTIMATE`, `INDEX`, `LEGACY_PRICE`)
  * Prices sourced from Hornbach.ch (retail CHF, IVA inclusa) — Edilgroup B2B ~15-25% below
* When inserting from catalog into quote: `sourceNote` and first `links` URL are copied automatically
* CatalogBrowser: 2-level filter (Parent → Sub) + tier filter (Essenziale/Standard/Premium/Servizio) + link icon ↗ per product verification
* **Category is now a closed list** — defined in `src/lib/price-catalog-taxonomy.ts` (44 subcategories). "Generale" is legacy; maps to `Varie – Generale` via `LEGACY_PRICE_CATEGORY_ALIASES`.
* **`code` is auto-generated** from category prefix (e.g. `BAG-WC-001`, `PAV-GRE-003`). Format: `{PREFIX}-{NNN}` using `PRICE_CATEGORY_PREFIX` map in `price-catalog-taxonomy.ts`. Never set manually.
* **Saving item from quote editor to prezzario** opens a mini-modal to select correct category — never falls to `Generale` automatically.
* `inferPriceCategoryFromText()` helper guesses category from description keywords — used as default suggestion in the save-to-catalog modal.
* Scripts: `scripts/apply-prezzario-updates.mjs` · `scripts/prezzario-update.json` (cowork research file)
* Document cleanup script: `node scripts/backfill-document-projects.mjs` backfills `documents.projectId` from quote/invoice/expense relations.

---

## Templates (QuoteTemplate)

* Management UI: `/settings/templates` (grouped by category, archived collapsed)
* **Two creation paths**, both via the "Crea template" menu on `/settings/templates`:
  * **From an existing quote** → opens a searchable picker → redirects to `/quotes/[id]/template` (section picker → form). Also still reachable via the "Crea template" button on the quote detail page.
  * **From scratch** → `/settings/templates/new`, opens the template form with no items; user fills name/category/emoji/items manually.
* Picker data: `getQuotesForTemplatePicker()` returns id/number/version/project/client/updatedAt for all quotes; client-side filter on the modal.
* Section picker (from a quote): `QuoteSectionTemplateBuilder` at `src/components/quote-templates/quote-section-template-builder.tsx`
  * Shows all HEADER/SECTION blocks with checkboxes; template name auto-built as `{project name} - {Section A} / {Section B}`
  * Layout: vertical stack by default; sidebar becomes sticky at `2xl` only. Editor wrapper has `min-w-0 overflow-x-auto` to keep row icons from escaping at xl.
  * When creating from a quote (`isQuoteDerivedCreate`): Categoria is hidden (auto-inferred via `inferCategory()`), Sottocategoria is hidden, scopeLevel is hidden, isActive is hidden (forced active)
  * When editing or creating from scratch: Categoria, Sottocategoria (optional) and Icona are visible and editable
* **Emoji is selectable** via `EmojiPicker` (24 preset icons) on both create and edit forms; defaults to `📋`.
* **Sottocategoria is a free-text optional field** — used to group variants of the same template; shown as a Badge in the manager.
* `templateType = 'QUOTE'` for new templates created from `/settings/templates`; INVOICE templates only via "Salva come template" button when creating an invoice
* **All previously seeded templates deactivated** (migration `20260524000003_deactivate_seed_templates`) — `sourceQuoteId IS NULL` → `isActive = 0`
* Templates use **dynamic pricing**: `getActiveTemplates(marginPercent, type)` resolves prices from current prezzario (description exact match, case-insensitive)
* Notes/links from prezzario are also copied to template items on load
* Each quote template insertion prepends a `HEADER` row (dark blue title) with template name
* Template insertion uses compact preview before opening the quote editor
* Quote list `/quotes` is ordered by `updatedAt desc`; the visible date column is "Modificato"
* Quote list and project detail show one row per quote family (`quoteNumber`) with the highest `version` as the current row, plus historical versions as indented sub-rows. Dashboard quote status counts and "approved without invoice" alerts count only current family versions, not historical rejected/approved versions.
* **Delete template**: ADMIN-only via `deleteTemplate(id)` action; Trash icon in the manager actions column. MANAGER can only `toggleTemplateActive` (archive).
* **Source quote 404 handling**: `getTemplateManagerRows()` checks each `sourceQuoteId` against the `quotes` table; templates with a deleted source render the file icon disabled and an "X" button that calls `clearTemplateSourceQuote(id)` to null the reference.
* **Scope labels for templates** (legacy, reflect renovation complexity, NOT material quality):
  * `LIGHT` → "Leggero" · `STANDARD` → "Standard" · `COMPLETE` → "Completo" · `SERVICE` → "Servizio"
  * The Leggero/Completo "create variant" buttons and `createTemplateVariant` action were removed — fixed price-scaling factors (0.85x/1.25x) didn't reflect real material/scope changes.
* Scripts (legacy, kept for reference):
  * `scripts/seed-template-quality-variants.mjs` — legacy seeder
  * `scripts/update-template-quality-items.mjs` — legacy material description remapper
  * `scripts/fix-template-descriptions.mjs` — corrects small desc template↔prezzario mismatches

---

## Invoices — Partial Flow

* Primary workflow: approved quote → `/quotes/[id]/invoice` → choose billing mode → create invoice
* **Two billing modes** (locked to the first invoice created for that quote):
  * `ITEMS` — select individual quote items/quantities; tracks remaining per line via `invoice_items.quoteItemId`
  * `PERCENTAGE` — enter a percentage (e.g. 30%); creates a single invoice line: `"Acconto 30% su preventivo PRE-XXXX vN - {project name}"`. `billingPercent` + `quoteBaseTotal` stored on the invoice.
  * `MANUAL` — legacy/fallback for invoices created without a mode; same as ITEMS for UI purposes
* **Mode locked**: once a quote has one invoice in ITEMS or PERCENTAGE mode, all subsequent invoices for that quote must use the same mode — UI and server action both enforce this
* The quote detail page shows a **"Fatture collegate"** block with linked invoice numbers, statuses, totals and % faturato
* `invoice_items.quoteItemId` stores the originating quote line; this powers "already invoiced" vs "remaining" quantities.
* Multiple invoices can reference the same quote. The old unique constraint `quoteId+version` was removed in migration `20260522000015_partial_invoice_items`.
* Quote status becomes `INVOICED` only when all visible quote ITEM rows are fully invoiced; otherwise it remains/returns `APPROVED`.
* Deleting an invoice recomputes the quote status from remaining linked invoice items.
* **New quote version carries forward existing invoices**: both `cloneQuote()` and `importQuoteUpdateFromJson()`'s `new-version` mode relink any non-cancelled invoices from the superseded version to the new one (`Invoice.quoteId` updated inside the same transaction). Without this, an approved quote that already has a partially-paid invoice would silently "lose" that invoice's tracking on the new version — the new version's "Fatture collegate" card and remaining-balance math would start from zero even though the client already paid something for the same underlying work. Only the invoice directly on the version being cloned FROM is relinked, not the whole version chain.
* `/invoices/new` remains for manual invoices not linked to any quote.
* **Invoice versioning (clone/new version) has been removed** from the UI. Invoices are immutable once sent/paid.
* `dueDate` is auto-filled = `issueDate + defaultInvoiceDueDays` (from CompanySettings, default 5 days).
* **Preventivo collegato** is filtered to only show quotes belonging to the same project selected at the top of the invoice form — validated on server too.
* Invoice PDF: `intestatario` appears only in coordinate bancarie section — removed duplication in condizioni di pagamento.

---

## PDF Print Rules

* `src/proxy.ts` (not middleware.ts — Next 16) handles auth redirect
* Invoice: `@page { margin: 10mm 14mm }` + `.inv-doc { padding: 0 }` in print — no double margin
* Quote: `@page { margin: 15mm 20mm }` — same approach
* User must disable "Headers and footers" in print dialog to avoid browser URL header
* `hiddenFromClient` items absent from client PDF; shown with [NASCOSTO] badge in internal PDF
* Quote PDF signature block: shows only the acceptance signature lines — NO "Direttore dei lavori" card (removed). Signatory names come from `quote.signatories` field or default to client name.
* `defaultQuoteNotes` in CompanySettings pre-fills `clientNotes` on new quote creation; editable per-quote. Currently set to: Direttore dei lavori / Incaricato del lavoro / Responsabile sicurezza lines.
* Invoice PDF: zero clickable links — project address is a `<span>`, not `<a>`
* Invoice PDF: `intestatario` only in coordinate bancarie — not repeated in condizioni di pagamento
* **Quote PDF footer**: quote number and version (e.g. `PRE-2026-013 v8`) appear once at the end of the document (same pattern as the invoice PDF) — NOT repeated as a running per-page footer. A `position: fixed` running footer was tried twice (see git history) and both times caused the footer to overlap page content on multi-page quotes (a known CSS Paged Media quirk with `position: fixed` + `@page` margins); removed for good, don't reintroduce without solving the overlap for real multi-page content first. Last page (signatures + notes + payment terms) is designed to fit on a single page
* **Quote PDF layout toggle** (`?layout=auto|compatto|esteso`, toolbar buttons on `/quotes/[id]/preview`):
  * `esteso` — legacy layout: section summary, item detail and signature each forced onto their own page (`.page-break-before`, `.quote-final-page`).
  * `compatto` — drops the "Riepilogo per sezione" summary + forced page breaks; totals render after the item table. Plus **auto vertical-fit**: `QuoteAutoFit` (`src/components/quotes/quote-auto-fit.tsx`) measures the document and steps a CSS var `--vspace` (1 → 0.5) down only as needed to fit one A4 page. It scales **vertical whitespace only** — never font size, never the signature line height (the floor that guarantees room to sign). If even the floor overflows, content flows onto extra pages naturally.
  * `auto` (default) — picks `compatto` when the quote has ≤ 12 ITEM rows, else `esteso`.
  * **Anti-cut**: `.quote-final-card` and `.quote-signature-block` use `break-inside: avoid` so a card or the signature never splits across pages, in any mode.
* **Quote PDF "Note e condizioni" toggle**: persisted per quote via `Quote.showClientNotes` (default true). Toolbar button `QuoteNotesToggle` (`src/components/quotes/quote-notes-toggle.tsx`) → `setQuoteShowClientNotes(quoteId, show)` action. Empty/whitespace cards never print (all final cards gated on `?.trim()`).

---

## Scontrini (Receipt Inbox)

* **Purpose**: quick photo capture of scontrini in the field; processed into expenses later.
* **Flow**: photo captured on mobile → saved in `receipt_inbox` table with `capturedAt` (date + hour + minute) → later opened in `/receipts/[id]/process` → expense created + photo attached as RECEIPT document + `processedAt` set → receipt archived.
* **Multi-upload**: the upload modal (`ReceiptUploadModal`) allows selecting multiple photos at once. Each photo gets its own optional note field shown as a thumbnail review before saving.
* **Project picker at upload time**: the upload modal also takes a `projects` prop. A global "Opera per tutte le foto" selector appears at the top (default empty = "Da classificare"); each thumbnail has an inline override `<select>` underneath. The chosen project is stored on `receipt_inbox.suggestedProjectId` per photo and pre-fills the Opera field on `/receipts/[id]/process`.
* **"Da classificare" sentinel project**: lazy-created via `ensurePlaceholderProject()` in `src/lib/placeholder-project.ts` — attached to an "Interno" client, marked `isPlaceholder=true`. Used as fallback when `processReceiptAsExpense` runs without a chosen project. `assignProjectToReceipts(ids, projectId)` (in `modules/receipt-inbox/actions.ts`) bulk-updates `suggestedProjectId` from the `/receipts` page selection mode (`ReceiptBulkAssign`).
* **`/receipts` page**: grid of unprocessed receipts (Da processare) with multi-select + bulk-assign toolbar + collapsible Archiviati section. Each thumbnail shows the suggested project as a blue chip.
* **`/receipts/[id]/process` page**: photo sticky on left (desktop) / top (mobile) + expense form on right. Uses `processReceiptAsExpense(receiptId, prevState, formData)` action.
* **Media page**: Scontrini section shows thumbnails for Da processare (clickable to process page) and Archiviati (with link to expense).
* **Upload implementation**: each photo is uploaded in a **separate** `createReceiptInboxItems` call (one FormData per photo) to avoid iOS Safari / Vercel body-size limit issues. `revalidatePath` NOT called inside action — client handles refresh via `router.push()`/`router.refresh()` after all photos complete. If all photos uploaded but navigation throws (iOS quirk), error is silently swallowed.
* **Upload image normalization**: `ReceiptUploadModal` and `PhotoGallery` use the shared helper `src/lib/image-normalize.ts` — converts HEIC/HEIF and other selected images client-side to JPEG (max side 2000px, quality 0.86) before upload, so iPhone photos are compatible with browser previews, AI analysis, and don't blow past Vercel's 4.5MB body limit.
* **AI analysis**: `/receipts/[id]/process` has an "Analizza foto" button that calls `analyzeReceiptForExpense()` (Server Action, no API route). Requires `OPENAI_API_KEY`; optional `OPENAI_RECEIPT_MODEL` defaults to `gpt-4.1-mini`. It fills the expense form suggestions only; user must confirm by saving.
* **AI workpack export**: `/receipts` has "Scarica ZIP per IA" for unprocessed scontrini. It downloads all pending receipt photos plus a `manifest.json` template containing `receiptInboxId`, `imageFile`, `capturedAt`, and empty expense fields. This ZIP is meant to be uploaded to a ChatGPT/Claude project configured with the Delegami receipt import instructions.
* **Batch ZIP/JSON import**: `/receipts/import` imports scontrini analyzed outside the app. It accepts either a ZIP with `manifest.json` + images, or a final `manifest.json` directly when rows include `receiptInboxId`. The page includes project-instruction text, default project selection, editable preview, required supplier confirmation/create, duplicate warnings, sequential import, and import history.
* **Batch receipt linking rule**: when an import row has `receiptInboxId`, the app reuses the original `receipt_inbox.photoUrl`, creates `Expense` + `Document(documentType=RECEIPT)`, and updates that original receipt as processed. It does not create a duplicate archived receipt inbox row or upload a second blob. Rows without `receiptInboxId` still require an image file and create a new archived `ReceiptInbox` row.
* **Batch supplier rule**: suppliers are never silently chosen by AI. The import preview always shows a supplier control with three options: existing supplier, "Crea nuovo fornitore", or "Senza fornitore (da aggiustare dopo)". When the AI returns `supplierName: null` (unreadable photo), the row defaults to "Senza fornitore" — the expense is created without a `supplierId` and the client fixes it later via the expense detail page. Duplicate detection still runs (matches `supplierId IS NULL`).
* **Batch items rule**: the manifest can include a per-receipt `items[]` array with description/quantity/amount. The Expense model has no line-items table — items are folded into the expense `notes` field as a `Dettaglio scontrino: ...` block by `buildExpenseNotes()` in `modules/receipt-imports/actions.ts`. Only the receipt total (`amount`) is stored as the expense amount.
* **Batch project rule**: the user chooses a default project or "Spesa aziendale" before uploading the ZIP. The AI/manifest does not select projects; each row keeps an editable project dropdown.
* **Dashboard**: "Scontrini" button uses `ReceiptUploadButton` — opens upload modal directly (does NOT navigate to `/receipts` first); after success navigates to `/receipts`. Orange card shows `pendingReceiptsCount` (hidden when 0). `getDashboardStats()` includes this count.
* **Sidebar**: "Scontrini" nav item with Camera icon, between Spese and Fornitori.
* **Auth**: upload/process requires `canMutate`; delete requires `canDelete` (ADMIN only). Unarchive requires `canMutate`.
* **Blob storage**: `receipts/inbox/{timestamp}-{index}.{ext}` in Vercel Blob (public).
* **Document on process**: when a receipt is processed, the photo is also saved as a `Document` with `documentType=RECEIPT` linked to the new expense.
* **Unarchive**: `unarchiveReceiptInboxItem(id)` resets `processedAt=null` and `expenseId=null`, returning the receipt to "Da processare". `UnarchiveReceiptButton` (amber, ↺ icon) shown on archived receipts with no linked expense. Triggered automatically when `deleteExpense` is called — any `receipt_inbox` rows with `expenseId` pointing to the deleted expense are reset before the expense is removed.

---

## Rapportino (Worker Daily Log)

* **Purpose**: an operaio (WORKER role) logs daily hours + photos from the field; admin/manager review and approve before it counts toward compenso.
* **Routes**: `/rapportino` (worker's own **3-tab mini-app** — Rapportino / Documenti / Profilo; the ONLY route a WORKER can reach; bottom tab bar on mobile, top tabs on desktop, component `rapportino-client.tsx`). `/rapportini` (admin/manager: overview of all operai + filters + "Registra per operaio" + "Nuovo operaio" shortcut). `/rapportini/[userId]` (worker dossier: anagrafica, documenti, compenso, agency reconciliation, rapportini). `/rapportini/[userId]/print` (printable PDF report + agency bulletin d'heures).
* **Employment model (DIRECT vs AGENCY)**: `User.employmentType`. DIRECT = you pay the worker directly (`hourlyRate`, `WorkerPayment`). AGENCY = a staffing agency (`agencySupplierId` → a Supplier, category "Agenzia di lavoro") invoices you; `costRate` is the agency's hourly bill rate (an **estimate**, e.g. agreed 20 × coefficient, until the real invoice arrives). `hourlyRate` stays = what the worker actually earns. Both `hourlyRate` and `costRate` snapshot onto each WorkLog at creation. Agency invoices are recorded as normal **Expenses** (fornitore = agenzia, tipo Manodopera) — no parallel system.
* **Money visibility**: the worker **never sees money** in their mini-app — no rate, no per-day value, no maturato/saldo, no cost. They see hours + evidence + documents + a "Pagamenti ricevuti" list (what they were actually paid). `WorkLogList` gates all money on a `showMoney` prop (false for the worker view). Agency `costRate`/coefficient/reconciliation are admin/manager only.
* **Agency reconciliation** (`getAgencyReconciliation(userId)`, admin-only card on the dossier): expected cost (approved hours × `costRate`) vs invoiced (Expenses linked to `agencySupplierId`) → variance. NOTE: agency expenses are per-supplier, not per-worker; if several workers share one agency the invoiced total covers all of them (fine while there's one agency worker).
* **Manodopera in the opera P&L**: `getProjectLaborCost(projectId)` sums APPROVED work logs' company cost (`workLogCost` = hours × `costRate`, or = worker earn for DIRECT). Shown as a "Manodopera" row in the project "Riepilogo finanziario" and subtracted from Margine (Fatturato − Spese − Manodopera).
* **Models**: `WorkLog` + `WorkLogPhoto` (Phase 1, migration `20260721000001`), `User.phone/address/hourlyRate/notes` + `WorkerPayment` + `WorkerDocument` (Phase 2, migration `20260721000002`), `WorkLog.approvedAt` + `CompanySettings.defaultWorkerHourlyRate` (migration `20260721000003`), `WorkLog.location` (migration `20260721000004`). See Key Models table.
* **Status lifecycle**: `DRAFT` (worker editing, only they + admin can touch it) → `SUBMITTED` (worker clicks Invia, locks it for the worker) → `APPROVED` (admin/manager clicks Approva — **only from here does it count as compenso maturato**). Admin/manager can `reopenWorkLog()` back to DRAFT from either SUBMITTED or APPROVED to correct something (clears `approvedAt` + revision flags).
* **Evidence required to submit**: `luogo` + `descrizione` are **mandatory to Invia** (a DRAFT may stay incomplete). Enforced client-side (Invia disabled + amber hint) AND server-side in `createWorkLog` when `submit=true`. Photo stays optional by decision.
* **One rapportino per day**: `createWorkLog`/`updateWorkLog` reject a second log for the same worker+calendar-day (`hasDuplicateDate`). Correct the existing one instead.
* **Revision request**: a worker can't edit a locked (SUBMITTED/APPROVED) log directly. They click "Richiedi modifica" (optional reason) → `requestWorkLogRevision()` flags `revisionRequestedAt`/`revisionReason` (does NOT unlock). Admin/manager sees a red "Revisione richiesta" badge + reason and grants it via `reopenWorkLog()` (→ DRAFT). `getPendingWorkLogsCount()` now counts SUBMITTED **or** revision-requested logs (drives the sidebar/dashboard badge).
* **Monthly grouping**: `WorkLogList` groups logs by month (collapsible; most recent month open, older collapsed), each header showing the month's hours subtotal (+ value when `showMoney`). Used in both worker and admin views to keep long lists manageable.
* **Unified operaio creation**: the user form (`/settings/users/new?role=WORKER`, or "Nuovo operaio" on `/rapportini`) shows a "Dati operaio" section when role=WORKER — phone, address, DIRECT/AGENCY toggle, agency + `costRate` (when AGENCY), `hourlyRate`, `identityNumber`, contract start/type, notes — all in one go. Same fields editable later in the dossier's Anagrafica (`WorkerProfileForm`). Both wired through `workerData()`/`readWorkerInputs()` in `modules/users/actions.ts`.
* **Opera assignment is admin-only**: a worker's own create/edit form hides the "Opera" selector entirely (`canSetProject={false}` prop on `WorkLogForm`) — they cannot categorize their own rapportino to a project. Admin/manager can set/change it, either when registering on the worker's behalf or when reviewing/editing later.
* **Hourly rate**: `User.hourlyRate` is the worker's current rate, editable any time in `/settings/users` (create/edit form) or in the worker dossier's Anagrafica card. Every new `WorkLog` snapshots the rate at creation time (`WorkLog.hourlyRate`) — changing the rate later never rewrites past logs. Default for new WORKER accounts comes from `CompanySettings.defaultWorkerHourlyRate` (CHF 25 default, configurable in Impostazioni → Operai). `WorkLog.amountOverride` (managers only) can force a fixed price for a day instead of hours × rate.
* **Compenso ledger** (`getWorkerLedger(userId)` in `modules/workers/queries.ts`): `earned` = sum of **APPROVED** logs' worker amount (`workLogAmount` = override, else hours × `hourlyRate`); `cost` = sum of APPROVED logs' company cost (`workLogCost` = hours × `costRate`, or = earned for DIRECT); `paid` = sum of `WorkerPayment`; `balance` = earned − paid. Direct payments to a worker are still allowed even for AGENCY workers (e.g. the odd cash top-up). Per-log paid state (`Pagato`/`Parziale`/`Da pagare`) is computed via **FIFO allocation** of the paid pool across approved logs oldest-first — no extra table, computed on read.
* **Payments**: `addWorkerPayment()` (admin/manager) records amount/date/method/note + optional receipt upload (image or PDF, Vercel Blob at `worker-payments/{userId}/`). Delete is ADMIN-only.
* **Worker documents**: `addWorkerDocuments()` — foto/PDF uploads with a `category` (CONTRACT/ID/PERMIT/PHOTO/OTHER), Blob at `worker-docs/{userId}/`. Admin/manager upload/delete freely. The **worker can upload their own** documents (Documenti tab, `allowSelfUpload` + `maxDocuments={10}`) — capped at **10 total**, enforced client-side AND server-side (`SELF_DOCUMENT_LIMIT`, self-check `session.id === userId`). The worker **cannot delete** — `deleteWorkerDocument` is `canDelete` (ADMIN only).
* **Location field**: `WorkLog.location` — free-text workplace the worker fills in per entry (e.g. "Lugano", "Grancia"). Shown in lists (with a MapPin icon) and printed as its own "Luogo / Opera" column on the PDF report (falls back to the linked opera's name if location is blank).
* **Notifications for admin/manager**: an amber badge on the "Rapportini" sidebar nav item + an amber alert card on the Dashboard, both driven by `getPendingWorkLogsCount()` (count of `SUBMITTED` logs awaiting review). No email/push — these are the only "notification" surfaces in the app.
* **PDF report** (`/rapportini/[userId]/print`): per-row Data, Luogo/Opera, Ore, **Tariffa** (that day's rate or "fisso"), Valore, Stato; totals for ore + maturato/pagato/saldo; the worker's `identityNumber` (N. identità / matricola) under the name; a **signature block** (Firma operaio / Firma responsabile) at the end so it doubles as the agency/client **bulletin d'heures**. Toolbar has a `?from=&to=` period filter (GET form) + a **"Solo ore (agenzia)"** toggle (`?soloOre=1`) that hides all money columns/totals/payments for a clean hours-only version to hand to the agency. Same visual language as invoice/quote PDFs (navy header, bordered info cards, `PrintButton`).
* **Mobile-specific fixes worth knowing about** (in case similar bugs resurface elsewhere): iOS Safari auto-zooms the page when a focused input's font-size is below 16px and the zoom can persist across client-side navigation — fixed globally in `globals.css` (`input, select, textarea { font-size: 16px !important }` under `max-width: 640px`). Editing a DRAFT log used to hide its already-uploaded photos because the edit form never received them — `WorkLogForm`'s `ExistingLog.photos` now renders + allows deleting existing photos, separate from newly-picked ones.
* **Reference scripts**: `scripts/create-angelo.mjs` (worker + historical work logs, all pre-approved) — good template for bulk-entering a new operaio's timesheet.
* **Roadmap — deferred (NOT implemented yet; implement only when the client explicitly asks)**:
  * **Bulk approval** of SUBMITTED logs (select-all / per-worker / per-week). Deferred while there are only a few operai — approving one-by-one is fine for now.
  * **Document expiry alerts**: add `WorkerDocument.expiresAt` + a Dashboard alert ("permesso di X scade tra 30 giorni"). Very relevant once workers are direct-hired with permits.
  * **Automatic location capture / live camera** on the worker's rapportino (geolocation like the expense form, or force camera-capture instead of gallery) for stronger evidence. Kept free-text/free-upload for now by decision.
  * **Structured overtime rates** (straordinario +25%, sabato, festivo) beyond the current `amountOverride` fixed-day mechanism.

---

## Activity Log

* **Purpose**: full audit trail of every mutation in the app, admin-only.
* **Helper**: `src/lib/activity-log.ts` — `logActivity(actor, action, entityType, opts?)`. Non-blocking: always wrapped in try/catch, never interrupts the main action. Captures request context (IP, simplified user-agent `Browser · OS`, path) automatically from `headers()`.
* **Model**: `ActivityLog` → table `activity_logs`. Fields: `action`, `entityType`, `entityId`, `entityLabel`, `userId`, `userName`, `details` (JSON string), `ipAddress`, `userAgent`, `path`, `success` (default true), `errorMessage`, `durationMs`, `createdAt`.
* **Instrumented modules** (all 13): `auth`, `clients`, `projects`, `quotes`, `invoices`, `expenses`, `suppliers`, `receipt-inbox`, `price-catalog`, `quote-templates`, `settings`, `users`, `documents` (partial).
* **Action names used**: `LOGIN`, `LOGOUT`, `CREATE`, `UPDATE`, `DELETE`, `STATUS_CHANGE`, `CLONE`, `UPLOAD`, `PROCESS`, `AI_ANALYZE`, `IMPORT`, `UNARCHIVE`, `ADD_PAYMENT`, `UPDATE_SIGNATORIES`, `ACTIVATE`, `DEACTIVATE`, `SAVE_TO_CATALOG`, `SUBMIT`, `APPROVE`, `REOPEN`, `REVISION_REQUEST` (rapportino).
* **`/logs` page**: admin-only (`isAdmin` check → redirect `/`). Default shows last 20 entries; `?all=1` shows up to 500. Ordered by `createdAt DESC`. Color-coded action badges.
* **Filters** on `/logs`: dropdowns for action, entityType, userId, esito (success/fail), plus date range `from`/`to`. Filter chips persist via query string. "Azzera filtri" button when any filter is active.
* **Mobile layout**: date column shrinks to 58px, user/IP/UA column hidden; user name appears inline within the description row.
* **Sidebar**: "Log attività" link with `ClipboardList` icon — visible only to `ADMIN` role, in the **Sistema** section at the bottom.
* **`userName` is denormalized** at write time — snapshot of the actor's name, not a foreign key lookup. Handles future user renames correctly.

---

## Expense Form — Special Behaviors

* **Categoria removed** from expenses — only `tipo` (MATERIAL/LABOR/EQUIPMENT/OTHER) remains
* **Acquisto in Italia** checkbox: when checked → currency forced to EUR; shows EUR/CHF exchange rate with month/year of last update
* EUR/CHF rate comes from `CompanySettings.eurChfRate` + `eurChfRateUpdatedAt` — set in Configurazioni, default 0.9119 (maggio 2026)
* When saving an EUR expense: `amountChf` = `amount × eurChfRate`; `exchangeRateUpdatedAt` stored on the expense record
* **Stato pagamento defaults to PAGATA** — pre-selected on the form because expenses are usually entered after purchase
* **N° fattura fornitore field removed** from the form
* Descrizione: datalist with 15 suggestions per tipo combo
* Geolocation: auto-detects CH/IT → pre-fills CHF/EUR; suggests nearest supplier (25km radius)
* 21 supplier coordinates hardcoded in `expense-form.tsx`
* **Expense list page**: removed categoria column (no longer exists); tipo column remains
* **DocumentList multi-upload**: `document-list.tsx` file input has `multiple`; uploads sequentially, stops on first error.
* **CompanyDocumentUpload multi-upload**: `company-document-upload.tsx` file input has `multiple`; uploads sequentially, stops on first error.

---

## Demo data

`dev.db` is generated from `prisma/seed.ts` and is entirely fictional — Impresa
Demo Sagl and five invented clients. It exists so the app can be run, screenshotted
and demonstrated without touching anyone's real records.

**Never commit a database or a script containing a real client's data.** An earlier
version of this copy shipped one client's quotes, invoices and workers, plus a
hardcoded Turso token, into a public repository. Both are gone; the lesson is not.


---

## Suppliers — Taxonomy

* **Category** is a closed dropdown defined in `src/lib/supplier-taxonomy.ts` (`SUPPLIER_CATEGORIES` — 19 values, incl. "Agenzia di lavoro" for staffing agencies)
* `normalizeSupplierCategory()` maps legacy free-text values to the controlled list
* **Tags** are filtered by the selected category via `SUPPLIER_TAGS_BY_CATEGORY` — only tags relevant to the category are shown
* User can add a new tag inline (not pre-existing) — the new tag is added to the record immediately
* Existing supplier tags are preserved; if they don't match any controlled tag they still display as custom chips

---

## Address Autocomplete

* Component: `src/components/ui/address-autocomplete.tsx`
* Used in: client form, project form — anywhere an address field exists
* Backend: **OpenStreetMap / Nominatim** (free, no API key) — endpoint `https://nominatim.openstreetmap.org/search`
* Searches as the user types (debounced 400ms, min 3 chars); shows dropdown of up to 5 results
* User selects a result → fields (street, city, postal code, country) are populated
* Falls back to manual entry if no match found or user ignores suggestions
* No Google Maps / no paid API

---

## Projects — Notes

* Status `LEAD` is kept but displayed as "Nuova richiesta" in UI — conceptually "not started / prospect"
* Start date and end date are optional — leave blank when not known; displayed as "Da definire"
* Estimated value: stored as-is; display rounds to integer CHF (no `.99` display artifacts)

---

## Sidebar Layout

* Component: `src/components/layout/sidebar.tsx`. Used in both desktop (sticky left, `lg:flex`) and mobile (overlay panel triggered by hamburger in `AppShell`).
* **Categorized navigation** (Dashboard standalone at top, then labeled sections):
  * **Operativo**: Clienti, Opere, Preventivi, Fatture, Rapportini (amber badge = count of pending-review work logs, from `getPendingWorkLogsCount()`, computed in `layout.tsx` and threaded through `AppShell` → `Sidebar`)
  * **Finanziario**: Spese, Scontrini, Fornitori
  * **Strumenti**: Prezzario, Template, Media, Infografico, Report, Relatori
  * **Sistema** (rendered separately under the border-divider at the bottom): Impostazioni, Utenti (ADMIN), Log attività (ADMIN)
* **WORKER role gets a completely different, minimal sidebar** (early-return inside `Sidebar` component): just the logo, "Il mio rapportino" link, user info, and logout. No other nav items render at all.
* Section labels use small uppercase tracking-wider `text-slate-500`.
* Templates link lives in **Strumenti** (not the bottom system area).
* **Infografico**: `/infografico` shows the static app overview image from `public/delegami-app-infografico.png`; keep it responsive with horizontal scroll on mobile and "Apri grande"/"Scarica" links.
* Active route highlighting via `usePathname()`; `/settings` link does NOT light up when `/settings/users` or `/settings/templates` is active.
* **Mobile top bar** (`AppShell`): renders `/logo.png` (not a lucide icon) inside a white rounded-md box, same brand as desktop sidebar.

---

## Photo galleries (project + media pages)

* Components: `src/components/projects/photo-gallery.tsx` (project detail) and `src/components/media/media-gallery.tsx` (`/media`).
* **Lazy loading**: all `<img>` tags use `loading="lazy"` + `decoding="async"`. Browser only fetches images as they enter the viewport.
* **Pagination "Carica altre"**: only `PAGE_SIZE = 10` thumbnails are inserted in the DOM initially. A "Carica altre N" button reveals the next batch.
* **Lightbox**: shared component at `src/components/media/photo-lightbox.tsx` — fullscreen modal with `← / →` keyboard navigation, `Home`/`End` to jump, `Esc` to close. Strip of thumbnails at the bottom auto-scrolls to keep the active thumbnail visible. Prev/next images are preloaded in a hidden div for instant flipping.
* **Lightbox sees ALL photos** (not just the visible page) — the gallery passes the full array and the user can navigate through every image even when only 10 are mounted in the grid.
* **Upload normalization**: photo uploads (project + spese + documents) all reuse `normalizeImageFile()` (HEIC→JPEG, resize to ≤2000px). Uploads of non-image files skip normalization.
* **Upload progress + partial failure**: `PhotoGallery` and `DocumentList` show a blue progress bar `{current}/{total} · filename` while uploading. If a file fails, the loop continues with the rest; failures are surfaced via a collapsible `<details>` at the end.
* **In-app preview for document lists**: `DocumentList`, `AttachmentList` (quote), `ExpenseReceiptList`, and `InvoicePaymentList` all route image clicks into the shared `PhotoLightbox` instead of opening a new tab. PDFs and other files still open in a new tab (browser native preview/download). Helper lives in `src/lib/document-preview.ts` (`isPreviewableImage(fileType)` + `isImageUrl(url)` for receipts that only carry a URL). Action icons (download/delete) use `sm:opacity-0 sm:group-hover:opacity-100` instead of `opacity-0 group-hover:opacity-100`, so they stay visible on touch devices.
* **/media page rows**: the three list sections (`Archivio normativo`, `Comunicazioni & Allegati`, `Ricevute spese`) all render through `MediaDocList` (`src/components/media/media-document-list.tsx`). The page passes per-row `meta` (Badges, Link tags) and `trailing` (DeleteMediaDocumentButton) as `ReactNode`. The component handles thumbnail click + name click → `PhotoLightbox` for images, new tab for everything else. The Download icon is always visible on every row.
* **PhotoGallery delete button**: same mobile fix — uses `opacity-100 sm:opacity-0 sm:group-hover:opacity-100` so the per-photo `×` is always reachable on touch devices (was previously hover-only and unreachable on mobile).
* **Lightbox delete**: `PhotoLightbox` accepts an optional `onDelete(photo)` prop (plus `confirmDeleteMessage`). When provided, a red Trash icon appears in the header; the lightbox handles the confirm dialog and calls back into the caller's deletion logic. Wired in `PhotoGallery`, `DocumentList`, `AttachmentList`, `ExpenseReceiptList`, `MediaGallery`, and `MediaDocList`. The two `/media`-only components also gained a `canDelete` prop passed from the page based on `canDelete(session.role)` (ADMIN-only). After delete, the lightbox auto-advances/closes so the next image stays in view.

---

## Project detail page layout

* Right column order (when scrolling top to bottom): **Preventivi → Fatture → Spese → Comunicazioni / Documenti → Foto cantiere**. Photos at the bottom because they are evidence/documentation, not decisions.
* Left column: Dettagli, Riepilogo finanziario, Descrizione/Note.

---

## Lista acquisti per opera

* **Routes**: `/projects/[id]/shopping-list` (read-optimized viewer), `/projects/[id]/shopping-list?edit=1` (full editor), `/projects/[id]/shopping-list/import` (AI JSON import), and `/projects/[id]/shopping-list/print` (print/PDF view).
* **Models**: `ShoppingList` (one active list per project in v1) + `ShoppingListItem`. Migration: `20260526000003_shopping_lists_and_project_schedule`.
* **Generation**: `generateShoppingListFromQuote(projectId, quoteId)` in `src/modules/shopping-lists/actions.ts`. Requires quote status APPROVED or INVOICED, replaces any existing list for that project, and creates one list item per `QuoteItem` with `itemType=ITEM`.
* **Empty creation**: `createEmptyShoppingList(projectId)` creates a blank list so material can be added one by one without any approved quote.
* **Supplier inference**: there is no `PriceSource.supplierId` in the current schema. The v1 inference matches `PriceSource.supplierName`, `QuoteItem.sourceNote`, or `sourceUrl` hostname against registered `Supplier.name`/`website`. Items with no match stay unassigned.
* **Viewer vs editor**: opening the list from an opera shows a mobile-friendly viewer by default with all details and quick status changes. Full editing opens only via `Modifica`.
* **Editability**: after generation/import, the list is independent from the quote. User can edit description, planned/purchased qty, estimated/paid unit price, unit, supplier, status, source URL/notes, ordering, and can add/delete manual items. Long descriptions use a multiline editor with explicit `Salva`/`Annulla`; Enter inserts a new line and Ctrl/Cmd+Enter saves.
* **Session restore**: same pattern as the cronograma — entering edit mode captures a snapshot (items + list notes) and shows a `Ripristina stato iniziale` banner whenever the current state differs. Backed by `restoreShoppingListSnapshot(listId, snapshotJson)`, which replaces all items in a transaction. Single-session undo, not multi-level history.
* **Units**: material unit input is a dropdown backed by `src/lib/units.ts` (`pz`, `m²`, `m³`, `ml`, `kg`, `t`, `l`, `h`, `set`, `corpo`, `sacco`, `scatola`, `confezione`, `rotolo`, `tubo`, `lastra`, `barattolo`) with an `Altro` custom entry.
* **Status values**: `PENDING`, `ORDERED`, `PURCHASED`, `RECEIVED`.
* **Expense integration**: "Crea spesa da articolo" links to `/expenses/new` with project/supplier/description/amount/shoppingListItemId prefilled. `createExpense` writes the resulting `expenseId` back to the shopping item, marks it `PURCHASED`, and stores paid unit price as total expense amount divided by `qtyPlanned`. Updating/deleting the expense propagates back to linked shopping-list items.
* **AI workflow**: "Esporta per IA" downloads a `shopping_list_ai_context` JSON containing project, approved quotes, suppliers, current list, instructions, and expected schema. "Importa da IA" opens a page matching the quote/invoice import pattern: copyable instructions, example JSON, file upload, textarea, preview, and `Sostituisci corrente` vs `Aggiungi a corrente`. Import action: `importShoppingListFromJson(projectId, jsonText, mode)`.
* **Print**: grouped by supplier with checkboxes, planned qty, estimated unit price, paid unit price, notes, and source URLs. Intended for paper/PDF use in the field.
* **Mobile**: grouped cards with inline controls; default viewer and full editor both avoid horizontal-only workflows except intentional timeline/print previews. No drag-and-drop in v1 (arrow buttons only).
* **Future ideas**: multi-list per phase, supplier comparison, Excel export, receipt matching, team buyer tracking, supplier-order PDF/email. Keep these in `FUTURE_FEATURES.md`.

---

## Cronograma per opera

* **Routes**: `/projects/[id]/schedule` (read-optimized viewer), `/projects/[id]/schedule?edit=1` (full editor), `/projects/[id]/schedule/import` (AI JSON import), and `/projects/[id]/schedule/print` (print/PDF view).
* **Models**: `ProjectSchedule` (one per project) + `SchedulePhase` (`name`, `startDate`, `endDate`, `color`, `notes`, `sortOrder`) + `ScheduleTask` (`name`, optional `startDate/endDate`, `notes`, `status`, `sourceQuoteItemId`, `sortOrder`). Migrations: `20260526000003_shopping_lists_and_project_schedule` and `20260526000004_schedule_tasks`.
* **Generation**: `generateScheduleFromQuote(projectId, quoteId, startDate)` in `src/modules/schedules/actions.ts`. Requires quote status APPROVED or INVOICED, replaces existing phases, creates one phase per quote `SECTION`, and creates phase tasks from the `ITEM` rows under each section.
* **Default dates**: starts from the selected start date (or `project.startDate`, then today) and assigns each generated phase 5 business days, sequentially.
* **Viewer vs editor**: opening the schedule from an opera shows a mobile-friendly viewer by default with all phase/task details and quick task status changes. Full editing opens only via `Modifica`.
* **Editability**: after generation/import, the schedule is independent from the quote. User can edit phase name, start/end dates, color, notes, ordering, and can add/delete manual phases. Inside each phase, user can add/edit/delete/reorder tasks and set task start/end dates plus status. Long phase/task names use a multiline editor with explicit `Salva`/`Annulla`; Enter inserts a new line and Ctrl/Cmd+Enter saves.
* **Date inputs**: phase + task start/end use a `DateInput` helper that buffers the value locally and only saves to the server on `blur` (or Enter). This stops the previous freeze where the input was disabled mid-pick (because `isPending` flipped on every keystroke). `Esc` cancels the local edit and restores the server value.
* **Session restore**: when entering edit mode, the client captures a snapshot (phases + tasks + list notes) via lazy `useState`. While the current state differs from the snapshot, an amber banner appears with `Ripristina stato iniziale`, which calls `restoreScheduleSnapshot(scheduleId, snapshotJson)`. The action wipes phases in a transaction and recreates them from the snapshot. It is a single-session undo, not multi-level history; reopening the page resets the baseline.
* **Colors and notes**: phase color picker offers 10 colors and is visible directly in the phase editor. The palette is centralized in `src/lib/schedule-colors.ts` (`PHASE_COLOR_PALETTE` + `phaseColorAt(index)`) and used by `generateScheduleFromQuote`, `importScheduleFromJson`, and the print page so phases without an explicit color cycle through the palette (no more all-blue Gantt). `ProjectSchedule.notes` is editable at the end of the editor and is printed at the end of the PDF.
* **Timeline**: CSS-only Gantt preview, horizontally scrollable on mobile. No dependencies, no automatic recalculation, no drag-and-drop in v1.
* **AI workflow**: "Esporta per IA" downloads a `schedule_ai_context` JSON containing project, approved quotes, current schedule with tasks, instructions, and expected schema. "Importa da IA" uses the same import UX pattern as quote/invoice/template imports, with preview and `Sostituisci corrente` vs `Aggiungi a corrente`. Import action: `importScheduleFromJson(projectId, jsonText, mode)`.
* **Print**: chronological table plus compact, date-labelled timeline bars. Date columns are shortened (`Dal`, `Al`, `gg`) to leave more room for phase/task descriptions; general notes print at the end. Print page forces `print-color-adjust: exact` so phase colors (dots + Gantt bars) survive in the PDF. The last timeline tick is anchored right (`translateX(-100%)`) so date labels never overflow the page edge. When `totalDays > 60` the page auto-switches to A4 landscape so long schedules fit without cropping.
* **Future ideas**: dependencies/auto recalculation, drag timeline, resource assignment, calendar views, reminders, planned-vs-real comparison, Google Calendar export. Keep these in `FUTURE_FEATURES.md`.

---

## Relatori — AI JSON import (custom reports)

* **Two flavours coexist on `/relatori`**:
  * **Static (hardcoded)** — Next.js pages under `/relatorio/{slug}/page.tsx` (e.g. `finanziario-013`, `eletrico`, `raccolta-scontrini`), listed via `RELATORI_REGISTRY` in `src/lib/relatori-registry.ts`. They contain custom JSX/calculations and cannot be deleted from the UI.
  * **AI-imported (DB-backed)** — stored in the `custom_reports` table (`CustomReport` model). Rendered by a single dynamic page `/relatorio/[id]/page.tsx`. Listed alongside static ones on `/relatori` with a violet "IA" chip and a delete button (ADMIN-only) on each card.
* **Model**: `CustomReport` (table `custom_reports`). Migration `20260527000001_custom_reports`. Fields: `title`, `description?`, `type?` (eletrico|hidraulico|strutturale|termico|altro), `projectId?` (SET NULL on project delete), `quoteId?`, `contentJson` (block array), `createdBy` (denormalized user name).
* **Block schema** in `src/modules/custom-reports/schema.ts` — 8 discriminated-union blocks: `heading` (level 1/2/3), `paragraph`, `list` (ordered/bullet), `table` (columns + rows + per-column alignment), `callout` (info/warning/success/danger), `diagram` (monospace pre block), `keyValue` (KPI grid), `divider`. Renderer in `src/components/custom-reports/report-blocks.tsx` matches the styling of the legacy static relatori (A4-ready, blue header borders, alternating row backgrounds).
* **Schema lives in a non-`'use server'` file** so it can be reused by the server action AND the dynamic renderer page. Putting Zod objects inside `'use server'` breaks Next 16 build (only async functions can be exported from server-action files).
* **Import flow**: `/relatori/import` mirrors `/quotes/import` and `/invoices/import` — copyable AI instructions, JSON example, file upload + textarea, live preview of block counts, project selector with `— Senza progetto (aziendale) —` as the first/default option. Action: `importReportFromJson(projectId | null, jsonText)` → validates → creates `CustomReport` → redirects to `/relatorio/{id}`.
* **AI prompt** explicitly states that content language (italiano/portoghese/altro) and currency (CHF/EUR/none) are free; only the JSON schema keys stay in English. `projectId` is NOT in the JSON — chosen in-app at import time.
* **Delete action**: `deleteCustomReport(id)` — ADMIN-only via `canDelete(session.role)`. UI: `DeleteReportButton` shown on each AI-imported card.
* **/relatori/novo** is now a server redirect to `/relatori/import` (the previous code-generator helper is obsolete).
* **Route precedence**: Next.js matches static folders (`/relatorio/raccolta-scontrini`) before the dynamic `[id]` segment, so all legacy hardcoded reports keep working.

---

## Template import da JSON

* **Route**: `/settings/templates/import`.
* **Action**: `importTemplateFromJson(jsonText)` in `src/modules/quote-templates/actions.ts`. Validates JSON with Zod and creates a `QuoteTemplate` directly; no API route.
* **Entry point**: third option "Importa da IA" in `CreateTemplateMenu` on `/settings/templates`.
* **Schema**: `kind: "template"` (optional), `name`, `category`, optional `subcategory`/`emoji`, `templateType`, and `items[]` with `type` values HEADER/SECTION/ITEM/NOTE/SUBTOTAL.
* **Behavior**: stores normalized items in `itemsJson`, creates a `templateGroupKey`, logs `IMPORT`, and revalidates templates, quotes, and invoices.
* **Future ideas**: bulk import, duplicate detection, replace-existing vs create-new flow. Keep these in `FUTURE_FEATURES.md`.

---

## Quote & Invoice — AI JSON import

* **Pages**: `/quotes/import` and `/invoices/import` — instructions block (copy-to-clipboard) + JSON example + project picker + textarea/file upload + live preview (item count, margine, IVA) + create button.
* **Shared client component**: `src/components/imports/json-import-client.tsx`.
* **Actions**: `importQuoteFromJson(projectId, jsonText)` and `importInvoiceFromJson(projectId, jsonText)`. Both validate the JSON with Zod, reuse the existing totals/numbering/item-create helpers, and create a `DRAFT` document.
* **Server-side defaults merge**: when the JSON omits `clientNotes`, `paymentTerms`, or `validityDays`, the action falls back to `CompanySettings.defaultQuoteNotes`, `CompanySettings.paymentTerms`, and `CompanySettings.defaultQuoteValidityDays`. Same behaviour as `createQuote`. The AI instructions tell the assistant to omit those fields unless a per-quote override is needed.
* **AI instructions in the page** explain the schema, valid `type` values (HEADER/SECTION/ITEM/NOTE/SUBTOTAL), valid `unit` values, when to use `directPrice` / `hiddenFromClient`, and that prices should be researched on Hornbach.ch (retail CHF IVA inclusa).
* **`IMPORT` activity log action** records the JSON-import origin in `details`.
* **Entry point**: "Importa da IA" button next to "Nuovo preventivo" / "Nuova fattura" on the list pages.

---

## Quote — AI iteration loop (export + update)

* **Esporta JSON**: button on `/quotes/[id]` that calls `exportQuoteAsJson(id)` action → returns the current quote (header + items) in the same schema the AI import uses → client downloads as `PRE-XXXX-vN.json`. the client pastes this into the chat alongside requested changes.
* **Aggiorna da JSON**: button on `/quotes/[id]` that opens `/quotes/[id]/import-update` — radio toggle between two modes:
  * `replace-in-place` — **only enabled when status === DRAFT**. Overwrites items + header fields on the SAME quote (same id, same version). Saves a snapshot of the prior `itemsJson` into `ActivityLog.details.previousSnapshot` for audit/restore. Confirmation dialog: *"Sostituirai N voci con le M del JSON. Procedere?"*
  * `new-version` — always available. Creates a new entry in the version chain (same `parentQuoteId` / `quoteNumber`, bumped `version`, status DRAFT). Same logic as `cloneQuote`.
* **Server enforces** the DRAFT requirement for `replace-in-place` — UI radio + server validation.
* Action: `importQuoteUpdateFromJson(quoteId, jsonText, mode)` in `modules/quotes/actions.ts`. Activity log records `mode` + `previousSnapshot` + new item count.
* **Mobile**: the "Esporta JSON" and "Aggiorna da JSON" buttons are hidden on `<sm` screens and collapsed into the **Altre azioni** popover (`src/components/quotes/quote-actions-menu.tsx`).

---

## Quote detail — mobile action menu

* Component: `src/components/quotes/quote-actions-menu.tsx`. Visible only `<sm` (renders nothing on `sm+`).
* Collapses secondary actions into a popover: **Crea template**, **Esporta JSON**, **Aggiorna da JSON**, **PDF Interno**.
* Primary actions stay visible on mobile: status, Crea fattura, Clona, Invia, PDF Cliente, Modifica, Elimina.

---

## Expenses — move to another project

* Action: `moveExpenseToProject(expenseId, newProjectId)` in `modules/expenses/actions.ts`. Updates `Expense.projectId` and propagates to `Document.projectId` for all linked docs (so media grouping stays clean).
* Button: `MoveExpenseButton` on the expense detail page — opens a small modal with a project dropdown (placeholder option at the top for "Spesa aziendale (nessuna opera)") and a confirm button.
* Useful to graduate spese assigned to **🗂 Da classificare** into a real project once it's known.

---

## Document cleanup on expense delete

* `deleteExpense` (`modules/expenses/actions.ts`):
  * Looks up linked `receipt_inbox` rows (`expenseId = id`) — those rows are unarchived (`processedAt=null, expenseId=null`) AFTER the document cleanup so their `photoUrl` is treated as **preserved**.
  * For every `Document` row linked to the expense, deletes the row AND the underlying Vercel blob — **unless** the `filePath` matches a preserved receipt photoUrl (in which case the blob stays alive for the unarchived receipt).
  * Then `prisma.expense.delete` runs.
* One-off cleanup script for historical orphans: `scripts/cleanup-orphan-receipt-documents.mjs` (`--dry-run` supported).

---

## Date/time formatting — Europe/Zurich

* `src/lib/utils.ts` exports `APP_TIMEZONE = 'Europe/Zurich'`.
* `formatDate(date)` → `de-CH`, just the date, forced to `Europe/Zurich`.
* `formatDateTime(date)` → `de-CH` short date + short time.
* `formatTime(date)` → `it-CH` `HH:mm:ss`.
* All Server Components render dates through these helpers so Vercel's UTC server doesn't show times 1–2h off.

---

## UI Behaviours

* **QuoteItemsTable** (`src/components/quotes/quote-items-table.tsx`): auto-collapses when >8 ITEM rows, showing only HEADER/SECTION/subtotal rows. Toggle "Mostra tutti / Comprimi" appears at top of card.
* **Dashboard** (`src/app/page.tsx`): "Fatture aperte" card shows all SENT invoices with residuo (total − paid); "Fatture scadute" card shows SENT/DRAFT past dueDate; orange "Scontrini da processare" card shows `pendingReceiptsCount` (hidden when 0). `getDashboardStats()` in `modules/projects/queries.ts` fetches all three. "Scontrini" quick-action button opens `ReceiptUploadButton` modal directly.
* **Sidebar logo**: `public/logo.png` — used in the sidebar and as browser favicon (`src/app/icon.png`).
* **Quote detail**: shows "Fatture collegate" block at bottom — invoice number, status, total, % of quote invoiced
* **Media page**: spese aziendali (expenses without projectId) are shown with their expense type/description as context label instead of an empty project name
* **Client grouping**: Dashboard "Opere attive", `/projects` (Opere), `/quotes` (Preventivi), and `/invoices` (Fatture) all cluster their rows/cards under a client header (name + link to `/clients/[id]`) instead of a flat list — each page has its own small `groupByClient()` helper (not shared, shapes differ per page). Because the client name is already shown in the group header, the old per-row "Cliente" column was replaced with "Codice" (`project.referenceCode`) on Dashboard/Opere/Fatture — kept as a small subtitle on mobile since that column itself is `hidden sm:table-cell`. Preventivi never had a flat Cliente column (already grouped by opera into cards), so only got the client outer layer + row-height compaction.

---

## Finishing Checklist

* Imports valid · files consistent · actions ↔ UI wired · auth respected
* `@/generated/prisma/...` — never `@prisma/client`
* `npm run lint` + `npx tsc --noEmit` before every commit
* `prisma generate` after schema change
* Add migration to `migrate-turso.ts`

---

## Forbidden

* API routes (unless explicitly asked)
* `@prisma/client`
* Business logic in pages
* Bypass auth checks
* Large rewrites unless necessary
* Links in prezzario for Manodopera category items
