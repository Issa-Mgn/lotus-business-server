# 🗄️ Guide : Créer les tables Infos et Notifications sur Supabase

## 📋 Résumé

Ce guide explique comment créer les tables `infos` et `notifications` dans ta base de données Supabase.

---

## 🎯 Tables à créer

### 1. Table `infos`
Stocke les annonces/informations avec :
- Titre et contenu
- URL de l'image ImageKit
- Métadonnées ImageKit (fileId, filePath, thumbnail)
- Statut de publication

### 2. Table `notifications`
Stocke les notifications push pour l'app mobile avec :
- Type de notification
- Titre et message
- Utilisateur ciblé (ou NULL pour notification globale)
- Statut de lecture

---

## 🚀 Étapes d'exécution

### Étape 1 : Accéder à Supabase SQL Editor

1. Va sur https://supabase.com/dashboard
2. Sélectionne ton projet **Lotus Business**
3. Dans le menu de gauche, clique sur **SQL Editor**
4. Clique sur **"New query"**

### Étape 2 : Copier le script SQL

1. Ouvre le fichier `MIGRATION_INFOS_NOTIFICATIONS.sql`
2. Copie **TOUT** le contenu du fichier
3. Colle dans l'éditeur SQL de Supabase

### Étape 3 : Exécuter le script

1. Clique sur le bouton **"Run"** (ou Ctrl+Enter)
2. Attends quelques secondes
3. Vérifie qu'il n'y a pas d'erreur

### Étape 4 : Vérifier la création

Tu devrais voir ce message dans les résultats :

```
✅ Migration terminée avec succès !

📋 Tables créées :
  ✓ infos - Table des annonces avec images
  ✓ notifications - Table des notifications push

🔗 Relations :
  ✓ notifications.userId → users.id (CASCADE)

📊 Index créés pour optimiser les performances

🎉 Vous pouvez maintenant utiliser les pages Infos et Notifications !
```

### Étape 5 : Vérifier dans l'interface

1. Va dans **Table Editor** (menu de gauche)
2. Tu devrais voir deux nouvelles tables :
   - ✅ `infos`
   - ✅ `notifications`

---

## 📊 Structure des tables

### Table `infos`

| Colonne | Type | Description |
|---------|------|-------------|
| id | TEXT (UUID) | Identifiant unique |
| title | TEXT | Titre de l'annonce |
| content | TEXT | Contenu de l'annonce |
| imageUrl | TEXT (nullable) | URL de l'image sur ImageKit |
| imageFileId | TEXT (nullable) | ID ImageKit pour suppression |
| imageFilePath | TEXT (nullable) | Chemin sur ImageKit |
| thumbnailUrl | TEXT (nullable) | URL miniature |
| published | BOOLEAN | Statut de publication (défaut: true) |
| publishedAt | TIMESTAMP | Date de publication |
| createdAt | TIMESTAMP | Date de création |
| updatedAt | TIMESTAMP | Date de mise à jour |

**Index créés** :
- `infos_published_idx` sur `published`
- `infos_publishedAt_idx` sur `publishedAt` (DESC)

### Table `notifications`

| Colonne | Type | Description |
|---------|------|-------------|
| id | TEXT (UUID) | Identifiant unique |
| type | NotificationType | Type de notification (enum) |
| title | TEXT | Titre de la notification |
| message | TEXT | Message de la notification |
| userId | TEXT (nullable) | ID utilisateur ciblé (NULL = globale) |
| isRead | BOOLEAN | Statut de lecture (défaut: false) |
| createdAt | TIMESTAMP | Date de création |

**Relation** :
- `userId` → `users.id` (CASCADE)

**Index créés** :
- `notifications_userId_idx` sur `userId`
- `notifications_isRead_idx` sur `isRead`
- `notifications_createdAt_idx` sur `createdAt` (DESC)
- `notifications_type_idx` sur `type`

**Types de notification (enum)** :
- `LICENSE_EXPIRED` - Licence expirée
- `LICENSE_EXPIRING_SOON` - Licence expire bientôt
- `NEW_USER` - Nouvel utilisateur
- `USER_SUSPENDED` - Utilisateur suspendu
- `USER_UPGRADED` - Utilisateur upgradé

---

## 🔄 Après la migration

### Régénérer Prisma Client

Pour que Prisma reconnaisse les nouvelles tables :

```bash
cd server
npm run prisma:generate
```

Ou manuellement :
```bash
npx prisma generate
```

### Redémarrer le serveur

```bash
npm run dev
```

---

## 🧪 Tester les nouvelles tables

### Test 1 : Créer une info

**Via Postman ou cURL** :
```http
POST /api/admin/infos
Authorization: Bearer {admin_token}
Content-Type: application/json

{
  "title": "Nouvelle promotion",
  "content": "Profitez de -20% sur tous les produits !",
  "published": true
}
```

**Via Dashboard** :
1. Va sur `/infos`
2. Remplis le formulaire
3. Clique sur "Publier"

### Test 2 : Créer une notification

**Via Postman ou cURL** :
```http
POST /api/notifications
Authorization: Bearer {admin_token}
Content-Type: application/json

{
  "type": "NEW_USER",
  "title": "Bienvenue !",
  "message": "Merci d'avoir rejoint Lotus Business"
}
```

**Via Dashboard** :
1. Va sur `/notifications`
2. Remplis le formulaire
3. Clique sur "Envoyer"

---

## 🐛 Résolution de problèmes

### Erreur : "relation 'infos' already exists"

**Solution** : La table existe déjà. Tu peux :
1. Ignorer l'erreur (le script utilise `IF NOT EXISTS`)
2. Ou supprimer la table d'abord : `DROP TABLE IF EXISTS "infos" CASCADE;`

### Erreur : "type 'NotificationType' already exists"

**Solution** : Le type enum existe déjà. Le script gère ce cas automatiquement.

### Erreur : "foreign key constraint failed"

**Solution** : La table `users` n'existe pas. Exécute d'abord les migrations principales.

### Erreur Prisma : "Table 'infos' not found"

**Solutions** :
1. Vérifie que la migration a bien été exécutée sur Supabase
2. Régénère Prisma : `npm run prisma:generate`
3. Redémarre le serveur

---

## 📊 Vérification manuelle

### Compter les lignes

```sql
-- Compter les infos
SELECT COUNT(*) FROM infos;

-- Compter les notifications
SELECT COUNT(*) FROM notifications;
```

### Voir les données

```sql
-- Dernières infos
SELECT id, title, published, createdAt 
FROM infos 
ORDER BY createdAt DESC 
LIMIT 5;

-- Dernières notifications
SELECT id, type, title, "isRead", "createdAt" 
FROM notifications 
ORDER BY "createdAt" DESC 
LIMIT 5;
```

---

## ✅ Checklist

- [ ] Script SQL copié et exécuté sur Supabase
- [ ] Aucune erreur dans les résultats
- [ ] Tables `infos` et `notifications` visibles dans Table Editor
- [ ] Prisma client régénéré (`npm run prisma:generate`)
- [ ] Serveur redémarré
- [ ] Test création info via dashboard
- [ ] Test création notification via dashboard

---

## 🎉 C'est terminé !

Les tables `infos` et `notifications` sont maintenant créées sur Supabase et prêtes à être utilisées dans le dashboard ! 🚀

**Prochaines étapes** :
1. Tester les pages `/infos` et `/notifications` dans le dashboard
2. Intégrer les notifications dans l'app mobile
3. Tester l'upload d'images sur ImageKit
