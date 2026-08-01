-- CreateTable
CREATE TABLE "price_items" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "code" TEXT,
    "category" TEXT NOT NULL DEFAULT 'Generale',
    "description" TEXT NOT NULL,
    "unit" TEXT NOT NULL DEFAULT 'pz',
    "unitCost" REAL NOT NULL DEFAULT 0,
    "notes" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
