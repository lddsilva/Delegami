-- Worker identity/matricola number, printed on the agency hours report (bulletin d'heures).
-- Additive ALTER only — guarded by _applied_migrations.

ALTER TABLE "users" ADD COLUMN "identityNumber" TEXT;
