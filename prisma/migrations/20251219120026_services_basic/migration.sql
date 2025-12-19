-- Add basic fields to Service
ALTER TABLE "Service"
    ADD COLUMN     "description" TEXT,
    ADD COLUMN     "baseDurationMinutes" INTEGER NOT NULL DEFAULT 30,
    ADD COLUMN     "active" BOOLEAN NOT NULL DEFAULT true;

-- Ensure unique name per tenant
CREATE UNIQUE INDEX "Service_tenantId_name_key" ON "Service"("tenantId", "name");
