# 📦 Système de Backup Cloud - Lotus Business

## Vue d'ensemble

Le système de backup permet aux utilisateurs de sauvegarder leurs données (fichiers `.db`) dans le cloud Supabase.

### Stratégie Marketing 💰

- **Utilisateurs FREE** : Données sauvegardées automatiquement mais **pas d'accès**
  - Ils voient la liste de leurs backups
  - Ils ne peuvent pas les télécharger
  - Message : "Passez à PREMIUM pour accéder à vos données"
  - En cas de perte de téléphone → doivent payer pour récupérer leurs données

- **Utilisateurs PREMIUM** : Accès complet
  - Peuvent synchroniser leurs données
  - Peuvent restaurer leurs données à tout moment
  - Téléchargement illimité

## Architecture

### Base de données (Prisma)

```prisma
model UserBackup {
  id              String    @id
  userId          String
  fileName        String
  fileSize        Int
  fileUrl         String?   // null pour FREE
  uploadedAt      DateTime
  deviceId        String?
  deviceName      String?
  isAccessible    Boolean   // false pour FREE, true pour PREMIUM
  accessGrantedAt DateTime? // Date d'accès si accordé
  metadata        Json?
}
```

### Stockage (Supabase Storage)

- **Bucket**: `user-backups` (privé)
- **Structure**: `{userId}/{timestamp}_{filename}.db`
- **Taille max**: 100 MB par fichier
- **Types acceptés**: `.db` (SQLite)

## API Endpoints

### 1. Upload un backup
```
POST /api/backups/upload
Authorization: Bearer {token}
Content-Type: multipart/form-data

Body:
- backup: fichier .db
- fileName: nom du fichier
- deviceId: ID de l'appareil (optionnel)
- deviceName: nom de l'appareil (optionnel)
- metadata: JSON metadata (optionnel)

Réponse:
{
  "message": "Backup sauvegardé...",
  "backup": { ... },
  "isPremium": true/false,
  "upgradeMessage": "..." (si FREE)
}
```

### 2. Lister mes backups
```
GET /api/backups/my-backups
Authorization: Bearer {token}

Réponse:
{
  "backups": [
    {
      "id": "...",
      "fileName": "backup_2026-07-08.db",
      "fileSize": 1024000,
      "uploadedAt": "2026-07-08T...",
      "canDownload": true/false,
      "downloadUrl": "/api/backups/{id}/download" (si PREMIUM)
    }
  ],
  "isPremium": true/false,
  "totalBackups": 5,
  "accessibleBackups": 5 (0 si FREE),
  "upgradeMessage": "..." (si FREE)
}
```

### 3. Télécharger un backup
```
GET /api/backups/{backupId}/download
Authorization: Bearer {token}

Réponse (PREMIUM uniquement):
{
  "downloadUrl": "https://supabase.co/storage/...",
  "fileName": "backup_2026-07-08.db",
  "fileSize": 1024000,
  "expiresIn": 3600 (secondes)
}

Réponse (FREE):
{
  "error": "Accès refusé",
  "message": "Cette fonctionnalité est réservée aux utilisateurs PREMIUM",
  "upgradeRequired": true
}
```

### 4. Supprimer un backup
```
DELETE /api/backups/{backupId}
Authorization: Bearer {token}

Réponse:
{
  "message": "Backup supprimé avec succès"
}
```

### 5. [ADMIN] Accorder l'accès à un backup
```
POST /api/backups/grant-access
Authorization: Bearer {adminToken}

Body:
{
  "backupId": "...",
  "userId": "..."
}

Usage: Après paiement d'un utilisateur FREE pour récupérer ses données
```

## Configuration

### 1. Variables d'environnement

Ajouter dans `.env` :

```env
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_KEY=your_service_role_key_here
```

### 2. Créer le bucket Supabase

```bash
npm run setup:bucket
# ou
node setup-supabase-bucket.js
```

### 3. Migration Prisma

```bash
npm run prisma:migrate
```

## Utilisation côté Mobile

### Upload d'un backup (React Native / Expo)

```javascript
import * as FileSystem from 'expo-file-system';

const uploadBackup = async (dbFilePath, token) => {
  const formData = new FormData();
  
  formData.append('backup', {
    uri: dbFilePath,
    name: 'backup_' + new Date().toISOString() + '.db',
    type: 'application/x-sqlite3'
  });
  
  formData.append('fileName', 'my_backup.db');
  formData.append('deviceId', Constants.deviceId);
  formData.append('deviceName', Constants.deviceName);

  const response = await fetch('https://api.lotusbusiness.com/api/backups/upload', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
    },
    body: formData
  });

  const data = await response.json();
  
  if (!data.isPremium) {
    // Afficher message d'upgrade
    Alert.alert(
      'Backup sauvegardé',
      data.upgradeMessage,
      [
        { text: 'Passer à PREMIUM', onPress: () => navigate('Upgrade') },
        { text: 'Plus tard' }
      ]
    );
  }
};
```

### Téléchargement d'un backup

```javascript
const downloadBackup = async (backupId, token) => {
  const response = await fetch(
    `https://api.lotusbusiness.com/api/backups/${backupId}/download`,
    {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    }
  );

  const data = await response.json();

  if (data.upgradeRequired) {
    // Utilisateur FREE
    Alert.alert(
      'Accès Premium requis',
      data.message,
      [
        { text: 'Passer à PREMIUM', onPress: () => navigate('Upgrade') },
        { text: 'Annuler' }
      ]
    );
    return;
  }

  // Télécharger le fichier
  const downloadResumable = FileSystem.createDownloadResumable(
    data.downloadUrl,
    FileSystem.documentDirectory + data.fileName
  );

  const { uri } = await downloadResumable.downloadAsync();
  console.log('Backup téléchargé:', uri);
};
```

## Flow Marketing pour FREE Users

1. **Upload** : Utilisateur FREE upload son backup → Succès avec message
   ```
   "Backup sauvegardé. Passez à PREMIUM pour y accéder."
   ```

2. **Liste** : Utilisateur voit ses backups mais pas de bouton "Télécharger"
   ```
   [Liste des backups]
   🔒 Passez à PREMIUM pour restaurer vos données
   [Bouton: Upgrade vers PREMIUM]
   ```

3. **Tentative de téléchargement** : Erreur 403 avec message
   ```
   "Cette fonctionnalité est réservée aux utilisateurs PREMIUM.
   Protégez vos données et restaurez-les à tout moment."
   [Bouton: Passer à PREMIUM - 999 FCFA/mois]
   ```

4. **Perte de téléphone** : L'utilisateur contacte le support
   - Support vérifie qu'il a des backups
   - Propose un paiement unique ou upgrade PREMIUM
   - Admin accorde l'accès via `grantBackupAccess`

## Sécurité

- ✅ Authentification JWT requise
- ✅ Fichiers privés (bucket Supabase non-public)
- ✅ URLs signées temporaires (1h pour téléchargement)
- ✅ Vérification que l'utilisateur accède uniquement à ses propres backups
- ✅ Limite de 100 MB par fichier
- ✅ Validation du type de fichier (.db uniquement)

## Tests

### Test en local avec Postman

1. **Upload** (FREE ou PREMIUM):
   ```
   POST http://localhost:5000/api/backups/upload
   Authorization: Bearer {token}
   Body: form-data
   - backup: [fichier .db]
   - fileName: "test_backup.db"
   ```

2. **Liste**:
   ```
   GET http://localhost:5000/api/backups/my-backups
   Authorization: Bearer {token}
   ```

3. **Download** (PREMIUM):
   ```
   GET http://localhost:5000/api/backups/{backupId}/download
   Authorization: Bearer {token}
   ```

## Évolutions futures

- 🔄 Synchronisation automatique planifiée
- 📊 Dashboard admin pour voir les stats de backup
- 💾 Compression automatique des backups
- 🔐 Chiffrement des backups
- 📱 Notification push quand backup réussi
- ⏰ Rétention automatique (garder X derniers backups)
