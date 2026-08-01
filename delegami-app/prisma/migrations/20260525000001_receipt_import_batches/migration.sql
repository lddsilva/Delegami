-- Receipt import batches: reviewed ZIP imports of receipt photos into expenses

CREATE TABLE IF NOT EXISTS receipt_import_batches (
  id                  TEXT NOT NULL PRIMARY KEY,
  fileName            TEXT NOT NULL,
  defaultProjectId    TEXT,
  defaultProjectLabel TEXT,
  status              TEXT NOT NULL DEFAULT 'DRAFT',
  totalItems          INTEGER NOT NULL DEFAULT 0,
  createdCount        INTEGER NOT NULL DEFAULT 0,
  skippedCount        INTEGER NOT NULL DEFAULT 0,
  errorCount          INTEGER NOT NULL DEFAULT 0,
  createdById         TEXT NOT NULL,
  createdByName       TEXT NOT NULL,
  createdAt           DATETIME NOT NULL DEFAULT (datetime('now')),
  updatedAt           DATETIME NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS receipt_import_items (
  id                  TEXT NOT NULL PRIMARY KEY,
  batchId             TEXT NOT NULL REFERENCES receipt_import_batches(id) ON DELETE CASCADE,
  imageFile           TEXT NOT NULL,
  photoUrl            TEXT,
  rawJson             TEXT NOT NULL,
  supplierNameRaw     TEXT,
  supplierId          TEXT,
  supplierName        TEXT,
  projectId           TEXT,
  projectLabel        TEXT,
  expenseId           TEXT,
  receiptInboxId      TEXT,
  status              TEXT NOT NULL DEFAULT 'PENDING',
  errorMessage        TEXT,
  duplicateExpenseId  TEXT,
  createdAt           DATETIME NOT NULL DEFAULT (datetime('now')),
  updatedAt           DATETIME NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS receipt_import_items_batchId ON receipt_import_items(batchId);
CREATE INDEX IF NOT EXISTS receipt_import_batches_createdAt ON receipt_import_batches(createdAt DESC);
