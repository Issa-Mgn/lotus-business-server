# 🚀 Guide d'Installation - Système de Paiement KKiaPay

Ce guide vous aide à configurer le système de paiement KKiaPay pour Lotus Business.

---

## ✅ Étape 1 : Migration de la Base de Données

Le modèle `Payment` a été ajouté au schema Prisma. Exécutez la migration :

```bash
cd server
npx prisma migrate dev --name add_payment_model
npx prisma generate
```

Cela va créer :
- La table `payments` dans votre base de données
- Les types `PaymentType` et `PaymentStatus`
- La relation entre `User` et `Payment`

---

## ✅ Étape 2 : Configuration KKiaPay

### 2.1 Créer un compte KKiaPay

1. Allez sur [kkiapay.me](https://kkiapay.me)
2. Créez un compte marchand
3. Accédez au dashboard : [app.kkiapay.me](https://app.kkiapay.me)

### 2.2 Récupérer les clés API

Dans votre dashboard KKiaPay, vous trouverez :
- **Public Key** (commence par `pk_`)
- **Private Key** (commence par `sk_`)
- **Secret** (pour la vérification des webhooks)

### 2.3 Configurer le fichier .env

Ajoutez ces variables dans `server/.env` :

```env
# KKiaPay Configuration
KKIAPAY_PUBLIC_KEY="pk_xxxxxxxxxxxxxxxxxxxxx"
KKIAPAY_PRIVATE_KEY="sk_xxxxxxxxxxxxxxxxxxxxx"
KKIAPAY_SECRET="secret_xxxxxxxxxxxxxxxxxxxxx"
KKIAPAY_SANDBOX="true"
```

⚠️ **Important** :
- Utilisez vos **vraies clés** récupérées du dashboard KKiaPay
- En mode **sandbox** : `KKIAPAY_SANDBOX="true"` (tests)
- En mode **production** : `KKIAPAY_SANDBOX="false"` (argent réel)

---

## ✅ Étape 3 : Configurer le Webhook

### 3.1 URL du Webhook

Votre URL de webhook sera :
```
https://votre-domaine.com/api/payments/webhook
```

Pour le développement local avec Postman, vous pouvez sauter cette étape et tester manuellement.

### 3.2 Configurer dans KKiaPay

1. Allez dans le dashboard KKiaPay
2. Section **Webhooks** ou **API**
3. Ajoutez l'URL : `https://votre-domaine.com/api/payments/webhook`
4. Enregistrez

Le webhook sera appelé automatiquement par KKiaPay lors de chaque paiement confirmé.

---

## ✅ Étape 4 : Vérifier l'Installation

### 4.1 Démarrer le serveur

```bash
cd server
npm run dev
```

Vérifiez qu'il n'y a pas d'erreurs au démarrage.

### 4.2 Tester avec Postman

#### Test 1 : Créer un paiement

```http
POST http://localhost:5000/api/payments/create
Authorization: Bearer <user_jwt_token>
Content-Type: application/json

{
  "type": "UPGRADE_PREMIUM",
  "subscriptionType": "MONTHLY"
}
```

**Réponse attendue** :
```json
{
  "message": "Paiement initialisé",
  "payment": {
    "id": "clxxx...",
    "amount": 999,
    "type": "UPGRADE_PREMIUM",
    "status": "PENDING",
    "transactionId": "kkiapay_xxx"
  },
  "transactionId": "kkiapay_xxx",
  "paymentUrl": "https://pay.kkiapay.me/xxx"
}
```

#### Test 2 : Vérifier le statut

```http
GET http://localhost:5000/api/payments/verify/<transactionId>
Authorization: Bearer <user_jwt_token>
```

#### Test 3 : Historique des paiements

```http
GET http://localhost:5000/api/payments/history
Authorization: Bearer <user_jwt_token>
```

---

## ✅ Étape 5 : Intégration Mobile (React Native)

### 5.1 Installer le SDK KKiaPay

```bash
npm install kkiapay-sdk
```

### 5.2 Exemple de Code

```javascript
import { KKiaPay } from 'kkiapay-sdk';

const kkiapay = new KKiaPay({
  publicKey: 'pk_xxxxxxxxxxxxxxxxxxxxx', // Votre clé publique
  sandbox: true, // false en production
});

async function upgradeToPremium() {
  try {
    // 1. Créer intention de paiement
    const response = await fetch('https://your-api.com/api/payments/create', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${userToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        type: 'UPGRADE_PREMIUM',
        subscriptionType: 'MONTHLY',
      }),
    });

    const { payment, transactionId } = await response.json();

    // 2. Ouvrir interface de paiement
    await kkiapay.requestPayment({
      amount: payment.amount,
      reason: 'Upgrade Premium Lotus Business',
      phone: user.phone,
      email: user.email,
    });

    // 3. Vérifier le paiement
    const verifyResponse = await fetch(
      `https://your-api.com/api/payments/verify/${transactionId}`,
      {
        headers: { 'Authorization': `Bearer ${userToken}` },
      }
    );

    const result = await verifyResponse.json();

    if (result.status === 'SUCCESS') {
      Alert.alert('Succès', 'Compte upgradé vers Premium !');
    }
  } catch (error) {
    console.error('Erreur:', error);
    Alert.alert('Erreur', 'Paiement échoué');
  }
}
```

---

## 🔍 Vérification Post-Installation

### Checklist

- [ ] Migration Prisma exécutée (`npx prisma migrate dev`)
- [ ] Variables KKiaPay dans `.env`
- [ ] Serveur démarre sans erreur
- [ ] Route `/api/payments/create` fonctionne
- [ ] Route `/api/payments/verify/:id` fonctionne
- [ ] Route `/api/payments/history` fonctionne
- [ ] Webhook configuré (production seulement)
- [ ] SDK mobile installé (si applicable)

---

## 🐛 Problèmes Courants

### Erreur : "KKiaPay non configuré"

**Solution** : Vérifiez que les 4 variables sont dans `.env` :
```env
KKIAPAY_PUBLIC_KEY="pk_..."
KKIAPAY_PRIVATE_KEY="sk_..."
KKIAPAY_SECRET="secret_..."
KKIAPAY_SANDBOX="true"
```

### Erreur : "Signature webhook invalide"

**Solution** : Vérifiez que le `KKIAPAY_SECRET` est correct dans `.env`

### Paiement reste en PENDING

**Causes possibles** :
1. Mode sandbox : Le paiement test n'a pas été complété
2. Webhook non configuré : Configurez l'URL du webhook dans KKiaPay
3. Vérifiez les logs backend pour voir si le webhook a été reçu

### Table `payments` n'existe pas

**Solution** : Exécutez la migration :
```bash
npx prisma migrate dev --name add_payment_model
```

---

## 📊 Monitoring en Production

### Logs à surveiller

Les logs importants à monitorer :

```
[KKiaPay] Initialisation paiement: { amount, phone, sandbox }
[KKiaPay] Paiement initialisé: { transactionId }
[KKiaPay] Vérification paiement: transactionId
[Payment] Webhook KKiaPay reçu: { transactionId, status }
[Payment] Traitement paiement réussi: paymentId
[Payment] Utilisateur upgradé vers PREMIUM: userId
```

### Alertes à configurer

- Paiements échoués (status = FAILED)
- Webhooks avec signature invalide
- Erreurs API KKiaPay (timeout, 500, etc.)
- Paiements en PENDING > 24h

---

## 🚀 Déploiement en Production

### Avant le déploiement

1. **Passer en mode production** :
   ```env
   KKIAPAY_SANDBOX="false"
   ```

2. **Utiliser les clés de production** :
   - Récupérez les clés de production depuis le dashboard KKiaPay
   - Remplacez dans `.env`

3. **Configurer le webhook** :
   - URL : `https://lotus-business-server.onrender.com/api/payments/webhook`
   - Ajoutez dans le dashboard KKiaPay

4. **Tester en production** :
   - Faites un petit paiement réel de test (999 FCFA)
   - Vérifiez que l'upgrade fonctionne
   - Vérifiez que le webhook est bien reçu

### Après le déploiement

- Surveillez les logs pendant 24-48h
- Vérifiez que les webhooks arrivent bien
- Testez tous les types de paiements
- Vérifiez que les remontées d'erreur fonctionnent

---

## 📞 Support

### Documentation KKiaPay

- [Documentation officielle](https://docs.kkiapay.me)
- [API Reference](https://docs.kkiapay.me/api)
- [SDK React Native](https://www.npmjs.com/package/kkiapay-sdk)

### Support KKiaPay

- Email : support@kkiapay.me
- Dashboard : [app.kkiapay.me](https://app.kkiapay.me)

### Documentation Lotus Business

- `KKIAPAY_INTEGRATION.md` - Guide complet d'intégration
- `routes.md` - Toutes les routes API avec exemples
- `README.md` - Vue d'ensemble du projet

---

## ✅ Installation Terminée !

Une fois toutes les étapes complétées, votre système de paiement est prêt.

**Prochaines étapes** :
1. Intégrer le SDK mobile dans l'app React Native
2. Créer l'interface utilisateur pour les upgrades
3. Tester le flow complet de paiement
4. Déployer en production

---

**Version** : 1.0.0  
**Date** : 2 août 2026
