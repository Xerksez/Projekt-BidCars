/*
  Warnings:

  - A unique constraint covering the columns `[source,sourceId]` on the table `Auction` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[auctionId,url]` on the table `AuctionPhoto` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "source_sourceId" ON "public"."Auction"("source", "sourceId");

-- CreateIndex
CREATE UNIQUE INDEX "auctionId_url" ON "public"."AuctionPhoto"("auctionId", "url");
