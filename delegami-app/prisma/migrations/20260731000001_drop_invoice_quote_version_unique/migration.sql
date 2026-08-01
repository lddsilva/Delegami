-- Drop the stale UNIQUE(quoteId, version) index on invoices.
--
-- 20260522000015_partial_invoice_items already dropped it, because a quote is
-- meant to carry several invoices (acconti, SAL, saldo). A later table-rebuild
-- migration recreated it from an older schema snapshot, so the live database
-- disagreed with schema.prisma, which only declares @@unique([invoiceNumber, version]).
-- The drift silently blocked linking more than one invoice to the same quote.
DROP INDEX IF EXISTS "invoices_quoteId_version_key";
