-- Add defaultQuoteNotes to company_settings
-- Used as template for clientNotes on new quotes (editable per-quote)
ALTER TABLE company_settings ADD COLUMN defaultQuoteNotes TEXT;
