# Guide d'Application de la Migration Device

## 📋 Résumé des Modifications

Toutes les corrections de sécurité et le système de device binding ont été implémentés. Voici ce qui reste à faire :

---

## ✅ Modifications déjà effectuées

1. ✅ Générateur de clé sécurisé (crypto.randomInt)
2. ✅ Route admin/create protégée (bootstrap)
3. ✅ Mail-status sécurisé (pas de fuite API key)
4. ✅ Rate limiting installé et configuré
5. ✅ Validation Zod sur toutes les routes critiques
6. ✅ Message générique forgot-key (pas d'énumération)
7. ✅ Modèle Device ajouté au schéma Prisma
8. ✅ Contrôleur et routes Device créés
9. ✅ Device binding intégré dans le login
10. ✅ Client Prisma généré

---

## 🚀 Étapes à Suivre

### Étape 1 : Appliquer la migration SQL sur Supabase

**Option A : Via Supabase Dashboard (Recommandé)**

1. Ouvrez votre dashboard Supabase : https://supabase.com/dashboard
2. Sélectionnez votre projet Lotus Business
3. Allez dans **SQL Editor** (dans le menu gauche)
4. Cliquez sur **New Query**
5. Copiez-collez le contenu du fichier `migration.sql` ci-dessous
6. Cliquez sur **Run** pour exécuter la migration

**Option B : Via psql (ligne de commande)**

```bash
psql -U postgres.xxx -h aws-1-eu-west-2.pooler.supabase.com -p 5432 -d postgres -f migration.sql
```

---

### Étape 2 : Vérifier la migration

Après avoir exécuté la migration, vérifiez que la table a été créée :

```sql
-- Vérifier que la table existe
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' AND table_name = 'devices';

-- Vérifier la structure
\d devices
```

Vous devriez voir :
- ✅ Table `devices` créée
- ✅ Colonnes : id, userId, deviceId, deviceName, deviceType, platform, isAuthorized, lastUsedAt, createdAt
- ✅ Index sur userId, deviceId
- ✅ Contrainte d'unicité sur (userId, deviceId)
- ✅ Foreign key vers users(id) avec CASCADE

---

### Étape 3 : Tester le serveur

```bash
cd server
npm run dev
```

Le serveur devrait démarrer sans erreur.

---

### Étape 4 : Tester les nouvelles fonctionnalités

#### Test 1 : Login avec device binding

```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "licenseKey": "LOT-1234-ABCD-5678",
    "deviceId": "test-device-123",
    "deviceName": "iPhone 13 Pro",
    "deviceType": "ios",
    "platform": "ios"
  }'
```

#### Test 2 : Récupérer mes devices

```bash
curl -X GET http://localhost:5000/api/devices/my-devices \
  -H "Authorization: Bearer VOTRE_TOKEN"
```

#### Test 3 : Validation Zod (test d'erreur)

```bash
# Email invalide
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "email-invalide",
    "phone": "+221771234567",
    "firstName": "Jean",
    "lastName": "Dupont"
  }'
```

Réponse attendue :
```json
{
  "error": "Données invalides",
  "details": [
    {
      "field": "email",
      "message": "Email invalide"
    }
  ]
}
```

#### Test 4 : Rate limiting

Faites 11 requêtes de login en 15 minutes → la 11ème devrait être bloquée.

---

## 📝 Fichier migration.sql

Copiez ce fichier dans Supabase SQL Editor :

```sql
-- CreateEnum
CREATE TYPE "Platform" AS ENUM ('ios', 'android');

-- CreateTable
CREATE TABLE "devices" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "deviceId" TEXT NOT NULL,
    "deviceName" TEXT,
    "deviceType" TEXT,
    "platform" "Platform",
    "isAuthorized" BOOLEAN NOT NULL DEFAULT true,
    "lastUsedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "devices_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "devices_userId_deviceId_key" ON "devices"("userId", "deviceId");

-- CreateIndex
CREATE INDEX "devices_userId_idx" ON "devices"("userId");

-- CreateIndex
CREATE INDEX "devices_deviceId_idx" ON "devices"("deviceId");

-- AddForeignKey
ALTER TABLE "devices" ADD CONSTRAINT "devices_userId_fkey" 
    FOREIGN KEY ("userId") REFERENCES "users"("id") 
    ON DELETE CASCADE ON UPDATE CASCADE;
```

---

## 🔍 Vérifications Post-Migration

### 1. Vérifier la table devices

```sql
SELECT * FROM devices LIMIT 5;
```

### 2. Tester l'enregistrement d'un device

```bash
curl -X POST http://localhost:5000/api/devices/register \
  -H "Authorization: Bearer VOTRE_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "deviceId": "test-device-456",
    "deviceName": "Samsung S21",
    "deviceType": "android",
    "platform": "android"
  }'
```

### 3. Vérifier les logs

Dans les logs du serveur, vous devriez voir :
```
✅ Connexion réussie - user@example.com (FREE) depuis IP: 127.0.0.1
```

Et si un device est fourni :
```
📱 Device enregistré: test-device-456
```

---

## 🎯 Prochaines Étapes (Frontend)

### 1. Mettre à jour le login

Dans votre app mobile, lors du login, envoyez les informations du device :

```javascript
// Exemple React Native
const deviceId = await DeviceInfo.getUniqueId();
const deviceName = await DeviceInfo.getDeviceName();
const platform = Platform.OS; // 'ios' ou 'android'

const response = await fetch('http://localhost:5000/api/auth/login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    licenseKey: 'LOT-1234-ABCD-5678',
    deviceId,
    deviceName,
    deviceType: platform,
    platform
  })
});
```

### 2. Afficher les devices dans le profil

```javascript
// Récupérer les devices
const response = await fetch('http://localhost:5000/api/devices/my-devices', {
  headers: { 'Authorization': `Bearer ${token}` }
});
const { devices } = await response.json();
```

### 3. Permettre la suppression d'un device

```javascript
// Supprimer un device
await fetch(`http://localhost:5000/api/devices/my-devices/${deviceId}`, {
  method: 'DELETE',
  headers: { 'Authorization': `Bearer ${token}` }
});
```

---

## 🐛 Dépannage

### Erreur : "relation devices does not exist"

**Solution** : La migration n'a pas été appliquée. Exécutez le SQL sur Supabase.

### Erreur : "duplicate key value violates unique constraint"

**Solution** : Le device existe déjà. Le système va le mettre à jour automatiquement.

### Erreur : "foreign key constraint fails"

**Solution** : Vérifiez que l'utilisateur existe bien dans la table `users`.

---

## 📊 Récapitulatif des Sécurités Ajoutées

| Sécurité | Status | Description |
|----------|--------|-------------|
| **Générateur clé** | ✅ Actif | crypto.randomInt au lieu de Math.random |
| **Bootstrap admin** | ✅ Actif | Premier admin public, suivants protégés |
| **Mail-status** | ✅ Actif | Ne révèle pas la clé API |
| **Rate limiting** | ✅ Actif | 10/15min login, 5/15min admin |
| **Validation Zod** | ✅ Actif | Toutes les routes critiques |
| **Forgot-key** | ✅ Actif | Message générique |
| **Device binding** | ✅ Actif | Table + routes + intégration login |

---

## 🎉 Félicitations !

Votre backend est maintenant **beaucoup plus sécurisé** avec :
- ✅ Protection contre les attaques par force brute
- ✅ Validation systématique des entrées
- ✅ Gestion sécurisée des appareils
- ✅ Pas de fuite d'informations sensibles
- ✅ Clés de licence cryptographiquement sûres

**Prochaine étape** : Appliquez la migration SQL sur Supabase et testez !