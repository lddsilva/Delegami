-- Toggle for the "Note e condizioni" card in the client quote PDF.
-- Simple column add (no table rebuild) — safe to re-run is guarded by _applied_migrations.
ALTER TABLE "quotes" ADD COLUMN "showClientNotes" INTEGER NOT NULL DEFAULT 1;
