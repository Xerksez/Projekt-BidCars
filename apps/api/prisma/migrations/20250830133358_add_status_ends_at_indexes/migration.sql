-- CreateIndex
CREATE INDEX "Auction_status_idx" ON "public"."Auction"("status");

-- CreateIndex
CREATE INDEX "Auction_endsAt_idx" ON "public"."Auction"("endsAt");
