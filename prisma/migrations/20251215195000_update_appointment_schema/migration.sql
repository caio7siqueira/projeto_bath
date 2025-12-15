-- Align Appointment schema with startsAt/endsAt, status and optional relations

-- Create enum if not exists
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'AppointmentStatus') THEN
    CREATE TYPE "AppointmentStatus" AS ENUM ('SCHEDULED', 'CANCELLED', 'COMPLETED');
  END IF;
END$$;

-- Rename columns startAt/endAt -> startsAt/endsAt
ALTER TABLE "Appointment"
  RENAME COLUMN "startAt" TO "startsAt";
ALTER TABLE "Appointment"
  RENAME COLUMN "endAt" TO "endsAt";

-- Add new columns
ALTER TABLE "Appointment"
  ADD COLUMN IF NOT EXISTS "status" "AppointmentStatus" NOT NULL DEFAULT 'SCHEDULED',
  ADD COLUMN IF NOT EXISTS "notes" TEXT,
  ADD COLUMN IF NOT EXISTS "cancelledAt" TIMESTAMP(3);

-- Make pet/service optional
ALTER TABLE "Appointment"
  ALTER COLUMN "petId" DROP NOT NULL,
  ALTER COLUMN "serviceId" DROP NOT NULL;

-- Indexes to support queries
CREATE INDEX IF NOT EXISTS "Appointment_tenantId_locationId_startsAt_idx" ON "Appointment"("tenantId", "locationId", "startsAt");
CREATE INDEX IF NOT EXISTS "Appointment_tenantId_customerId_startsAt_idx" ON "Appointment"("tenantId", "customerId", "startsAt");
