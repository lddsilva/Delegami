DROP INDEX IF EXISTS "invoices_invoiceNumber_key";
CREATE UNIQUE INDEX IF NOT EXISTS "invoices_invoiceNumber_version_key" ON "invoices" ("invoiceNumber", "version");
