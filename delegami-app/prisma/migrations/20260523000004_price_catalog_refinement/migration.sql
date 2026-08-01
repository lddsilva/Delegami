ALTER TABLE quote_templates ADD COLUMN scopeLevel TEXT NOT NULL DEFAULT 'STANDARD';

UPDATE quote_templates
SET scopeLevel = CASE qualityLevel
  WHEN 'LOW' THEN 'LIGHT'
  WHEN 'MEDIUM' THEN 'STANDARD'
  WHEN 'HIGH' THEN 'COMPLETE'
  ELSE 'SERVICE'
END;

ALTER TABLE price_items ADD COLUMN productTier TEXT;

UPDATE price_items
SET productTier = CASE qualityLevel
  WHEN 'LOW' THEN 'ESSENTIAL'
  WHEN 'MEDIUM' THEN 'STANDARD'
  WHEN 'HIGH' THEN 'PREMIUM'
  ELSE NULL
END;

ALTER TABLE quote_items ADD COLUMN priceItemId TEXT;
CREATE INDEX quote_items_priceItemId_idx ON quote_items(priceItemId);

CREATE TABLE price_sources (
  id TEXT PRIMARY KEY NOT NULL,
  priceItemId TEXT NOT NULL,
  supplierName TEXT,
  sourceType TEXT NOT NULL DEFAULT 'PRODUCT_URL',
  url TEXT,
  observedPrice REAL,
  currency TEXT NOT NULL DEFAULT 'CHF',
  vatIncluded BOOLEAN,
  unit TEXT,
  observedAt DATETIME,
  validUntil DATETIME,
  confidence TEXT NOT NULL DEFAULT 'MEDIUM',
  notes TEXT,
  createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updatedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT price_sources_priceItemId_fkey FOREIGN KEY (priceItemId) REFERENCES price_items(id) ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE INDEX price_sources_priceItemId_idx ON price_sources(priceItemId);
