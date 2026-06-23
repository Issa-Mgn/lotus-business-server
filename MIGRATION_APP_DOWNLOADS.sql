-- Migration: Ajout de la table app_downloads pour tracker les téléchargements

CREATE TABLE IF NOT EXISTS app_downloads (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  ip_address TEXT,
  user_agent TEXT,
  source TEXT,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Index pour améliorer les performances des requêtes
CREATE INDEX IF NOT EXISTS idx_app_downloads_created_at ON app_downloads(created_at);
CREATE INDEX IF NOT EXISTS idx_app_downloads_source ON app_downloads(source);

-- Vérification
SELECT 'Migration app_downloads terminée' AS status;
