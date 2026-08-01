ALTER TABLE invoice_items ADD COLUMN quoteItemId TEXT;
DROP INDEX IF EXISTS "invoices_quoteId_version_key";
