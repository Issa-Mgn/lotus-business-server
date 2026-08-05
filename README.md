# 🚀 Lotus Business - Backend API

Backend Node.js/Express pour l'application de gestion commerciale Lotus Business avec système de licences par clé.

---

## 🆕 Dernières Mises à Jour (Août 2026)

### 💳 Intégration KKiaPay - Paiements Mobiles (v1.2)

**2 août 2026** : Intégration complète de KKiaPay pour les paiements mobiles. Système de paiement sécurisé avec webhook pour automatiser les upgrades et accès backups.

#### 🎯 Fonctionnalités de Paiement

**Méthodes de paiement supportées** :
- 📱 **Mobile Money** : Wave, Orange Money, MTN, Moov
- 💳 **Cartes bancaires** : Visa, Mastercard

**Types de paiements** :
1. **UPGRADE_PREMIUM** : Passer de FREE à PREMIUM
   - Mensuel : **999 FCFA/mois**
   - Annuel : **10 000 FCFA/an**
2. **RENEW_PREMIUM** : Renouveler l'abonnement PREMIUM
3. **BACKUP_ACCESS** : Acheter l'accès à un backup (999 FCFA)

#### 🔧 Routes API Paiements

```http
POST   /api/payments/create                      # Créer un paiement
GET    /api/payments/verify/:transactionId       # Vérifier un paiement
GET    /api/payments/history                     # Historique utilisateur
POST   /api/payments/webhook                     # Webhook KKiaPay
GET    /api/payments/admin/all                   # [ADMIN] Tous les paiements
POST   /api/payments/admin/grant-backup-access   # [ADMIN] Accorder accès backup
```

#### ⚙️ Configuration KKiaPay

Variables d'environnement :
```env
KKIAPAY_PUBLIC_KEY=pk_xxxxxxxxxxxxxxxxxxxxx
KKIAPAY_PRIVATE_KEY=sk_xxxxxxxxxxxxxxxxxxxxx
KKIAPAY_SECRET=secret_xxxxxxxxxxxxxxxxxxxxx
KKIAPAY_SANDBOX=true  # false en production
```

**URL Webhook à configurer** : `https://votre-domaine.com/api/payments/webhook`

#### 🔄 Workflow de Paiement

1. **App Mobile** → Appelle `/api/payments/create` avec type et montant
2. **Backend** → Crée intention de paiement via KKiaPay
3. **Backend** → Retourne `transactionId` et `paymentUrl`
4. **App Mobile** → Ouvre SDK KKiaPay pour paiement
5. **Utilisateur** → Effectue le paiement (Wave, MTN, etc.)
6. **KKiaPay** → Envoie webhook de confirmation au backend
7. **Backend** → Traite webhook, upgrade utilisateur automatiquement
8. **App Mobile** → Vérifie statut via `/api/payments/verify/:transactionId`

#### ✨ Actions Automatiques Post-Paiement

- **UPGRADE_PREMIUM** :
  - ✅ Passe l'utilisateur en PREMIUM
  - ✅ Définit date d'expiration (1 mois ou 1 an)
  - ✅ Active connexions illimitées
  - ✅ Rend tous les backups accessibles

- **RENEW_PREMIUM** :
  - ✅ Prolonge la date d'expiration
  - ✅ Réactive si expiré

- **BACKUP_ACCESS** :
  - ✅ Rend le backup spécifique téléchargeable
  - ✅ Utilisateur FREE peut récupérer ses données

#### 📊 Base de Données

Nouveau modèle `Payment` avec :
- Montant, type, statut (PENDING/SUCCESS/FAILED)
- Transaction ID KKiaPay
- Méthode de paiement
- Métadonnées (backupId, subscriptionType, etc.)
- Timestamps (création, complétion)

#### 📝 Documentation Complète

- `KKIAPAY_INTEGRATION.md` - Guide d'intégration complet
- Exemples React Native
- Configuration webhook
- Tests et sécurité

---

### ☁️ Système de Cloud Backup - Nouvelle Fonctionnalité Majeure (v1.1)

**Correctif 8 juillet 2026** : Problème de chemin de fichier résolu dans le téléchargement de backups. Le système stocke maintenant correctement le chemin complet `userId/timestamp_filename.db` et l'utilise directement sans reconstruction. Voir [BACKUP_FIX_SUMMARY.md](./BACKUP_FIX_SUMMARY.md) pour les détails.

#### 🎯 Concept Marketing Innovant

Un système de sauvegarde cloud avec stratégie freemium :
- **Utilisateurs FREE** : Données sauvegardées automatiquement mais **pas d'accès** (doivent upgrader pour récupérer soit payer pour pouvoir juste télécharger les données si un le téléphone est perdu)
- **Utilisateurs PREMIUM** : Peuvent synchroniser et restaurer leurs données à volonté et ils ont égalment accès à d'utres fonctionnalités premium comme le convertisseur...
- **Stockage** : Supabase Storage (bucket privé `user-backups`)
- **Format** : Fichiers `.db` (SQLite) jusqu'à 50 MB

#### 📦 Fonctionnalités

1. **Upload automatique des backups** :
   - FREE : Backup sauvegardé, marqué comme non accessible
   - PREMIUM : Backup sauvegardé et immédiatement accessible
   - Message d'upgrade affiché aux utilisateurs FREE

2. **Liste des backups** :
   - Tous les utilisateurs voient leurs backups
   - FREE : `canDownload: false`, `downloadUrl: null`
   - PREMIUM : `canDownload: true`, `downloadUrl` présent

3. **Téléchargement** :
   - FREE : **403 Forbidden** avec message d'upgrade
   - PREMIUM : URL de téléchargement signée (valide 1h)

4. **Admin** :
   - Peut accorder l'accès à un backup spécifique pour un FREE (après paiement)
   - Route `POST /api/backups/grant-access`

#### 🔧 Routes API Backups

```http
POST   /api/backups/upload              # Upload backup (FREE et PREMIUM)
GET    /api/backups/my-backups          # Lister ses backups
GET    /api/backups/:backupId/download  # Télécharger (PREMIUM uniquement)
DELETE /api/backups/:backupId           # Supprimer un backup
POST   /api/backups/grant-access        # [ADMIN] Accorder accès à un FREE
```

#### 📊 Configuration Supabase Storage

```bash
npm run setup:bucket  # Créer le bucket user-backups
```

Variables d'environnement requises :
```env
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_KEY=your_service_role_key_here
```

**Plan FREE Supabase suffisant** :
- 1 GB de stockage (≈ 100-200 backups de 5-10 MB)
- 2 GB de bande passante/mois

#### 🎯 Flow Utilisateur

**FREE User :**
1. Upload backup → "Backup sauvegardé. Passez à PREMIUM pour y accéder."
2. Liste backups → Voit ses backups mais `canDownload: false`
3. Tentative download → **403** "Cette fonctionnalité est réservée aux utilisateurs PREMIUM"
4. Perte de téléphone → Contacte le support → Paye → Admin accorde l'accès

**PREMIUM User :**
1. Upload backup → "Backup sauvegardé et accessible dans le cloud"
2. Liste backups → Voit ses backups avec `downloadUrl`
3. Download → Reçoit URL signée, télécharge le fichier
4. Peut synchroniser/restaurer à volonté

#### 📝 Documentation Complète

- `BACKUP_SYSTEM.md` - Documentation technique complète
- `TEST_BACKUP_LOCAL.md` - Guide de test en local avec Postman

---

### 🔒 Sécurité Renforcée - Niveau Production (Juin 2026)

#### 🎯 Nouvelles Sécurités Implémentées

1. **Rate Limiting** - Protection contre les attaques par force brute
   - `express-rate-limit` installé et configuré
   - Login : 10 tentatives/15 minutes
   - Admin login : 5 tentatives/15 minutes
   - Forgot-key : 5 tentatives/heure
   - **Impact** : Impossible de faire du brute-force sur les mots de passe

2. **Validation Systématique des Entrées (Zod)**
   - Validation de tous les inputs sur les routes critiques
   - Email : format valide requis
   - Téléphone : 8-20 caractères
   - Noms : 2-50 caractères
   - Clé de licence : format `LOT-1234-ABCD-5678` strict
   - Mot de passe admin : 8+ caractères, majuscule, minuscule, chiffre
   - **Impact** : Pas de données invalides en base de données

3. **Générateur de Clé Cryptographiquement Sûr**
   - Remplacé `Math.random()` par `crypto.randomInt()`
   - Clés de licence non prévisibles
   - **Impact** : Sécurité maximale des licences

4. **Protection Route Admin/Create**
   - Système de bootstrap : premier admin public, suivants protégés
   - Routes séparées : `/admin/create` (bootstrap) et `/admin/admins` (protégé)
   - Vérification authentification admin pour création d'admins supplémentaires
   - **Impact** : Impossible de créer des admins arbitrairement

5. **Sécurisation Mail-Status**
   - Ne révèle plus la clé API Brevo
   - Retourne seulement `configured: true/false`
   - **Impact** : Pas de fuite d'informations sensibles

6. **Message Générique Forgot-Key**
   - "Si ce compte existe, un email vous a été envoyé"
   - Ne révèle pas si l'email existe ou non
   - **Impact** : Pas d'énumération d'emails

7. **Device Binding Complet**
   - Table `devices` pour tracker les appareils
   - Enregistrement automatique lors du login
   - Gestion des devices (CRUD)
   - Reset device par admin (débloquer utilisateurs FREE)
   - **Impact** : Contrôle total des appareils utilisés

### ✅ Corrections Majeures - Synchronisation et Messages d'Erreur

#### 🔧 Problèmes Résolés

1. **Suppression en cascade Users ↔ Licenses**:
   - Ajout relation `userId` dans table `License` avec `onDelete: Cascade`
   - Quand un utilisateur est supprimé, sa licence est automatiquement supprimée
   - Plus besoin de supprimer manuellement sur Supabase
   - Migration SQL disponible dans `prisma/migrations/manual_add_license_cascade.sql`

2. **Format de clé de licence corrigé**:
   - Ancien format : `LOT-xxxx-xxxx-xxxx`
   - **Nouveau format : `LOT-1234-ABCD-5678`**
   - Format : 4 chiffres - 4 lettres MAJUSCULES - 4 chiffres
   - Exemple : `LOT-8248-KZRI-8239`, `LOT-3457-KSME-9021`

3. **Messages d'erreur précis et détaillés**:
   - ✅ "Cet email est déjà utilisé" (au lieu de "Erreur lors de la création")
   - ✅ "Ce numéro de téléphone est déjà utilisé"
   - ✅ "Erreur de génération de clé. Veuillez réessayer."
   - ✅ Erreurs Prisma (P2002, P2003, P2025) gérées avec messages clairs
   - Frontend affiche correctement les messages de succès en vert, erreurs en rouge

4. **Création utilisateur optimisée**:
   - Création User + License en une seule transaction (nested create)
   - Plus de problèmes de synchronisation
   - Génération clé avec vérification d'unicité robuste

#### 📋 CRUD Utilisateurs Complet (Tableau de Bord Admin)

1. **Affichage de toutes les colonnes Supabase**:
   - Utilisateur (prénom, nom avec avatar)
   - Contact (email, téléphone)
   - Clé de licence
   - Type de licence (FREE/PREMIUM)
   - Status (ACTIVE/EXPIRED/SUSPENDED)
   - Date d'expiration
   - Nombre d'appareils simultanés
   - **Dernière adresse IP** (nouvelle colonne)
   - Statut en ligne (●/○)
   - Dernière connexion

---

### 🆕 Nouvelles Fonctionnalités - Système de Réactions et Routes Publiques

#### 📱 Routes Publiques pour l'App Mobile

1. **Infos accessibles sans authentification**:
   - `GET /api/public/infos` - Récupérer toutes les infos publiées avec stats de réactions
   - Plus besoin de token pour consulter les infos
   - Idéal pour l'app mobile (utilisateurs non connectés)

2. **Système de réactions complet**:
   - 12 types de réactions disponibles : LIKE, LOVE, HAHA, WOW, SAD, ANGRY, THUMBS_UP, THUMBS_DOWN, FIRE, HEART_EYES, CLAP, THINKING
   - `POST /api/public/infos/:infoId/reactions` - Ajouter une réaction (inscrit ou non)
   - `GET /api/public/infos/:infoId/reactions` - Voir toutes les réactions
   - `GET /api/public/infos/:infoId/reactions/stats` - Statistiques par type
   - Tracking par IP pour utilisateurs non connectés
   - Chaque info retourne automatiquement ses stats de réactions

3. **Documents légaux publics**:
   - `GET /terms-of-service.md` - CGU en Markdown (app mobile hors ligne)
   - `GET /privacy-policy.md` - Confidentialité en Markdown (app mobile hors ligne)
   - Pas d'authentification requise
   - Contenu identique aux versions HTML

#### 📚 Documentation Complète

1. **routes.md** - Documentation exhaustive de toutes les routes API :
   - Routes publiques (infos, réactions, documents légaux)
   - Routes d'authentification
   - Routes utilisateur
   - Routes admin
   - Routes notifications, documents, téléchargements
   - Routes activité
   - Format clé de licence, authentification JWT
   - Variables d'environnement requises

---2. **Modal d'Ajout d'Utilisateur**:
   - Bouton "Ajouter" dans le header
   - Formulaire complet: prénom, nom, email, téléphone
   - Choix du type de licence (FREE ou PREMIUM)
   - Création instantanée avec génération automatique de la clé
   - **Messages d'erreur précis** en cas de doublon

3. **Modal de Modification**:
   - Tous les champs modifiables
   - **Champ IP modifiable** pour débloquer les utilisateurs FREE bloqués
   - Mise à jour du type de licence, status, expiration
   - Modification du nombre d'appareils simultanés

4. **Suppression d'Utilisateurs**:
   - Bouton supprimer avec confirmation
   - **Suppression en cascade** : supprime automatiquement la licence
   - Plus besoin de supprimer manuellement sur Supabase

5. **Responsive Mobile Optimisé**:
   - Table avec scroll horizontal sur mobile
   - Toutes les colonnes visibles
   - Boutons d'action accessibles
   - Modaux adaptés aux petits écrans

#### � Étapes Post-Corrections

1. **Exécuter la migration SQL sur Supabase** :
   ```sql
   -- Fichier: server/prisma/migrations/manual_add_license_cascade.sql
   -- Connectez-vous à Supabase SQL Editor et exécutez ce fichier
   ```

2. **Régénérer le client Prisma** :
   ```bash
   npm run prisma:generate
   ```

3. **Redémarrer le serveur** :
   ```bash
   npm run dev
   ```

4. **Vérifier les corrections** :
   - Créer un utilisateur → vérifier le format de clé `LOT-1234-ABCD-5678`
   - Tester doublon email → message précis "Cet email est déjà utilisé"
   - Tester doublon téléphone → message précis "Ce numéro de téléphone est déjà utilisé"
   - Supprimer un utilisateur → vérifier que sa licence est aussi supprimée

#### �🔧 Backend

- Route `PATCH /api/admin/users/:userId` - Modifier un utilisateur
- Route `DELETE /api/admin/users/:userId` - Supprimer un utilisateur
- Support du champ `lastLoginIp` modifiable
- Validation complète des données

#### 🎨 Frontend

- Composant `Users.jsx` complètement refait
- Design moderne et cohérent
- Messages de succès/erreur
- Cache API intelligent
- État de chargement

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
- **ImageKit** - Stockage et gestion d'images (CDN)
- **Mistral AI** + **Groq** - Génération de documents comptables (IA)
- **bcrypt** - Hashage des mots de passe (admins)
- **uuid** - Génération des clés de licence

---

## 🏗️ Architecture

### Base de données

1. **users** : Utilisateurs avec leurs licences intégrées
2. **admins** : Administrateurs (connexion email/password)
3. **licenses** : Index rapide email → clé de licence
4. **infos** : Annonces/informations avec images (ImageKit)
5. **notifications** : Notifications système (globales et par utilisateur)
6. **activities** : Journal d'activité
7. **app_downloads** : Tracking des téléchargements de l'application

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
│   │   ├── mailService.js             # Service email Brevo
│   │   └── aiService.js               # Services IA (Mistral + Groq)
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
│   │   ├── adminController.js         # Gestion admin (CRUD users complet)
│   │   ├── infoController.js          # Gestion infos + ImageKit
│   │   ├── notificationController.js  # Notifications (admin + users)
│   │   ├── documentController.js      # Documents comptables (IA)
│   │   └── downloadController.js      # Tracking téléchargements app
│   ├── routes/
│   │   ├── auth.js                    # Routes publiques + infos/notifications users
│   │   ├── admin.js                   # Routes admin protégées (CRUD complet)
│   │   ├── activity.js                # Routes activités
│   │   ├── notifications.js           # Routes notifications admin
│   │   ├── documents.js               # Routes génération documents IA
│   │   └── downloads.js               # Routes tracking téléchargements
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

# IA - Mistral + Groq (gratuit)
MISTRAL_API_KEY="votre_cle_mistral"
GROQ_API_KEY="gsk_votre_cle_groq"

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

#### 4. Récupérer les infos (utilisateurs connectés)

```http
GET /auth/infos
Authorization: Bearer {user_token}
```

**Réponse :**
```json
{
  "count": 5,
  "infos": [
    {
      "id": "uuid",
      "title": "Nouvelle fonctionnalité",
      "content": "Description...",
      "imageUrl": "https://ik.imagekit.io/...",
      "published": true,
      "publishedAt": "2026-06-19T10:00:00Z"
    }
  ]
}
```

#### 5. Récupérer les notifications (utilisateurs connectés)

```http
GET /auth/notifications
Authorization: Bearer {user_token}
```

**Réponse :** Retourne les notifications globales + notifications spécifiques à l'utilisateur

```http
GET /auth/notifications/unread-count
Authorization: Bearer {user_token}
```

**Réponse :**
```json
{
  "unreadCount": 3
}
```

```http
PATCH /auth/notifications/:notificationId/read
Authorization: Bearer {user_token}
```

Marque une notification comme lue.

---

### 🔐 Routes Admin (Protégées)

Toutes les routes admin nécessitent un header :
```http
Authorization: Bearer {admin_token}
```

#### Gestion des utilisateurs (CRUD complet)

```http
GET    /admin/users                    # Liste tous les utilisateurs
PATCH  /admin/users/:userId            # Modifier un utilisateur (tous champs)
DELETE /admin/users/:userId            # Supprimer un utilisateur
POST   /admin/upgrade-premium          # Upgrade user vers PREMIUM
PATCH  /admin/suspend/:userId          # Suspendre un utilisateur
POST   /admin/reactivate-license       # Réactiver une licence
POST   /admin/force-logout/:userId     # Déconnecter un user
POST   /admin/send-license-email       # Renvoyer email de licence
```

**Exemple modification utilisateur :**
```json
PATCH /admin/users/:userId
{
  "email": "nouveau@email.com",
  "phone": "+221771234567",
  "firstName": "Jean",
  "lastName": "Dupont",
  "licenseType": "PREMIUM",
  "licenseStatus": "ACTIVE",
  "expirationDate": "2027-01-01",
  "maxSimultaneousLogins": 999
}
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

#### Tracking téléchargements

```http
GET    /downloads/count                # Compteur téléchargements (total, aujourd'hui, mois)
GET    /downloads/stats?period=7d      # Statistiques détaillées (7d, 30d, 90d, all)
POST   /downloads/track                # Enregistrer un téléchargement (route publique)
```

**Exemple réponse count :**
```json
{
  "total": 1250,
  "today": 15,
  "month": 320
}
```

#### Documents comptables (IA)

```http
POST   /documents/compte-resultat      # Générer compte de résultat
POST   /documents/bilan                # Générer bilan simplifié
POST   /documents/fiche-stock          # Générer fiche de stock
```

**Exemple génération compte de résultat :**
```json
POST /documents/compte-resultat
{
  "period": "2026",
  "ventes": 15000000,
  "achats": 8000000,
  "charges": 2500000
}
```

**Réponse :** Document au format JSON conforme SYSCOHADA

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

**Nouveau format (corrigé) : `LOT-1234-ABCD-5678`**

- Part 1 : **4 chiffres** (0000-9999)
- Part 2 : **4 lettres MAJUSCULES** (AAAA-ZZZZ)
- Part 3 : **4 chiffres** (0000-9999)

Exemples : `LOT-8248-IZRI-8239`, `LOT-3457-KSME-9021`, `LOT-1024-QWER-5678`

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
npm run test:email          # Test envoi email Brevo
npm run test:imagekit       # Test upload ImageKit
npm run test:ip             # Test restriction IP FREE
npm run test:db             # Test connexion Supabase
npm run test:keys           # Test générateur de clés
npm run test:ai             # Test services IA (Mistral + Groq)
npm run test:infos          # Test système infos/notifications
npm run test:image-upload   # Test upload images via API
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
| `npm run test:ai` | Tester les services IA |
| `npm run test:infos` | Tester infos/notifications |
| `npm run test:image-upload` | Tester upload images API |

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
MISTRAL_API_KEY=...
GROQ_API_KEY=gsk_...
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
2. ✅ Tester `/health` pour UptimeRobot : `GET https://votre-api.onrender.com/api/health`
3. ✅ Tester l'inscription : `POST /api/auth/register`
4. ✅ Vérifier réception email
5. ✅ Tester connexion admin : `POST /api/admin/login`
6. ✅ Tester upload image : `POST /api/admin/infos` avec image base64
7. ✅ Tester génération document IA : `POST /api/documents/compte-resultat`

### UptimeRobot (Monitoring 24/7)

Pour empêcher le serveur Render de s'endormir :

1. Créer un compte sur **https://uptimerobot.com** (gratuit)
2. Ajouter un monitor :
   - Type : `HTTP(s)`
   - URL : `https://lotus-business-server.onrender.com/api/health`
   - Interval : `5 minutes`
3. UptimeRobot va ping le serveur toutes les 5 minutes → **serveur toujours actif** 🚀

---

## 🚀 Nouvelles fonctionnalités (Juin 2026)

### 1. Routes utilisateurs pour Infos & Notifications

Les utilisateurs connectés peuvent maintenant accéder aux infos et notifications via :
- `GET /api/auth/infos` - Récupérer toutes les infos publiées
- `GET /api/auth/notifications` - Récupérer leurs notifications (globales + spécifiques)
- `GET /api/auth/notifications/unread-count` - Compteur non lues
- `PATCH /api/auth/notifications/:id/read` - Marquer comme lu

### 2. Tracking des téléchargements

Nouveau système de suivi des téléchargements de l'application :
- Table `app_downloads` dans la base
- Compteurs : total, aujourd'hui, ce mois
- Statistiques par période et par source
- Carte "Téléchargements app" dans le dashboard

### 3. CRUD complet des utilisateurs

Le dashboard admin dispose maintenant d'une gestion complète :
- ✅ Affichage de toutes les colonnes Supabase
- ✅ Modification complète (email, phone, nom, type licence, status, expiration, appareils)
- ✅ Suppression d'utilisateurs
- ✅ Modal d'édition avec tous les champs
- ✅ Colonnes : Utilisateur, Contact, Clé, Type, Status, Expiration, Appareils, En ligne, Dernière connexion

### 4. Génération documents comptables (IA)

Intégration de **Mistral AI** (primaire) et **Groq** (fallback) :
- Génération compte de résultat SYSCOHADA
- Génération bilan simplifié
- Génération fiche de stock
- Fallback automatique si Mistral est lent
- 100% gratuit

### 5. Limite body augmentée

Express accepte maintenant les images base64 jusqu'à **10MB** (fix upload images)

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

**Développé par L!txx pour Lotus Business**

---

## 📄 Licence

ISC
