# Design Document

## Architecture Overview

Le backend Lotus Business est une API REST Node.js/Express connectée à PostgreSQL via Prisma ORM, avec authentification JWT et système de gestion de licences automatisé.

### Stack Technique
- **Runtime**: Node.js
- **Framework**: Express.js
- **ORM**: Prisma
- **Base de données**: PostgreSQL (Supabase)
- **Authentification**: JWT (jsonwebtoken)
- **Hashing**: bcrypt
- **Email**: Nodemailer

### Architecture en couches
```
Routes (endpoints) → Controllers (logique métier) → Prisma Client → PostgreSQL (Supabase)
                  ↑
            Middlewares (auth, admin)
```

## Module Breakdown

### Module 1: Authentication & User Management

**Responsabilité**: Gestion de l'inscription, connexion, et authentification des utilisateurs.

**Fichiers**:
- `src/routes/auth.js` - Endpoints publics et protégés
- `src/controllers/authController.js` - Logique d'authentification
- `src/middlewares/auth.js` - Middleware de vérification JWT
- `src/lib/generateLicenseKey.js` - Génération des clés au format LOT-XXXX-XXXX-XXXX

**Endpoints**:
- `POST /api/auth/register` - Inscription avec création automatique de licence FREE
- `POST /api/auth/login` - Connexion avec vérification du statut de licence
- `POST /api/auth/logout` - Déconnexion (protégé)
- `POST /api/auth/forgot-key` - Récupération de clé de licence

**Flux d'inscription**:
1. Validation des données (email, phone, firstName, lastName, password)
2. Vérification unicité email et phone
3. Hash du mot de passe avec bcrypt
4. Génération de licenseKey au format `LOT-[4chiffres]-[4lettres majuscules]-[4chiffres]`
5. Création User dans la base avec:
   - licenseType: FREE
   - licenseStatus: ACTIVE
   - expirationDate: activationDate + 30 jours
6. Envoi email de bienvenue avec clé de licence
7. Retour du JWT token

**Flux de connexion**:
1. Validation email/phone + licenseKey
2. Vérification existence utilisateur
3. Vérification statut de licence (auto-update si expirée)
4. Mise à jour lastLoginAt, lastLoginIp, isOnline
5. Génération JWT avec userId
6. Retour token + données user (sans password)

**Gestion des erreurs détaillées**:
- Email déjà utilisé: "Cet email est déjà associé à un compte"
- Téléphone déjà utilisé: "Ce numéro de téléphone est déjà utilisé"
- Email invalide: "Format d'email invalide"
- Identifiants incorrects: "Email/téléphone ou clé de licence incorrects"
- Licence expirée: "Votre licence a expiré le [date]. Contactez l'administrateur"
- Licence suspendue: "Votre compte est suspendu. Contactez l'administrateur"
- Erreur serveur: Message d'erreur spécifique avec code

### Module 2: License Management

**Responsabilité**: Génération, vérification, activation et renouvellement des licences.

**Fichiers**:
- `src/lib/generateLicenseKey.js` - Génération clés uniques
- `src/lib/checkExpiredLicenses.js` - Vérification automatique des expirations
- `src/controllers/adminController.js` (partie licences)

**Format de clé**: `LOT-[4chiffres]-[4lettres MAJUSCULES]-[4chiffres]`
- Exemple: `LOT-1234-ABCD-5678`
- Génération aléatoire avec vérification d'unicité

**Types de licence**:
- **FREE**: 30 jours, création automatique à l'inscription
- **PREMIUM**: Durée variable selon paiement (mensuel/annuel)

**Statuts**:
- **ACTIVE**: Licence valide, accès autorisé
- **EXPIRED**: Date d'expiration dépassée
- **SUSPENDED**: Suspendu par admin

**Vérification automatique**:
- Intervalle: Toutes les heures
- Déclenchement: Au démarrage du serveur + setInterval
- Action: Mise à jour du status à EXPIRED si expirationDate < now()

**Opérations admin**:
- Activer/Renouveler licence (update expirationDate + status ACTIVE)
- Suspendre licence (status SUSPENDED)
- Réactiver licence suspendue (status ACTIVE)

### Module 3: Admin Management

**Responsabilité**: Gestion des utilisateurs et licences par les administrateurs.

**Fichiers**:
- `src/routes/admin.js` - Endpoints administrateur
- `src/controllers/adminController.js` - Logique admin
- `src/middlewares/adminAuth.js` - Middleware de vérification rôle admin

**Endpoints**:
- `GET /api/admin/users` - Liste tous les utilisateurs avec leurs licences
- `GET /api/admin/users/:userId` - Détails d'un utilisateur
- `PATCH /api/admin/users/:userId/license` - Activer/renouveler licence
- `PATCH /api/admin/users/:userId/suspend` - Suspendre un utilisateur
- `PATCH /api/admin/users/:userId/reactivate` - Réactiver un utilisateur
- `DELETE /api/admin/users/:userId` - Supprimer un utilisateur (CASCADE)

**Authentification admin**:
- Table Admin séparée avec email/password
- JWT avec claim role: 'admin'
- Middleware adminAuth vérifie le rôle

**Cascade de suppression**:
Lors de la suppression d'un User, supprimer automatiquement:
- Toutes ses notifications
- Tous ses logs d'activité (targetId)
- Toutes ses acceptations légales
- Sa licence (table License par email)

### Module 4: Database Schema & Relations

**Responsabilité**: Schéma de données avec relations et contraintes.

**Tables principales**:

**User**:
```prisma
- id: UUID (PK)
- email: String UNIQUE
- phone: String UNIQUE
- firstName, lastName: String
- licenseKey: String UNIQUE
- licenseType: LicenseType (FREE/PREMIUM)
- licenseStatus: LicenseStatus (ACTIVE/EXPIRED/SUSPENDED)
- activationDate: DateTime
- expirationDate: DateTime?
- isOnline: Boolean
- lastLoginAt: DateTime?
- activeSessionId: String? UNIQUE
- lastLoginIp: String?
- maxSimultaneousLogins: Int (default 1)
- expoPushToken: String?
- createdAt: DateTime
```

**Admin**:
```prisma
- id: UUID (PK)
- email: String UNIQUE
- phone: String UNIQUE
- password: String (hashed)
- createdAt: DateTime
```

**License** (table de référence):
```prisma
- id: UUID (PK)
- email: String UNIQUE
- licenseKey: String UNIQUE
```

**Relations & Cascades**:
- User.notifications → onDelete: Cascade
- User.activityLogs (target) → onDelete: SetNull
- Admin.activityLogs (author) → onDelete: Cascade
- UserLegalAcceptance → onDelete: Cascade (avec User)

**Synchronisation Supabase**:
- Utiliser les triggers PostgreSQL pour synchroniser User ↔ License
- Trigger ON DELETE User → DELETE License WHERE email = OLD.email
- Trigger ON INSERT User → INSERT License (email, licenseKey)
- Trigger ON UPDATE User.licenseKey → UPDATE License.licenseKey

### Module 5: Activity Logging

**Responsabilité**: Traçabilité des actions administratives.

**Fichiers**:
- `src/routes/activity.js`
- `src/controllers/activityController.js`
- `src/lib/logActivity.js` (helper)

**Types d'activité**:
- ADMIN_LOGIN
- USER_SUSPENDED
- USER_REACTIVATED
- LICENSE_UPGRADED
- ADMIN_CREATED
- EMAIL_SENT
- PASSWORD_CHANGED

**Champs ActivityLog**:
- type: ActivityType
- description: String (message lisible)
- adminId: UUID (auteur)
- targetId: UUID? (utilisateur concerné)
- metadata: String? (JSON avec détails)
- ipAddress: String?
- createdAt: DateTime

**Utilisation**:
```javascript
await logActivity({
  type: 'USER_SUSPENDED',
  description: `Utilisateur ${user.email} suspendu`,
  adminId: req.admin.id,
  targetId: userId,
  metadata: JSON.stringify({ reason: 'Non-paiement' }),
  ipAddress: req.ip
});
```

### Module 6: Notifications System

**Responsabilité**: Notifications utilisateurs et push notifications.

**Fichiers**:
- `src/routes/notifications.js`
- `src/controllers/notificationController.js`
- `src/lib/sendNotification.js` (helper)

**Types de notification**:
- LICENSE_EXPIRED
- LICENSE_EXPIRING_SOON (7 jours avant)
- NEW_USER
- USER_SUSPENDED
- USER_UPGRADED

**Endpoints**:
- `GET /api/auth/notifications` - Liste notifications utilisateur
- `GET /api/auth/notifications/unread-count` - Compteur non lues
- `PATCH /api/auth/notifications/:id/read` - Marquer comme lue
- `PATCH /api/auth/notifications/mark-all-read` - Tout marquer comme lu

**Création automatique**:
- À l'inscription → NEW_USER
- À l'expiration → LICENSE_EXPIRED
- 7 jours avant expiration → LICENSE_EXPIRING_SOON
- À la suspension → USER_SUSPENDED
- Au renouvellement → USER_UPGRADED

### Module 7: Email Service

**Responsabilité**: Envoi d'emails transactionnels.

**Fichiers**:
- `src/lib/sendEmail.js` - Client Nodemailer
- `src/templates/welcome.js` - Email de bienvenue
- `src/templates/licenseExpiring.js` - Email expiration proche
- `src/templates/licenseExpired.js` - Email expiration
- `src/templates/licenseSuspended.js` - Email suspension
- `src/templates/policyUpdate.js` - Email mise à jour CGU/Privacy

**Configuration**:
```javascript
// Utiliser les variables d'environnement
EMAIL_HOST, EMAIL_PORT, EMAIL_USER, EMAIL_PASSWORD, EMAIL_FROM
```

**Templates**:
- HTML avec inline CSS
- Variables dynamiques: {firstName}, {licenseKey}, {expirationDate}, etc.
- Footer avec liens CGU/Privacy
- Logo Lotus Business

**Triggers**:
- Inscription → welcome email avec licenseKey
- 7 jours avant expiration → reminder
- Expiration → notification expiration
- Suspension → notification suspension
- Mise à jour CGU/Privacy → email tous utilisateurs actifs

### Module 8: Legal Documents Management

**Responsabilité**: Gestion des CGU et politiques de confidentialité avec versioning.

**Fichiers**:
- `src/routes/legal.js`
- `src/controllers/legalController.js`
- `public/terms-of-service.html` - CGU complets et professionnels
- `public/privacy-policy.html` - Politique de confidentialité complète

**Tables**:
```prisma
LegalDocument:
- id: CUID (PK)
- type: String ('terms' | 'privacy')
- version: String (ex: "1.0", "1.1")
- content: Text (HTML complet)
- publishedAt: DateTime
- createdAt: DateTime

UserLegalAcceptance:
- id: CUID (PK)
- userId: UUID
- documentId: CUID
- acceptedAt: DateTime
- UNIQUE(userId, documentId)
```

**Endpoints publics**:
- `GET /terms-of-service.html` - Affiche les CGU
- `GET /privacy-policy.html` - Affiche la politique
- `GET /api/legal/terms/latest` - JSON dernière version CGU
- `GET /api/legal/privacy/latest` - JSON dernière version Privacy

**Endpoints admin**:
- `POST /api/admin/legal/publish` - Publier nouvelle version
- `GET /api/admin/legal/history` - Historique versions

**Flux de mise à jour**:
1. Admin publie nouvelle version (type, content, version)
2. Système insert nouveau LegalDocument
3. Système récupère tous les users ACTIVE
4. Pour chaque user: envoi email notification changement
5. Email contient: résumé changements + liens vers documents

**Contenu des documents**:
- **CGU**: Conditions générales d'utilisation longues et professionnelles
  - Acceptation des conditions
  - Description du service
  - Licences et abonnements
  - Obligations des utilisateurs
  - Propriété intellectuelle
  - Responsabilités et limitations
  - Résiliation
  - Modifications des CGU
  - Loi applicable et juridiction
  - Contact
  
- **Privacy Policy**: Politique de confidentialité complète
  - Collecte de données
  - Utilisation des données
  - Partage des données
  - Stockage et sécurité
  - Droits des utilisateurs (RGPD)
  - Cookies
  - Modifications de la politique
  - Contact DPO

**Mise en forme**:
- HTML simple et professionnel
- Structure claire avec titres h1, h2, h3
- Paragraphes espacés
- Liste à puces pour clarté
- Footer avec date de dernière mise à jour
- Responsive design

### Module 9: Info & Downloads Management

**Responsabilité**: Gestion des infos publiées et statistiques de téléchargements.

**Fichiers**:
- `src/routes/documents.js` - CRUD Infos (admin)
- `src/routes/downloads.js` - Stats téléchargements
- `src/controllers/infoController.js`
- `src/controllers/downloadController.js`

**Table Info**:
```prisma
- id: UUID
- title: String
- content: String
- imageUrl: String?
- imageFileId: String?
- imageFilePath: String?
- thumbnailUrl: String?
- published: Boolean
- publishedAt: DateTime
- createdAt, updatedAt: DateTime
```

**Endpoints Infos**:
- `GET /api/auth/infos` - Liste infos publiées (users)
- `GET /api/admin/infos` - Toutes les infos (admin)
- `POST /api/admin/infos` - Créer info
- `PATCH /api/admin/infos/:id` - Modifier info
- `DELETE /api/admin/infos/:id` - Supprimer info

**Endpoints Downloads**:
- `POST /api/downloads/track` - Enregistrer un téléchargement
- `GET /api/admin/downloads/stats` - Statistiques admin

**Table AppDownload**:
```prisma
- id: UUID
- ipAddress: String?
- userAgent: String?
- source: String?
- createdAt: DateTime
```

## Data Flow Diagrams

### User Registration Flow
```
Client → POST /api/auth/register
  ↓
authController.register()
  ↓
1. Validate input (email, phone, firstName, lastName, password)
2. Check email uniqueness → Error: "Cet email est déjà associé à un compte"
3. Check phone uniqueness → Error: "Ce numéro de téléphone est déjà utilisé"
4. Hash password (bcrypt)
5. Generate licenseKey (LOT-XXXX-XXXX-XXXX)
6. Calculate expirationDate (now + 30 days)
  ↓
Prisma: Create User + Create License (via trigger)
  ↓
Send welcome email with licenseKey
  ↓
Create NEW_USER notification
  ↓
Log activity
  ↓
Generate JWT token
  ↓
Response: { token, user: {...} }
```

### User Login Flow
```
Client → POST /api/auth/login (email/phone + licenseKey)
  ↓
authController.login()
  ↓
1. Find user by email/phone
2. Verify licenseKey match
3. Check license expiration
  ↓
If expired:
  - Update licenseStatus to EXPIRED
  - Return error: "Votre licence a expiré le [date]"
  ↓
If suspended:
  - Return error: "Votre compte est suspendu"
  ↓
If active:
  - Update lastLoginAt, lastLoginIp, isOnline
  - Generate JWT
  - Return { token, user }
```

### License Renewal Flow (Admin)
```
Admin → PATCH /api/admin/users/:userId/license
  ↓
adminAuth middleware (verify admin JWT)
  ↓
adminController.updateLicense()
  ↓
1. Validate userId
2. Validate licenseType (FREE/PREMIUM)
3. Calculate new expirationDate
  ↓
Prisma: Update User
  - licenseType
  - licenseStatus = ACTIVE
  - expirationDate
  ↓
Update License table (via trigger)
  ↓
Create USER_UPGRADED notification
  ↓
Send email notification
  ↓
Log activity (LICENSE_UPGRADED)
  ↓
Response: { success, user }
```

### User Deletion Flow (Admin)
```
Admin → DELETE /api/admin/users/:userId
  ↓
adminAuth middleware
  ↓
adminController.deleteUser()
  ↓
Prisma: Delete User
  ↓
CASCADE triggers:
  - Delete Notifications (userId)
  - SetNull ActivityLogs (targetId)
  - Delete UserLegalAcceptances (userId)
  - Delete License (email) ← via PostgreSQL trigger
  ↓
Log activity (USER_DELETED)
  ↓
Response: { success, message }
```

## Error Handling Strategy

### Principes
- Tous les controllers utilisent try-catch
- Messages d'erreur clairs et spécifiques en français
- Codes HTTP appropriés
- Logging des erreurs côté serveur
- Pas d'exposition de stack traces en production

### Codes d'erreur
- **400 Bad Request**: Validation échouée, données manquantes
- **401 Unauthorized**: JWT manquant/invalide
- **403 Forbidden**: Accès refusé (licence expirée/suspendue, non-admin)
- **404 Not Found**: Ressource introuvable
- **409 Conflict**: Conflit unicité (email/phone/licenseKey existe)
- **500 Internal Server Error**: Erreur serveur

### Messages d'erreur détaillés

**Inscription**:
- Email existe: "Cet email est déjà associé à un compte"
- Phone existe: "Ce numéro de téléphone est déjà utilisé"
- Email invalide: "Format d'email invalide"
- Champs manquants: "Veuillez renseigner tous les champs obligatoires: [liste]"

**Connexion**:
- Identifiants incorrects: "Email/téléphone ou clé de licence incorrects"
- Licence expirée: "Votre licence a expiré le [date]. Veuillez contacter l'administrateur pour renouveler votre abonnement"
- Licence suspendue: "Votre compte est actuellement suspendu. Veuillez contacter l'administrateur"

**Admin**:
- Non autorisé: "Accès administrateur requis"
- User inexistant: "Utilisateur introuvable"
- Type licence invalide: "Type de licence invalide. Valeurs acceptées: FREE, PREMIUM"

**Exemple d'implémentation**:
```javascript
try {
  // Logique métier
} catch (error) {
  console.error('Error in register:', error);
  
  // Erreur Prisma unicité
  if (error.code === 'P2002') {
    const field = error.meta?.target?.[0];
    if (field === 'email') {
      return res.status(409).json({ 
        error: "Cet email est déjà associé à un compte" 
      });
    }
    if (field === 'phone') {
      return res.status(409).json({ 
        error: "Ce numéro de téléphone est déjà utilisé" 
      });
    }
  }
  
  res.status(500).json({ 
    error: "Erreur lors de la création de l'utilisateur",
    details: process.env.NODE_ENV === 'development' ? error.message : undefined
  });
}
```

## Security Considerations

### JWT Security
- Secret stocké dans variable d'environnement (JWT_SECRET)
- Expiration: 7 jours
- Payload minimal: { userId, role }
- Vérification à chaque requête protégée

### Password Security
- Hash avec bcrypt (salt rounds: 10)
- Jamais retourné dans les réponses API
- Exclusion explicite dans les queries Prisma: `select: { password: false }`

### SQL Injection Prevention
- Utilisation exclusive de Prisma ORM (requêtes paramétrées)
- Pas de raw SQL sauf nécessité absolue

### Rate Limiting
- Implémenter express-rate-limit sur /api/auth/login et /api/auth/register
- Limite: 5 tentatives par IP par 15 minutes

### CORS Configuration
- Configuration stricte en production
- Whitelist des origines autorisées
```javascript
app.use(cors({
  origin: process.env.ALLOWED_ORIGINS?.split(',') || '*',
  credentials: true
}));
```

### Environment Variables
Toutes les informations sensibles dans .env:
- DATABASE_URL, DIRECT_URL
- JWT_SECRET
- EMAIL_HOST, EMAIL_PORT, EMAIL_USER, EMAIL_PASSWORD
- NODE_ENV

## Database Triggers (PostgreSQL)

### Trigger 1: Sync User → License on INSERT
```sql
CREATE OR REPLACE FUNCTION sync_license_on_user_insert()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO licenses (id, email, "licenseKey")
  VALUES (gen_random_uuid(), NEW.email, NEW."licenseKey")
  ON CONFLICT (email) DO UPDATE SET "licenseKey" = NEW."licenseKey";
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER user_insert_sync_license
AFTER INSERT ON users
FOR EACH ROW
EXECUTE FUNCTION sync_license_on_user_insert();
```

### Trigger 2: Sync User → License on UPDATE
```sql
CREATE OR REPLACE FUNCTION sync_license_on_user_update()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW."licenseKey" != OLD."licenseKey" OR NEW.email != OLD.email THEN
    UPDATE licenses
    SET email = NEW.email, "licenseKey" = NEW."licenseKey"
    WHERE email = OLD.email;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER user_update_sync_license
AFTER UPDATE ON users
FOR EACH ROW
EXECUTE FUNCTION sync_license_on_user_update();
```

### Trigger 3: Sync User → License on DELETE
```sql
CREATE OR REPLACE FUNCTION sync_license_on_user_delete()
RETURNS TRIGGER AS $$
BEGIN
  DELETE FROM licenses WHERE email = OLD.email;
  RETURN OLD;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER user_delete_sync_license
AFTER DELETE ON users
FOR EACH ROW
EXECUTE FUNCTION sync_license_on_user_delete();
```

## Testing Strategy

### Unit Tests
- Controllers: Mock Prisma client
- Lib functions: Test pure logic (generateLicenseKey, etc.)
- Middlewares: Test auth/admin avec mock tokens

### Integration Tests
- Test des endpoints avec base de test
- Vérification des flows complets
- Test des cascades de suppression

### Test Cases Prioritaires
1. Registration avec email/phone déjà utilisé
2. Login avec licence expirée/suspendue
3. Génération de licenseKey unique (format + unicité)
4. Suppression user avec cascade vers License
5. Mise à jour CGU/Privacy avec envoi emails
6. Vérification automatique des licences expirées

## Deployment Considerations

### Environment Setup
- **Production**: Supabase PostgreSQL + Node.js server
- **Staging**: Clone de production
- **Development**: Local PostgreSQL + local server

### Database Migrations
```bash
# Générer migration
npx prisma migrate dev --name migration_name

# Appliquer en production
npx prisma migrate deploy

# Créer triggers PostgreSQL
psql $DATABASE_URL < triggers.sql
```

### Startup Sequence
1. Load environment variables
2. Initialize Prisma Client
3. Run checkExpiredLicenses()
4. Start Express server
5. Start cron job (setInterval 1h)

### Monitoring
- Health check endpoint: `GET /health`
- Log toutes les erreurs serveur
- Monitor temps de réponse API
- Alert si échec connexion database

## Performance Optimizations

### Database Indexes
```prisma
@@index([email])
@@index([phone])
@@index([licenseKey])
@@index([licenseStatus])
@@index([expirationDate])
```

### Query Optimizations
- Utiliser `select` pour ne récupérer que les champs nécessaires
- Utiliser `include` judicieusement pour éviter les N+1 queries
- Paginer les listes longues (users, notifications, activity logs)

### Caching Strategy
- Considérer Redis pour:
  - Session storage (activeSessionId)
  - Rate limiting counters
  - Cache des documents légaux (rarely change)

### Batch Operations
- Vérification licences: batch update au lieu d'updates individuelles
- Envoi emails CGU/Privacy: queue system (Bull/BullMQ)

## Future Enhancements

### Phase 2
- Paiement intégré (Stripe/PayPal)
- Webhooks paiement → auto-renouvellement
- API pour app mobile (React Native)
- Push notifications (Expo)

### Phase 3
- Analytics dashboard admin
- Export données utilisateurs (CSV)
- 2FA authentication
- OAuth2 (Google, Facebook login)

### Phase 4
- Multi-tenancy support
- API rate limiting per user
- Advanced reporting
- Subscription tiers (Basic, Pro, Enterprise)
