-- AlterTable
ALTER TABLE "quote_items" ADD COLUMN "marginPercent" REAL;

-- AlterTable
ALTER TABLE "quotes" ADD COLUMN "parentQuoteId" TEXT;

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_company_settings" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "address" TEXT,
    "city" TEXT,
    "postalCode" TEXT,
    "country" TEXT NOT NULL DEFAULT 'CH',
    "phone" TEXT,
    "email" TEXT,
    "iban" TEXT,
    "vatNumber" TEXT,
    "registrationNumber" TEXT,
    "logoPath" TEXT,
    "defaultCurrency" TEXT NOT NULL DEFAULT 'CHF',
    "defaultLanguage" TEXT NOT NULL DEFAULT 'it',
    "accountantEmail" TEXT,
    "defaultMargin" REAL NOT NULL DEFAULT 0,
    "paymentTerms" TEXT,
    "quoteFooterText" TEXT,
    "invoiceFooterText" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_company_settings" ("accountantEmail", "address", "city", "country", "createdAt", "defaultCurrency", "defaultLanguage", "email", "iban", "id", "invoiceFooterText", "logoPath", "name", "paymentTerms", "phone", "postalCode", "quoteFooterText", "registrationNumber", "updatedAt", "vatNumber") SELECT "accountantEmail", "address", "city", "country", "createdAt", "defaultCurrency", "defaultLanguage", "email", "iban", "id", "invoiceFooterText", "logoPath", "name", "paymentTerms", "phone", "postalCode", "quoteFooterText", "registrationNumber", "updatedAt", "vatNumber" FROM "company_settings";
DROP TABLE "company_settings";
ALTER TABLE "new_company_settings" RENAME TO "company_settings";
CREATE TABLE "new_invoices" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "invoiceNumber" TEXT NOT NULL,
    "version" INTEGER NOT NULL DEFAULT 1,
    "parentInvoiceId" TEXT,
    "projectId" TEXT NOT NULL,
    "quoteId" TEXT,
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "issueDate" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "dueDate" DATETIME,
    "subtotal" REAL NOT NULL DEFAULT 0,
    "taxRate" REAL NOT NULL DEFAULT 8.1,
    "taxAmount" REAL NOT NULL DEFAULT 0,
    "total" REAL NOT NULL DEFAULT 0,
    "notes" TEXT,
    "paidAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "invoices_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "projects" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "invoices_quoteId_fkey" FOREIGN KEY ("quoteId") REFERENCES "quotes" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_invoices" ("createdAt", "dueDate", "id", "invoiceNumber", "issueDate", "notes", "paidAt", "projectId", "quoteId", "status", "subtotal", "taxAmount", "taxRate", "total", "updatedAt") SELECT "createdAt", "dueDate", "id", "invoiceNumber", "issueDate", "notes", "paidAt", "projectId", "quoteId", "status", "subtotal", "taxAmount", "taxRate", "total", "updatedAt" FROM "invoices";
DROP TABLE "invoices";
ALTER TABLE "new_invoices" RENAME TO "invoices";
CREATE UNIQUE INDEX "invoices_invoiceNumber_key" ON "invoices"("invoiceNumber");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
