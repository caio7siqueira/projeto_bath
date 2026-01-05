/*
  Warnings:

  - A unique constraint covering the columns `[tenantId]` on the table `OmieConnection` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "OmieSalesEvent" ADD COLUMN     "attemptCount" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "lastAttemptAt" TIMESTAMP(3),
ADD COLUMN     "lastErrorCode" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "OmieConnection_tenantId_key" ON "OmieConnection"("tenantId");
