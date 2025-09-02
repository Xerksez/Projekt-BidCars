-- CreateTable
CREATE TABLE "public"."AuctionPhoto" (
    "id" TEXT NOT NULL,
    "auctionId" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "sort" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuctionPhoto_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "AuctionPhoto_auctionId_sort_idx" ON "public"."AuctionPhoto"("auctionId", "sort");

-- AddForeignKey
ALTER TABLE "public"."AuctionPhoto" ADD CONSTRAINT "AuctionPhoto_auctionId_fkey" FOREIGN KEY ("auctionId") REFERENCES "public"."Auction"("id") ON DELETE CASCADE ON UPDATE CASCADE;
