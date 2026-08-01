-- Shopping list per project
CREATE TABLE "shopping_lists" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "projectId" TEXT NOT NULL,
    "sourceQuoteId" TEXT,
    "notes" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "shopping_lists_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "projects" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE INDEX "shopping_lists_projectId_idx" ON "shopping_lists"("projectId");

CREATE TABLE "shopping_list_items" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "listId" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "unit" TEXT,
    "qtyPlanned" REAL NOT NULL DEFAULT 1,
    "qtyPurchased" REAL,
    "unitPriceEstimated" REAL,
    "unitPricePaid" REAL,
    "supplierId" TEXT,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "sourceQuoteItemId" TEXT,
    "sourceUrl" TEXT,
    "expenseId" TEXT,
    "notes" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "shopping_list_items_listId_fkey" FOREIGN KEY ("listId") REFERENCES "shopping_lists" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "shopping_list_items_supplierId_fkey" FOREIGN KEY ("supplierId") REFERENCES "suppliers" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
CREATE INDEX "shopping_list_items_listId_idx" ON "shopping_list_items"("listId");
CREATE INDEX "shopping_list_items_supplierId_idx" ON "shopping_list_items"("supplierId");

-- Project schedule (Cronograma Lite)
CREATE TABLE "project_schedules" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "projectId" TEXT NOT NULL,
    "notes" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "project_schedules_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "projects" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE UNIQUE INDEX "project_schedules_projectId_key" ON "project_schedules"("projectId");

CREATE TABLE "schedule_phases" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "scheduleId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "startDate" DATETIME NOT NULL,
    "endDate" DATETIME NOT NULL,
    "color" TEXT,
    "notes" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "schedule_phases_scheduleId_fkey" FOREIGN KEY ("scheduleId") REFERENCES "project_schedules" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE INDEX "schedule_phases_scheduleId_idx" ON "schedule_phases"("scheduleId");
