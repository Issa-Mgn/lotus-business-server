# Tests Postman - Lotus Business API

Guide complet pour tester toutes les fonctionnalités avec Postman.

---

## ⚙️ Configuration Postman

### Variables d'environnement

Créer un environnement Postman avec ces variables :

- `base_url` : `http://localhost:5000`
- `admin_token` : (sera rempli automatiquement après login)
- `user_id` : (sera rempli automatiquement)
- `info_id` : (sera rempli automatiquement)

---

## 🧪 Tests Séquentiels

### 1. Créer un Admin

**Méthode** : `POST`  
**URL** : `{{base_url}}/api/admin/create`  
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
  "message": "Admin créé avec succès",
  "admin": {
    "id": "...",
    "email": "admin@lotus.com",
    "phone": "+22500000000"
  }
}
```

---

### 2. Se connecter en tant qu'Admin

**Méthode** : `POST`  
**URL** : `{{base_url}}/api/admin/login`  
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
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "admin": {
    "id": "...",
    "email": "admin@lotus.com"
  }
}
```

**Action** : Copier le `token` et le mettre dans la variable `admin_token`

---

### 3. Vérifier le profil Admin

**Méthode** : `GET`  
**URL** : `{{base_url}}/api/admin/profile`  
**Headers** :
- `Authorization` : `Bearer {{admin_token}}`

**Réponse attendue** :
```json
{
  "admin": {
    "id": "...",
    "email": "admin@lotus.com",
    "phone": "+22500000000"
  }
}
```

---

### 4. Créer un Utilisateur

**Méthode** : `POST`  
**URL** : `{{base_url}}/api/admin/users`  
**Headers** :
- `Authorization` : `Bearer {{admin_token}}`

**Body** (raw JSON) :

```json
{
  "email": "user@test.com",
  "phone": "+22511111111",
  "firstName": "Jean",
  "lastName": "Dupont",
  "licenseType": "FREE"
}
```

**Réponse attendue** :
```json
{
  "message": "Utilisateur créé avec succès",
  "user": {
    "id": "...",
    "email": "user@test.com",
    "firstName": "Jean",
    "lastName": "Dupont",
    "licenseKey": "LOT-1234-ABCD-5678"
  },
  "licenseKey": "LOT-1234-ABCD-5678"
}
```

**Action** : Copier l'`id` dans la variable `user_id`

---

### 5. Récupérer tous les Utilisateurs

**Méthode** : `GET`  
**URL** : `{{base_url}}/api/admin/users`  
**Headers** :
- `Authorization` : `Bearer {{admin_token}}`

**Réponse attendue** :
```json
{
  "users": [
    {
      "id": "...",
      "email": "user@test.com",
      "firstName": "Jean",
      "lastName": "Dupont",
      "licenseKey": "LOT-1234-ABCD-5678",
      "licenseType": "FREE",
      "licenseStatus": "ACTIVE",
      "isOnline": false
    }
  ]
}
```

---

### 6. Créer une Info

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
    "id": "...",
    "title": "Nouvelle fonctionnalité !",
    "content": "Découvrez notre nouvelle fonctionnalité...",
    "published": true
  }
}
```

**Action** : Copier l'`id` dans la variable `info_id`

---

### 7. Récupérer les Infos (PUBLIC - Pas de token)

**Méthode** : `GET`  
**URL** : `{{base_url}}/api/public/infos`  
**Headers** : Aucun (route publique)

**Réponse attendue** :
```json
{
  "infos": [
    {
      "id": "...",
      "title": "Nouvelle fonctionnalité !",
      "content": "Découvrez notre nouvelle fonctionnalité...",
      "imageUrl": null,
      "published": true,
      "publishedAt": "2026-06-26T...",
      "reactionStats": {},
      "totalReactions": 0
    }
  ]
}
```

---

### 8. Ajouter une Réaction LIKE (PUBLIC)

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
    "id": "...",
    "infoId": "...",
    "reactionType": "LIKE",
    "ipAddress": "127.0.0.1",
    "createdAt": "2026-06-26T..."
  }
}
```

---

### 9. Ajouter une Réaction LOVE

**Méthode** : `POST`  
**URL** : `{{base_url}}/api/public/infos/{{info_id}}/reactions`

**Body** (raw JSON) :

```json
{
  "reactionType": "LOVE",
  "userId": "{{user_id}}"
}
```

---

### 10. Ajouter plusieurs types de Réactions

Tester avec différents `reactionType` :

- `LIKE` 👍
- `LOVE` ❤️
- `HAHA` 😂
- `WOW` 😮
- `SAD` 😢
- `ANGRY` 😡
- `THUMBS_UP` 👍
- `THUMBS_DOWN` 👎
- `FIRE` 🔥
- `HEART_EYES` 😍
- `CLAP` 👏
- `THINKING` 🤔

---

### 11. Obtenir toutes les Réactions d'une Info

**Méthode** : `GET`  
**URL** : `{{base_url}}/api/public/infos/{{info_id}}/reactions`

**Réponse attendue** :
```json
{
  "reactions": [
    {
      "id": "...",
      "infoId": "...",
      "reactionType": "LIKE",
      "userId": null,
      "ipAddress": "127.0.0.1",
      "createdAt": "2026-06-26T..."
    },
    {
      "id": "...",
      "reactionType": "LOVE",
      "userId": "...",
      "createdAt": "2026-06-26T..."
    }
  ]
}
```

---

### 12. Obtenir les Statistiques de Réactions

**Méthode** : `GET`  
**URL** : `{{base_url}}/api/public/infos/{{info_id}}/reactions/stats`

**Réponse attendue** :
```json
{
  "infoId": "...",
  "total": 2,
  "stats": {
    "LIKE": 1,
    "LOVE": 1
  }
}
```

---

### 13. Récupérer les Infos avec Stats (PUBLIC)

**Méthode** : `GET`  
**URL** : `{{base_url}}/api/public/infos`

**Réponse attendue** (après avoir ajouté des réactions) :
```json
{
  "infos": [
    {
      "id": "...",
      "title": "Nouvelle fonctionnalité !",
      "content": "...",
      "reactionStats": {
        "LIKE": 1,
        "LOVE": 1
      },
      "totalReactions": 2
    }
  ]
}
```

---

### 14. Récupérer CGU en Markdown (PUBLIC)

**Méthode** : `GET`  
**URL** : `{{base_url}}/terms-of-service.md`  
**Headers** : Aucun

**Réponse attendue** : Fichier Markdown

---

### 15. Récupérer Politique de Confidentialité en Markdown (PUBLIC)

**Méthode** : `GET`  
**URL** : `{{base_url}}/privacy-policy.md`  
**Headers** : Aucun

**Réponse attendue** : Fichier Markdown

---

### 16. Mettre à Jour un Utilisateur

**Méthode** : `PATCH`  
**URL** : `{{base_url}}/api/admin/users/{{user_id}}`  
**Headers** :
- `Authorization` : `Bearer {{admin_token}}`

**Body** (raw JSON) :

```json
{
  "firstName": "Jean-Pierre",
  "lastName": "Dupont-Martin"
}
```

**Réponse attendue** :
```json
{
  "message": "Utilisateur mis à jour avec succès",
  "user": {
    "id": "...",
    "firstName": "Jean-Pierre",
    "lastName": "Dupont-Martin"
  }
}
```

---

### 17. Passer un Utilisateur en Premium

**Méthode** : `POST`  
**URL** : `{{base_url}}/api/admin/upgrade-premium`  
**Headers** :
- `Authorization` : `Bearer {{admin_token}}`

**Body** (raw JSON) :

```json
{
  "userId": "{{user_id}}",
  "duration": 12
}
```

**Réponse attendue** :
```json
{
  "message": "Utilisateur passé en Premium avec succès",
  "user": {
    "id": "...",
    "licenseType": "PREMIUM",
    "expirationDate": "2027-06-26T..."
  }
}
```

---

### 18. Supprimer un Utilisateur (avec Cascade)

**Méthode** : `DELETE`  
**URL** : `{{base_url}}/api/admin/users/{{user_id}}`  
**Headers** :
- `Authorization` : `Bearer {{admin_token}}`

**Réponse attendue** :
```json
{
  "message": "Utilisateur et licence supprimés avec succès"
}
```

**Note** : La licence associée est automatiquement supprimée (cascade delete)

---

## 🧪 Tests d'Erreurs

### Test 1 : Email déjà utilisé

**Méthode** : `POST`  
**URL** : `{{base_url}}/api/admin/users`  
**Body** :

```json
{
  "email": "user@test.com",
  "phone": "+22522222222",
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

### Test 2 : Téléphone déjà utilisé

**Méthode** : `POST`  
**URL** : `{{base_url}}/api/admin/users`  
**Body** :

```json
{
  "email": "newuser@test.com",
  "phone": "+22511111111",
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

### Test 3 : Type de réaction invalide

**Méthode** : `POST`  
**URL** : `{{base_url}}/api/public/infos/{{info_id}}/reactions`  
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
  "validTypes": ["LIKE", "LOVE", "HAHA", ...]
}
```

---

### Test 4 : Route protégée sans token

**Méthode** : `GET`  
**URL** : `{{base_url}}/api/admin/users`  
**Headers** : Aucun (pas de token)

**Réponse attendue** :
```json
{
  "error": "Token non fourni"
}
```

---

## 📊 Résultats Attendus

### Format de Clé de Licence

Toutes les clés générées doivent suivre le format :

**`LOT-[4chiffres]-[4LETTRES]-[4chiffres]`**

Exemples valides :
- `LOT-1234-ABCD-5678`
- `LOT-9876-XYZW-5432`
- `LOT-0001-AAAA-9999`

Exemples invalides :
- `LOT-abcd-1234-5678` ❌ (pas de lettres au début)
- `LOT-1234-abcd-5678` ❌ (lettres minuscules)
- `LOT-123-ABCD-5678` ❌ (pas assez de chiffres)

---

## 🔍 Vérifications sur Supabase

Après chaque test, vérifier sur Supabase :

1. **Après création utilisateur** :
   - Table `users` : nouveau user créé
   - Table `licenses` : nouvelle licence créée avec `userId`

2. **Après suppression utilisateur** :
   - Table `users` : user supprimé
   - Table `licenses` : licence supprimée automatiquement (cascade)

3. **Après ajout de réactions** :
   - Table `reactions` : nouvelles réactions enregistrées
   - Vérifier `infoId`, `reactionType`, `ipAddress`

---

## 🚀 Collection Postman

Pour importer directement la collection :

1. Créer un nouveau workspace Postman
2. Importer les requêtes ci-dessus
3. Configurer les variables d'environnement
4. Exécuter les tests dans l'ordre

---

## 📝 Notes

- Toutes les routes `/api/public/*` sont accessibles sans authentification
- Les routes `/api/admin/*` nécessitent un token admin
- Les routes `/api/auth/*` sont pour les utilisateurs finaux
- Les réactions peuvent être ajoutées par n'importe qui (inscrit ou non)
- Le tracking IP permet d'éviter les abus

---

**Dernière mise à jour** : 26 juin 2026
