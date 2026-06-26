# Routes API - Lotus Business Backend

Ce document liste toutes les routes disponibles dans le backend de Lotus Business pour faciliter l'intégration avec l'application mobile.

---

## 📋 Table des matières

1. [Routes Publiques](#routes-publiques)
2. [Routes d'Authentification](#routes-dauthentification)
3. [Routes Utilisateur](#routes-utilisateur)
4. [Routes Admin](#routes-admin)
5. [Routes Notifications](#routes-notifications)
6. [Routes Documents](#routes-documents)
7. [Routes Téléchargements](#routes-téléchargements)
8. [Routes Légales](#routes-légales)
9. [Routes Activité](#routes-activité)

---

## 🌍 Routes Publiques

### GET `/`
- **Description**: Page d'accueil de l'API
- **Auth requise**: Non
- **Réponse**: `{ message, version, status }`

### GET `/health` ou `/api/health`
- **Description**: Health check pour monitoring (UptimeRobot)
- **Auth requise**: Non
- **Réponse**: `{ status: "ok", timestamp, uptime }`

### GET `/api/public/infos`
- **Description**: Récupérer toutes les infos publiées avec statistiques de réactions
- **Auth requise**: Non
- **Réponse**: `{ infos: [{ id, title, content, imageUrl, reactionStats, totalReactions, ... }] }`

### POST `/api/public/infos/:infoId/reactions`
- **Description**: Ajouter une réaction à une info (utilisateurs inscrits ou non)
- **Auth requise**: Non
- **Body**: `{ reactionType: "LIKE" | "LOVE" | "HAHA" | "WOW" | "SAD" | "ANGRY" | "THUMBS_UP" | "THUMBS_DOWN" | "FIRE" | "HEART_EYES" | "CLAP" | "THINKING", userId?: string }`
- **Réponse**: `{ message, reaction }`

### GET `/api/public/infos/:infoId/reactions`
- **Description**: Obtenir toutes les réactions d'une info
- **Auth requise**: Non
- **Réponse**: `{ reactions: [] }`

### GET `/api/public/infos/:infoId/reactions/stats`
- **Description**: Obtenir les statistiques de réactions d'une info
- **Auth requise**: Non
- **Réponse**: `{ infoId, total, stats: { LIKE: 5, LOVE: 3, ... } }`

---

## 🔐 Routes d'Authentification

### POST `/api/auth/register`
- **Description**: Inscription d'un nouvel utilisateur
- **Auth requise**: Non
- **Body**: `{ email, phone, firstName, lastName, licenseType: "FREE" | "PREMIUM" }`
- **Réponse**: `{ message, user, licenseKey }`
- **Erreurs**: 
  - `Cet email est déjà utilisé`
  - `Ce numéro de téléphone est déjà utilisé`
  - `Erreur de génération de clé`

### POST `/api/auth/login`
- **Description**: Connexion utilisateur
- **Auth requise**: Non
- **Body**: `{ email, licenseKey, expoPushToken? }`
- **Réponse**: `{ token, user }`

### POST `/api/auth/logout`
- **Description**: Déconnexion utilisateur
- **Auth requise**: Oui (User)
- **Réponse**: `{ message }`

### POST `/api/auth/forgot-key`
- **Description**: Récupération de clé de licence par email
- **Auth requise**: Non
- **Body**: `{ email }`
- **Réponse**: `{ message }`

---

## 👤 Routes Utilisateur

### GET `/api/auth/notifications`
- **Description**: Récupérer les notifications de l'utilisateur connecté
- **Auth requise**: Oui (User)
- **Réponse**: `{ notifications: [] }`

### GET `/api/auth/notifications/unread-count`
- **Description**: Nombre de notifications non lues
- **Auth requise**: Oui (User)
- **Réponse**: `{ count: number }`

### PATCH `/api/auth/notifications/:notificationId/read`
- **Description**: Marquer une notification comme lue
- **Auth requise**: Oui (User)
- **Réponse**: `{ message }`

### PATCH `/api/auth/notifications/mark-all-read`
- **Description**: Marquer toutes les notifications comme lues
- **Auth requise**: Oui (User)
- **Réponse**: `{ message }`

---

## 👨‍💼 Routes Admin

### POST `/api/admin/login`
- **Description**: Connexion administrateur
- **Auth requise**: Non
- **Body**: `{ email, password }`
- **Réponse**: `{ token, admin }`

### POST `/api/admin/create`
- **Description**: Créer un nouvel administrateur
- **Auth requise**: Non (à sécuriser après premier admin)
- **Body**: `{ email, phone, password }`
- **Réponse**: `{ message, admin }`

### GET `/api/admin/profile`
- **Description**: Obtenir le profil de l'admin connecté
- **Auth requise**: Oui (Admin)
- **Réponse**: `{ admin }`

### POST `/api/admin/change-password`
- **Description**: Changer le mot de passe admin
- **Auth requise**: Oui (Admin)
- **Body**: `{ currentPassword, newPassword }`
- **Réponse**: `{ message }`

### GET `/api/admin/users`
- **Description**: Liste de tous les utilisateurs
- **Auth requise**: Oui (Admin)
- **Réponse**: `{ users: [] }`

### POST `/api/admin/users`
- **Description**: Créer un utilisateur depuis l'admin
- **Auth requise**: Oui (Admin)
- **Body**: `{ email, phone, firstName, lastName, licenseType }`
- **Réponse**: `{ message, user, licenseKey }`

### PATCH `/api/admin/users/:userId`
- **Description**: Mettre à jour un utilisateur
- **Auth requise**: Oui (Admin)
- **Body**: `{ firstName?, lastName?, phone?, licenseType?, licenseStatus?, expirationDate? }`
- **Réponse**: `{ message, user }`

### DELETE `/api/admin/users/:userId`
- **Description**: Supprimer un utilisateur (supprime aussi sa licence via cascade)
- **Auth requise**: Oui (Admin)
- **Réponse**: `{ message }`

### GET `/api/admin/admins`
- **Description**: Liste de tous les administrateurs
- **Auth requise**: Oui (Admin)
- **Réponse**: `{ admins: [] }`

### POST `/api/admin/upgrade-premium`
- **Description**: Passer un utilisateur en Premium
- **Auth requise**: Oui (Admin)
- **Body**: `{ userId, duration: number (mois) }`
- **Réponse**: `{ message, user }`

### PATCH `/api/admin/suspend/:userId`
- **Description**: Suspendre un utilisateur
- **Auth requise**: Oui (Admin)
- **Réponse**: `{ message }`

### POST `/api/admin/reactivate-license`
- **Description**: Réactiver une licence suspendue
- **Auth requise**: Oui (Admin)
- **Body**: `{ userId }`
- **Réponse**: `{ message, user }`

### POST `/api/admin/force-logout/:userId`
- **Description**: Forcer la déconnexion d'un utilisateur
- **Auth requise**: Oui (Admin)
- **Réponse**: `{ message }`

### GET `/api/admin/infos`
- **Description**: Récupérer toutes les infos (publiées et non publiées)
- **Auth requise**: Oui (Admin)
- **Réponse**: `{ infos: [] }`

### POST `/api/admin/infos`
- **Description**: Créer une nouvelle info avec image
- **Auth requise**: Oui (Admin)
- **Body**: `{ title, content, imageBase64?, published? }`
- **Réponse**: `{ message, info }`

### PATCH `/api/admin/infos/:infoId`
- **Description**: Mettre à jour une info
- **Auth requise**: Oui (Admin)
- **Body**: `{ title?, content?, imageBase64?, published? }`
- **Réponse**: `{ info }`

### DELETE `/api/admin/infos/:infoId`
- **Description**: Supprimer une info
- **Auth requise**: Oui (Admin)
- **Réponse**: `{ message }`

### GET `/api/admin/infos/imagekit-auth`
- **Description**: Obtenir les paramètres d'authentification ImageKit
- **Auth requise**: Oui (Admin)
- **Réponse**: `{ token, expire, signature, publicKey, urlEndpoint }`

### GET `/api/admin/infos/public`
- **Description**: Infos publiques pour l'app mobile
- **Auth requise**: Non
- **Réponse**: `{ infos: [] }`

### GET `/api/admin/mail-status`
- **Description**: Vérifier le statut du service email
- **Auth requise**: Oui (Admin)
- **Réponse**: `{ configured, senderEmail, apiKey }`

### POST `/api/admin/test-email`
- **Description**: Envoyer un email de test
- **Auth requise**: Oui (Admin)
- **Body**: `{ to, subject, content }`
- **Réponse**: `{ message, messageId }`

### POST `/api/admin/send-email`
- **Description**: Envoyer un email manuel à un ou plusieurs utilisateurs
- **Auth requise**: Oui (Admin)
- **Body**: `{ userIds: [], subject, content }`
- **Réponse**: `{ message, results }`

### POST `/api/admin/send-license-email`
- **Description**: Envoyer les informations de licence à un utilisateur
- **Auth requise**: Oui (Admin)
- **Body**: `{ userId }`
- **Réponse**: `{ message }`

---

## 🔔 Routes Notifications (Admin)

### GET `/api/notifications`
- **Description**: Récupérer toutes les notifications
- **Auth requise**: Oui (Admin)
- **Réponse**: `{ notifications: [] }`

### POST `/api/notifications`
- **Description**: Créer une notification
- **Auth requise**: Oui (Admin)
- **Body**: `{ type, title, message, userId? }`
- **Réponse**: `{ message, notification }`

### GET `/api/notifications/unread-count`
- **Description**: Nombre total de notifications non lues
- **Auth requise**: Oui (Admin)
- **Réponse**: `{ count }`

### PATCH `/api/notifications/:notificationId/read`
- **Description**: Marquer une notification comme lue
- **Auth requise**: Oui (Admin)
- **Réponse**: `{ message }`

### PATCH `/api/notifications/mark-all-read`
- **Description**: Marquer toutes les notifications comme lues
- **Auth requise**: Oui (Admin)
- **Réponse**: `{ message }`

### DELETE `/api/notifications/:notificationId`
- **Description**: Supprimer une notification
- **Auth requise**: Oui (Admin)
- **Réponse**: `{ message }`

---

## 📄 Routes Documents (Premium)

### POST `/api/documents/compte-resultat`
- **Description**: Générer un compte de résultat (Premium uniquement)
- **Auth requise**: Oui (User Premium)
- **Body**: `{ data: { recettes: [], charges: [] } }`
- **Réponse**: Document comptable généré

### POST `/api/documents/bilan`
- **Description**: Générer un bilan (Premium uniquement)
- **Auth requise**: Oui (User Premium)
- **Body**: `{ data: { actifs: [], passifs: [] } }`
- **Réponse**: Document comptable généré

### POST `/api/documents/fiche-stock`
- **Description**: Générer une fiche de stock (Premium uniquement)
- **Auth requise**: Oui (User Premium)
- **Body**: `{ data: { produits: [] } }`
- **Réponse**: Document de stock généré

### GET `/api/documents/test-ai`
- **Description**: Tester les services IA
- **Auth requise**: Oui (User)
- **Réponse**: `{ openai, gemini, perplexity }`

---

## 📥 Routes Téléchargements

### POST `/api/downloads/track`
- **Description**: Enregistrer un téléchargement de l'app mobile
- **Auth requise**: Non
- **Body**: `{ source?: string }`
- **Réponse**: `{ message }`

### GET `/api/downloads/count`
- **Description**: Nombre total de téléchargements
- **Auth requise**: Oui (Admin)
- **Réponse**: `{ count }`

### GET `/api/downloads/stats`
- **Description**: Statistiques détaillées des téléchargements
- **Auth requise**: Oui (Admin)
- **Réponse**: `{ total, bySource, recent }`

---

## 📜 Routes Légales

### GET `/terms-of-service`
- **Description**: CGU en HTML (pour le site web)
- **Auth requise**: Non
- **Réponse**: Fichier HTML

### GET `/privacy-policy`
- **Description**: Politique de confidentialité en HTML (pour le site web)
- **Auth requise**: Non
- **Réponse**: Fichier HTML

### GET `/terms-of-service.md`
- **Description**: CGU en Markdown (pour l'app mobile hors ligne)
- **Auth requise**: Non
- **Réponse**: Fichier Markdown

### GET `/privacy-policy.md`
- **Description**: Politique de confidentialité en Markdown (pour l'app mobile hors ligne)
- **Auth requise**: Non
- **Réponse**: Fichier Markdown

### GET `/legal/latest`
- **Description**: Obtenir les derniers documents légaux et leur statut d'acceptation
- **Auth requise**: Oui (User)
- **Réponse**: `{ cgu, privacyPolicy }`

### POST `/legal/accept`
- **Description**: Accepter un document légal
- **Auth requise**: Oui (User)
- **Body**: `{ documentId }`
- **Réponse**: `{ success: true }`

### POST `/admin/legal`
- **Description**: Créer un nouveau document légal et notifier tous les utilisateurs
- **Auth requise**: Oui (Admin)
- **Body**: `{ type: "CGU" | "PRIVACY_POLICY", version, content }`
- **Réponse**: `{ success: true, documentId }`

---

## 📊 Routes Activité (Admin)

### GET `/api/activity`
- **Description**: Récupérer tous les logs d'activité
- **Auth requise**: Oui (Admin)
- **Réponse**: `{ activities: [] }`

### GET `/api/activity/recent`
- **Description**: Récupérer les activités récentes (24h)
- **Auth requise**: Oui (Admin)
- **Réponse**: `{ activities: [] }`

### GET `/api/activity/admin/:adminId`
- **Description**: Récupérer les activités d'un admin spécifique
- **Auth requise**: Oui (Admin)
- **Réponse**: `{ activities: [] }`

### POST `/api/activity`
- **Description**: Créer un log d'activité
- **Auth requise**: Oui (Admin)
- **Body**: `{ type, description, targetId?, metadata? }`
- **Réponse**: `{ message, activity }`

---

## 🔑 Format de la clé de licence

**Format**: `LOT-[4chiffres]-[4LETTRES]-[4chiffres]`

**Exemple**: `LOT-1234-ABCD-5678`

---

## 🛡️ Authentification

Toutes les routes protégées nécessitent un header :
```
Authorization: Bearer <token>
```

Le token est obtenu via `/api/auth/login` ou `/api/admin/login`

---

## 📌 Notes importantes

1. **Cascade Delete**: La suppression d'un utilisateur supprime automatiquement sa licence associée
2. **Réactions**: Tous les utilisateurs (inscrits ou non) peuvent réagir aux infos
3. **Premium**: Certaines fonctionnalités nécessitent une licence Premium active
4. **ImageKit**: Les images des infos sont hébergées sur ImageKit
5. **Emails**: Notifications automatiques par email via Brevo
6. **Push**: Notifications push via Expo pour l'app mobile

---

## 🔧 Variables d'environnement requises

- `DATABASE_URL`: URL PostgreSQL (Supabase)
- `DIRECT_URL`: URL directe PostgreSQL
- `JWT_SECRET`: Secret pour les tokens JWT
- `BREVO_API_KEY`: Clé API Brevo (emails)
- `BREVO_SENDER_EMAIL`: Email expéditeur
- `IMAGEKIT_PUBLIC_KEY`: Clé publique ImageKit
- `IMAGEKIT_PRIVATE_KEY`: Clé privée ImageKit
- `IMAGEKIT_URL_ENDPOINT`: Endpoint ImageKit
- `OPENAI_API_KEY`: Clé API OpenAI (documents)
- `GEMINI_API_KEY`: Clé API Gemini (documents)
- `PERPLEXITY_API_KEY`: Clé API Perplexity (documents)

---

**Version**: 1.0.0  
**Dernière mise à jour**: 26 juin 2026
