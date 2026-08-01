-- Allow multiple records with the same quoteNumber (different versions)
-- Drop the old unique index on quoteNumber alone
DROP INDEX IF EXISTS "quotes_quoteNumber_key";

-- Add composite unique on (quoteNumber, version) — same number, different versions OK
CREATE UNIQUE INDEX IF NOT EXISTS "quotes_quoteNumber_version_key" ON "quotes" ("quoteNumber", "version");
