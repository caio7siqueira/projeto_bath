-- Auth/RBAC + Contacts + Pet lifeStatus/allowNotifications

-- Add SUPER_ADMIN to UserRole
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'UserRole') THEN
    CREATE TYPE "UserRole" AS ENUM ('ADMIN', 'STAFF', 'GROOMER', 'SUPER_ADMIN');
  ELSIF NOT EXISTS (
    SELECT 1 FROM pg_enum e
    JOIN pg_type t ON e.enumtypid = t.oid
    WHERE e.enumlabel = 'SUPER_ADMIN' AND t.typname = 'UserRole'
  ) THEN
    ALTER TYPE "UserRole" ADD VALUE 'SUPER_ADMIN';
  END IF;
END$$;

-- Add LifeStatus enum
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'LifeStatus') THEN
    CREATE TYPE "LifeStatus" AS ENUM ('ALIVE', 'DECEASED');
  END IF;
END$$;

-- Extend AppointmentStatus enum
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_enum e
    JOIN pg_type t ON e.enumtypid = t.oid
    WHERE e.enumlabel = 'DONE' AND t.typname = 'AppointmentStatus'
  ) THEN
    ALTER TYPE "AppointmentStatus" ADD VALUE 'DONE';
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_enum e
    JOIN pg_type t ON e.enumtypid = t.oid
    WHERE e.enumlabel = 'RESCHEDULED' AND t.typname = 'AppointmentStatus'
  ) THEN
    ALTER TYPE "AppointmentStatus" ADD VALUE 'RESCHEDULED';
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_enum e
    JOIN pg_type t ON e.enumtypid = t.oid
    WHERE e.enumlabel = 'NO_SHOW' AND t.typname = 'AppointmentStatus'
  ) THEN
    ALTER TYPE "AppointmentStatus" ADD VALUE 'NO_SHOW';
  END IF;
END$$;

-- User.tenantId nullable (SUPER_ADMIN) + FK
ALTER TABLE "User" DROP CONSTRAINT IF EXISTS "User_tenantId_fkey";
ALTER TABLE "User" ALTER COLUMN "tenantId" DROP NOT NULL;
ALTER TABLE "User" ADD CONSTRAINT "User_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Pet lifeStatus + allowNotifications
ALTER TABLE "Pet"
  ADD COLUMN IF NOT EXISTS "lifeStatus" "LifeStatus" NOT NULL DEFAULT 'ALIVE',
  ADD COLUMN IF NOT EXISTS "allowNotifications" BOOLEAN NOT NULL DEFAULT TRUE;

-- RefreshToken rotation with hashed tokens
DROP TABLE IF EXISTS "RefreshToken";
CREATE TABLE "RefreshToken" (
  "id" TEXT NOT NULL,
  "tokenHash" TEXT NOT NULL,
  "jti" TEXT NOT NULL,
  "userId" TEXT,
  "customerId" TEXT,
  "revokedAt" TIMESTAMP(3),
  "replacedByTokenId" TEXT,
  "expiresAt" TIMESTAMP(3) NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "RefreshToken_pkey" PRIMARY KEY ("id")
);
CREATE INDEX IF NOT EXISTS "RefreshToken_tokenHash_idx" ON "RefreshToken"("tokenHash");
CREATE INDEX IF NOT EXISTS "RefreshToken_jti_idx" ON "RefreshToken"("jti");
ALTER TABLE "RefreshToken" ADD CONSTRAINT "RefreshToken_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "RefreshToken" ADD CONSTRAINT "RefreshToken_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- CustomerContact table
CREATE TABLE IF NOT EXISTS "CustomerContact" (
  "id" TEXT NOT NULL,
  "tenantId" TEXT NOT NULL,
  "customerId" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "email" TEXT,
  "phone" TEXT,
  "birthDate" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "CustomerContact_pkey" PRIMARY KEY ("id")
);
CREATE INDEX IF NOT EXISTS "CustomerContact_tenantId_customerId_idx" ON "CustomerContact"("tenantId", "customerId");
CREATE INDEX IF NOT EXISTS "CustomerContact_tenantId_phone_idx" ON "CustomerContact"("tenantId", "phone");
ALTER TABLE "CustomerContact" ADD CONSTRAINT "CustomerContact_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "CustomerContact" ADD CONSTRAINT "CustomerContact_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE CASCADE ON UPDATE CASCADE;
