-- Migration manuelle : Ajouter le système de réactions
-- À exécuter sur Supabase

-- 1. Créer l'enum ReactionType
CREATE TYPE "ReactionType" AS ENUM (
  'LIKE',
  'LOVE',
  'HAHA',
  'WOW',
  'SAD',
  'ANGRY',
  'THUMBS_UP',
  'THUMBS_DOWN',
  'FIRE',
  'HEART_EYES',
  'CLAP',
  'THINKING'
);

-- 2. Créer la table reactions
CREATE TABLE "reactions" (
    "id" TEXT NOT NULL,
    "infoId" TEXT NOT NULL,
    "reactionType" "ReactionType" NOT NULL,
    "userId" TEXT,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "reactions_pkey" PRIMARY KEY ("id")
);

-- 3. Ajouter les index pour les performances
CREATE INDEX "reactions_infoId_idx" ON "reactions"("infoId");
CREATE INDEX "reactions_ipAddress_idx" ON "reactions"("ipAddress");

-- 4. Ajouter la contrainte de clé étrangère avec cascade delete
ALTER TABLE "reactions" ADD CONSTRAINT "reactions_infoId_fkey" 
  FOREIGN KEY ("infoId") REFERENCES "infos"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- 5. Vérification (optionnel)
SELECT table_name, column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'reactions';
