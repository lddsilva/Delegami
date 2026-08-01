-- Receipt Inbox: quick photo capture of scontrini in the field, processed into expenses later

CREATE TABLE IF NOT EXISTS receipt_inbox (
  id          TEXT NOT NULL PRIMARY KEY,
  photoUrl    TEXT NOT NULL,
  note        TEXT,
  capturedAt  DATETIME NOT NULL DEFAULT (datetime('now')),
  processedAt DATETIME,
  expenseId   TEXT REFERENCES expenses(id) ON DELETE SET NULL,
  createdById TEXT NOT NULL,
  createdAt   DATETIME NOT NULL DEFAULT (datetime('now')),
  updatedAt   DATETIME NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS receipt_inbox_capturedAt ON receipt_inbox(capturedAt DESC);
CREATE INDEX IF NOT EXISTS receipt_inbox_processedAt ON receipt_inbox(processedAt);
