# Guide de Test - Système de Cloud Backup (Local)

**Version**: 1.1  
**Dernière mise à jour**: 8 juillet 2026  
**Correctifs**: Problème de chemin de fichier résolu

---

## 🎯 Objectif

Tester localement le système de cloud backup avec Postman pour vérifier que :
- ✅ Les utilisateurs FREE peuvent uploader mais pas télécharger
- ✅ Les utilisateurs PREMIUM peuvent uploader ET télécharger
- ✅ Les fichiers sont correctement stockés dans Supabase Storage
- ✅ Les chemins de fichiers sont gérés correctement (avec timestamp)

---

## 📋 Prérequis

### 1. Serveur démarré

```bash
cd server
npm run dev
```

Le serveur doit tourner sur `http://localhost:5000`

### 2. Variables d'environnement configurées

Vérifier que le fichier `.env` contient :

```env
SUPABASE_URL=https://votre-projet.supabase.co
SUPABASE_SERVICE_KEY=votre_service_role_key
```

### 3. Bucket Supabase créé

```bash
npm run setup:bucket
```

Résultat attendu :
```
✅ Bucket 'user-backups' créé avec succès
```

### 4. Fichier de test

Créer un fichier `.db` de test (ou utiliser un vrai fichier SQLite) :

```bash
# Windows
echo. > test.db
```

---

## 🧪 Tests avec Postman

### Test 1 : Créer un utilisateur FREE

**Endpoint** : `POST http://localhost:5000/api/auth/register`

**Headers** :
```
Content-Type: application/json
```

**Body (raw JSON)** :
```json
{
  "email": "free@test.com",
  "phone": "+221771111111",
  "firstName": "User",
  "lastName": "FREE",
  "licenseType": "FREE"
}
```

**Résultat attendu** :
```json
{
  "message": "Inscription réussie ! Votre clé a été envoyée par email.",
  "user": {
    "id": "...",
    "email": "free@test.com",
    "licenseKey": "LOT-1234-ABCD-5678",
    "licenseType": "FREE"
  }
}
```

📝 **Noter le token JWT** retourné (si présent) ou se connecter avec la clé.

---

### Test 2 : Connexion utilisateur FREE

**Endpoint** : `POST http://localhost:5000/api/auth/login`

**Body** :
```json
{
  "licenseKey": "LOT-1234-ABCD-5678"
}
```

**Résultat attendu** :
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": { ... }
}
```

📝 **Copier le token JWT FREE**

---

### Test 3 : Upload backup (Utilisateur FREE)

**Endpoint** : `POST http://localhost:5000/api/backups/upload`

**Headers** :
```
Authorization: Bearer <token_FREE>
```

**Body (form-data)** :
- Key: `backup` | Type: `File` | Value: Sélectionner `test.db`
- Key: `fileName` | Type: `Text` | Value: `test.db`
- Key: `deviceId` | Type: `Text` | Value: `device-123` (optionnel)
- Key: `deviceName` | Type: `Text` | Value: `iPhone 13` (optionnel)

**Résultat attendu** :
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

✅ **Vérifications** :
- `isAccessible: false`
- `canDownload: false`
- Message d'upgrade présent

---

### Test 4 : Lister les backups (Utilisateur FREE)

**Endpoint** : `GET http://localhost:5000/api/backups/my-backups`

**Headers** :
```
Authorization: Bearer <token_FREE>
```

**Résultat attendu** :
```json
{
  "backups": [
    {
      "id": "...",
      "fileName": "test.db",
      "fileSize": 4096,
      "uploadedAt": "2026-07-08T13:27:08.446Z",
      "isAccessible": false,
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

✅ **Vérifications** :
- Backup visible dans la liste
- `canDownload: false`
- `downloadUrl: null`

---

### Test 5 : Tentative de téléchargement (Utilisateur FREE) ❌

**Endpoint** : `GET http://localhost:5000/api/backups/<backupId>/download`

**Headers** :
```
Authorization: Bearer <token_FREE>
```

**Résultat attendu** :
```json
{
  "error": "Accès refusé",
  "message": "Cette fonctionnalité est réservée aux utilisateurs PREMIUM.",
  "upgradeRequired": true,
  "upgradeUrl": "/upgrade-premium"
}
```

✅ **Status Code** : `403 Forbidden`

---

### Test 6 : Créer un utilisateur PREMIUM

**Endpoint** : `POST http://localhost:5000/api/auth/register`

**Body** :
```json
{
  "email": "premium@test.com",
  "phone": "+221772222222",
  "firstName": "User",
  "lastName": "PREMIUM",
  "licenseType": "PREMIUM"
}
```

📝 **Copier le token JWT PREMIUM** après connexion

---

### Test 7 : Upload backup (Utilisateur PREMIUM)

**Endpoint** : `POST http://localhost:5000/api/backups/upload`

**Headers** :
```
Authorization: Bearer <token_PREMIUM>
```

**Body (form-data)** :
- Key: `backup` | Type: `File` | Value: `test.db`
- Key: `fileName` | Type: `Text` | Value: `test.db`

**Résultat attendu** :
```json
{
  "message": "Backup sauvegardé et accessible dans le cloud",
  "backup": {
    "id": "...",
    "fileName": "test.db",
    "fileSize": 4096,
    "uploadedAt": "2026-07-08T13:30:00.000Z",
    "isAccessible": true,
    "canDownload": true
  },
  "isPremium": true,
  "upgradeMessage": null
}
```

✅ **Vérifications** :
- `isAccessible: true`
- `canDownload: true`
- Pas de message d'upgrade

---

### Test 8 : Lister les backups (Utilisateur PREMIUM)

**Endpoint** : `GET http://localhost:5000/api/backups/my-backups`

**Headers** :
```
Authorization: Bearer <token_PREMIUM>
```

**Résultat attendu** :
```json
{
  "backups": [
    {
      "id": "...",
      "fileName": "test.db",
      "fileSize": 4096,
      "uploadedAt": "2026-07-08T13:30:00.000Z",
      "isAccessible": true,
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

✅ **Vérifications** :
- `canDownload: true`
- `downloadUrl` présent

---

### Test 9 : Téléchargement (Utilisateur PREMIUM) ✅

**Endpoint** : `GET http://localhost:5000/api/backups/<backupId>/download`

**Headers** :
```
Authorization: Bearer <token_PREMIUM>
```

**Résultat attendu** :
```json
{
  "message": "Lien de téléchargement généré",
  "downloadUrl": "https://xxx.supabase.co/storage/v1/object/sign/user-backups/userId/1783516968145_test.db?token=...",
  "fileName": "test.db",
  "fileSize": 4096,
  "expiresIn": 3600
}
```

✅ **Vérifications** :
- URL signée Supabase générée
- Expire dans 1 heure (3600 secondes)
- `fileName` affiché sans timestamp ni `userId/`

📌 **Copier le `downloadUrl` et l'ouvrir dans le navigateur pour télécharger le fichier**

---

### Test 10 : Supprimer un backup

**Endpoint** : `DELETE http://localhost:5000/api/backups/<backupId>`

**Headers** :
```
Authorization: Bearer <token_PREMIUM>
```

**Résultat attendu** :
```json
{
  "message": "Backup supprimé avec succès"
}
```

---

### Test 11 : [ADMIN] Accorder accès à un backup FREE

**Endpoint** : `POST http://localhost:5000/api/backups/grant-access`

**Headers** :
```
Authorization: Bearer <token_ADMIN>
```

**Body** :
```json
{
  "backupId": "<id_backup_FREE>",
  "userId": "<id_user_FREE>"
}
```

**Résultat attendu** :
```json
{
  "message": "Accès au backup accordé",
  "backup": {
    "id": "...",
    "isAccessible": true,
    "accessGrantedAt": "2026-07-08T14:00:00.000Z"
  }
}
```

---

## 🐛 Déboggage

### Problème : "Supabase non configuré"

**Cause** : Variables `SUPABASE_URL` ou `SUPABASE_SERVICE_KEY` manquantes

**Solution** :
1. Vérifier le fichier `.env`
2. Redémarrer le serveur : `npm run dev`

---

### Problème : "Object not found" lors du téléchargement

**Cause** : Chemin de fichier incorrect (problème corrigé dans v1.1)

**Solution** :
- Le `fileName` est maintenant stocké avec le chemin complet : `userId/timestamp_filename.db`
- Le code a été corrigé pour utiliser directement `backup.fileName` sans reconstruction

**Vérification dans Supabase Storage** :
1. Aller sur https://supabase.com/dashboard
2. Storage → `user-backups`
3. Vérifier que les fichiers sont dans `userId/timestamp_filename.db`

---

### Problème : Bucket introuvable

**Cause** : Bucket pas créé dans Supabase

**Solution** :
```bash
npm run setup:bucket
```

Ou créer manuellement dans Supabase Dashboard :
1. Storage → New Bucket
2. Nom : `user-backups`
3. Private : ✅
4. File size limit : 50 MB

---

## ✅ Checklist de Test

- [ ] Utilisateur FREE peut s'inscrire
- [ ] Utilisateur FREE peut uploader un backup
- [ ] Backup FREE marqué comme `isAccessible: false`
- [ ] Utilisateur FREE **ne peut pas** télécharger (403)
- [ ] Utilisateur PREMIUM peut s'inscrire
- [ ] Utilisateur PREMIUM peut uploader un backup
- [ ] Backup PREMIUM marqué comme `isAccessible: true`
- [ ] Utilisateur PREMIUM **peut** télécharger (URL signée)
- [ ] Téléchargement via URL signée fonctionne
- [ ] Suppression de backup fonctionne
- [ ] Admin peut accorder l'accès à un backup FREE
- [ ] Nom de fichier affiché correctement (sans timestamp)

---

## 📝 Notes

### Stockage des fichiers

Les fichiers sont stockés dans Supabase Storage avec la structure :
```
user-backups/
  └── <userId>/
      ├── 1783516968145_test.db
      ├── 1783517227390_backup.db
      └── ...
```

### Base de données

Table `user_backups` :
- `fileName` : Chemin complet `userId/timestamp_filename.db`
- `fileSize` : Taille en bytes
- `fileUrl` : URL signée longue durée (PREMIUM) ou null (FREE)
- `isAccessible` : `true` pour PREMIUM, `false` pour FREE

### Affichage

Le nom affiché à l'utilisateur est nettoyé :
- ✅ Affiche : `test.db`
- ❌ Ne pas afficher : `180b55e0-ce3e-4a1c-8290-24812f1e0058/1783516968145_test.db`

---

## 🚀 Prochaines Étapes

1. ✅ Tests locaux avec Postman
2. ⏳ Intégration dans l'app mobile (React Native)
3. ⏳ Tests en production (Render.com + Supabase)
4. ⏳ Interface admin pour gérer les backups
5. ⏳ Statistiques backups dans le dashboard

---

**Auteur** : Lotus Business Dev Team  
**Contact** : support@lotusbusiness.com
