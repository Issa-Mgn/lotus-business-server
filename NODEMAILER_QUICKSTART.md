# 🚀 Guide Rapide - Configuration Nodemailer + Gmail

## ✅ Checklist (5 minutes)

### 1. Obtenir un mot de passe d'application Gmail

1. **Activer la 2FA** : https://myaccount.google.com/security
2. **Créer un mot de passe d'app** : https://myaccount.google.com/apppasswords
   - Nom : `Lotus Business Backend`
   - Copier le mot de passe à 16 caractères

### 2. Configurer le fichier .env

Ouvre `c:\Mes Travaux\Lotus Business\server\.env` et remplace :

```env
MAIL_USER="ton_email@gmail.com"
MAIL_APP_PASSWORD="xxxx xxxx xxxx xxxx"
```

**Exemple :**
```env
MAIL_USER="contact@lotusbusiness.com"
MAIL_APP_PASSWORD="abcd efgh ijkl mnop"
```

### 3. Tester l'envoi d'email

```bash
npm run test:email
```

**Résultat attendu :**
```
✅ Email envoyé avec succès !
Message ID : <...@gmail.com>
📬 Vérifiez votre boîte email : contact@lotusbusiness.com
```

### 4. Démarrer le serveur

```bash
npm run dev
```

**Résultat attendu :**
```
✅ Serveur mail prêt à envoyer des emails
🚀 Serveur Lotus Business démarré sur le port 5000
```

### 5. Tester l'inscription avec Postman

**POST** `http://localhost:5000/api/auth/register`

**Body (JSON) :**
```json
{
  "email": "test@example.com",
  "phone": "+221771234567",
  "firstName": "Jean",
  "lastName": "Dupont"
}
```

**✅ Tu devrais recevoir un email professionnel avec la clé de licence !**

---

## 📧 Ce qui a été configuré

### Fichiers créés :

1. **`src/lib/mailer.js`** : Transporter Nodemailer singleton
2. **`src/lib/sendMail.js`** : Fonction d'envoi d'email
3. **`src/templates/welcome.js`** : Template HTML professionnel
4. **`test-email.js`** : Script de test

### Intégrations :

- ✅ Envoi automatique d'email à l'inscription
- ✅ Envoi d'email pour "Clé oubliée"
- ✅ Template HTML responsive design sombre
- ✅ Version texte alternative (anti-spam)
- ✅ Envoi en arrière-plan (ne bloque pas la réponse HTTP)

---

## 🎨 Aperçu de l'email

L'email envoyé contient :

- 🌸 **Header** : Logo "Lotus Business" avec dégradé violet
- 👋 **Message personnalisé** avec le prénom
- 🔑 **Clé de licence** en grand format (LOT-XXXX-xxxx-XXXX)
- 📋 **Détails de la licence** : Type, Statut, Date d'expiration
- ⚠️ **Avertissements** : Sécurité et confidentialité
- 🔵 **Bouton CTA** : "Accéder à mon espace"
- 📧 **Footer** : Copyright et mentions légales

**Design :** Fond sombre (#0f172a), accent violet (#4F46E5), moderne et professionnel.

---

## 🐛 Dépannage Rapide

### Erreur : "Invalid login"

→ Vérifie que tu utilises un **mot de passe d'application**, pas ton mot de passe Gmail.

### Erreur : "Connection timeout"

→ Vérifie ta connexion internet ou les paramètres firewall.

### Email reçu en spam

→ Demande au destinataire de marquer comme "Non spam". C'est normal au début.

### Email pas reçu

1. Vérifie le dossier spam
2. Attends quelques minutes (peut prendre jusqu'à 5 min)
3. Vérifie les logs du serveur pour voir les erreurs

---

## 📚 Documentation Complète

- **`GMAIL_SETUP.md`** : Guide détaillé de configuration Gmail
- **`README.md`** : Documentation complète de l'API
- **`POSTMAN_TESTS.md`** : Tests complets avec Postman

---

## 🎯 Prochaines Étapes

1. ✅ Configurer Gmail (fait maintenant)
2. ✅ Tester l'envoi d'email
3. ✅ Tester l'inscription avec Postman
4. 🔄 Créer un admin (voir `create-admin-hash.js`)
5. 🔄 Tester toutes les routes (voir `POSTMAN_TESTS.md`)

---

**Configuration terminée ! 🎉**

Tous les emails seront envoyés automatiquement lors des inscriptions et récupérations de clé.
