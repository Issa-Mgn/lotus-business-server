-- Migration manuelle: Ajouter la relation userId dans la table licenses avec cascade
-- À exécuter manuellement sur Supabase

-- Étape 1: Ajouter la colonne userId (nullable temporairement)
ALTER TABLE "licenses" ADD COLUMN IF NOT EXISTS "userId" TEXT;

-- Étape 2: Créer l'index unique sur userId
CREATE UNIQUE INDEX IF NOT EXISTS "licenses_userId_key" ON "licenses"("userId");

-- Étape 3: Remplir les userId existants basés sur l'email
UPDATE "licenses" l
SET "userId" = u.id
FROM "users" u
WHERE l.email = u.email;

-- Étape 4: Rendre la colonne userId NOT NULL
ALTER TABLE "licenses" ALTER COLUMN "userId" SET NOT NULL;

-- Étape 5: Ajouter la contrainte de clé étrangère avec CASCADE
ALTER TABLE "licenses" 
ADD CONSTRAINT "licenses_userId_fkey" 
FOREIGN KEY ("userId") REFERENCES "users"("id") 
ON DELETE CASCADE ON UPDATE CASCADE;

-- NOTE: Maintenant, quand un utilisateur est supprimé, sa licence sera automatiquement supprimée
