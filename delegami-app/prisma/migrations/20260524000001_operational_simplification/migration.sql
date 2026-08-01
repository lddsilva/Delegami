ALTER TABLE company_settings ADD COLUMN defaultQuoteValidityDays INTEGER NOT NULL DEFAULT 30;
ALTER TABLE company_settings ADD COLUMN defaultInvoiceDueDays INTEGER NOT NULL DEFAULT 5;
ALTER TABLE company_settings ADD COLUMN eurChfRate REAL NOT NULL DEFAULT 0.9119;
ALTER TABLE company_settings ADD COLUMN eurChfRateUpdatedAt DATETIME;

UPDATE company_settings
SET eurChfRateUpdatedAt = COALESCE(eurChfRateUpdatedAt, '2026-05-22T00:00:00.000Z')
WHERE eurChfRate IS NOT NULL;

ALTER TABLE expenses ADD COLUMN exchangeRateUpdatedAt DATETIME;
ALTER TABLE expenses ADD COLUMN isItalianPurchase BOOLEAN NOT NULL DEFAULT false;

UPDATE expenses
SET isItalianPurchase = true
WHERE currency = 'EUR' OR category = 'Acquisto Italia';
