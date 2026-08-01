-- Worker employment model (DIRECT vs AGENCY) + agency cost rate, minimal contract fields,
-- WorkLog cost-rate snapshot, and a revision-request flow for locked logs.
-- Additive ALTERs only — guarded by _applied_migrations.

ALTER TABLE "users" ADD COLUMN "employmentType" TEXT NOT NULL DEFAULT 'DIRECT';
ALTER TABLE "users" ADD COLUMN "agencySupplierId" TEXT;
ALTER TABLE "users" ADD COLUMN "costRate" REAL;
ALTER TABLE "users" ADD COLUMN "contractStart" DATETIME;
ALTER TABLE "users" ADD COLUMN "contractType" TEXT;

ALTER TABLE "work_logs" ADD COLUMN "costRate" REAL;
ALTER TABLE "work_logs" ADD COLUMN "revisionRequestedAt" DATETIME;
ALTER TABLE "work_logs" ADD COLUMN "revisionReason" TEXT;
