CREATE TABLE "custom_reports" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "type" TEXT,
    "projectId" TEXT,
    "quoteId" TEXT,
    "contentJson" TEXT NOT NULL,
    "createdBy" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "custom_reports_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "projects" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "custom_reports_quoteId_fkey" FOREIGN KEY ("quoteId") REFERENCES "quotes" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

CREATE INDEX "custom_reports_projectId_idx" ON "custom_reports"("projectId");
CREATE INDEX "custom_reports_quoteId_idx" ON "custom_reports"("quoteId");
