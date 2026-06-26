# Changelog - Lotus Business Backend

Toutes les modifications importantes du projet.

---

## [1.2.0] - 2026-06-26

### 🆕 Nouvelles Fonctionnalités

#### Routes Publiques et Système de Réactions

- **Routes publiques pour les infos** :
  - `GET /api/public/infos` - Récupérer toutes les infos sans authentification
  - Inclut automatiquement les statistiques de réactions
  - Idéal pour l'app mobile (utilisateurs non connectés)

- **Système de réactions complet** :
  - 12 types de réactions : LIKE, LOVE, HAHA, WOW, SAD, ANGRY, THUMBS_UP, THUMBS_DOWN, FIRE, HEART_EYES, CLAP, THINKING
  - `POST /api/public/infos/:infoId/reactions` - Ajouter une réaction (public)
  - `GET /api/public/infos/:infoId/reactions` - Voir toutes les réactions
  - `GET /api/public/infos/:infoId/reactions/stats` - Statistiques par type
  - Tracking par IP pour utilisateurs non connectés
  - Tracking optionnel par userId pour utilisateurs connectés

- **Documents légaux en Markdown** :
  - `GET /terms-of-service.md` - CGU publiques en Markdown
  - `GET /privacy-policy.md` - Confidentialité publique en Markdown
  - Pas d'authentification requise
  - Contenu identique aux versions HTML
  - Optimisé pour l'app mobile (support hors ligne)

### 📝 Documentation

- **routes.md** - Documentation exhaustive de toutes les routes API
- **POSTMAN_TESTS.md** - Guide complet pour tester avec Postman
- **README.md** mis à jour avec les nouvelles fonctionnalités

### 🗄️ Base de Données

- **Nouveau modèle Reaction** :
  ```prisma
  model Reaction {
    id           String       @id @default(uuid())
    infoId       String
    reactionType ReactionType
    userId       String?
    ipAddress    String?
    userAgent    String?
    createdAt    DateTime     @default(now())
  }
  ```

- **Enum ReactionType** :
  ```prisma
  enum ReactionType {
    LIKE, LOVE, HAHA, WOW, SAD, ANGRY,
    THUMBS_UP, THUMBS_DOWN, FIRE, HEART_EYES, CLAP, THINKING
  }
  ```

- **Relation Info ↔ Reactions** avec cascade delete

### 📁 Fichiers Créés

- `src/routes/public.js` - Routes publiques (infos, réactions)
- `src/controllers/reactionController.js` - Gestion des réactions
- `prisma/migrations/manual_add_reactions.sql` - Migration SQL pour Supabase
- `routes.md` - Documentation API complète
- `POSTMAN_TESTS.md` - Guide de tests Postman
- `CHANGELOG.md` - Ce fichier

### 🔧 Modifications

- `src/app.js` - Ajout route `/api/public`
- `src/routes/auth.js` - Suppression route `/infos` (déplacée vers public)
- `src/controllers/infoController.js` - Ajout stats de réactions dans `getAllInfos`
- `prisma/schema.prisma` - Ajout modèles Reaction et enum ReactionType
- `README.md` - Mise à jour avec nouvelles features

---

## [1.1.0] - 2026-06-14

### ✅ Corrections Majeures

#### Synchronisation Supabase

- **Cascade Delete Users ↔ Licenses** :
  - Ajout `userId` dans table License avec `onDelete: Cascade`
  - Suppression automatique de la licence lors de la suppression d'un utilisateur
  - Migration SQL : `prisma/migrations/manual_add_license_cascade.sql`

#### Format de Clé de Licence

- **Correction du format** :
  - Ancien : `LOT-xxxx-xxxx-xxxx` (alphanumérique aléatoire)
  - Nouveau : `LOT-1234-ABCD-5678` (4 chiffres - 4 LETTRES - 4 chiffres)
  - Fichier : `src/lib/generateLicenseKey.js`

#### Messages d'Erreur

- **Messages précis et détaillés** :
  - "Cet email est déjà utilisé" (P2002 sur email)
  - "Ce numéro de téléphone est déjà utilisé" (P2002 sur phone)
  - "Erreur de génération de clé" (P2002 sur licenseKey)
  - Gestion erreurs Prisma : P2002, P2003, P2025
  - Frontend : affichage correct (vert = succès, rouge = erreur)

#### Création Utilisateur

- **Optimisation** :
  - Création User + License en une seule transaction (nested create)
  - Génération clé avec vérification d'unicité robuste
  - Plus de problèmes de synchronisation

### 📝 Fichiers Modifiés

- `prisma/schema.prisma` - Ajout userId dans License
- `src/lib/generateLicenseKey.js` - Nouveau format de clé
- `src/controllers/authController.js` - Messages d'erreur détaillés
- `src/controllers/adminController.js` - Messages d'erreur détaillés
- `dashboard/src/pages/Users.jsx` - Affichage messages (vert/rouge)

---

## [1.0.0] - 2026-06-10

### 🎉 Version Initiale

#### Fonctionnalités

- Authentification JWT (users et admins)
- Gestion de licences (FREE/PREMIUM)
- Système de notifications
- Génération documents comptables (IA)
- Emails automatiques (Brevo)
- Push notifications (Expo)
- Upload images (ImageKit)
- Documents légaux (CGU/Privacy)
- Tracking téléchargements
- Logs d'activité
- Vérification automatique licences expirées

#### Technologies

- Node.js + Express
- PostgreSQL + Prisma
- JWT
- Brevo (emails)
- ImageKit (images)
- OpenAI + Gemini + Perplexity (IA)

---

## 📊 Statistiques

### Version 1.2.0
- **Lignes de code ajoutées** : ~800
- **Nouveaux fichiers** : 7
- **Fichiers modifiés** : 5
- **Nouvelles routes** : 6 (publiques)
- **Nouvelles fonctionnalités** : 3 (réactions, infos publiques, docs MD)

### Total Projet
- **Routes API** : 60+
- **Modèles Prisma** : 11
- **Contrôleurs** : 10
- **Middlewares** : 2
- **Services** : 4

---

**Mainteneur** : Lotus Business Team  
**Dernière mise à jour** : 26 juin 2026
