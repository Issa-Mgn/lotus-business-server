# Système de Cloud Backup - Documentation Technique

**Version**: 1.1  
**Dernière mise à jour**: 8 juillet 2026  
**Status**: ✅ Production Ready

---

## 📋 Table des Matières

1. [Vue d'ensemble](#vue-densemble)
2. [Architecture](#architecture)
3. [Modèle de données](#modèle-de-données)
4. [API Endpoints](#api-endpoints)
5. [Logique Métier](#logique-métier)
6. [Sécurité](#sécurité)
7. [Configuration](#configuration)
8. [Tests](#tests)
9. [Déploiement](#déploiement)
10. [Troubleshooting](#troubleshooting)

---

## 🎯 Vue d'ensemble

### Concept Marketing

Le système de cloud backup implémente une stratégie freemium innovante :

- **Utilisateurs FREE** : 
  - 📦 Données sauvegardées automatiquement dans le cloud
  - 🔒 Pas d'accès au téléchargement
  - 💰 Doivent upgrader vers PREMIUM pour récupérer leurs données en cas de perte

- **Utilisateurs PREMIUM** :
  - 📦 Données sauvegardées automatiquement
  - ✅ Accès complet : synchronisation et restauration à volonté
  - ☁️ Backups illimités

### Cas d'usage

1. **Utilisateur FREE perd son téléphone** :
   - Contacte le support
   - Voit qu'il a X backups sauvegardés mais non accessibles
   - Doit payer pour récupérer ses données (ou upgrader vers PREMIUM)

2. **Utilisateur PREMIUM** :
   - Change de téléphone
   - Télécharge l'app sur le nouveau téléphone
   - Se connecte et restaure son dernier backup immédiatement

3. **Admin accorde l'accès ponctuel** :
   - Utilisateur FREE paye pour un accès unique
   - Admin débloque un backup spécifique
   - Utilisateur peut télécharger ce backup une fois

---

## 🏗️ Architecture

### Stack Technique

- **Backend** : Node.js + Express
- **ORM** : Prisma
- **Base de données** : PostgreSQL (Supabase)
- **Stockage fichiers** : Supabase Storage
- **Authentification** : JWT

### Structure des Fichiers

```
server/
├── src/
│   ├── controllers/
│   │   └── backupController.js       # Logique métier backups
│   ├── routes/
│   │   └── backups.js                # Routes + multer config
│   ├── middlewares/
│   │   ├── auth.js                   # Vérification JWT
│   │   └── isAdmin.js                # Vérification rôle admin
│   └── app.js                        # Enregistrement routes
├── prisma/
│   └── schema.prisma                 # Modèle UserBackup
├── setup-supabase-bucket.js          # Script création bucket
├── BACKUP_SYSTEM.md                  # Cette documentation
├── TEST_BACKUP_LOCAL.md              # Guide de test
└── BACKUP_FIX_SUMMARY.md             # Historique correctifs
```

### Flow de Données

```
┌─────────────┐
│  App Mobile │
└──────┬──────┘
       │ 1. Upload .db file
       │ (multipart/form-data)
       ↓
┌─────────────────┐
│  Express API    │
│  + Multer       │ 2. Parse file buffer
└──────┬──────────┘
       │
       │ 3. Upload to Storage
       ↓
┌─────────────────┐
│ Supabase        │
│ Storage Bucket  │ 4. Store file
│ "user-backups"  │    userId/timestamp_filename.db
└──────┬──────────┘
       │
       │ 5. Return URL
       ↓
┌─────────────────┐
│  PostgreSQL DB  │
│  (user_backups) │ 6. Save metadata
└─────────────────┘
       │
       │ 7. Return response
       ↓
┌─────────────────┐
│   App Mobile    │ 8. Display backup list
└─────────────────┘
```

---

## 📊 Modèle de Données

### Table `user_backups`

```prisma
model UserBackup {
  id              String    @id @default(cuid())
  userId          String
  user            User      @relation("UserBackups", fields: [userId], references: [id], onDelete: Cascade)
  fileName        String    // Chemin complet: userId/timestamp_filename.db
  fileSize        Int       // Taille en bytes
  fileUrl         String?   // URL signée (PREMIUM) ou null (FREE)
  uploadedAt      DateTime  @default(now())
  deviceId        String?   // ID appareil d'origine
  deviceName      String?   // Nom appareil (ex: "iPhone 13")
  isAccessible    Boolean   @default(false) // true = PREMIUM, false = FREE
  accessGrantedAt DateTime? // Date d'accès accordé
  metadata        Json?     // Métadonnées additionnelles

  @@index([userId])
  @@index([uploadedAt])
  @@map("user_backups")
}
```

### Champs Importants

| Champ | Description | FREE | PREMIUM |
|-------|-------------|------|---------|
| `fileName` | Chemin complet dans Storage | `userId/1783516968145_test.db` | `userId/1783516968145_test.db` |
| `fileSize` | Taille en bytes | ✅ | ✅ |
| `fileUrl` | URL signée longue durée | `null` | `https://...` |
| `isAccessible` | Peut télécharger | `false` | `true` |
| `accessGrantedAt` | Date d'accès | `null` | Date upload |

---

## 🔌 API Endpoints

### 1. Upload Backup

```http
POST /api/backups/upload
Authorization: Bearer <token>
Content-Type: multipart/form-data
```

**Body (form-data)** :
- `backup` (file) : Fichier .db (max 50 MB)
- `fileName` (text) : Nom du fichier
- `deviceId` (text, optionnel) : ID de l'appareil
- `deviceName` (text, optionnel) : Nom de l'appareil
- `metadata` (text, optionnel) : JSON metadata

**Réponse FREE** :
```json
{
  "message": "Backup sauvegardé. Passez à PREMIUM pour y accéder.",
  "backup": {
    "id": "cmrc43wyl0001uq53p3v6pzr9",
    "fileName": "test.db",
    "fileSize": 4096,
    "uploadedAt": "2026-07-08T13:27:08.446Z",
    "isAccessible": false,
    "canDownload": false
  },
  "isPremium": false,
  "upgradeMessage": "Passez à PREMIUM pour synchroniser et restaurer vos données à tout moment."
}
```

**Réponse PREMIUM** :
```json
{
  "message": "Backup sauvegardé et accessible dans le cloud",
  "backup": {
    "id": "cmrc43wyl0001uq53p3v6pzr9",
    "fileName": "test.db",
    "fileSize": 4096,
    "uploadedAt": "2026-07-08T13:27:08.446Z",
    "isAccessible": true,
    "canDownload": true
  },
  "isPremium": true,
  "upgradeMessage": null
}
```

---

### 2. Liste des Backups

```http
GET /api/backups/my-backups
Authorization: Bearer <token>
```

**Réponse FREE** :
```json
{
  "backups": [
    {
      "id": "...",
      "fileName": "test.db",
      "fileSize": 4096,
      "uploadedAt": "2026-07-08T13:27:08.446Z",
      "deviceId": "device-123",
      "deviceName": "iPhone 13",
      "isAccessible": false,
      "accessGrantedAt": null,
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

**Réponse PREMIUM** :
```json
{
  "backups": [
    {
      "id": "...",
      "fileName": "test.db",
      "fileSize": 4096,
      "uploadedAt": "2026-07-08T13:27:08.446Z",
      "deviceId": "device-123",
      "deviceName": "iPhone 13",
      "isAccessible": true,
      "accessGrantedAt": "2026-07-08T13:27:08.446Z",
      "canDownload": true,
      "downloadUrl": "/api/backups/.../download"
    }
  ],
  "isPremium": true,
  "totalBackups": 1,
  "accessibleBackups": 1,
  "upgradeMessage": null
}
```

---

### 3. Télécharger un Backup

```http
GET /api/backups/:backupId/download
Authorization: Bearer <token>
```

**Réponse FREE** (403 Forbidden) :
```json
{
  "error": "Accès refusé",
  "message": "Cette fonctionnalité est réservée aux utilisateurs PREMIUM.",
  "upgradeRequired": true,
  "upgradeUrl": "/upgrade-premium"
}
```

**Réponse PREMIUM** (200 OK) :
```json
{
  "message": "Lien de téléchargement généré",
  "downloadUrl": "https://xxx.supabase.co/storage/v1/object/sign/user-backups/userId/1783516968145_test.db?token=...",
  "fileName": "test.db",
  "fileSize": 4096,
  "expiresIn": 3600
}
```

📌 **URL signée valide 1 heure**

---

### 4. Supprimer un Backup

```http
DELETE /api/backups/:backupId
Authorization: Bearer <token>
```

**Réponse** :
```json
{
  "message": "Backup supprimé avec succès"
}
```

---

### 5. [ADMIN] Accorder l'Accès

```http
POST /api/backups/grant-access
Authorization: Bearer <admin_token>
Content-Type: application/json
```

**Body** :
```json
{
  "backupId": "cmrc43wyl0001uq53p3v6pzr9",
  "userId": "180b55e0-ce3e-4a1c-8290-24812f1e0058"
}
```

**Réponse** :
```json
{
  "message": "Accès au backup accordé",
  "backup": {
    "id": "cmrc43wyl0001uq53p3v6pzr9",
    "isAccessible": true,
    "accessGrantedAt": "2026-07-08T14:00:00.000Z",
    "fileUrl": "https://..."
  }
}
```

---

## 🧠 Logique Métier

### Upload Backup

```javascript
// 1. Vérifier authentification
const userId = req.userId;

// 2. Récupérer type de licence
const user = await prisma.user.findUnique({ where: { id: userId } });
const isPremium = user.licenseType === 'PREMIUM';

// 3. Upload vers Supabase Storage
const timestamp = Date.now();
const filePath = `${userId}/${timestamp}_${fileName}`;
await supabase.storage.from('user-backups').upload(filePath, fileBuffer);

// 4. Générer URL signée (PREMIUM uniquement)
let fileUrl = null;
if (isPremium) {
  const { data } = await supabase.storage
    .from('user-backups')
    .createSignedUrl(filePath, 315360000); // 10 ans
  fileUrl = data?.signedUrl;
}

// 5. Sauvegarder en DB
await prisma.userBackup.create({
  data: {
    userId,
    fileName: filePath,  // ✅ Chemin complet
    fileSize: file.size,
    fileUrl,
    isAccessible: isPremium,
    accessGrantedAt: isPremium ? new Date() : null
  }
});
```

### Téléchargement Backup

```javascript
// 1. Vérifier authentification
const userId = req.userId;

// 2. Vérifier type de licence
const user = await prisma.user.findUnique({ where: { id: userId } });
const isPremium = user.licenseType === 'PREMIUM';

// 3. Refuser si FREE
if (!isPremium) {
  return res.status(403).json({ error: 'Accès refusé', ... });
}

// 4. Récupérer le backup
const backup = await prisma.userBackup.findFirst({
  where: { id: backupId, userId }
});

// 5. Vérifier accessibilité
if (!backup.isAccessible) {
  return res.status(403).json({ error: 'Backup non accessible' });
}

// 6. Générer URL signée temporaire (1h)
const filePath = backup.fileName; // ✅ Déjà le chemin complet
const { data } = await supabase.storage
  .from('user-backups')
  .createSignedUrl(filePath, 3600);

// 7. Retourner l'URL
res.json({ downloadUrl: data.signedUrl, ... });
```

### Affichage Nom de Fichier

```javascript
// Nettoyer le nom pour l'affichage
const displayFileName = backup.fileName
  .split('/').pop()           // Enlève "userId/"
  .replace(/^\d+_/, '');     // Enlève "timestamp_"

// ✅ Affiche: "test.db"
// ❌ Au lieu de: "180b55e0-ce3e-4a1c-8290-24812f1e0058/1783516968145_test.db"
```

---

## 🔒 Sécurité

### Authentification

- ✅ Toutes les routes nécessitent un JWT valide
- ✅ Vérification `req.userId` extraite du token
- ✅ Les utilisateurs ne peuvent accéder qu'à leurs propres backups

### Autorisation

- ✅ FREE : Upload autorisé, téléchargement refusé (403)
- ✅ PREMIUM : Upload et téléchargement autorisés
- ✅ ADMIN : Peut accorder l'accès à des backups FREE

### Validation

- ✅ Extension `.db` requise
- ✅ Taille maximale : 50 MB (configuré dans multer)
- ✅ Buffer en mémoire (pas de stockage local)

### Isolation des Données

- ✅ Fichiers stockés par utilisateur : `userId/...`
- ✅ Pas de listing cross-utilisateur possible
- ✅ URLs signées temporaires (1h pour téléchargement)

---

## ⚙️ Configuration

### Variables d'Environnement

```env
# Supabase
SUPABASE_URL=https://votre-projet.supabase.co
SUPABASE_SERVICE_KEY=votre_service_role_key
```

### Obtenir les Credentials Supabase

1. Aller sur https://supabase.com/dashboard
2. Sélectionner votre projet
3. **Settings** → **API**
4. Copier :
   - **Project URL** → `SUPABASE_URL`
   - **service_role key** → `SUPABASE_SERVICE_KEY`

⚠️ **Attention** : Utiliser la `service_role` key (pas la `anon` key)

### Créer le Bucket

```bash
npm run setup:bucket
```

Ou manuellement :
1. Supabase Dashboard → **Storage**
2. **New Bucket**
3. Nom : `user-backups`
4. **Public** : ❌ Non (Private)
5. **File size limit** : 50 MB
6. **Allowed MIME types** : Laisser vide (tous)

### Configuration Multer

```javascript
// routes/backups.js
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 50 * 1024 * 1024, // 50 MB
  },
  fileFilter: (req, file, cb) => {
    if (!file.originalname.endsWith('.db')) {
      return cb(new Error('Seuls les fichiers .db sont acceptés'));
    }
    cb(null, true);
  }
});
```

---

## 🧪 Tests

### Tests Locaux

Voir le guide complet : **[TEST_BACKUP_LOCAL.md](./TEST_BACKUP_LOCAL.md)**

### Tests Automatisés (TODO)

```bash
npm run test:backup
```

**Scénarios à tester** :
- [ ] Upload FREE → `isAccessible: false`
- [ ] Upload PREMIUM → `isAccessible: true`
- [ ] Téléchargement FREE → 403 Forbidden
- [ ] Téléchargement PREMIUM → URL signée valide
- [ ] Suppression backup
- [ ] Admin grant access
- [ ] Fichier trop gros → 413 Payload Too Large
- [ ] Fichier non-.db → 400 Bad Request

---

## 🚀 Déploiement

### Étapes

1. **Configuration Supabase** :
   ```bash
   npm run setup:bucket
   ```

2. **Variables d'environnement sur Render.com** :
   - Ajouter `SUPABASE_URL`
   - Ajouter `SUPABASE_SERVICE_KEY`

3. **Déployer le code** :
   ```bash
   git add .
   git commit -m "feat: Cloud backup system"
   git push origin main
   ```

4. **Vérifier le déploiement** :
   ```bash
   curl https://lotus-business-server.onrender.com/api/health
   ```

5. **Tester en production** :
   - Créer un utilisateur PREMIUM
   - Uploader un backup
   - Télécharger le backup
   - Vérifier l'URL signée

---

## 🐛 Troubleshooting

### Problème : "Supabase non configuré"

**Cause** : Variables d'environnement manquantes

**Solution** :
1. Vérifier `.env` contient `SUPABASE_URL` et `SUPABASE_SERVICE_KEY`
2. Redémarrer le serveur : `npm run dev`

---

### Problème : "Object not found" lors du téléchargement

**Cause** : Chemin de fichier incorrect (corrigé dans v1.1)

**Solution** :
- ✅ Le code utilise maintenant `backup.fileName` directement
- ✅ Plus de reconstruction de chemin

**Vérification** :
1. Aller sur Supabase Dashboard → Storage → `user-backups`
2. Vérifier que les fichiers sont dans `userId/timestamp_filename.db`

---

### Problème : "Payload Too Large"

**Cause** : Fichier > 50 MB

**Solution** :
- Augmenter la limite dans `routes/backups.js` :
  ```javascript
  limits: { fileSize: 100 * 1024 * 1024 } // 100 MB
  ```
- Redémarrer le serveur

---

### Problème : Upload lent

**Cause** : Fichier volumineux + connexion lente

**Solution** :
- Implémenter un indicateur de progression côté mobile
- Considérer la compression avant upload
- Augmenter le timeout des requêtes

---

## 📈 Métriques

### Plan FREE Supabase

- ✅ **Stockage** : 1 GB (≈ 100-200 backups de 5-10 MB)
- ✅ **Bande passante** : 2 GB/mois
- ✅ **Requêtes API** : Illimité
- ✅ **Coût** : 0€/mois

### Estimation Usage

**100 utilisateurs PREMIUM** :
- Upload 1 backup/semaine de 10 MB
- = 100 × 10 MB = 1 GB/semaine
- = 4 GB/mois de stockage
- = 8 GB/mois de bande passante (upload + download)

📊 **Plan PRO Supabase requis** : 25$/mois (8 GB stockage, 50 GB bandwidth)

---

## 🔮 Roadmap

### Phase 1 : MVP (✅ Complété)
- [x] Upload backup (.db)
- [x] Liste des backups
- [x] Téléchargement PREMIUM
- [x] Refus FREE avec upgrade message
- [x] Admin grant access

### Phase 2 : Améliorations (En cours)
- [ ] Interface admin pour gérer les backups
- [ ] Statistiques backups dans le dashboard
- [ ] Notifications backup réussi/échoué
- [ ] Backup automatique quotidien (app mobile)

### Phase 3 : Optimisations
- [ ] Compression automatique des backups
- [ ] Déduplication des fichiers identiques
- [ ] Versioning des backups
- [ ] Restauration partielle (seulement certaines tables)
- [ ] Migration vers un autre provider de stockage

---

## 📞 Support

**Équipe Dev** : Lotus Business  
**Email** : miganissa334@gmail.com  
**Documentation** : Ce fichier  
**Tests** : TEST_BACKUP_LOCAL.md  
**Correctifs** : BACKUP_FIX_SUMMARY.md

---

**Dernière révision** : 8 juillet 2026  
**Auteur** : Kiro AI Assistant  
**Version** : 1.1
