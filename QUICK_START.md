# 🚀 Quick Start - Lotus Business Backend

## ✅ Checklist de configuration (À faire maintenant)

### 1️⃣ Configuration Brevo (URGENT - pour les emails)

1. **Créer un compte Brevo :**
   - Va sur https://www.brevo.com
   - Clique sur **"Sign up free"** (gratuit)
   - Vérifie ton email

2. **Obtenir ta clé API :**
   - Connecte-toi à Brevo
   - Va dans **Settings** (en haut à droite)
   - Clique sur **SMTP & API** dans le menu de gauche
   - Clique sur **"Create a new API key"**
   - Nom : `Lotus Business Backend`
   - Copie la clé (commence par `xkeysib-...`)

3. **Mettre à jour le fichier .env :**
   - Ouvre `c:\Mes Travaux\Lotus Business\server\.env`
   - Remplace `BREVO_API_KEY="xkeysib-VOTRE_CLE_ICI"` avec ta vraie clé
   - Exemple : `BREVO_API_KEY="xkeysib-abc123def456..."`

### 2️⃣ Créer un compte Admin

**Option A : Générer le hash avec le script**

```bash
npm run create:admin
```

Copie la requête SQL affichée.

**Option B : Générer manuellement**

```bash
node -e "const bcrypt = require('bcrypt'); bcrypt.hash('admin123', 10).then(hash => console.log(hash));"
```

**Exécuter dans Supabase :**

1. Va sur https://supabase.com/dashboard
2. Sélectionne ton projet
3. Va dans **SQL Editor**
4. Colle la requête SQL :

```sql
INSERT INTO "admins" ("id", "email", "phone", "password", "createdAt")
VALUES (
  gen_random_uuid()::text,
  'admin@lotusbusiness.com',
  '+221770000000',
  'LE_HASH_GENERE',
  CURRENT_TIMESTAMP
);
```

5. Clique sur **Run**

### 3️⃣ Installer Brevo package (si pas encore fait)

```bash
npm install
```

### 4️⃣ Démarrer le serveur

```bash
npm run dev
```

Tu devrais voir :
```
🚀 Serveur Lotus Business démarré sur le port 5000
📍 URL: http://localhost:5000
```

---

## 🧪 Tester avec Postman

### Configuration rapide Postman

1. **Créer une nouvelle collection** : `Lotus Business API`

2. **Créer un environnement** avec ces variables :
   - `baseUrl` : `http://localhost:5000`
   - `token` : (vide pour l'instant)
   - `adminToken` : (vide pour l'instant)
   - `licenseKey` : (vide pour l'instant)
   - `userId` : (vide pour l'instant)

3. **Sélectionner cet environnement** dans Postman

### Premier test : Inscription

**Requête :**
```
POST {{baseUrl}}/api/auth/register
```

**Headers :**
```
Content-Type: application/json
```

**Body (raw JSON) :**
```json
{
  "email": "test@example.com",
  "phone": "+221771234567",
  "firstName": "Jean",
  "lastName": "Dupont"
}
```

**Cliquer sur Send**

**Résultat attendu :**
- Status : `201 Created`
- Tu reçois une clé de licence (format `LOT-1234-abcd-5678`)
- ✅ **Tu dois recevoir un email** avec la clé de licence

**Si tu ne reçois pas l'email :**
- Vérifie que `BREVO_API_KEY` est correct dans `.env`
- Vérifie les logs du serveur pour voir les erreurs
- Vérifie ta boîte spam

### Deuxième test : Connexion

**Requête :**
```
POST {{baseUrl}}/api/auth/login
```

**Body (raw JSON) :**
```json
{
  "licenseKey": "LA_CLE_RECUE"
}
```

**Résultat attendu :**
- Status : `200 OK`
- Tu reçois un `token` JWT
- Copie ce token pour les prochaines requêtes

---

## 📚 Documentation complète

- **Guide de test complet :** `POSTMAN_TESTS.md`
- **Documentation API :** `README.md`

---

## 🐛 Problèmes courants

### ❌ "API key is invalid" (Brevo)

**Solution :**
- Vérifie que ta clé Brevo commence par `xkeysib-`
- Vérifie qu'elle est bien dans `.env`
- Redémarre le serveur : `npm run dev`

### ❌ Pas d'email reçu

**Vérifications :**
1. Ta clé Brevo est-elle valide ?
2. As-tu vérifié ton dossier spam ?
3. Regarde les logs du serveur pour voir les erreurs Brevo

**Test manuel Brevo :**
- Va sur https://app.brevo.com/senders
- Vérifie que ton compte est actif

### ❌ "Can't reach database server"

**Solution :**
- Vérifie que `DATABASE_URL` est correct dans `.env`
- Va sur Supabase Dashboard et vérifie que le projet est actif
- Teste la connexion :
```bash
npm run test:db
```

### ❌ "Prisma Client not found"

**Solution :**
```bash
npm run prisma:generate
```

---

## 📊 Statut actuel de ton projet

✅ **Configuré :**
- Node.js backend (Express)
- Prisma ORM
- Supabase PostgreSQL
- JWT Authentication
- bcrypt pour les mots de passe admin
- Système de licences (FREE/PREMIUM)
- Session unique par utilisateur
- Expiration automatique des licences
- Brevo (code prêt)

⚠️ **À faire MAINTENANT :**
- [ ] Créer compte Brevo
- [ ] Obtenir clé API Brevo
- [ ] Mettre à jour `.env` avec `BREVO_API_KEY`
- [ ] Créer un admin dans Supabase
- [ ] Tester l'inscription et vérifier l'email

---

## 🎯 Prochaines étapes

Une fois les tests Postman validés :

1. **Intégration frontend** (React, Vue, Angular, etc.)
2. **Déploiement** (Heroku, Vercel, Railway, etc.)
3. **Fonctionnalités supplémentaires** (Dashboard admin, etc.)

---

## 📞 Besoin d'aide ?

Si tu rencontres un problème :

1. Vérifie les logs du serveur (terminal où `npm run dev` tourne)
2. Vérifie les logs de Postman (Console en bas)
3. Consulte `POSTMAN_TESTS.md` pour les tests détaillés
4. Consulte `README.md` pour la documentation complète

---

**Bon courage ! 🚀**
