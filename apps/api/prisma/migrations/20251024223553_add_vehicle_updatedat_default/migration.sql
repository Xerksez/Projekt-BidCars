/*
  Warnings:

  - You are about to drop the column `softCloseSec` on the `Auction` table. All the data in the column will be lost.
  - You are about to drop the column `bodyClass` on the `Vehicle` table. All the data in the column will be lost.
  - You are about to drop the column `vehicleType` on the `Vehicle` table. All the data in the column will be lost.

*/
-- DropIndex
DROP INDEX "public"."Auction_createdAt_idx";

-- DropIndex
DROP INDEX "public"."Auction_startsAt_idx";

-- AlterTable
ALTER TABLE "public"."Auction" DROP COLUMN "softCloseSec",
ADD COLUMN     "auction_house" TEXT,
ADD COLUMN     "buy_now_price" INTEGER,
ADD COLUMN     "currency_code" TEXT,
ADD COLUMN     "est_retail_value" INTEGER,
ADD COLUMN     "location" TEXT,
ADD COLUMN     "lot_number" INTEGER,
ADD COLUMN     "primaryDamage" TEXT,
ADD COLUMN     "sale_date_ts" BIGINT,
ADD COLUMN     "secondaryDamage" TEXT,
ADD COLUMN     "vendor_current_bid" INTEGER;

-- AlterTable
ALTER TABLE "public"."Vehicle" DROP COLUMN "bodyClass",
DROP COLUMN "vehicleType",
ADD COLUMN     "body_style" TEXT,
ADD COLUMN     "color" TEXT,
ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "cylinders" INTEGER,
ADD COLUMN     "drive" TEXT,
ADD COLUMN     "engine_type" TEXT,
ADD COLUMN     "fuel" TEXT,
ADD COLUMN     "keys_present" BOOLEAN,
ADD COLUMN     "series" TEXT,
ADD COLUMN     "transmission" TEXT,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "vehicle_type" TEXT;

-- CreateTable
CREATE TABLE "public"."AuctionActiveBid" (
    "id" TEXT NOT NULL,
    "auctionId" TEXT NOT NULL,
    "sale_date_ts" BIGINT,
    "currentBid" INTEGER,
    "bidUpdated" INTEGER,
    "dateUpdated" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuctionActiveBid_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "AuctionActiveBid_auctionId_createdAt_idx" ON "public"."AuctionActiveBid"("auctionId", "createdAt");

-- CreateIndex
CREATE INDEX "Auction_auction_house_idx" ON "public"."Auction"("auction_house");

-- CreateIndex
CREATE INDEX "Auction_location_idx" ON "public"."Auction"("location");

-- CreateIndex
CREATE INDEX "Auction_lot_number_idx" ON "public"."Auction"("lot_number");

-- CreateIndex
CREATE INDEX "Auction_est_retail_value_idx" ON "public"."Auction"("est_retail_value");

-- CreateIndex
CREATE INDEX "Auction_primaryDamage_idx" ON "public"."Auction"("primaryDamage");

-- CreateIndex
CREATE INDEX "Auction_secondaryDamage_idx" ON "public"."Auction"("secondaryDamage");

-- CreateIndex
CREATE INDEX "Auction_currency_code_idx" ON "public"."Auction"("currency_code");

-- CreateIndex
CREATE INDEX "Auction_vehicleId_idx" ON "public"."Auction"("vehicleId");

-- CreateIndex
CREATE INDEX "Vehicle_make_model_idx" ON "public"."Vehicle"("make", "model");

-- CreateIndex
CREATE INDEX "Vehicle_year_idx" ON "public"."Vehicle"("year");

-- AddForeignKey
ALTER TABLE "public"."AuctionActiveBid" ADD CONSTRAINT "AuctionActiveBid_auctionId_fkey" FOREIGN KEY ("auctionId") REFERENCES "public"."Auction"("id") ON DELETE CASCADE ON UPDATE CASCADE;
