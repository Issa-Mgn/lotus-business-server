# 📧 Configuration Gmail pour Nodemailer

## Étapes de configuration

### 1️⃣ Activer la validation en 2 étapes sur Gmail

1. Va sur https://myaccount.google.com/security
2. Clique sur **"Validation en 2 étapes"**
3. Suis les instructions pour l'activer
4. ✅ **Important** : Tu dois activer la 2FA pour créer des mots de passe d'application

---

### 2️⃣ Créer un mot de passe d'application

1. Va sur https://myaccount.google.com/apppasswords
2. Connecte-toi si nécessaire
3. Dans **"Sélectionner l'application"** : choisis **"Autre (nom personnalisé)"**
4. Tape : **"Lotus Business Backend"**
5. Clique sur **"Générer"**
6. 📋 **Copie le mot de passe à 16 caractères** (format : `xxxx xxxx xxxx xxxx`)
7. ⚠️ **Attention** : Tu ne pourras pas le revoir une fois fermé !

---

### 3️⃣ Configurer le fichier .env

Ouvre le fichier `.env` et remplace :

```env
MAIL_USER="ton_email@gmail.com"
MAIL_APP_PASSWORD="xxxx xxxx xxxx xxxx"
```

**Exemple :**
```env
MAIL_USER="contact@lotusbusiness.com"
MAIL_APP_PASSWORD="abcd efgh ijkl mnop"
```

---

### 4️⃣ Tester la configuration

**Redémarre le serveur :**
```bash
npm run dev
```

**Résultat attendu :**
```
✅ Serveur mail prêt à envoyer des emails
```

**Si erreur :**
```
❌ Erreur de connexion Gmail SMTP: ...
```
→ Vérifie que le mot de passe d'application est correct.

---

## 🧪 Test avec Postman

### Inscription d'un utilisateur

**Endpoint :** `POST http://localhost:5000/api/auth/register`

**Body (JSON) :**
```json
{
  "email": "test@example.com",
  "phone": "+221771234567",
  "firstName": "Jean",
  "lastName": "Dupont"
}
```

**Résultat attendu :**
- Status : `201 Created`
- Response avec `user` et `licenseKey`
- ✅ **Email reçu dans la boîte test@example.com**

---

## 🔒 Règles Anti-Spam

### ✅ Ce qui est bien configuré :

1. **Nom d'expéditeur clair** : `"Lotus Business" <email>`
2. **Subject propre** : Pas de mots comme "gratuit", "offre", "promo"
3. **HTML structuré** : Email professionnel avec inline CSS
4. **Version texte** : Alternative plain text incluse
5. **Footer légal** : Copyright et mention "ne pas répondre"

### ⚠️ Limites Gmail gratuites :

- **500 emails par jour** (largement suffisant pour débuter)
- **100 destinataires par email**

---

## 🐛 Dépannage

### Erreur : "Invalid login: 535-5.7.8 Username and Password not accepted"

**Solutions :**
1. Vérifie que la validation en 2 étapes est activée
2. Crée un nouveau mot de passe d'application
3. Copie-colle le mot de passe sans espaces supplémentaires
4. Vérifie que `MAIL_USER` est bien ton email Gmail complet

### Erreur : "Less secure app access"

**Solution :**
- N'utilise **jamais** le mot de passe de ton compte Gmail directement
- Utilise **uniquement** un mot de passe d'application

### Emails vont en spam

**Solutions :**
1. Demande aux destinataires de marquer comme "Non spam"
2. Configure SPF/DKIM sur un domaine personnalisé (avancé)
3. Utilise un service professionnel (SendGrid, AWS SES) en production

---

## 🚀 Configuration pour la Production

### Option 1 : Gmail avec domaine personnalisé (G Suite / Google Workspace)

- Meilleur délivrabilité
- Jusqu'à 2000 emails/jour
- Coût : ~6€/mois par utilisateur

### Option 2 : Services transactionnels professionnels

| Service | Gratuit | Payant |
|---------|---------|--------|
| **SendGrid** | 100/jour | $15/mois (40k emails) |
| **AWS SES** | 62k/mois | $0.10/1000 emails |
| **Mailgun** | 5k/mois | $35/mois (50k emails) |
| **Brevo** | 300/jour | €25/mois (20k emails) |

---

## 📝 Résumé Configuration

1. ✅ Activer 2FA sur Gmail
2. ✅ Créer mot de passe d'application
3. ✅ Configurer `.env`
4. ✅ Redémarrer le serveur
5. ✅ Tester l'inscription
6. ✅ Vérifier réception email

---

## ✉️ Exemple d'email reçu

Voici ce que l'utilisateur recevra :

```
De: Lotus Business <contact@lotusbusiness.com>
À: test@example.com
Objet: Bienvenue sur Lotus Business 🎉

[Email HTML design sombre avec :]
- Logo Lotus Business
- Message personnalisé avec prénom
- Clé de licence en grand format
- Détails de la licence (type, statut, expiration)
- Avertissements importants
- Bouton CTA "Accéder à mon espace"
- Footer avec copyright
```

---

**Configuration terminée ! 🎉**

Si tu rencontres un problème, consulte la section Dépannage ci-dessus.
