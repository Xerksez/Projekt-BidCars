-- AlterTable
ALTER TABLE "public"."Auction" ADD COLUMN     "raw" JSONB,
ADD COLUMN     "source" TEXT NOT NULL DEFAULT 'MANUAL',
ADD COLUMN     "sourceId" TEXT,
ADD COLUMN     "sourceUrl" TEXT;
