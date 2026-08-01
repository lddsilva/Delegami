-- Phase 2: employee profile fields, worklog rate snapshot, payments + documents.
-- Additive ALTERs (no table rebuild) + two new tables — guarded by _applied_migrations.

ALTER TABLE "users" ADD COLUMN "phone" TEXT;
ALTER TABLE "users" ADD COLUMN "address" TEXT;
ALTER TABLE "users" ADD COLUMN "hourlyRate" REAL;
ALTER TABLE "users" ADD COLUMN "notes" TEXT;

ALTER TABLE "work_logs" ADD COLUMN "hourlyRate" REAL;
ALTER TABLE "work_logs" ADD COLUMN "amountOverride" REAL;

CREATE TABLE "worker_payments" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "userName" TEXT NOT NULL,
    "amount" REAL NOT NULL,
    "paidAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "method" TEXT,
    "note" TEXT,
    "receiptUrl" TEXT,
    "createdById" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

CREATE INDEX "worker_payments_userId_idx" ON "worker_payments"("userId");

CREATE TABLE "worker_documents" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "fileType" TEXT,
    "category" TEXT NOT NULL DEFAULT 'OTHER',
    "note" TEXT,
    "uploadedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX "worker_documents_userId_idx" ON "worker_documents"("userId");
