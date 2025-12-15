-- CreateEnum
CREATE TYPE "AppointmentStatus" AS ENUM ('SCHEDULED', 'CANCELLED', 'COMPLETED');

-- AlterTable: Renomear campos e adicionar novos
ALTER TABLE "Appointment" RENAME COLUMN "startAt" TO "startsAt";
ALTER TABLE "Appointment" RENAME COLUMN "endAt" TO "endsAt";
ALTER TABLE "Appointment" ALTER COLUMN "petId" DROP NOT NULL;
ALTER TABLE "Appointment" ALTER COLUMN "serviceId" DROP NOT NULL;
ALTER TABLE "Appointment" ADD COLUMN "status" "AppointmentStatus" NOT NULL DEFAULT 'SCHEDULED';
ALTER TABLE "Appointment" ADD COLUMN "notes" TEXT;
ALTER TABLE "Appointment" ADD COLUMN "cancelledAt" TIMESTAMP(3);

-- CreateIndex
CREATE INDEX "Appointment_tenantId_locationId_startsAt_idx" ON "Appointment"("tenantId", "locationId", "startsAt");
CREATE INDEX "Appointment_tenantId_customerId_startsAt_idx" ON "Appointment"("tenantId", "customerId", "startsAt");
