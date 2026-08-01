-- Activity log: full audit trail of every mutation in the app

CREATE TABLE IF NOT EXISTS activity_logs (
  id          TEXT NOT NULL PRIMARY KEY,
  action      TEXT NOT NULL,
  entityType  TEXT NOT NULL,
  entityId    TEXT,
  entityLabel TEXT,
  userId      TEXT NOT NULL,
  userName    TEXT NOT NULL,
  details     TEXT,
  createdAt   DATETIME NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS activity_logs_createdAt ON activity_logs(createdAt DESC);
