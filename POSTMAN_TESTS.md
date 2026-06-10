# 🧪 Guide de test Postman - Lotus Business API

## Configuration initiale

### 1. Créer une collection Postman

1. Ouvrir Postman
2. Créer une nouvelle collection : **"Lotus Business API"**
3. Ajouter une variable d'environnement :
   - `baseUrl` : `http://localhost:5000`
   - `token` : (sera rempli automatiquement après login)
   - `userId` : (sera rempli automatiquement)

---

## 📋 Tests à effectuer dans l'ordre

### ✅ TEST 1 : Inscription utilisateur

**Endpoint :** `POST {{baseUrl}}/api/auth/register`

**Headers :**
```
Content-Type: application/json
```

**Body (JSON) :**
```json
{
  "email": "test@example.com",
  "phone": "+221771234567",
  "firstName": "Jean",
  "lastName": "Dupont"
}
```

**Résultat attendu :**
- Status : `201 Created`
- Response contient :
  - `user.licenseKey` (format LOT-XXXX-xxxx-XXXX)
  - `user.licenseType` : "FREE"
  - `user.licenseStatus` : "ACTIVE"
  - `emailSent` : `true`
- ✅ **Vérifier dans ta boîte email** : Tu dois recevoir un email avec la clé

**💾 Postman Script (Tests tab) :**
```javascript
if (pm.response.code === 201) {
    const jsonData = pm.response.json();
    pm.environment.set("licenseKey", jsonData.user.licenseKey);
    pm.environment.set("userId", jsonData.user.id);
    console.log("License Key:", jsonData.user.licenseKey);
}
```

---

### ✅ TEST 2 : Connexion avec clé de licence

**Endpoint :** `POST {{baseUrl}}/api/auth/login`

**Headers :**
```
Content-Type: application/json
```

**Body (JSON) :**
```json
{
  "licenseKey": "{{licenseKey}}"
}
```

**Résultat attendu :**
- Status : `200 OK`
- Response contient :
  - `token` (JWT)
  - `user` avec toutes les infos
  - `user.isOnline` : `true`
  - `user.activeSessionId` présent

**💾 Postman Script (Tests tab) :**
```javascript
if (pm.response.code === 200) {
    const jsonData = pm.response.json();
    pm.environment.set("token", jsonData.token);
    pm.environment.set("sessionId", jsonData.user.activeSessionId);
    console.log("Token saved:", jsonData.token);
}
```

---

### ✅ TEST 3 : Clé oubliée (récupération par email)

**Endpoint :** `POST {{baseUrl}}/api/auth/forgot-key`

**Headers :**
```
Content-Type: application/json
```

**Body (JSON) :**
```json
{
  "email": "test@example.com"
}
```

**Résultat attendu :**
- Status : `200 OK`
- Message : "Clé renvoyée par email"
- ✅ **Vérifier dans ta boîte email** : Tu dois recevoir un nouvel email

---

### ✅ TEST 4 : Test session unique (double connexion)

**But :** Vérifier qu'un utilisateur ne peut être connecté que sur un seul appareil

**Étapes :**

1. **Garde le token actuel** de TEST 2
2. **Reconnecter avec la même clé** (répéter TEST 2)
3. **Récupérer le nouveau token**
4. **Tester l'ancien token** avec une route protégée

**Endpoint pour tester l'ancien token :** `POST {{baseUrl}}/api/auth/logout`

**Headers :**
```
Authorization: Bearer {ANCIEN_TOKEN}
Content-Type: application/json
```

**Résultat attendu :**
- Status : `401 Unauthorized`
- Message : "Session invalide ou expirée"
- ✅ **Cela confirme que l'ancienne session est invalidée**

---

### ✅ TEST 5 : Déconnexion

**Endpoint :** `POST {{baseUrl}}/api/auth/logout`

**Headers :**
```
Authorization: Bearer {{token}}
Content-Type: application/json
```

**Résultat attendu :**
- Status : `200 OK`
- Message : "Déconnexion réussie"
- L'utilisateur doit être marqué `isOnline: false` en base

---

### ✅ TEST 6 : Erreur - clé invalide

**Endpoint :** `POST {{baseUrl}}/api/auth/login`

**Body (JSON) :**
```json
{
  "licenseKey": "LOT-0000-zzzz-9999"
}
```

**Résultat attendu :**
- Status : `401 Unauthorized`
- Message : "Clé de licence invalide"

---

### ✅ TEST 7 : Erreur - email déjà utilisé

**Endpoint :** `POST {{baseUrl}}/api/auth/register`

**Body (JSON) :**
```json
{
  "email": "test@example.com",
  "phone": "+221770000001",
  "firstName": "Paul",
  "lastName": "Martin"
}
```

**Résultat attendu :**
- Status : `400 Bad Request`
- Message : "Cet email est déjà utilisé"

---

## 🔐 Tests Admin

### Prérequis : Créer un admin en base de données

**Exécuter dans Supabase SQL Editor :**

```sql
-- Générer un hash bcrypt pour "admin123"
-- Hash : $2b$10$rQZ9vXZ3Z3Z3Z3Z3Z3Z3Z.XqOqN9qN9qN9qN9qN9qN9qN9qN9qN9q

INSERT INTO "admins" ("id", "email", "phone", "password", "createdAt")
VALUES (
  gen_random_uuid()::text,
  'admin@lotusbusiness.com',
  '+221770000000',
  '$2b$10$YourHashedPasswordHere',
  CURRENT_TIMESTAMP
);
```

**Ou utiliser Node.js pour générer le hash :**

```bash
node -e "const bcrypt = require('bcrypt'); bcrypt.hash('admin123', 10).then(hash => console.log(hash));"
```

Copie le hash et remplace `$2b$10$YourHashedPasswordHere` dans la requête SQL.

---

### ✅ TEST 8 : Connexion Admin

**Endpoint :** `POST {{baseUrl}}/api/admin/login`

**Headers :**
```
Content-Type: application/json
```

**Body (JSON) :**
```json
{
  "email": "admin@lotusbusiness.com",
  "password": "admin123"
}
```

**Résultat attendu :**
- Status : `200 OK`
- Response contient `token` et `admin`

**💾 Postman Script (Tests tab) :**
```javascript
if (pm.response.code === 200) {
    const jsonData = pm.response.json();
    pm.environment.set("adminToken", jsonData.token);
    console.log("Admin Token saved");
}
```

---

### ✅ TEST 9 : Liste des utilisateurs (Admin)

**Endpoint :** `GET {{baseUrl}}/api/admin/users`

**Headers :**
```
Authorization: Bearer {{adminToken}}
```

**Résultat attendu :**
- Status : `200 OK`
- Liste de tous les utilisateurs avec leurs infos complètes

---

### ✅ TEST 10 : Upgrade utilisateur vers PREMIUM (Admin)

**Endpoint :** `POST {{baseUrl}}/api/admin/upgrade-premium`

**Headers :**
```
Authorization: Bearer {{adminToken}}
Content-Type: application/json
```

**Body (JSON) :**
```json
{
  "userId": "{{userId}}"
}
```

**Résultat attendu :**
- Status : `200 OK`
- `user.licenseType` : "PREMIUM"
- `user.expirationDate` : +1 an depuis maintenant

---

### ✅ TEST 11 : Suspendre un utilisateur (Admin)

**Endpoint :** `PATCH {{baseUrl}}/api/admin/suspend/{{userId}}`

**Headers :**
```
Authorization: Bearer {{adminToken}}
```

**Résultat attendu :**
- Status : `200 OK`
- `user.licenseStatus` : "SUSPENDED"
- L'utilisateur ne peut plus se connecter

---

### ✅ TEST 12 : Réactiver une licence expirée (Admin)

**Endpoint :** `POST {{baseUrl}}/api/admin/reactivate-license`

**Headers :**
```
Authorization: Bearer {{adminToken}}
Content-Type: application/json
```

**Body (JSON) :**
```json
{
  "userId": "{{userId}}",
  "licenseType": "PREMIUM"
}
```

**Résultat attendu :**
- Status : `200 OK`
- `user.licenseStatus` : "ACTIVE"
- Nouvelle `expirationDate` selon le type choisi

---

### ✅ TEST 13 : Forcer la déconnexion d'un utilisateur (Admin)

**Endpoint :** `POST {{baseUrl}}/api/admin/force-logout/{{userId}}`

**Headers :**
```
Authorization: Bearer {{adminToken}}
```

**Résultat attendu :**
- Status : `200 OK`
- Message : "Utilisateur déconnecté avec succès"
- L'utilisateur est marqué `isOnline: false`

---

## 🧪 Tests de sécurité

### ✅ TEST 14 : Accès route admin sans token

**Endpoint :** `GET {{baseUrl}}/api/admin/users`

**Headers :**
```
(Aucun header Authorization)
```

**Résultat attendu :**
- Status : `401 Unauthorized`
- Message : "Token manquant"

---

### ✅ TEST 15 : Accès route admin avec token utilisateur

**Endpoint :** `GET {{baseUrl}}/api/admin/users`

**Headers :**
```
Authorization: Bearer {{token}}
```
(Utiliser le token d'un utilisateur normal, pas admin)

**Résultat attendu :**
- Status : `403 Forbidden`
- Message : "Accès refusé : admin uniquement"

---

### ✅ TEST 16 : Token expiré

**Endpoint :** `POST {{baseUrl}}/api/auth/logout`

**Headers :**
```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.INVALID_TOKEN
```

**Résultat attendu :**
- Status : `403 Forbidden`
- Message : "Token invalide"

---

## 🔍 Test d'expiration automatique

### ✅ TEST 17 : Expiration automatique de licence

**Étapes :**

1. **Modifier manuellement la date d'expiration** dans Supabase :

```sql
UPDATE "users"
SET "expirationDate" = NOW() - INTERVAL '1 day'
WHERE "email" = 'test@example.com';
```

2. **Attendre 1 heure** (ou redémarrer le serveur pour forcer la vérification)

3. **Vérifier le statut** :

```sql
SELECT "email", "licenseStatus", "expirationDate"
FROM "users"
WHERE "email" = 'test@example.com';
```

**Résultat attendu :**
- `licenseStatus` doit être passé à "EXPIRED"

4. **Essayer de se connecter :**

**Endpoint :** `POST {{baseUrl}}/api/auth/login`

**Body :**
```json
{
  "licenseKey": "{{licenseKey}}"
}
```

**Résultat attendu :**
- Status : `403 Forbidden`
- Message : "Licence expirée" ou "Licence suspendue ou expirée"

---

## 📊 Résumé des statuts attendus

| Test | Endpoint | Status | Message clé |
|------|----------|--------|-------------|
| 1 | Register | 201 | "Inscription réussie" |
| 2 | Login | 200 | Token présent |
| 3 | Forgot Key | 200 | "Clé renvoyée" |
| 4 | Double Login | 401 | "Session invalide" |
| 5 | Logout | 200 | "Déconnexion réussie" |
| 6 | Invalid Key | 401 | "Clé invalide" |
| 7 | Duplicate Email | 400 | "Email déjà utilisé" |
| 8 | Admin Login | 200 | Token admin présent |
| 9 | List Users | 200 | Array d'utilisateurs |
| 10 | Upgrade Premium | 200 | Type = PREMIUM |
| 11 | Suspend User | 200 | Status = SUSPENDED |
| 12 | Reactivate | 200 | Status = ACTIVE |
| 13 | Force Logout | 200 | isOnline = false |
| 14 | No Token | 401 | "Token manquant" |
| 15 | User Token on Admin | 403 | "Accès refusé" |
| 16 | Invalid Token | 403 | "Token invalide" |
| 17 | Expired License | 403 | "Licence expirée" |

---

## 📝 Notes importantes

### Variables d'environnement Postman

Créer ces variables dans ton environnement Postman :

```
baseUrl = http://localhost:5000
token = (auto-filled)
adminToken = (auto-filled)
licenseKey = (auto-filled)
userId = (auto-filled)
sessionId = (auto-filled)
```

### Ordre recommandé des tests

1. Tests utilisateurs (1-7)
2. Créer un admin en base
3. Tests admin (8-13)
4. Tests de sécurité (14-16)
5. Test d'expiration (17)

---

## 🚀 Automatisation (optionnel)

Tu peux créer un **Collection Runner** dans Postman pour exécuter tous les tests automatiquement :

1. Sélectionner la collection
2. Cliquer sur **Run**
3. Sélectionner tous les tests
4. Cliquer sur **Run Lotus Business API**

---

## ✅ Checklist finale

- [ ] Serveur démarré : `npm run dev`
- [ ] Base de données Supabase configurée
- [ ] Admin créé en base de données
- [ ] Clé API Brevo configurée dans `.env`
- [ ] Test d'inscription réussi
- [ ] Email reçu avec la clé de licence
- [ ] Connexion utilisateur réussie
- [ ] Session unique validée
- [ ] Tests admin réussis
- [ ] Tests de sécurité validés

---

**Bon test ! 🎉**

Si tu rencontres une erreur, vérifie :
1. Le serveur est bien démarré
2. Les variables d'environnement sont correctes
3. La base de données est accessible
4. La clé Brevo est valide
