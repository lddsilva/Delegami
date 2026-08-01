-- Enrich activity_logs with diagnostic context
ALTER TABLE "activity_logs" ADD COLUMN "ipAddress" TEXT;
ALTER TABLE "activity_logs" ADD COLUMN "userAgent" TEXT;
ALTER TABLE "activity_logs" ADD COLUMN "path" TEXT;
ALTER TABLE "activity_logs" ADD COLUMN "success" INTEGER NOT NULL DEFAULT 1;
ALTER TABLE "activity_logs" ADD COLUMN "errorMessage" TEXT;
ALTER TABLE "activity_logs" ADD COLUMN "durationMs" INTEGER;

CREATE INDEX "activity_logs_userId_idx" ON "activity_logs"("userId");
CREATE INDEX "activity_logs_entityType_entityId_idx" ON "activity_logs"("entityType", "entityId");
