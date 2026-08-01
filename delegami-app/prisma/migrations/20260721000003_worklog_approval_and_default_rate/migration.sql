-- Approval step for work logs (only APPROVED counts as compenso maturato)
-- + a company-wide default hourly rate to pre-fill new WORKER accounts.
-- Additive ALTERs only — guarded by _applied_migrations.

ALTER TABLE "work_logs" ADD COLUMN "approvedAt" DATETIME;
ALTER TABLE "company_settings" ADD COLUMN "defaultWorkerHourlyRate" REAL NOT NULL DEFAULT 25;
