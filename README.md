# 🚀 Lotus Business - Backend API

Backend Node.js/Express pour l'application de gestion commerciale Lotus Business avec système de licences par clé.

---

## 📋 Table des matières

- [Stack Technique](#stack-technique)
- [Architecture](#architecture)
- [Installation](#installation)
- [Configuration](#configuration)
- [API Endpoints](#api-endpoints)
- [Système de Licences](#système-de-licences)
- [Upload d'Images](#upload-dimages)
- [Tests](#tests)
- [Déploiement](#déploiement)

---

## 🛠️ Stack Technique

- **Node.js** + **Express** - Framework web
- **Prisma ORM** - Gestion de la base de données
- **Supabase (PostgreSQL)** - Base de données cloud
- **JWT** - Authentification
- **Brevo** - Envoi d'emails (API HTTP transactionnelle)
- **ImageKit** - Stockage et gestion d'images
- **bcrypt** - Hashage des mots de passe (admins)
- **uuid** - Génération des clés de licence

---

## 🏗️ Architecture

### Base de données

1. **users** : Utilisateurs avec leurs licences intégrées
2. **admins** : Administrateurs (connexion email/password)
3. **licenses** : Index rapide email → clé de licence
4. **infos** : Annonces/informations avec images (ImageKit)
5. **activities** : Journal d'activité
6. **notifications** : Notifications système

### Structure du code

```
server/
├── src/
│   ├── lib/
│   │   ├── prisma.js                  # Instance Prisma
│   │   ├── generateLicenseKey.js      # Générateur LOT-XXXX-xxxx-XXXX
│   │   ├── checkExpiredLicenses.js    # Vérification automatique
│   │   ├── getClientIp.js             # Extraction IP réelle (proxy, CDN)
│   │   └── mailer.js                  # (Legacy - remplacé par Brevo)
│   ├── services/
│   │   └── mailService.js             # Service email Brevo
│   ├── templates/
│   │   └── welcome.js                 # Template email bienvenue
│   ├── config/
│   │   ├── mailer.js                  # Configuration Brevo
│   │   └── imagekit.js                # Configuration ImageKit
│   ├── utils/
│   │   └── imageUpload.js             # Fonctions upload ImageKit
│   ├── middlewares/
│   │   ├── auth.js                    # Vérification JWT
│   │   ├── isAdmin.js                 # Vérification rôle admin
│   │   └── checkLicense.js            # Vérification validité licence
│   ├── controllers/
│   │   ├── authController.js          # Inscription/Connexion + restriction IP
│   │   ├── adminController.js         # Gestion admin
│   │   └── infoController.js          # Gestion infos + ImageKit
│   ├── routes/
│   │   ├── auth.js                    # Routes publiques
│   │   ├── admin.js                   # Routes admin protégées
│   │   ├── activity.js                # Routes activités
│   │   └── notifications.js           # Routes notifications
│   └── app.js                         # Point d'entrée
├── prisma/
│   ├── schema.prisma                  # Schéma DB
│   └── seed.js                        # Données de test
├── test-email.js                      # Script test email
├── test-imagekit.js                   # Script test ImageKit
├── test-ip-restriction.js             # Script test restriction IP
└── .env                               # Variables d'environnement
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
# Base de données
DATABASE_URL="postgresql://postgres.xxx:password@aws-0-eu-west-2.pooler.supabase.com:6543/postgres?pgbouncer=true"
DIRECT_URL="postgresql://postgres.xxx:password@aws-0-eu-west-2.pooler.supabase.com:5432/postgres"

# JWT
JWT_SECRET="votre_secret_jwt_genere"

# Email - Brevo
BREVO_API_KEY="xkeysib-votre_cle_brevo"
BREVO_SENDER_EMAIL="noreply@lotusbusiness.com"
BREVO_SENDER_NAME="Lotus Business"

# ImageKit
IMAGEKIT_PRIVATE_KEY="private_xxx"
IMAGEKIT_PUBLIC_KEY="public_xxx"
IMAGEKIT_URL_ENDPOINT="https://ik.imagekit.io/xxx"

# Serveur
PORT=5000
NODE_ENV="development"

# Debug (optionnel)
DEBUG_ADMIN=1
DEBUG_MAIL=1
```

**Générer un JWT_SECRET :**
```bash
node -e "console.log(require('crypto').randomBytes(64).toString('base64'))"
```

### 3. Configurer Prisma

```bash
npm run prisma:generate
```

### 4. Démarrer le serveur

```bash
npm run dev
```

Serveur sur : `http://localhost:5000`

---

## ⚙️ Configuration

### Brevo (Envoi d'emails)

1. Créer un compte sur [brevo.com](https://www.brevo.com)
2. Aller dans **Settings** → **SMTP & API**
3. Créer une nouvelle **API Key**
4. Copier la clé dans `.env` comme `BREVO_API_KEY`

**Avantages de Brevo :**
- ✅ 300 emails gratuits par jour
- ✅ API HTTP (pas de blocage SMTP)
- ✅ Pas de vérification de domaine requise
- ✅ Idéal pour développement et production

### ImageKit (Stockage d'images)

1. Créer un compte sur [imagekit.io](https://imagekit.io)
2. Aller dans **Settings** → **API Keys**
3. Copier :
   - **Public Key** → `IMAGEKIT_PUBLIC_KEY`
   - **Private Key** → `IMAGEKIT_PRIVATE_KEY`
   - **URL Endpoint** → `IMAGEKIT_URL_ENDPOINT`

**Avantages d'ImageKit :**
- ✅ 20GB de stockage gratuit
- ✅ CDN mondial intégré
- ✅ Optimisation automatique des images
- ✅ Transformations d'images à la volée

---

## 🔌 API Endpoints

### Base URL
```
Production: https://lotus-business-server.onrender.com/api
Local: http://localhost:5000/api
```

### 📍 Routes Users (Public)

#### 1. Inscription

```http
POST /auth/register
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
    "expirationDate": null
  }
}
```

**Note :** Les comptes FREE n'expirent jamais (`expirationDate: null`)

#### 2. Connexion

```http
POST /auth/login
Content-Type: application/json

{
  "licenseKey": "LOT-1234-abcd-5678"
}
```

**Note :** Pour les comptes FREE, la connexion est limitée à 1 appareil (vérification par IP). Si déjà connecté sur un autre appareil, le serveur retourne une erreur 403.

**Réponse succès :**
```json
{
  "message": "Connexion réussie",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": { ... }
}
```

**Erreur FREE (déjà connecté sur autre IP) :**
```json
{
  "error": "Compte FREE déjà connecté sur un autre appareil. Déconnectez-vous d'abord ou passez à PREMIUM pour connexions illimitées."
}
```

#### 3. Récupérer sa clé de licence

```http
POST /auth/forgot-key
Content-Type: application/json

{
  "email": "user@example.com"
}
```

---

### 🔐 Routes Admin (Protégées)

Toutes les routes admin nécessitent un header :
```http
Authorization: Bearer {admin_token}
```

#### Gestion des utilisateurs

```http
GET    /admin/users                    # Liste tous les utilisateurs
POST   /admin/upgrade-premium          # Upgrade user vers PREMIUM
PATCH  /admin/suspend/:userId          # Suspendre un utilisateur
POST   /admin/reactivate-license       # Réactiver une licence
POST   /admin/force-logout/:userId     # Déconnecter un user
POST   /admin/send-license-email       # Renvoyer email de licence
```

#### Gestion des infos (avec ImageKit)

```http
GET    /admin/infos                    # Liste toutes les infos
POST   /admin/infos                    # Créer info avec image
PATCH  /admin/infos/:infoId            # Modifier info
DELETE /admin/infos/:infoId            # Supprimer info + image
GET    /admin/infos/imagekit-auth      # Auth ImageKit pour client
```

**Exemple création d'info avec image :**
```json
{
  "title": "Nouvelle promotion",
  "content": "Description de la promotion...",
  "imageBase64": "data:image/jpeg;base64,/9j/4AAQ...",
  "published": true
}
```

#### Profil et paramètres

```http
GET    /admin/profile                  # Profil de l'admin connecté
POST   /admin/change-password          # Changer le mot de passe
```

---

## 🎫 Système de Licences

### Types de licences

| Type | Durée | Appareils | Restriction | Caractéristiques |
|------|-------|-----------|-------------|------------------|
| **FREE** | ♾️ Illimité | 1 seul | ✅ Restriction IP | Fonctionnalités limitées, avec publicités |
| **PREMIUM** | 30 jours | ∞ Illimité | ❌ Aucune | Toutes les fonctionnalités, sans pub, cloud illimité |

### Statuts

- **ACTIVE** : Licence valide
- **EXPIRED** : Licence expirée (vérifié automatiquement)
- **SUSPENDED** : Licence suspendue par admin

### Format des clés

`LOT-XXXX-xxxx-XXXX`

- Part 1 : 4 chiffres
- Part 2 : 4 lettres minuscules
- Part 3 : 4 chiffres

Exemple : `LOT-8248-izri-8239`

### 🔒 Restriction d'appareils (FREE)

Les comptes **FREE** sont limités à **1 seul appareil** à la fois via une vérification d'adresse IP :

- ✅ Un utilisateur FREE peut se connecter depuis un appareil (IP1)
- ❌ Si déjà connecté sur IP1, la connexion depuis un autre appareil (IP2) est **REFUSÉE**
- ✅ Il peut se **déconnecter** puis se reconnecter depuis un autre appareil
- 💎 Les comptes **PREMIUM** n'ont **aucune restriction** et peuvent se connecter depuis plusieurs appareils simultanément

**Comment ça marche ?**

1. Lors du login, le backend récupère l'IP réelle du client via les headers (`x-forwarded-for`, `x-real-ip`, `cf-connecting-ip`)
2. Pour les comptes FREE : vérifie si `isOnline = true` et si `lastLoginIp ≠ IP actuelle`
3. Si les IPs sont différentes → **403 Forbidden** avec message explicite
4. Pour les comptes PREMIUM : **aucune vérification IP**

**Message d'erreur :**
```json
{
  "error": "Compte FREE déjà connecté sur un autre appareil. Déconnectez-vous d'abord ou passez à PREMIUM pour connexions illimitées."
}
```

### Vérification automatique

Le serveur vérifie automatiquement les licences expirées **toutes les heures** et au démarrage. Seules les licences **PREMIUM** sont vérifiées (FREE n'expire jamais).

---

## 📸 Upload d'Images

### Architecture

Le système utilise **ImageKit** pour le stockage et la gestion des images :

1. **Frontend** : Convertit l'image en base64
2. **Backend** : Upload vers ImageKit via API
3. **ImageKit** : Stockage + CDN + optimisation
4. **Base de données** : Stocke l'URL de l'image

### Flow complet

```
┌─────────────┐      base64      ┌─────────────┐
│  Dashboard  │ ───────────────> │   Backend   │
└─────────────┘                  └─────────────┘
                                        │
                                        │ uploadImage()
                                        ↓
                                 ┌─────────────┐
                                 │  ImageKit   │
                                 └─────────────┘
                                        │
                                        │ URL
                                        ↓
                                 ┌─────────────┐
                                 │  Database   │
                                 └─────────────┘
```

### Tester ImageKit

```bash
npm run test:imagekit
```

Ce script :
- ✅ Vérifie les variables d'environnement
- ✅ Upload une image de test
- ✅ Affiche l'URL
- ✅ Supprime l'image de test

---

## 🧪 Tests

### Scripts de test disponibles

```bash
npm run test:email      # Test envoi email Brevo
npm run test:imagekit   # Test upload ImageKit
npm run test:ip         # Test restriction IP FREE
npm run test:db         # Test connexion Supabase
npm run test:keys       # Test générateur de clés
```

### Test email

```bash
npm run test:email
```

Envoie un email de test à l'adresse configurée dans `BREVO_SENDER_EMAIL`.

### Test ImageKit

```bash
npm run test:imagekit
```

Upload et supprime une image de test.

### Test restriction IP

```bash
npm run test:ip
```

Teste la restriction d'appareil pour les comptes FREE :
- ✅ Connexion depuis appareil 1 (doit réussir)
- ❌ Connexion depuis appareil 2 avec IP différente (doit échouer)
- ✅ Reconnexion depuis appareil 1 (doit réussir)

---

## 📝 Scripts NPM

| Commande | Description |
|----------|-------------|
| `npm run dev` | Démarrer en mode développement |
| `npm start` | Démarrer en production |
| `npm run prisma:generate` | Générer le client Prisma |
| `npm run prisma:studio` | Ouvrir Prisma Studio |
| `npm run test:email` | Tester l'envoi d'emails |
| `npm run test:imagekit` | Tester ImageKit |
| `npm run test:ip` | Tester la restriction IP FREE |

---

## 🚀 Déploiement Production

### Render.com

#### 1. Variables d'environnement

Configurer dans Render Dashboard :

```env
DATABASE_URL=postgresql://...
DIRECT_URL=postgresql://...
JWT_SECRET=...
BREVO_API_KEY=xkeysib-...
BREVO_SENDER_EMAIL=noreply@lotusbusiness.com
BREVO_SENDER_NAME=Lotus Business
IMAGEKIT_PRIVATE_KEY=private_...
IMAGEKIT_PUBLIC_KEY=public_...
IMAGEKIT_URL_ENDPOINT=https://ik.imagekit.io/...
PORT=5000
NODE_ENV=production
```

#### 2. Build Command

```bash
npm install && npx prisma generate
```

#### 3. Start Command

```bash
node src/app.js
```

### Vérifications post-déploiement

1. ✅ Tester la route de santé : `GET https://votre-api.onrender.com/`
2. ✅ Tester l'inscription : `POST /api/auth/register`
3. ✅ Vérifier réception email
4. ✅ Tester connexion admin : `POST /api/admin/login`
5. ✅ Tester upload image : `POST /api/admin/infos` avec image base64

---

## 🐛 Dépannage

### Erreur : "Cannot find module '../config/database'"

**Solution :** Ce problème a été corrigé. Le projet utilise `../lib/prisma` au lieu de `../config/database`.

### Erreur : "Cannot find module '../middleware/auth'"

**Solution :** Le dossier s'appelle `middlewares` (pluriel), pas `middleware`. Import corrigé dans tous les fichiers.

### Erreur : "BREVO_API_KEY manquant"

**Solution :** Vérifier que `BREVO_API_KEY` est défini dans `.env` et commence par `xkeysib-`.

### Erreur : "ImageKit upload failed"

**Solution :** Vérifier les 3 variables ImageKit dans `.env` :
- `IMAGEKIT_PRIVATE_KEY`
- `IMAGEKIT_PUBLIC_KEY`
- `IMAGEKIT_URL_ENDPOINT`

### Restriction IP ne fonctionne pas

**Symptôme :** Les utilisateurs FREE peuvent se connecter depuis plusieurs appareils

**Solutions :**
1. Vérifier que la colonne `lastLoginIp` existe dans la table `users` (Supabase)
   ```sql
   SELECT column_name FROM information_schema.columns 
   WHERE table_name = 'users' AND column_name = 'lastLoginIp';
   ```
2. Exécuter la migration SQL si la colonne n'existe pas :
   ```sql
   ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "lastLoginIp" TEXT;
   ```
3. Régénérer le client Prisma : `npm run prisma:generate`
4. Vérifier les logs : chercher "🔐 Tentative connexion" dans les logs Render
5. Tester localement : `npm run test:ip`

### Déploiement Render échoue

**Causes courantes :**
1. Variables d'environnement manquantes
2. Build command incorrect
3. Imports de modules incorrects
4. Routes non définies

**Vérifier :**
```bash
# Tester localement
npm install
npm run prisma:generate
node src/app.js

# Vérifier syntaxe
node --check src/app.js
```

---

## 📞 Support

Pour toute question ou contribution, contacter le développeur.

**Développé avec ❤️ par L!txx pour Lotus Business**

---

## 📄 Licence

ISC
