-- Track how an invoice consumes an approved quote: by selected items, by percentage/SAL, or manual.

ALTER TABLE invoices ADD COLUMN billingMode TEXT;
ALTER TABLE invoices ADD COLUMN billingPercent REAL;
ALTER TABLE invoices ADD COLUMN quoteBaseTotal REAL;

UPDATE invoices
SET billingMode = 'ITEMS'
WHERE quoteId IS NOT NULL
  AND id IN (
    SELECT DISTINCT invoiceId
    FROM invoice_items
    WHERE quoteItemId IS NOT NULL
  );

UPDATE invoices
SET billingMode = 'MANUAL'
WHERE quoteId IS NOT NULL
  AND billingMode IS NULL;

UPDATE invoices
SET quoteBaseTotal = (
  SELECT total FROM quotes WHERE quotes.id = invoices.quoteId
)
WHERE quoteId IS NOT NULL
  AND quoteBaseTotal IS NULL;
