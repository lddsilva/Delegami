-- Rapportino giornaliero operai: daily work logs + photos.
-- New tables only (no table rebuild) — guarded by _applied_migrations.
-- The WORKER role is stored in users.role (TEXT), so no enum migration is needed.

CREATE TABLE "work_logs" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "userName" TEXT NOT NULL,
    "projectId" TEXT,
    "workDate" DATETIME NOT NULL,
    "hours" REAL NOT NULL DEFAULT 0,
    "description" TEXT,
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "submittedAt" DATETIME,
    "createdById" TEXT NOT NULL,
    "createdByName" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "work_logs_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "projects" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

CREATE INDEX "work_logs_userId_idx" ON "work_logs"("userId");
CREATE INDEX "work_logs_workDate_idx" ON "work_logs"("workDate");
CREATE INDEX "work_logs_projectId_idx" ON "work_logs"("projectId");

CREATE TABLE "work_log_photos" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "workLogId" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "note" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "work_log_photos_workLogId_fkey" FOREIGN KEY ("workLogId") REFERENCES "work_logs" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE INDEX "work_log_photos_workLogId_idx" ON "work_log_photos"("workLogId");
