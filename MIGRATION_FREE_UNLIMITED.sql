-- Migration : FREE illimité + PREMIUM 1 mois
-- Date : 2026-06-16

-- 1. Ajouter la colonne maxSimultaneousLogins
ALTER TABLE "users" 
ADD COLUMN IF NOT EXISTS "maxSimultaneousLogins" INTEGER DEFAULT 1;

-- 2. Rendre expirationDate nullable
ALTER TABLE "users" 
ALTER COLUMN "expirationDate" DROP NOT NULL;

-- 3. Afficher la structure mise à jour
SELECT 
  column_name, 
  data_type, 
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_name = 'users'
AND column_name IN ('expirationDate', 'maxSimultaneousLogins')
ORDER BY ordinal_position;

-- 4. Message de confirmation
DO $$
BEGIN
  RAISE NOTICE '✅ Migration terminée avec succès !';
  RAISE NOTICE 'expirationDate est maintenant nullable';
  RAISE NOTICE 'maxSimultaneousLogins ajouté avec valeur par défaut = 1';
END $$;
