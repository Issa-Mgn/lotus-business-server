# ⚡ Quick Start - Système de Paiement KKiaPay

Guide rapide pour démarrer avec le système de paiement en 5 minutes.

---

## 🚀 Installation Rapide (5 minutes)

### 1. Migration Base de Données
```bash
cd server
npx prisma migrate dev --name add_payment_model
npx prisma generate
```

### 2. Configuration .env

Ajoutez ces 4 lignes dans `server/.env` :
```env
KKIAPAY_PUBLIC_KEY="pk_test_xxxxx"
KKIAPAY_PRIVATE_KEY="sk_test_xxxxx"
KKIAPAY_SECRET="secret_test_xxxxx"
KKIAPAY_SANDBOX="true"
```

**Où trouver ces clés ?**
1. Allez sur [app.kkiapay.me](https://app.kkiapay.me)
2. Connectez-vous ou créez un compte
3. Section **API Keys** ou **Paramètres**
4. Copiez les 3 clés

### 3. Démarrer le serveur
```bash
npm run dev
```

✅ **C'est prêt !** Vous pouvez maintenant tester.

---

## 🧪 Test Rapide avec Postman

### Test 1 : Créer un paiement

```http
POST http://localhost:5000/api/payments/create
Authorization: Bearer <votre_token_user>
Content-Type: application/json

{
  "type": "UPGRADE_PREMIUM",
  "subscriptionType": "MONTHLY"
}
```

**Résultat attendu** : Status 200, réponse avec `transactionId`

### Test 2 : Historique

```http
GET http://localhost:5000/api/payments/history
Authorization: Bearer <votre_token_user>
```

**Résultat attendu** : Liste de vos paiements

---

## 💰 Les 3 Types de Paiements

### 1. Upgrade Premium
```json
{
  "type": "UPGRADE_PREMIUM",
  "subscriptionType": "MONTHLY"  // ou "ANNUAL"
}
```
- **MONTHLY** : 999 FCFA/mois
- **ANNUAL** : 10 000 FCFA/an

### 2. Renouveler Premium
```json
{
  "type": "RENEW_PREMIUM",
  "subscriptionType": "MONTHLY"
}
```

### 3. Accès Backup
```json
{
  "type": "BACKUP_ACCESS",
  "backupId": "clxxx..."
}
```
- **Prix** : 999 FCFA

---

## 📱 Intégration Mobile (React Native)

### Installation
```bash
npm install kkiapay-sdk
```

### Code Minimal
```javascript
import { KKiaPay } from 'kkiapay-sdk';

// Configuration
const kkiapay = new KKiaPay({
  publicKey: 'pk_test_xxxxx',
  sandbox: true,
});

// Fonction de paiement
async function pay() {
  // 1. Créer intention
  const res = await fetch('https://api.com/api/payments/create', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      type: 'UPGRADE_PREMIUM',
      subscriptionType: 'MONTHLY',
    }),
  });
  
  const { transactionId, payment } = await res.json();
  
  // 2. Ouvrir KKiaPay
  await kkiapay.requestPayment({
    amount: payment.amount,
    reason: 'Upgrade Premium',
    phone: user.phone,
    email: user.email,
  });
  
  // 3. Vérifier
  const verify = await fetch(
    `https://api.com/api/payments/verify/${transactionId}`,
    { headers: { 'Authorization': `Bearer ${token}` } }
  );
  
  const result = await verify.json();
  
  if (result.status === 'SUCCESS') {
    alert('Paiement réussi !');
  }
}
```

---

## 🎯 Routes API Essentielles

| Route | Méthode | Description |
|-------|---------|-------------|
| `/api/payments/create` | POST | Créer un paiement |
| `/api/payments/verify/:id` | GET | Vérifier le statut |
| `/api/payments/history` | GET | Mes paiements |
| `/api/payments/webhook` | POST | Webhook KKiaPay |

---

## 🔧 Webhook (Production uniquement)

**URL à configurer dans KKiaPay** :
```
https://votre-domaine.com/api/payments/webhook
```

Le webhook est **automatique** - il traite les paiements sans intervention.

---

## ✅ Checklist de Démarrage

- [ ] Migration Prisma executée
- [ ] 4 variables KKiaPay dans .env
- [ ] Serveur démarre sans erreur
- [ ] Test Postman réussi (create)
- [ ] Test Postman réussi (history)
- [ ] SDK mobile installé (si applicable)
- [ ] Test paiement sandbox (optionnel)

---

## 🆘 Problèmes Courants

### "KKiaPay non configuré"
→ Ajoutez les 4 variables dans `.env`

### "Token invalide"
→ Connectez-vous pour obtenir un nouveau token

### "Table payments not found"
→ Exécutez `npx prisma migrate dev`

---

## 📚 Documentation Complète

- **KKIAPAY_INTEGRATION.md** - Guide complet (5000+ mots)
- **SETUP_PAYMENTS.md** - Installation détaillée
- **PAYMENT_IMPLEMENTATION_SUMMARY.md** - Résumé technique
- **routes.md** - Toutes les routes API

---

## 🚀 Passer en Production

1. Récupérez les clés **production** sur [app.kkiapay.me](https://app.kkiapay.me)
2. Changez dans `.env` :
   ```env
   KKIAPAY_PUBLIC_KEY="pk_live_xxxxx"
   KKIAPAY_PRIVATE_KEY="sk_live_xxxxx"
   KKIAPAY_SECRET="secret_live_xxxxx"
   KKIAPAY_SANDBOX="false"
   ```
3. Configurez le webhook : `https://votre-domaine.com/api/payments/webhook`
4. Testez avec un vrai paiement de 999 FCFA

---

**Temps d'installation** : ⏱️ 5 minutes  
**Niveau de difficulté** : 🟢 Facile  
**Documentation** : 📚 Complète

**Besoin d'aide ?** Consultez `KKIAPAY_INTEGRATION.md` pour plus de détails.
