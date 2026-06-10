# Requirements Document

## Introduction

Le backend Lotus Business est une API REST pour la gestion de boutique avec un système d'authentification JWT et un système de licences automatisé. L'application permet aux utilisateurs de s'inscrire, de se connecter, et de gérer leur licence d'utilisation (FREE, MONTHLY, ANNUAL). Les administrateurs peuvent gérer les utilisateurs et leurs licences.

## Glossary

- **System**: L'API backend Lotus Business (Express + Node.js)
- **User**: Un utilisateur de l'application avec un compte
- **License**: Une licence d'utilisation associée à un User
- **JWT_Token**: JSON Web Token utilisé pour l'authentification
- **Admin**: Un utilisateur avec le rôle "admin"
- **License_Key**: Clé unique au format LOTUS-XXXX-XXXX-XXXX
- **Database**: Base de données PostgreSQL hébergée sur Supabase
- **Prisma_Client**: Instance unique du client Prisma ORM
- **Middleware**: Fonction intermédiaire pour valider les requêtes
- **FREE_License**: Licence gratuite de 1 mois créée automatiquement à l'inscription
- **MONTHLY_License**: Licence payante mensuelle (5000 FCFA)
- **ANNUAL_License**: Licence payante annuelle (50000 FCFA)

## Requirements

### Requirement 1: Authentification des utilisateurs

**User Story:** En tant qu'utilisateur, je veux pouvoir créer un compte et me connecter, afin d'accéder aux fonctionnalités de l'application.

#### Acceptance Criteria

1. WHEN a User submits registration data with email, firstName, lastName, and password, THE System SHALL create a new User account in the Database
2. WHEN a User registers, THE System SHALL hash the password using bcrypt before storage
3. WHEN a User registers, THE System SHALL create a FREE_License automatically for the User with a duration of 1 month
4. WHEN a User registers, THE System SHALL generate a unique License_Key in the format LOTUS-XXXX-XXXX-XXXX
5. IF a User attempts to register with an email that already exists, THEN THE System SHALL return an error indicating the email is already in use
6. WHEN a User submits login credentials with valid email and password, THE System SHALL return a JWT_Token and User information including License data
7. WHEN a User submits login credentials, THE System SHALL verify the License status and update it to EXPIRED if the endDate is before the current date
8. IF a User submits invalid login credentials, THEN THE System SHALL return an authentication error
9. THE System SHALL exclude the password field from all User response data

### Requirement 2: Génération et gestion des clés de licence

**User Story:** En tant que système, je veux générer automatiquement des clés de licence uniques, afin que chaque utilisateur ait une licence identifiable.

#### Acceptance Criteria

1. WHEN the System generates a License_Key, THE System SHALL format it as LOTUS-XXXX-XXXX-XXXX where X represents alphanumeric characters
2. THE System SHALL ensure each License_Key is unique in the Database
3. WHEN a License is created, THE System SHALL set the type to one of FREE, MONTHLY, or ANNUAL
4. WHEN a License is created, THE System SHALL set the status to ACTIVE
5. WHEN a FREE_License is created, THE System SHALL set the endDate to 1 month after the startDate
6. WHEN a MONTHLY_License is created, THE System SHALL set the endDate to 1 month after the startDate
7. WHEN a ANNUAL_License is created, THE System SHALL set the endDate to 1 year after the startDate
8. THE System SHALL associate each License with exactly one User

### Requirement 3: Vérification automatique des licences

**User Story:** En tant que système, je veux vérifier automatiquement l'état des licences, afin que les licences expirées soient détectées.

#### Acceptance Criteria

1. WHEN a User attempts to login, THE System SHALL compare the License endDate with the current date
2. IF the License endDate is before the current date, THEN THE System SHALL update the License status to EXPIRED
3. WHEN a protected endpoint is accessed, THE Middleware SHALL verify that the User's License status is ACTIVE
4. IF a User's License status is not ACTIVE, THEN THE Middleware SHALL return a 403 error indicating the license is expired or suspended

### Requirement 4: Gestion administrative des utilisateurs

**User Story:** En tant qu'administrateur, je veux pouvoir consulter tous les utilisateurs et leurs licences, afin de gérer efficacement la plateforme.

#### Acceptance Criteria

1. WHEN an Admin requests the list of users, THE System SHALL return all Users with their associated License information
2. THE System SHALL exclude password fields from the users list response
3. WHEN an Admin request is received, THE Middleware SHALL verify that the requester has the role "admin"
4. IF a non-Admin User attempts to access admin endpoints, THEN THE System SHALL return a 403 forbidden error

### Requirement 5: Activation et renouvellement des licences par l'administrateur

**User Story:** En tant qu'administrateur, je veux pouvoir activer ou renouveler les licences des utilisateurs, afin de gérer les abonnements.

#### Acceptance Criteria

1. WHEN an Admin submits a license activation request with userId and type, THE System SHALL update or create the User's License
2. WHEN a License is activated with type MONTHLY, THE System SHALL set the endDate to 1 month from the activation date
3. WHEN a License is activated with type ANNUAL, THE System SHALL set the endDate to 1 year from the activation date
4. WHEN a License is activated, THE System SHALL set the status to ACTIVE
5. WHEN a License is renewed, THE System SHALL preserve the existing License_Key
6. IF the Admin provides an invalid userId, THEN THE System SHALL return an error indicating the user was not found

### Requirement 6: Suspension des licences par l'administrateur

**User Story:** En tant qu'administrateur, je veux pouvoir suspendre les licences des utilisateurs, afin de bloquer l'accès en cas de problème.

#### Acceptance Criteria

1. WHEN an Admin submits a license suspension request with userId, THE System SHALL update the License status to SUSPENDED
2. WHEN a License is suspended, THE System SHALL preserve the endDate
3. IF the Admin provides an invalid userId, THEN THE System SHALL return an error indicating the user was not found
4. WHEN a User with a SUSPENDED License attempts to access protected endpoints, THE System SHALL return a 403 error

### Requirement 7: Sécurisation des endpoints avec JWT

**User Story:** En tant que système, je veux protéger les endpoints avec JWT, afin que seuls les utilisateurs authentifiés puissent y accéder.

#### Acceptance Criteria

1. WHEN a protected endpoint receives a request, THE Middleware SHALL extract and verify the JWT_Token from the Authorization header
2. WHEN a JWT_Token is valid, THE Middleware SHALL inject the userId and role into the request object
3. IF a JWT_Token is missing or invalid, THEN THE Middleware SHALL return a 401 unauthorized error
4. THE System SHALL use a secret key from environment variables to sign and verify JWT_Token
5. WHEN a JWT_Token is generated at login, THE System SHALL include the userId and role in the token payload

### Requirement 8: Gestion centralisée de la connexion Prisma

**User Story:** En tant que développeur, je veux une instance unique du client Prisma, afin d'éviter les connexions multiples à la base de données.

#### Acceptance Criteria

1. THE System SHALL export a single Prisma_Client instance from a dedicated prisma.js module
2. THE System SHALL reuse the same Prisma_Client instance across all controllers and services
3. WHEN the Prisma_Client connects to the Database, THE System SHALL use the DATABASE_URL from environment variables
4. THE System SHALL use Supabase PostgreSQL as the Database provider

### Requirement 9: Gestion des erreurs dans les controllers

**User Story:** En tant que développeur, je veux gérer les erreurs de manière uniforme, afin d'assurer la stabilité de l'API.

#### Acceptance Criteria

1. WHEN a controller function executes, THE System SHALL wrap the logic in a try-catch block
2. IF an error occurs during request processing, THEN THE System SHALL return a 500 error with a descriptive message
3. WHEN a database constraint violation occurs, THE System SHALL return an appropriate error code and message
4. THE System SHALL log errors to the console for debugging purposes

### Requirement 10: Validation des données d'entrée

**User Story:** En tant que système, je veux valider les données d'entrée, afin d'éviter les données invalides dans la base de données.

#### Acceptance Criteria

1. WHEN a User submits registration data, THE System SHALL verify that email, firstName, lastName, and password are provided
2. WHEN a User submits registration data, THE System SHALL verify that the email is in a valid format
3. WHEN an Admin submits a license activation request, THE System SHALL verify that the type is one of FREE, MONTHLY, or ANNUAL
4. IF required fields are missing, THEN THE System SHALL return a 400 error with details about missing fields
5. IF the data format is invalid, THEN THE System SHALL return a 400 error with validation details

### Requirement 11: Structure des endpoints API

**User Story:** En tant que client de l'API, je veux des endpoints REST clairement définis, afin d'interagir facilement avec le backend.

#### Acceptance Criteria

1. THE System SHALL expose a POST endpoint at /api/auth/register for user registration
2. THE System SHALL expose a POST endpoint at /api/auth/login for user authentication
3. THE System SHALL expose a GET endpoint at /api/admin/users for listing all users (admin only)
4. THE System SHALL expose a POST endpoint at /api/admin/license/activate for license activation (admin only)
5. THE System SHALL expose a PATCH endpoint at /api/admin/license/suspend/:userId for license suspension (admin only)
6. WHEN the System receives a request, THE System SHALL parse JSON request bodies
7. WHEN the System sends a response, THE System SHALL use appropriate HTTP status codes

### Requirement 12: Gestion des types de licence et tarification

**User Story:** En tant que système, je veux gérer différents types de licences avec leurs tarifs, afin de supporter le modèle économique.

#### Acceptance Criteria

1. THE System SHALL support three License types: FREE, MONTHLY, and ANNUAL
2. THE System SHALL associate the MONTHLY_License type with a price of 5000 FCFA per month
3. THE System SHALL associate the ANNUAL_License type with a price of 50000 FCFA per year
4. THE System SHALL associate the FREE_License type with a duration of 1 month and no cost
5. WHEN a License type is FREE, THE System SHALL set the initial status to ACTIVE
6. THE System SHALL store the License type in the Database

