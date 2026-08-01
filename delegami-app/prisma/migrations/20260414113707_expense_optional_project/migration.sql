-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_expenses" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "projectId" TEXT,
    "supplierId" TEXT,
    "expenseType" TEXT NOT NULL DEFAULT 'MATERIAL',
    "paymentStatus" TEXT NOT NULL DEFAULT 'PENDING',
    "category" TEXT,
    "description" TEXT NOT NULL,
    "amount" REAL NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'CHF',
    "amountChf" REAL,
    "exchangeRate" REAL,
    "date" DATETIME NOT NULL,
    "supplierInvoiceNumber" TEXT,
    "receiptPath" TEXT,
    "notes" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "expenses_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "projects" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "expenses_supplierId_fkey" FOREIGN KEY ("supplierId") REFERENCES "suppliers" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_expenses" ("amount", "amountChf", "category", "createdAt", "currency", "date", "description", "exchangeRate", "expenseType", "id", "notes", "paymentStatus", "projectId", "receiptPath", "supplierId", "supplierInvoiceNumber", "updatedAt") SELECT "amount", "amountChf", "category", "createdAt", "currency", "date", "description", "exchangeRate", "expenseType", "id", "notes", "paymentStatus", "projectId", "receiptPath", "supplierId", "supplierInvoiceNumber", "updatedAt" FROM "expenses";
DROP TABLE "expenses";
ALTER TABLE "new_expenses" RENAME TO "expenses";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
