# 🧪 Test du système de backup en local

## Prérequis

1. **Supabase configuré** avec les credentials dans `.env`
2. **Base de données** avec le schéma mis à jour
3. **Un fichier `.db` de test** pour uploader

## Étape 1 : Configurer Supabase

### 1.1 Ajouter les variables dans `.env`

```env
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_KEY=your_service_role_key_here
```

### 1.2 Créer le bucket

```bash
node setup-supabase-bucket.js
```

Résultat attendu :
```
✅ Bucket "user-backups" créé avec succès!
```

## Étape 2 : Démarrer le serveur

```bash
npm run dev
```

Le serveur démarre sur `http://localhost:5000`

## Étape 3 : Tester avec Postman

### 3.1 Créer un fichier .db de test

Créer un fichier nommé `test_backup.db` (peut être vide ou contenir des données SQLite).

### 3.2 Se connecter en tant qu'utilisateur

**Login utilisateur FREE :**
```
POST http://localhost:5000/api/auth/login
Body (JSON):
{
  "licenseKey": "LOT-XXXX-XXXX-XXXX"
}

Réponse:
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": { ... }
}
```

Copier le `token` pour les prochaines requêtes.

### 3.3 Upload un backup (FREE)

```
POST http://localhost:5000/api/backups/upload
Headers:
- Authorization: Bearer {token}
- Content-Type: multipart/form-data

Body (form-data):
- backup: [sélectionner le fichier test_backup.db]
- fileName: "test_backup.db"
- deviceId: "device-123"
- deviceName: "iPhone 13"

Réponse attendue (FREE):
{
  "message": "Backup sauvegardé. Passez à PREMIUM pour y accéder.",
  "backup": {
    "id": "...",
    "fileName": "test_backup.db",
    "fileSize": 1024,
    "uploadedAt": "2026-07-08T...",
    "isAccessible": false,
    "canDownload": false
  },
  "isPremium": false,
  "upgradeMessage": "Passez à PREMIUM pour synchroniser..."
}
```

### 3.4 Lister les backups

```
GET http://localhost:5000/api/backups/my-backups
Headers:
- Authorization: Bearer {token}

Réponse (FREE):
{
  "backups": [
    {
      "id": "...",
      "fileName": "test_backup.db",
      "fileSize": 1024,
      "uploadedAt": "2026-07-08T...",
      "canDownload": false,
      "downloadUrl": null
    }
  ],
  "isPremium": false,
  "totalBackups": 1,
  "accessibleBackups": 0,
  "upgradeMessage": "Passez à PREMIUM pour accéder à vos backups."
}
```

### 3.5 Tenter de télécharger (FREE) - DEVRAIT ÉCHOUER

```
GET http://localhost:5000/api/backups/{backupId}/download
Headers:
- Authorization: Bearer {token}

Réponse attendue (403):
{
  "error": "Accès refusé",
  "message": "Cette fonctionnalité est réservée aux utilisateurs PREMIUM.",
  "upgradeRequired": true,
  "upgradeUrl": "/upgrade-premium"
}
```

## Étape 4 : Tester avec utilisateur PREMIUM

### 4.1 Upgrade un utilisateur vers PREMIUM (via admin)

```
POST http://localhost:5000/api/admin/upgrade-premium
Headers:
- Authorization: Bearer {adminToken}

Body (JSON):
{
  "userId": "user-id-ici",
  "subscriptionType": "MONTHLY"
}
```

### 4.2 Upload un backup (PREMIUM)

Refaire l'upload (étape 3.3) avec un utilisateur PREMIUM.

Réponse attendue (PREMIUM):
```json
{
  "message": "Backup sauvegardé et accessible dans le cloud",
  "backup": {
    "id": "...",
    "fileName": "test_backup.db",
    "fileSize": 1024,
    "uploadedAt": "2026-07-08T...",
    "isAccessible": true,
    "canDownload": true
  },
  "isPremium": true,
  "upgradeMessage": null
}
```

### 4.3 Télécharger un backup (PREMIUM) - DEVRAIT RÉUSSIR

```
GET http://localhost:5000/api/backups/{backupId}/download
Headers:
- Authorization: Bearer {premiumToken}

Réponse attendue (200):
{
  "message": "Lien de téléchargement généré",
  "downloadUrl": "https://xxxx.supabase.co/storage/v1/object/sign/user-backups/...",
  "fileName": "test_backup.db",
  "fileSize": 1024,
  "expiresIn": 3600
}
```

Copier le `downloadUrl` et l'ouvrir dans le navigateur pour télécharger le fichier.

## Étape 5 : Vérifier dans Supabase

1. Aller sur https://supabase.com/dashboard
2. Sélectionner votre projet
3. Aller dans **Storage** → **user-backups**
4. Vous devriez voir les dossiers par `userId` avec les fichiers `.db`

## Étape 6 : Test Admin - Accorder l'accès à un FREE

Simuler un utilisateur FREE qui a perdu son téléphone et paye pour récupérer ses données.

```
POST http://localhost:5000/api/backups/grant-access
Headers:
- Authorization: Bearer {adminToken}

Body (JSON):
{
  "backupId": "backup-id-du-free-user",
  "userId": "user-id-du-free-user"
}

Réponse:
{
  "message": "Accès au backup accordé",
  "backup": {
    ...
    "isAccessible": true,
    "accessGrantedAt": "2026-07-08T..."
  }
}
```

Maintenant le FREE user peut télécharger CE backup spécifique (même s'il est toujours FREE).

## Checklist de validation

- [x] Bucket Supabase créé
- [ ] Upload backup FREE → isAccessible = false
- [ ] Upload backup PREMIUM → isAccessible = true
- [ ] Liste backups FREE → downloadUrl = null
- [ ] Liste backups PREMIUM → downloadUrl présent
- [ ] Download FREE → 403 Accès refusé
- [ ] Download PREMIUM → URL de téléchargement valide
- [ ] Admin grant access → FREE peut télécharger le backup spécifique
- [ ] Fichier visible dans Supabase Storage

## Dépannage

### Erreur "Bucket not found"
```bash
node setup-supabase-bucket.js
```

### Erreur "SUPABASE_URL is not defined"
Vérifier que les variables sont dans `.env` et redémarrer le serveur.

### Erreur lors de l'upload
- Vérifier que le fichier fait moins de 100 MB
- Vérifier que l'extension est `.db`
- Vérifier les credentials Supabase

### Erreur 401 lors du download
- Vérifier que le token JWT est valide
- Vérifier que l'utilisateur est le propriétaire du backup
