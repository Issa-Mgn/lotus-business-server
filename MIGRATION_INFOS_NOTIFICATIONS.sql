-- Migration : Création des tables infos et notifications
-- Date : 2026-06-17
-- À exécuter sur Supabase SQL Editor

-- ============================================
-- 1. Table infos (annonces avec images)
-- ============================================

CREATE TABLE IF NOT EXISTS "infos" (
  "id" TEXT NOT NULL PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  "title" TEXT NOT NULL,
  "content" TEXT NOT NULL,
  "imageUrl" TEXT,
  "imageFileId" TEXT,
  "imageFilePath" TEXT,
  "thumbnailUrl" TEXT,
  "published" BOOLEAN NOT NULL DEFAULT true,
  "publishedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Index pour optimiser les requêtes
CREATE INDEX IF NOT EXISTS "infos_published_idx" ON "infos"("published");
CREATE INDEX IF NOT EXISTS "infos_publishedAt_idx" ON "infos"("publishedAt" DESC);

-- Commentaires
COMMENT ON TABLE "infos" IS 'Table des annonces/informations avec images (ImageKit)';
COMMENT ON COLUMN "infos"."imageUrl" IS 'URL de l''image sur ImageKit';
COMMENT ON COLUMN "infos"."imageFileId" IS 'ID du fichier ImageKit pour suppression';
COMMENT ON COLUMN "infos"."imageFilePath" IS 'Chemin du fichier sur ImageKit';
COMMENT ON COLUMN "infos"."thumbnailUrl" IS 'URL de la miniature ImageKit';

-- ============================================
-- 2. Enum NotificationType
-- ============================================

DO $$ BEGIN
  CREATE TYPE "NotificationType" AS ENUM (
    'LICENSE_EXPIRED',
    'LICENSE_EXPIRING_SOON',
    'NEW_USER',
    'USER_SUSPENDED',
    'USER_UPGRADED'
  );
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- ============================================
-- 3. Table notifications
-- ============================================

CREATE TABLE IF NOT EXISTS "notifications" (
  "id" TEXT NOT NULL PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  "type" "NotificationType" NOT NULL,
  "title" TEXT NOT NULL,
  "message" TEXT NOT NULL,
  "userId" TEXT,
  "isRead" BOOLEAN NOT NULL DEFAULT false,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Clé étrangère vers users (avec suppression en cascade)
ALTER TABLE "notifications" 
  DROP CONSTRAINT IF EXISTS "notifications_userId_fkey";

ALTER TABLE "notifications" 
  ADD CONSTRAINT "notifications_userId_fkey" 
  FOREIGN KEY ("userId") 
  REFERENCES "users"("id") 
  ON DELETE CASCADE 
  ON UPDATE CASCADE;

-- Index pour optimiser les requêtes
CREATE INDEX IF NOT EXISTS "notifications_userId_idx" ON "notifications"("userId");
CREATE INDEX IF NOT EXISTS "notifications_isRead_idx" ON "notifications"("isRead");
CREATE INDEX IF NOT EXISTS "notifications_createdAt_idx" ON "notifications"("createdAt" DESC);
CREATE INDEX IF NOT EXISTS "notifications_type_idx" ON "notifications"("type");

-- Commentaires
COMMENT ON TABLE "notifications" IS 'Table des notifications push pour l''app mobile';
COMMENT ON COLUMN "notifications"."userId" IS 'ID utilisateur ciblé (NULL = notification globale)';
COMMENT ON COLUMN "notifications"."isRead" IS 'Statut de lecture de la notification';

-- ============================================
-- 4. Fonction de mise à jour automatique du timestamp
-- ============================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW."updatedAt" = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger pour mettre à jour automatiquement updatedAt sur infos
DROP TRIGGER IF EXISTS "update_infos_updated_at" ON "infos";
CREATE TRIGGER "update_infos_updated_at"
  BEFORE UPDATE ON "infos"
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- 5. Vérification des tables créées
-- ============================================

SELECT 
  table_name,
  (SELECT count(*) FROM information_schema.columns WHERE table_name = t.table_name) as column_count
FROM information_schema.tables t
WHERE table_schema = 'public'
  AND table_name IN ('infos', 'notifications')
ORDER BY table_name;

-- ============================================
-- 6. Afficher la structure des tables
-- ============================================

-- Structure table infos
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_name = 'infos'
ORDER BY ordinal_position;

-- Structure table notifications
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_name = 'notifications'
ORDER BY ordinal_position;

-- ============================================
-- 7. Message de confirmation
-- ============================================

DO $$
BEGIN
  RAISE NOTICE '✅ Migration terminée avec succès !';
  RAISE NOTICE '';
  RAISE NOTICE '📋 Tables créées :';
  RAISE NOTICE '  ✓ infos - Table des annonces avec images';
  RAISE NOTICE '  ✓ notifications - Table des notifications push';
  RAISE NOTICE '';
  RAISE NOTICE '🔗 Relations :';
  RAISE NOTICE '  ✓ notifications.userId → users.id (CASCADE)';
  RAISE NOTICE '';
  RAISE NOTICE '📊 Index créés pour optimiser les performances';
  RAISE NOTICE '';
  RAISE NOTICE '🎉 Vous pouvez maintenant utiliser les pages Infos et Notifications !';
END $$;
