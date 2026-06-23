# 📝 Changelog - Lotus Business

Toutes les modifications notables de ce projet seront documentées dans ce fichier.

---

## [23 Juin 2026] - CRUD Utilisateurs Complet

### ✅ Ajouté

#### Backend API
- **Route PATCH `/api/admin/users/:userId`** - Modification complète d'un utilisateur
  - Tous les champs modifiables: email, phone, firstName, lastName
  - Gestion du type de licence et du status
  - Support de la modification de `lastLoginIp` (pour débloquer les utilisateurs)
  - Modification du nombre d'appareils simultanés
  - Gestion de la date d'expiration (null pour FREE illimité)

- **Route DELETE `/api/admin/users/:userId`** - Suppression d'un utilisateur
  - Suppression définitive de la base de données
  - Vérification de l'existence avant suppression

#### Frontend Dashboard
- **Page Utilisateurs Complète** (`Users.jsx`)
  - Affichage de toutes les colonnes Supabase:
    - Utilisateur (prénom, nom, avatar)
    - Contact (email, téléphone)
    - Clé de licence
    - Type (FREE/PREMIUM)
    - Status (ACTIVE/EXPIRED/SUSPENDED)
    - Date d'expiration
    - Nombre d'appareils
    - **Dernière adresse IP** ⭐ NOUVEAU
    - Statut en ligne (●/○)
    - Dernière connexion
    - Actions (Modifier, Supprimer)

- **Modal d'Ajout d'Utilisateur** ⭐ NOUVEAU
  - Bouton "Ajouter" dans le header
  - Formulaire avec tous les champs requis
  - Choix du type de licence (FREE/PREMIUM)
  - Génération automatique de la clé de licence
  - Validation frontend complète

- **Modal de Modification** ⭐ AMÉLIORÉ
  - Tous les champs modifiables
  - Champ IP modifiable pour débloquer les utilisateurs
  - Mise à jour du type, status, expiration
  - Modification des appareils simultanés
  - Messages de succès/erreur

- **Fonctionnalité de Suppression** ⭐ NOUVEAU
  - Bouton supprimer avec icône poubelle
  - Confirmation avant suppression
  - Message de succès après suppression

### 🎨 Design & UX

- **Responsive Mobile Optimisé**
  - Table avec scroll horizontal sur mobile
  - Toutes les colonnes accessibles
  - Modaux adaptés aux petits écrans
  - Grilles de formulaire responsive (2 colonnes → 1 colonne sur mobile)
  - Boutons d'action toujours accessibles

- **Styles CSS Améliorés**
  - Classe `.pill-badge` pour les badges ronds
  - Classe `.search-box` pour la barre de recherche
  - Classe `.modal-panel` pour les modaux
  - Classe `.modal-actions` pour les actions de modal
  - Support complet du responsive avec media queries

### 🔧 Améliorations Techniques

- **Controller `adminController.js`**
  - Fonction `updateUser` avec validation complète
  - Fonction `deleteUser` avec vérification
  - Support du champ `lastLoginIp` modifiable
  - Gestion des dates d'expiration null

- **API Client `api.js`**
  - Méthode `usersAPI.update(userId, userData)`
  - Méthode `usersAPI.delete(userId)`
  - Cache invalidation après modifications
  - Gestion des erreurs améliorée

### 🐛 Corrections

- **Route `/api/downloads`**
  - Correction du chemin des middlewares (`../middlewares/` au lieu de `../middleware/`)
  - Utilisation correcte de `auth` et `isAdmin`

- **Serveur Backend**
  - Gestion des erreurs de port déjà utilisé
  - Démarrage propre avec messages clairs

### 📚 Documentation

- **README.md** mis à jour avec:
  - Section "Dernières Mises à Jour"
  - Description complète des fonctionnalités CRUD
  - Instructions pour le backend et frontend
  - Colonnes affichées dans le tableau

---

## Résumé des Fonctionnalités Actuelles

### 🔐 Système de Licences
- **FREE**: Durée illimitée (expirationDate = null), 1 appareil uniquement
- **PREMIUM**: 999 FCFA/mois, appareils illimités (999), sans pub

### 📧 Emails
- Service Brevo (API HTTP transactionnelle)
- Templates personnalisés avec logo
- Email de bienvenue avec clé de licence

### 🖼️ Gestion d'Images
- ImageKit pour le stockage (CDN)
- Supabase pour les métadonnées
- Upload base64 jusqu'à 10MB

### 🤖 IA pour Documents
- Mistral AI (primaire) + Groq (fallback)
- Génération de documents comptables
- Format JSON conforme SYSCOHADA

### 📱 Système Infos & Notifications
- Annonces globales avec images
- Notifications par utilisateur
- Marquer comme lu, compteur non lus

### 📊 Tracking Téléchargements
- Table `app_downloads`
- Tracking par IP, user-agent, source
- Statistiques: total, aujourd'hui, ce mois

### 🔒 Sécurité IP
- Restriction IP pour comptes FREE
- 1 seul appareil (même IP) pour FREE
- PREMIUM bypass complet

### 🎯 Routes Health Check
- `/health` et `/api/health`
- Pour UptimeRobot (empêche Render de s'endormir)

---

## 🚀 Prochaines Étapes Recommandées

1. **Déploiement**
   - Commit et push du code
   - Redéploiement sur Render
   - Test des nouvelles routes en production

2. **Tests**
   - Tester l'ajout d'utilisateurs
   - Tester la modification (surtout le champ IP)
   - Tester la suppression
   - Vérifier le responsive sur mobile

3. **Optimisations**
   - Pagination pour grandes listes d'utilisateurs
   - Filtres avancés (par type, status, etc.)
   - Export CSV des utilisateurs

---

**Date de mise à jour**: 23 Juin 2026  
**Version**: 2.0.0
