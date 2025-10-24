-- DropIndex
DROP INDEX "public"."Auction_endsAt_status_idx";

-- DropIndex
DROP INDEX "public"."Auction_title_idx";

-- DropIndex
DROP INDEX "public"."Auction_vin_key";

-- AlterTable
ALTER TABLE "public"."Auction" ADD COLUMN     "vehicleId" TEXT;

-- CreateTable
CREATE TABLE "public"."Vehicle" (
    "id" TEXT NOT NULL,
    "vin" TEXT NOT NULL,
    "make" TEXT,
    "model" TEXT,
    "year" INTEGER,
    "bodyClass" TEXT,
    "vehicleType" TEXT,
    "odometer" INTEGER,

    CONSTRAINT "Vehicle_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Vehicle_vin_key" ON "public"."Vehicle"("vin");

-- AddForeignKey
ALTER TABLE "public"."Auction" ADD CONSTRAINT "Auction_vehicleId_fkey" FOREIGN KEY ("vehicleId") REFERENCES "public"."Vehicle"("id") ON DELETE SET NULL ON UPDATE CASCADE;
