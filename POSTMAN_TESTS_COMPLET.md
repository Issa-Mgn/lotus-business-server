# Guide de Tests Postman - Lotus Business API

Guide complet pour tester toutes les fonctionnalités du backend depuis le début.

---

## 📋 Table des matières

1. [Configuration Postman](#configuration-postman)
2. [Tests Séquentiels Complets](#tests-séquentiels-complets)
3. [Tests de Sécurité](#tests-de-sécurité)
4. [Tests des Devices](#tests-des-devices)
5. [Tests d'Erreurs](#tests-derreurs)

---

## ⚙️ Configuration Postman

### Variables d'environnement

Créer un environnement Postman avec ces variables :

| Variable | Valeur | Description |
|----------|--------|-------------|
| `base_url` | `http://localhost:5000` | URL de base du serveur |
| `admin_token` | (vide) | Token admin (rempli après login) |
| `user_token` | (vide) | Token user (rempli après login) |
| `user_id` | (vide) | ID utilisateur (rempli après création) |
| `info_id` | (vide) | ID info (rempli après création) |
| `device_id` | (vide) | ID device (rempli après enregistrement) |

---

## 🧪 Tests Séquentiels Complets

### **ÉTAPE 1 : Créer le Premier Admin (Bootstrap)**

**Méthode** : `POST`  
**URL** : `{{base_url}}/api/admin/create`  
**Headers** : Aucun (route publique pour le bootstrap)  
**Body** (raw JSON) :

```json
{
  "email": "admin@lotus.com",
  "phone": "+22500000000",
  "password": "Admin123!"
}
```

**Réponse attendue** :
```json
{
  "message": "Premier admin créé avec succès. Vous pouvez maintenant vous connecter.",
  "admin": {
    "id": "uuid",
    "email": "admin@lotus.com",
    "phone": "+22500000000",
    "createdAt": "2026-06-27T..."
  }
}
```

**✅ Vérification** : 
- Status code : 201
- Message contient "Premier admin"
- Admin créé avec succès

---

### **ÉTAPE 2 : Se connecter en tant qu'Admin**

**Méthode** : `POST`  
**URL** : `{{base_url}}/api/admin/login`  
**Headers** : Aucun  
**Body** (raw JSON) :

```json
{
  "email": "admin@lotus.com",
  "password": "Admin123!"
}
```

**Réponse attendue** :
```json
{
  "message": "Connexion admin réussie",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "admin": {
    "id": "uuid",
    "email": "admin@lotus.com",
    "phone": "+22500000000"
  }
}
```

**✅ Actions** :
1. Copier le `token` 
2. Dans Postman, aller dans l'environnement
3. Coller le token dans la variable `admin_token`

---

### **ÉTAPE 3 : Vérifier le profil Admin**

**Méthode** : `GET`  
**URL** : `{{base_url}}/api/admin/profile`  
**Headers** :
- `Authorization` : `Bearer {{admin_token}}`

**Réponse attendue** :
```json
{
  "admin": {
    "id": "uuid",
    "email": "admin@lotus.com",
    "phone": "+22500000000",
    "createdAt": "2026-06-27T..."
  }
}
```

**✅ Vérification** : Status code 200

---

### **ÉTAPE 4 : Créer un Utilisateur**

**Méthode** : `POST`  
**URL** : `{{base_url}}/api/admin/users`  
**Headers** :
- `Authorization` : `Bearer {{admin_token}}`

**Body** (raw JSON) :

```json
{
  "email": "user@test.com",
  "phone": "+225771234567",
  "firstName": "Jean",
  "lastName": "Dupont",
  "licenseType": "FREE"
}
```

**Réponse attendue** :
```json
{
  "message": "Utilisateur créé avec succès. Un email a été envoyé avec la clé de licence.",
  "user": {
    "id": "uuid",
    "email": "user@test.com",
    "phone": "+225771234567",
    "firstName": "Jean",
    "lastName": "Dupont",
    "licenseKey": "LOT-1234-ABCD-5678",
    "licenseType": "FREE",
    "licenseStatus": "ACTIVE",
    "activationDate": "2026-06-27T...",
    "expirationDate": null,
    "isOnline": false,
    "maxSimultaneousLogins": 1
  }
}
```

**✅ Actions** :
1. Copier l'`id` dans la variable `user_id`
2. Copier la `licenseKey` pour le test de login

---

### **ÉTAPE 5 : Récupérer tous les Utilisateurs**

**Méthode** : `GET`  
**URL** : `{{base_url}}/api/admin/users`  
**Headers** :
- `Authorization` : `Bearer {{admin_token}}`

**Réponse attendue** :
```json
{
  "count": 1,
  "users": [
    {
      "id": "uuid",
      "email": "user@test.com",
      "firstName": "Jean",
      "lastName": "Dupont",
      "licenseKey": "LOT-1234-ABCD-5678",
      "licenseType": "FREE",
      "licenseStatus": "ACTIVE",
      "isOnline": false,
      "lastLoginIp": null,
      "maxSimultaneousLogins": 1
    }
  ]
}
```

**✅ Vérification** : Status code 200, count = 1

---

### **ÉTAPE 6 : Créer une Info (avec notification automatique)**

**Méthode** : `POST`  
**URL** : `{{base_url}}/api/admin/infos`  
**Headers** :
- `Authorization` : `Bearer {{admin_token}}`

**Body** (raw JSON) :

```json
{
  "title": "Nouvelle fonctionnalité !",
  "content": "Découvrez notre nouvelle fonctionnalité de génération de documents comptables avec IA.",
  "published": true
}
```

**Réponse attendue** :
```json
{
  "message": "Info publiée avec succès",
  "info": {
    "id": "uuid",
    "title": "Nouvelle fonctionnalité !",
    "content": "Découvrez notre nouvelle fonctionnalité...",
    "imageUrl": null,
    "published": true,
    "publishedAt": "2026-06-27T...",
    "createdAt": "2026-06-27T..."
  }
}
```

**✅ Actions** : 
1. Copier l'`id` dans la variable `info_id`
2. Vérifier les logs du serveur : `📱 Notification envoyée à X utilisateurs pour l'info: Nouvelle fonctionnalité !`

**📱 Notification automatique** : 
- Tous les utilisateurs actifs reçoivent une notification
- Type : `NEW_INFO`
- Titre : `Nouvelle information`
- Message : `Nouvelle publication : Nouvelle fonctionnalité !`

---

### **ÉTAPE 7 : Récupérer les Infos Publiques (sans authentification)**

**Méthode** : `GET`  
**URL** : `{{base_url}}/api/public/infos`  
**Headers** : Aucun

**Réponse attendue** :
```json
{
  "infos": [
    {
      "id": "uuid",
      "title": "Nouvelle fonctionnalité !",
      "content": "Découvrez...",
      "imageUrl": null,
      "published": true,
      "publishedAt": "2026-06-27T...",
      "reactionStats": {},
      "totalReactions": 0
    }
  ]
}
```

**✅ Vérification** : Status code 200, pas de token requis

---

### **ÉTAPE 8 : Ajouter une Réaction (publique)**

**Méthode** : `POST`  
**URL** : `{{base_url}}/api/public/infos/{{info_id}}/reactions`  
**Headers** : Aucun (route publique)

**Body** (raw JSON) :

```json
{
  "reactionType": "LIKE"
}
```

**Réponse attendue** :
```json
{
  "message": "Réaction ajoutée avec succès",
  "reaction": {
    "id": "uuid",
    "infoId": "uuid",
    "reactionType": "LIKE",
    "userId": null,
    "ipAddress": "127.0.0.1",
    "createdAt": "2026-06-27T..."
  }
}
```

**✅ Vérification** : Status code 201

---

### **ÉTAPE 9 : Voir les Réactions d'une Info**

**Méthode** : `GET`  
**URL** : `{{base_url}}/api/public/infos/{{info_id}}/reactions`  
**Headers** : Aucun

**Réponse attendue** :
```json
{
  "reactions": [
    {
      "id": "uuid",
      "infoId": "uuid",
      "reactionType": "LIKE",
      "userId": null,
      "ipAddress": "127.0.0.1",
      "createdAt": "2026-06-27T..."
    }
  ]
}
```

---

### **ÉTAPE 10 : Statistiques de Réactions**

**Méthode** : `GET`  
**URL** : `{{base_url}}/api/public/infos/{{info_id}}/reactions/stats`  
**Headers** : Aucun

**Réponse attendue** :
```json
{
  "infoId": "uuid",
  "total": 1,
  "stats": {
    "LIKE": 1
  }
}
```

---

### **ÉTAPE 11 : Connexion Utilisateur (avec device binding)**

**Méthode** : `POST`  
**URL** : `{{base_url}}/api/auth/login`  
**Headers** : Aucun

**Body** (raw JSON) :

```json
{
  "licenseKey": "LOT-1234-ABCD-5678",
  "deviceId": "test-device-123",
  "deviceName": "iPhone 13 Pro",
  "deviceType": "ios",
  "platform": "ios"
}
```

**Réponse attendue** :
```json
{
  "message": "Connexion réussie",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "uuid",
    "email": "user@test.com",
    "phone": "+225771234567",
    "firstName": "Jean",
    "lastName": "Dupont",
    "licenseKey": "LOT-1234-ABCD-5678",
    "licenseType": "FREE",
    "licenseStatus": "ACTIVE",
    "isOnline": true,
    "lastLoginIp": "127.0.0.1",
    "maxSimultaneousLogins": 1
  }
}
```

**✅ Actions** :
1. Copier le `token` dans la variable `user_token`
2. Copier l'`id` dans la variable `user_id` (déjà fait)

---

### **ÉTAPE 12 : Récupérer mes Devices**

**Méthode** : `GET`  
**URL** : `{{base_url}}/api/devices/my-devices`  
**Headers** :
- `Authorization` : `Bearer {{user_token}}`

**Réponse attendue** :
```json
{
  "count": 1,
  "devices": [
    {
      "id": "uuid",
      "userId": "uuid",
      "deviceId": "test-device-123",
      "deviceName": "iPhone 13 Pro",
      "deviceType": "ios",
      "platform": "ios",
      "isAuthorized": true,
      "lastUsedAt": "2026-06-27T...",
      "createdAt": "2026-06-27T..."
    }
  ]
}
```

**✅ Vérification** : 
- Status code 200
- 1 device enregistré
- deviceId correspond à "test-device-123"

---

### **ÉTAPE 13 : Récupérer les Notifications (User)**

**Méthode** : `GET`  
**URL** : `{{base_url}}/api/auth/notifications`  
**Headers** :
- `Authorization` : `Bearer {{user_token}}`

**Réponse attendue** :
```json
{
  "notifications": []
}
```

---

### **ÉTAPE 14 : Déconnexion**

**Méthode** : `POST`  
**URL** : `{{base_url}}/api/auth/logout`  
**Headers** :
- `Authorization` : `Bearer {{user_token}}`

**Réponse attendue** :
```json
{
  "message": "Déconnexion réussie"
}
```

---

### **ÉTAPE 15 : Vérifier les Devices (Admin)**

**Méthode** : `GET`  
**URL** : `{{base_url}}/api/devices/user/{{user_id}}`  
**Headers** :
- `Authorization` : `Bearer {{admin_token}}`

**Réponse attendue** :
```json
{
  "count": 1,
  "devices": [
    {
      "id": "uuid",
      "userId": "uuid",
      "deviceId": "test-device-123",
      "deviceName": "iPhone 13 Pro",
      "deviceType": "ios",
      "platform": "ios",
      "isAuthorized": true,
      "lastUsedAt": "2026-06-27T...",
      "createdAt": "2026-06-27T..."
    }
  ]
}
```

---

### **ÉTAPE 16 : Réinitialiser un Device (Admin)**

**Méthode** : `POST`  
**URL** : `{{base_url}}/api/devices/reset`  
**Headers** :
- `Authorization` : `Bearer {{admin_token}}`

**Body** (raw JSON) :

```json
{
  "userId": "{{user_id}}",
  "deviceId": "test-device-123"
}
```

**Réponse attendue** :
```json
{
  "message": "Appareil réinitialisé avec succès. L'utilisateur peut maintenant se connecter.",
  "device": {
    "id": "uuid",
    "userId": "uuid",
    "deviceId": "test-device-123",
    "deviceName": "iPhone 13 Pro",
    "deviceType": "ios",
    "platform": "ios",
    "isAuthorized": true,
    "lastUsedAt": "2026-06-27T...",
    "createdAt": "2026-06-27T..."
  }
}
```

---

### **ÉTAPE 17 : Vérifier le statut Email (Admin)**

**Méthode** : `GET`  
**URL** : `{{base_url}}/api/admin/mail-status`  
**Headers** :
- `Authorization` : `Bearer {{admin_token}}`

**Réponse attendue** :
```json
{
  "status": {
    "configured": true,
    "senderEmail": true,
    "brevoInitialized": true
  },
  "apiCheck": {
    "ok": true,
    "info": { ... }
  }
}
```

**✅ Vérification** : 
- PAS de champ `apiKey` ou `BREVO_API_KEY`
- Seulement `configured: true/false`

---

### **ÉTAPE 18 : Récupérer CGU en Markdown**

**Méthode** : `GET`  
**URL** : `{{base_url}}/terms-of-service.md`  
**Headers** : Aucun

**Réponse** : Fichier Markdown avec les CGU

---

### **ÉTAPE 19 : Récupérer Privacy Policy en Markdown**

**Méthode** : `GET`  
**URL** : `{{base_url}}/privacy-policy.md`  
**Headers** : Aucun

**Réponse** : Fichier Markdown avec la politique de confidentialité

---

### **ÉTAPE 20 : Health Check**

**Méthode** : `GET`  
**URL** : `{{base_url}}/health`  
**Headers** : Aucun

**Réponse attendue** :
```json
{
  "status": "ok",
  "timestamp": "2026-06-27T...",
  "uptime": 1234
}
```

---

## 🔒 Tests de Sécurité

### **Test 1 : Validation Email Invalide**

**Méthode** : `POST`  
**URL** : `{{base_url}}/api/auth/register`  
**Headers** : Aucun

**Body** :
```json
{
  "email": "email-invalide",
  "phone": "+225771234567",
  "firstName": "Jean",
  "lastName": "Dupont"
}
```

**Réponse attendue** :
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

**✅ Vérification** : Status code 400

---

### **Test 2 : Validation Téléphone Trop Court**

**Méthode** : `POST`  
**URL** : `{{base_url}}/api/auth/register`  
**Headers** : Aucun

**Body** :
```json
{
  "email": "test@test.com",
  "phone": "123",
  "firstName": "Jean",
  "lastName": "Dupont"
}
```

**Réponse attendue** :
```json
{
  "error": "Données invalides",
  "details": [
    {
      "field": "phone",
      "message": "Numéro de téléphone trop court"
    }
  ]
}
```

---

### **Test 3 : Validation Clé de Licence Invalide**

**Méthode** : `POST`  
**URL** : `{{base_url}}/api/auth/login`  
**Headers** : Aucun

**Body** :
```json
{
  "licenseKey": "CLE-INVALIDE"
}
```

**Réponse attendue** :
```json
{
  "error": "Données invalides",
  "details": [
    {
      "field": "licenseKey",
      "message": "Format de clé invalide (LOT-1234-ABCD-5678)"
    }
  ]
}
```

---

### **Test 4 : Email Déjà Utilisé**

**Méthode** : `POST`  
**URL** : `{{base_url}}/api/auth/register`  
**Headers** : Aucun

**Body** :
```json
{
  "email": "user@test.com",
  "phone": "+225779999999",
  "firstName": "Test",
  "lastName": "User"
}
```

**Réponse attendue** :
```json
{
  "error": "Cet email est déjà utilisé"
}
```

**✅ Vérification** : Status code 400

---

### **Test 5 : Route Protégée Sans Token**

**Méthode** : `GET`  
**URL** : `{{base_url}}/api/admin/users`  
**Headers** : Aucun

**Réponse attendue** :
```json
{
  "error": "Token manquant"
}
```

**✅ Vérification** : Status code 401

---

### **Test 6 : Forgot-Key - Message Générique**

**Méthode** : `POST`  
**URL** : `{{base_url}}/api/auth/forgot-key`  
**Headers** : Aucun

**Body** :
```json
{
  "email": "email-qui-nexiste-pas@test.com"
}
```

**Réponse attendue** :
```json
{
  "message": "Si ce compte existe, un email avec votre clé de licence vous a été envoyé."
}
```

**✅ Vérification** : 
- Status code 200
- Message ne révèle PAS si l'email existe
- PAS d'erreur 404

---

### **Test 7 : Créer Admin Sans Authentification (doit échouer)**

**Méthode** : `POST`  
**URL** : `{{base_url}}/api/admin/create`  
**Headers** : Aucun

**Body** :
```json
{
  "email": "admin2@lotus.com",
  "phone": "+22511111111",
  "password": "Admin123!"
}
```

**Réponse attendue** :
```json
{
  "error": "Authentification admin requise"
}
```

**✅ Vérification** : Status code 401 (car un admin existe déjà)

---

### **Test 8 : Mot de Passe Admin Trop Faible**

**Méthode** : `POST`  
**URL** : `{{base_url}}/api/admin/change-password`  
**Headers** :
- `Authorization` : `Bearer {{admin_token}}`

**Body** :
```json
{
  "currentPassword": "Admin123!",
  "newPassword": "123"
}
```

**Réponse attendue** :
```json
{
  "error": "Données invalides",
  "details": [
    {
      "field": "newPassword",
      "message": "Le mot de passe doit contenir au moins 8 caractères"
    }
  ]
}
```

---

## 📱 Tests des Devices

### **Test 1 : Enregistrer un Device (User)**

**Méthode** : `POST`  
**URL** : `{{base_url}}/api/devices/register`  
**Headers** :
- `Authorization` : `Bearer {{user_token}}`

**Body** :
```json
{
  "deviceId": "device-test-456",
  "deviceName": "Samsung S21",
  "deviceType": "android",
  "platform": "android"
}
```

**Réponse attendue** :
```json
{
  "message": "Appareil enregistré avec succès",
  "device": {
    "id": "uuid",
    "userId": "uuid",
    "deviceId": "device-test-456",
    "deviceName": "Samsung S21",
    "deviceType": "android",
    "platform": "android",
    "isAuthorized": true,
    "lastUsedAt": "2026-06-27T...",
    "createdAt": "2026-06-27T..."
  }
}
```

**✅ Actions** : Copier l'`id` du device dans `device_id`

---

### **Test 2 : Récupérer mes Devices (User)**

**Méthode** : `GET`  
**URL** : `{{base_url}}/api/devices/my-devices`  
**Headers** :
- `Authorization` : `Bearer {{user_token}}`

**Réponse attendue** :
```json
{
  "count": 2,
  "devices": [
    {
      "id": "uuid",
      "deviceId": "test-device-123",
      "deviceName": "iPhone 13 Pro",
      ...
    },
    {
      "id": "uuid",
      "deviceId": "device-test-456",
      "deviceName": "Samsung S21",
      ...
    }
  ]
}
```

---

### **Test 3 : Supprimer un Device (User)**

**Méthode** : `DELETE`  
**URL** : `{{base_url}}/api/devices/my-devices/{{device_id}}`  
**Headers** :
- `Authorization` : `Bearer {{user_token}}`

**Réponse attendue** :
```json
{
  "message": "Appareil supprimé avec succès"
}
```

---

### **Test 4 : Voir les Devices d'un User (Admin)**

**Méthode** : `GET`  
**URL** : `{{base_url}}/api/devices/user/{{user_id}}`  
**Headers** :
- `Authorization` : `Bearer {{admin_token}}`

**Réponse attendue** :
```json
{
  "count": 1,
  "devices": [...]
}
```

---

### **Test 5 : Supprimer un Device (Admin)**

**Méthode** : `DELETE`  
**URL** : `{{base_url}}/api/devices/user/{{user_id}}/{{device_id}}`  
**Headers** :
- `Authorization` : `Bearer {{admin_token}}`

**Réponse attendue** :
```json
{
  "message": "Appareil supprimé avec succès"
}
```

---

## ⚠️ Tests d'Erreurs

### **Test 1 : Email Déjà Utilisé**

**Méthode** : `POST`  
**URL** : `{{base_url}}/api/admin/users`  
**Headers** :
- `Authorization` : `Bearer {{admin_token}}`

**Body** :
```json
{
  "email": "user@test.com",
  "phone": "+225779999999",
  "firstName": "Test",
  "lastName": "User",
  "licenseType": "FREE"
}
```

**Réponse attendue** :
```json
{
  "error": "Cet email est déjà utilisé"
}
```

---

### **Test 2 : Téléphone Déjà Utilisé**

**Méthode** : `POST`  
**URL** : `{{base_url}}/api/admin/users`  
**Headers** :
- `Authorization` : `Bearer {{admin_token}}`

**Body** :
```json
{
  "email": "newuser@test.com",
  "phone": "+225771234567",
  "firstName": "Test",
  "lastName": "User",
  "licenseType": "FREE"
}
```

**Réponse attendue** :
```json
{
  "error": "Ce numéro de téléphone est déjà utilisé"
}
```

---

### **Test 3 : Type de Réaction Invalide**

**Méthode** : `POST`  
**URL** : `{{base_url}}/api/public/infos/{{info_id}}/reactions`  
**Headers** : Aucun

**Body** :
```json
{
  "reactionType": "INVALID"
}
```

**Réponse attendue** :
```json
{
  "error": "Type de réaction invalide",
  "validTypes": ["LIKE", "LOVE", "HAHA", "WOW", "SAD", "ANGRY", "THUMBS_UP", "THUMBS_DOWN", "FIRE", "HEART_EYES", "CLAP", "THINKING"]
}
```

---

### **Test 4 : Route Protégée Sans Token**

**Méthode** : `GET`  
**URL** : `{{base_url}}/api/admin/users`  
**Headers** : Aucun

**Réponse attendue** :
```json
{
  "error": "Token manquant"
}
```

---

### **Test 5 : Token Invalide**

**Méthode** : `GET`  
**URL** : `{{base_url}}/api/admin/users`  
**Headers** :
- `Authorization` : `Bearer token-invalide`

**Réponse attendue** :
```json
{
  "error": "Token invalide"
}
```

---

### **Test 6 : User Introuvable**

**Méthode** : `GET`  
**URL** : `{{base_url}}/api/devices/user/user-qui-nexiste-pas`  
**Headers** :
- `Authorization` : `Bearer {{admin_token}}`

**Réponse attendue** :
```json
{
  "count": 0,
  "devices": []
}
```

---

### **Test 7 : Device Introuvable**

**Méthode** : `DELETE`  
**URL** : `{{base_url}}/api/devices/my-devices/device-qui-nexiste-pas`  
**Headers** :
- `Authorization` : `Bearer {{user_token}}`

**Réponse attendue** :
```json
{
  "error": "Appareil introuvable"
}
```

---

## 📊 Résumé des Tests

### Tests à Exécuter dans l'Ordre

1. ✅ Créer premier admin (bootstrap)
2. ✅ Login admin
3. ✅ Vérifier profil admin
4. ✅ Créer utilisateur
5. ✅ Récupérer tous les utilisateurs
6. ✅ Créer une info
7. ✅ Récupérer infos publiques
8. ✅ Ajouter réaction
9. ✅ Voir réactions
10. ✅ Statistiques réactions
11. ✅ Login user avec device
12. ✅ Récupérer mes devices
13. ✅ Récupérer notifications
14. ✅ Déconnexion
15. ✅ Voir devices (admin)
16. ✅ Réinitialiser device (admin)
17. ✅ Vérifier mail-status
18. ✅ Récupérer CGU
19. ✅ Récupérer Privacy Policy
20. ✅ Health check

### Tests de Sécurité (7)

1. ✅ Validation email invalide
2. ✅ Validation téléphone trop court
3. ✅ Validation clé invalide
4. ✅ Email déjà utilisé
5. ✅ Route protégée sans token
6. ✅ Forgot-key message générique
7. ✅ Créer admin sans auth (doit échouer)

### Tests des Devices (5)

1. ✅ Enregistrer device
2. ✅ Récupérer mes devices
3. ✅ Supprimer mon device
4. ✅ Voir devices d'un user (admin)
5. ✅ Supprimer device (admin)

### Tests d'Erreurs (7)

1. ✅ Email déjà utilisé
2. ✅ Téléphone déjà utilisé
3. ✅ Type réaction invalide
4. ✅ Route protégée sans token
5. ✅ Token invalide
6. ✅ User introuvable
7. ✅ Device introuvable

---

## 🎯 Checklist Complète

### Backend (20 tests)
- [ ] Étape 1 : Créer admin
- [ ] Étape 2 : Login admin
- [ ] Étape 3 : Profil admin
- [ ] Étape 4 : Créer utilisateur
- [ ] Étape 5 : Récupérer users
- [ ] Étape 6 : Créer info
- [ ] Étape 7 : Infos publiques
- [ ] Étape 8 : Ajouter réaction
- [ ] Étape 9 : Voir réactions
- [ ] Étape 10 : Stats réactions
- [ ] Étape 11 : Login user
- [ ] Étape 12 : Mes devices
- [ ] Étape 13 : Notifications
- [ ] Étape 14 : Déconnexion
- [ ] Étape 15 : Devices (admin)
- [ ] Étape 16 : Reset device
- [ ] Étape 17 : Mail status
- [ ] Étape 18 : CGU
- [ ] Étape 19 : Privacy
- [ ] Étape 20 : Health check

### Sécurité (7 tests)
- [ ] Test 1 : Email invalide
- [ ] Test 2 : Téléphone trop court
- [ ] Test 3 : Clé invalide
- [ ] Test 4 : Email déjà utilisé
- [ ] Test 5 : Sans token
- [ ] Test 6 : Forgot-key générique
- [ ] Test 7 : Admin sans auth

### Devices (5 tests)
- [ ] Test 1 : Enregistrer
- [ ] Test 2 : Récupérer
- [ ] Test 3 : Supprimer
- [ ] Test 4 : Voir (admin)
- [ ] Test 5 : Supprimer (admin)

### Erreurs (7 tests)
- [ ] Test 1 : Email doublon
- [ ] Test 2 : Phone doublon
- [ ] Test 3 : Réaction invalide
- [ ] Test 4 : Sans token
- [ ] Test 5 : Token invalide
- [ ] Test 6 : User introuvable
- [ ] Test 7 : Device introuvable

---

## 🚀 Importation dans Postman

### Option 1 : Import Manuel

1. Ouvrir Postman
2. Créer un nouvel environnement "Lotus Business"
3. Ajouter les variables d'environnement
4. Créer les requêtes manuellement en suivant ce guide

### Option 2 : Collection JSON

Créer une collection Postman avec toutes les requêtes ci-dessus et les organiser en dossiers :
- 📁 Configuration
- 📁 Tests Séquentiels (20 requêtes)
- 📁 Tests de Sécurité (7 requêtes)
- 📁 Tests Devices (5 requêtes)
- 📁 Tests d'Erreurs (7 requêtes)

---

## ✅ Vérifications Finales

Après avoir exécuté tous les tests, vérifier :

1. ✅ Toutes les routes répondent correctement
2. ✅ Les codes HTTP sont corrects (200, 201, 400, 401, etc.)
3. ✅ Les messages d'erreur sont clairs
4. ✅ Le device binding fonctionne
5. ✅ La validation Zod bloque les entrées invalides
6. ✅ Le rate limiting fonctionne (testez 11 requêtes rapides)
7. ✅ Les messages de sécurité ne fuient pas d'informations

---

## 🎉 Félicitations !

Si tous les tests passent, votre backend est **100% fonctionnel et sécurisé** !

**Prochaine étape** : Appliquer la migration SQL sur Supabase et tester en production.