-- Sentinel "Da classificare" project + suggested project on receipt inbox
ALTER TABLE "projects" ADD COLUMN "isPlaceholder" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "receipt_inbox" ADD COLUMN "suggestedProjectId" TEXT;
