/*
  Warnings:

  - You are about to drop the `rateLimit` table. If the table is not empty, all the data it contains will be lost.

*/
-- AlterTable
ALTER TABLE "StripeEvent" ADD COLUMN     "receivedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ALTER COLUMN "processedAt" DROP NOT NULL,
ALTER COLUMN "processedAt" DROP DEFAULT;

-- DropTable
DROP TABLE "rateLimit";
