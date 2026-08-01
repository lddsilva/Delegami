CREATE UNIQUE INDEX IF NOT EXISTS "invoices_quoteId_version_key" ON "invoices" ("quoteId", "version");
