-- CreateIndex
CREATE INDEX "Auction_endsAt_status_idx" ON "Auction"("endsAt", "status" ASC);

-- CreateIndex
CREATE INDEX "Auction_title_idx" ON "Auction"("title");

-- CreateIndex
CREATE INDEX "Auction_vin_idx" ON "Auction"("vin");

-- RenameIndex
ALTER INDEX "source_sourceId" RENAME TO "Auction_source_sourceId_key";
