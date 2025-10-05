-- CreateIndex
CREATE INDEX "Auction_startsAt_idx" ON "Auction"("startsAt");

-- CreateIndex
CREATE INDEX "Auction_createdAt_idx" ON "Auction"("createdAt");

-- CreateIndex
CREATE INDEX "Auction_currentPrice_idx" ON "Auction"("currentPrice");

-- indeks pod status + sortowanie po endsAt
CREATE INDEX IF NOT EXISTS "auction_status_endsat_idx"
  ON "Auction" ("status", "endsAt" DESC);

-- indeks po VIN (dokładny/contains – i tak pomoże)
CREATE INDEX IF NOT EXISTS "auction_vin_idx"
  ON "Auction" ("vin");

-- wyrażeniowy indeks dla case-insensitive po tytule
CREATE INDEX IF NOT EXISTS "auction_title_ci"
  ON "Auction" (LOWER("title"));
