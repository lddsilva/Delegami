CREATE TABLE "schedule_tasks" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "phaseId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "startDate" DATETIME,
    "endDate" DATETIME,
    "notes" TEXT,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "sourceQuoteItemId" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "schedule_tasks_phaseId_fkey" FOREIGN KEY ("phaseId") REFERENCES "schedule_phases" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE INDEX "schedule_tasks_phaseId_idx" ON "schedule_tasks"("phaseId");
