-- Free-text workplace/location field per work log, shown to both worker
-- and admin and printed on the worker PDF report.
-- Additive ALTER only — guarded by _applied_migrations.

ALTER TABLE "work_logs" ADD COLUMN "location" TEXT;
