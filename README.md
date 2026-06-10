# 🚀 Lotus Business - Backend API

Backend Node.js/Express pour l'application de gestion de boutique Lotus Business avec système de licences par clé.

---

## 📋 Table des matières

- [Stack Technique](#stack-technique)
- [Architecture](#architecture)
- [Installation](#installation)
- [Configuration](#configuration)
- [API Endpoints](#api-endpoints)
- [Système de Licences](#système-de-licences)
- [Connexion Frontend](#connexion-frontend)
- [Tests](#tests)

## 📄 Fichiers importants

- **`QUICK_START.md`** : Guide de démarrage rapide avec checklist
- **`POSTMAN_TESTS.md`** : Guide complet de test avec Postman (17 tests)
- **`create-admin-hash.js`** : Script pour générer un hash bcrypt pour admin
- **`README.md`** : Documentation complète de l'API

---

## 🛠️ Stack Technique

- **Node.js** + **Express** - Framework web
- **Prisma ORM** - Gestion de la base de données
- **Supabase (PostgreSQL)** - Base de données cloud
- **JWT** - Authentification
- **Resend** - Envoi d'emails
- **bcrypt** - Hashage des mots de passe (admins)
- **uuid** - Génération des clés de licence

---

## 🏗️ Architecture

### Base de données (3 tables)

1. **users** : Utilisateurs avec leurs licences intégrées
2. **admins** : Administrateurs (connexion email/password)
3. **licenses** : Index rapide email → clé de licence

### Structure du code

```
server/
├── src/
│   ├── lib/
│   │   ├── prisma.js              # Instance Prisma
│   │   ├── generateLicenseKey.js  # Générateur LOT-XXXX-xxxx-XXXX
│   │   └── sendEmail.js           # Service Resend
│   ├── middlewares/
│   │   ├── auth.js                # Vérification JWT
│   │   └── isAdmin.js             # Vérification rôle admin
│   ├── controllers/
│   │   ├── authController.js      # Inscription/Connexion users
│   │   └── adminController.js     # Gestion admin
│   ├── routes/
│   │   ├── auth.js                # Routes publiques
│   │   └── admin.js               # Routes admin protégées
│   └── app.js                     # Point d'entrée
├── prisma/
│   ├── schema.prisma              # Schéma DB
│   └── seed.js                    # Données de test
└── .env                           # Variables d'environnement
```

---

## 📦 Installation

### 1. Cloner et installer

```bash
cd server
npm install
```

### 2. Configurer les variables d'environnement

Créer un fichier `.env` :

```env
DATABASE_URL="postgresql://postgres.xxx:password@aws-0-eu-west-2.pooler.supabase.com:6543/postgres"
JWT_SECRET="votre_secret_jwt_genere"
BREVO_API_KEY="xkeysib-votre_cle_brevo"
BREVO_SENDER_EMAIL="noreply@lotusbusiness.com"
PORT=5000
NODE_ENV="development"
```

**Générer un JWT_SECRET :**
```bash
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

### 3. Configurer Supabase

1. Créer un projet sur [supabase.com](https://supabase.com)
2. Aller dans **SQL Editor**
3. Exécuter le script SQL (voir section SQL ci-dessous)

### 4. Initialiser Prisma

```bash
npm run prisma:generate
```

### 5. Démarrer le serveur

```bash
npm run dev
```

Serveur sur : `http://localhost:5000`

---

## ⚙️ Configuration

### Supabase - Script SQL

Exécuter dans le SQL Editor de Supabase :

```sql
-- Supprimer les anciennes tables
DROP TABLE IF EXISTS "licenses" CASCADE;
DROP TABLE IF EXISTS "admins" CASCADE;
DROP TABLE IF EXISTS "users" CASCADE;
DROP TYPE IF EXISTS "LicenseType" CASCADE;
DROP TYPE IF EXISTS "LicenseStatus" CASCADE;

-- Créer les types enum
CREATE TYPE "LicenseType" AS ENUM ('FREE', 'PREMIUM');
CREATE TYPE "LicenseStatus" AS ENUM ('ACTIVE', 'EXPIRED', 'SUSPENDED');

-- Table Users
CREATE TABLE "users" (
  "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "email" TEXT UNIQUE NOT NULL,
  "phone" TEXT UNIQUE NOT NULL,
  "firstName" TEXT NOT NULL,
  "lastName" TEXT NOT NULL,
  "licenseKey" TEXT UNIQUE NOT NULL,
  "licenseType" "LicenseType" DEFAULT 'FREE' NOT NULL,
  "licenseStatus" "LicenseStatus" DEFAULT 'ACTIVE' NOT NULL,
  "activationDate" TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
  "expirationDate" TIMESTAMP NOT NULL,
  "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- Table Admins
CREATE TABLE "admins" (
  "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "email" TEXT UNIQUE NOT NULL,
  "phone" TEXT UNIQUE NOT NULL,
  "password" TEXT NOT NULL,
  "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- Table Licenses
CREATE TABLE "licenses" (
  "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "email" TEXT UNIQUE NOT NULL,
  "key" TEXT UNIQUE NOT NULL
);

-- Index
CREATE INDEX "users_email_idx" ON "users"("email");
CREATE INDEX "users_licenseKey_idx" ON "users"("licenseKey");
CREATE INDEX "licenses_email_idx" ON "licenses"("email");
```

### Brevo (Envoi d'emails)

1. Créer un compte sur [brevo.com](https://www.brevo.com)
2. Aller dans **Settings** → **SMTP & API**
3. Créer une nouvelle **API Key**
4. Copier la clé dans `.env`

**Avantages de Brevo :**
- ✅ 300 emails gratuits par jour
- ✅ Pas de vérification de domaine requise
- ✅ Emails envoyés à n'importe quelle adresse
- ✅ Idéal pour développement et production

---

## 🔌 API Endpoints

### Base URL
```
http://localhost:5000
```

### 📍 Routes Users (Public)

#### 1. Inscription

```http
POST /api/auth/register
Content-Type: application/json

{
  "email": "user@example.com",
  "phone": "+221771234567",
  "firstName": "Jean",
  "lastName": "Dupont"
}
```

**Réponse :**
```json
{
  "message": "Inscription réussie ! Votre clé a été envoyée par email.",
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "phone": "+221771234567",
    "firstName": "Jean",
    "lastName": "Dupont",
    "licenseKey": "LOT-1234-abcd-5678",
    "licenseType": "FREE",
    "expirationDate": "2026-07-09T..."
  },
  "emailSent": true
}
```

#### 2. Connexion

```http
POST /api/auth/login
Content-Type: application/json

{
  "licenseKey": "LOT-1234-abcd-5678"
}
```

**Réponse :**
```json
{
  "message": "Connexion réussie",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "phone": "+221771234567",
    "firstName": "Jean",
    "lastName": "Dupont",
    "licenseKey": "LOT-1234-abcd-5678",
    "licenseType": "FREE",
    "licenseStatus": "ACTIVE",
    "expirationDate": "2026-07-09T..."
  }
}
```

#### 3. Récupérer sa clé de licence

```http
POST /api/auth/forgot-key
Content-Type: application/json

{
  "email": "user@example.com"
}
```

**Réponse :**
```json
{
  "message": "Clé renvoyée par email",
  "email": "us***@example.com"
}
```

---

### 🔐 Routes Admin (Protégées)

#### 1. Connexion Admin

```http
POST /api/admin/login
Content-Type: application/json

{
  "email": "admin@example.com",
  "password": "password123"
}
```

**Réponse :**
```json
{
  "message": "Connexion admin réussie",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "admin": {
    "id": "uuid",
    "email": "admin@example.com",
    "phone": "+221771234567"
  }
}
```

#### 2. Liste des utilisateurs

```http
GET /api/admin/users
Authorization: Bearer {token}
```

#### 3. Upgrade user vers PREMIUM

```http
POST /api/admin/upgrade-premium
Authorization: Bearer {token}
Content-Type: application/json

{
  "userId": "uuid"
}
```

#### 4. Suspendre un user

```http
PATCH /api/admin/suspend/{userId}
Authorization: Bearer {token}
```

---

## 🎫 Système de Licences

### Types de licences

| Type | Durée | Création |
|------|-------|----------|
| **FREE** | 1 mois | Automatique à l'inscription |
| **PREMIUM** | 1 an | Upgrade admin uniquement |

### Statuts

- **ACTIVE** : Licence valide
- **EXPIRED** : Licence expirée (vérifié à chaque login)
- **SUSPENDED** : Licence suspendue par admin

### Format des clés

`LOT-XXXX-xxxx-XXXX`

- Part 1 : 4 chiffres
- Part 2 : 4 lettres minuscules
- Part 3 : 4 chiffres

Exemple : `LOT-8248-izri-8239`

---

## 🔗 Connexion Frontend

### Configuration CORS

Le serveur accepte les requêtes de tous les domaines. Pour restreindre en production, modifier `src/app.js` :

```javascript
app.use(cors({
  origin: 'https://votre-frontend.com'
}));
```

### Authentification Frontend

#### 1. Inscription User

```javascript
const response = await fetch('http://localhost:5000/api/auth/register', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    email: 'user@example.com',
    phone: '+221771234567',
    firstName: 'Jean',
    lastName: 'Dupont'
  })
});

const data = await response.json();
console.log(data.user.licenseKey); // Afficher la clé
```

#### 2. Connexion avec clé

```javascript
const response = await fetch('http://localhost:5000/api/auth/login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    licenseKey: 'LOT-1234-abcd-5678'
  })
});

const data = await response.json();
localStorage.setItem('token', data.token);
localStorage.setItem('user', JSON.stringify(data.user));
```

#### 3. Requêtes protégées

```javascript
const token = localStorage.getItem('token');

const response = await fetch('http://localhost:5000/api/admin/users', {
  method: 'GET',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  }
});
```

#### 4. Vérification expiration licence

```javascript
const user = JSON.parse(localStorage.getItem('user'));
const expirationDate = new Date(user.expirationDate);
const now = new Date();

if (expirationDate < now) {
  alert('Votre licence a expiré. Veuillez renouveler.');
  // Rediriger vers page upgrade
}
```

---

## 🧪 Tests

### Postman

Importer la collection depuis `thunder-tests/` ou tester manuellement :

1. **Register** : `POST /api/auth/register`
2. **Login** : `POST /api/auth/login`
3. Copier le `token`
4. **Get Users** (admin) : `GET /api/admin/users` avec header `Authorization: Bearer {token}`

### Créer un admin manuellement

Exécuter dans Supabase SQL Editor :

```sql
INSERT INTO "admins" ("id", "email", "phone", "password", "createdAt")
VALUES (
  gen_random_uuid()::text,
  'admin@lotusbusiness.com',
  '+221771111111',
  '$2b$10$YourHashedPasswordHere', -- Hash bcrypt de "admin123"
  CURRENT_TIMESTAMP
);
```

Pour générer un hash bcrypt :

```javascript
const bcrypt = require('bcrypt');
const hash = await bcrypt.hash('admin123', 10);
console.log(hash);
```

---

## 📝 Scripts NPM

| Commande | Description |
|----------|-------------|
| `npm run dev` | Démarrer en mode développement |
| `npm start` | Démarrer en production |
| `npm run prisma:generate` | Générer le client Prisma |
| `npm run prisma:studio` | Ouvrir Prisma Studio |
| `npm run test:keys` | Tester le générateur de clés |

---

## 🐛 Dépannage

### Erreur : "API key is invalid" (Brevo)

- Vérifier que `BREVO_API_KEY` est correct dans `.env`
- La clé doit commencer par `xkeysib-`
- Créer une nouvelle clé sur https://app.brevo.com/settings/keys/api

### Erreur : "Can't reach database server"

- Vérifier `DATABASE_URL` dans `.env`
- Vérifier que le projet Supabase est actif

### Erreur : "Column does not exist"

```bash
npm run prisma:generate
```

---

## 🚀 Déploiement Production

### Variables d'environnement

Configurer sur votre plateforme (Heroku, Vercel, Railway, etc.) :

```env
DATABASE_URL=...
JWT_SECRET=...
BREVO_API_KEY=...
BREVO_SENDER_EMAIL=noreply@lotusbusiness.com
PORT=5000
NODE_ENV=production
```

### Commandes de build

```bash
npm install
npm run prisma:generate
npm start
```

---

## 📞 Support

Pour toute question ou contribution, contacter le développeur.

**Développé avec ❤️ par L!txx pour Lotus Business**

---

## 📄 Licence

ISC
