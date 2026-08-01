-- Templates are now created explicitly from real quotes/invoices.
-- Keep legacy seeded rows for history, but hide them from pickers by default.
UPDATE quote_templates
SET isActive = 0
WHERE sourceQuoteId IS NULL;
