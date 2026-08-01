ALTER TABLE quote_templates ADD COLUMN subcategory TEXT;
ALTER TABLE quote_templates ADD COLUMN qualityLevel TEXT NOT NULL DEFAULT 'STANDARD';
ALTER TABLE quote_templates ADD COLUMN templateGroupKey TEXT;
ALTER TABLE quote_templates ADD COLUMN version INTEGER NOT NULL DEFAULT 1;
ALTER TABLE quote_templates ADD COLUMN sourceQuoteId TEXT;
