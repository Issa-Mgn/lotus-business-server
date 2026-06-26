-- Migration : création de la table activity_logs
-- A exécuter dans Supabase SQL Editor si la page Activité retourne une erreur 500.

DO $$
BEGIN
  CREATE TPE "ActivityType" AS ENUM (
    'ADMIN_LOGIN',
    'USER_SUSPENDED',
    'USER_REACTIVATED',
    'LICENSE_UPGRADED',
    'ADMIN_CREATED',
    'EMAIL_SENT',
    'PASSWORD_CHANGED'
  );
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS "activity_logs" (
  "id" TEXT NOT NULL DEFAULT gen_random_uuid()::text,
  "type" "ActivityType" NOT NULL,
  "description" TEXT NOT NULL,
  "adminId" TEXT NOT NULL,
  "targetId" TEXT,
  "metadata" TEXT,
  "ipAddress" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "activity_logs_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "activity_logs"
  DROP CONSTRAINT IF EXISTS "activity_logs_adminId_fkey";

ALTER TABLE "activity_logs"
  ADD CONSTRAINT "activity_logs_adminId_fkey"
  FOREIGN KEY ("adminId") REFERENCES "admins"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "activity_logs"
  DROP CONSTRAINT IF EXISTS "activity_logs_targetId_fkey";

ALTER TABLE "activity_logs"
  ADD CONSTRAINT "activity_logs_targetId_fkey"
  FOREIGN KEY ("targetId") REFERENCES "users"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;

CREATE INDEX IF NOT EXISTS "activity_logs_type_idx" ON "activity_logs"("type");
CREATE INDEX IF NOT EXISTS "activity_logs_adminId_idx" ON "activity_logs"("adminId");
CREATE INDEX IF NOT EXISTS "activity_logs_targetId_idx" ON "activity_logs"("targetId");
CREATE INDEX IF NOT EXISTS "activity_logs_createdAt_idx" ON "activity_logs"("createdAt" DESC);
