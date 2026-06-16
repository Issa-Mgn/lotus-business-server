# 🚀 Guide de Déploiement - Nouveau Système de Licences

**Version :** 2.0.0  
**Date :** 16 Juin 2026

---

## ⚠️ IMPORTANT : Sauvegarder d'abord !

Avant toute manipulation, **faire une sauvegarde de la base de données**.

---

## 📋 Checklist Pré-Déploiement

- [ ] Lire CHANGELOG_LICENSE_SYSTEM.md
- [ ] Comprendre les changements FREE/PREMIUM
- [ ] Sauvegarder la base de données
- [ ] Tester en local d'abord

---

## 🔧 Étape 1 : Migration Base de Données

### Sur Supabase

1. **Se connecter à Supabase** :
   - Aller sur https://supabase.com
   - Sélectionner votre projet
   - Aller dans **SQL Editor**

2. **Exécuter la migration** :
   ```bash
   # Copier le contenu de MIGRATION_FREE_UNLIMITED.sql
   # Coller dans SQL Editor
   # Cliquer sur "Run"
   ```

3. **Vérifier le résultat** :
   ```sql
   SELECT 
     "licenseType",
     COUNT(*) as total,
     COUNT(CASE WHEN "expirationDate" IS NULL THEN 1 END) as sans_expiration
   FROM "users"
   GROUP BY "licenseType";
   ```

   **Résultat attendu :**
   - FREE : `sans_expiration` = `total`
   - PREMIUM : `sans_expiration` = 0

---

## 🖥️ Étape 2 : Backend (Local)

### 1. Regénérer Prisma Client

```bash
cd server
npm run prisma:generate
```

### 2. Tester le nouveau système

```bash
npm run test:licenses
```

**Vérifications :**
- ✅ FREE sans expiration
- ✅ PREMIUM avec expiration (1 mois)
- ✅ maxSimultaneousLogins correct (1 pour FREE, 999 pour PREMIUM)
- ✅ Aucune incohérence

### 3. Tester l'inscription

```bash
# Démarrer le serveur
npm run dev
```

Tester avec Postman/Thunder Client :

**Inscription :**
```http
POST http://localhost:5000/api/auth/register
Content-Type: application/json

{
  "email": "test@example.com",
  "phone": "+221771234567",
  "firstName": "Test",
  "lastName": "User"
}
```

**Vérifier la réponse :**
```json
{
  "user": {
    "licenseType": "FREE",
    "expirationDate": null,  // ✅ Devrait être null
    "maxSimultaneousLogins": 1  // ✅ Devrait être 1
  }
}
```

### 4. Tester l'upgrade PREMIUM

```http
POST http://localhost:5000/api/admin/upgrade-premium
Authorization: Bearer {admin_token}
Content-Type: application/json

{
  "userId": "{user_id}"
}
```

**Vérifier :**
- Expiration = 1 mois (pas 1 an)
- maxSimultaneousLogins = 999

---

## 🌐 Étape 3 : Déploiement Backend (Render)

### 1. Commit et Push

```bash
git add .
git commit -m "feat: nouveau système licences - FREE illimité + PREMIUM 1 mois"
git push origin main
```

### 2. Vérifier le déploiement sur Render

- Aller sur https://render.com
- Vérifier que le build réussit
- Vérifier les logs au démarrage

### 3. Tester en production

```bash
# Test inscription
curl -X POST https://votre-api.onrender.com/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "prod-test@example.com",
    "phone": "+221771234999",
    "firstName": "Prod",
    "lastName": "Test"
  }'
```

---

## 🎨 Étape 4 : Dashboard (Frontend)

### 1. Mettre à jour les variables

Modifier `dashboard/dashboard/.env` :

```env
# Ancien
VITE_MONTHLY_PRICE_FCFA=5000
VITE_ANNUAL_PRICE_FCFA=50000

# Nouveau
VITE_PREMIUM_PRICE_FCFA=5000
```

### 2. Mettre à jour l'affichage

Les pages qui affichent `expirationDate` doivent gérer le cas `null` :

```javascript
// Exemple
const displayExpiration = (user) => {
  if (user.licenseType === 'FREE') {
    return '♾️ Illimité';
  }
  if (!user.expirationDate) {
    return 'Non défini';
  }
  return new Date(user.expirationDate).toLocaleDateString('fr-FR');
};
```

### 3. Tester localement

```bash
cd dashboard/dashboard
npm run dev
```

Vérifier :
- [ ] Page Users affiche "Illimité" pour FREE
- [ ] Page Licenses affiche correctement
- [ ] Upgrade PREMIUM fonctionne
- [ ] Prix affiché = 5000 FCFA/mois

### 4. Déployer

```bash
npm run build
# Puis déployer sur Vercel/Netlify
```

---

## 📱 Étape 5 : Application Mobile

### Modifications nécessaires

#### 1. Gérer FREE vs PREMIUM

```javascript
// Dans l'app mobile
const user = getUserFromStorage();

if (user.licenseType === 'FREE') {
  // Afficher publicités
  initAds();
  
  // Limiter fonctionnalités
  disableAdvancedReports();
  
  // Message stockage
  showMessage('Vos données sont stockées localement');
  
  // Bloquer multi-connexion
  maxDevices = 1;
  
} else if (user.licenseType === 'PREMIUM') {
  // Pas de pub
  hideAds();
  
  // Toutes fonctionnalités
  enableAllFeatures();
  
  // Vérifier expiration
  if (user.expirationDate && new Date(user.expirationDate) < new Date()) {
    showRenewalScreen();
  }
}
```

#### 2. Flow d'abonnement

```javascript
// Bouton "Passer à PREMIUM"
const subscribeToPremium = async () => {
  try {
    // Intégration Wave/Orange Money/Stripe
    const payment = await processPayment(5000); // 5000 FCFA
    
    if (payment.success) {
      // Appeler backend pour upgrade
      const response = await api.post('/admin/upgrade-premium', {
        userId: user.id
      });
      
      // Mettre à jour user local
      updateUser(response.user);
      
      showSuccess('Abonnement PREMIUM activé ! 🎉');
    }
  } catch (error) {
    showError('Échec du paiement');
  }
};
```

---

## ✅ Checklist Post-Déploiement

### Backend
- [ ] Migration SQL exécutée
- [ ] Prisma client regénéré
- [ ] Tests passent (npm run test:licenses)
- [ ] Inscription FREE fonctionne
- [ ] Upgrade PREMIUM fonctionne
- [ ] API déployée sur Render
- [ ] Tests en production OK

### Dashboard
- [ ] Variables d'environnement mises à jour
- [ ] Affichage "Illimité" pour FREE
- [ ] Prix 5000 FCFA/mois affiché
- [ ] Dashboard déployé
- [ ] Tests en production OK

### Mobile
- [ ] Logique FREE/PREMIUM implémentée
- [ ] Publicités intégrées (FREE)
- [ ] Restrictions FREE activées
- [ ] Flow d'abonnement testé
- [ ] Multi-connexion PREMIUM testée

---

## 🐛 Problèmes Connus

### Problème 1 : FREE avec expiration après migration

**Symptôme :** Utilisateurs FREE ont toujours une expirationDate

**Solution :**
```sql
UPDATE "users" 
SET "expirationDate" = NULL 
WHERE "licenseType" = 'FREE';
```

### Problème 2 : PREMIUM sans maxSimultaneousLogins

**Symptôme :** PREMIUM avec maxSimultaneousLogins = 1

**Solution :**
```sql
UPDATE "users" 
SET "maxSimultaneousLogins" = 999 
WHERE "licenseType" = 'PREMIUM';
```

### Problème 3 : Erreur Prisma "expirationDate required"

**Symptôme :** Erreur lors de l'inscription

**Solution :**
```bash
npm run prisma:generate
npm start
```

---

## 📊 Monitoring Post-Déploiement

### À surveiller

1. **Inscriptions FREE** :
   ```sql
   SELECT COUNT(*) FROM "users" 
   WHERE "licenseType" = 'FREE' 
   AND "createdAt" > NOW() - INTERVAL '24 hours';
   ```

2. **Upgrades PREMIUM** :
   ```sql
   SELECT COUNT(*) FROM "users" 
   WHERE "licenseType" = 'PREMIUM' 
   AND "activationDate" > NOW() - INTERVAL '24 hours';
   ```

3. **Expirations PREMIUM** :
   ```sql
   SELECT COUNT(*) FROM "users" 
   WHERE "licenseType" = 'PREMIUM' 
   AND "expirationDate" < NOW() 
   AND "licenseStatus" = 'ACTIVE';
   ```

---

## 📞 Support

En cas de problème :

1. Vérifier les logs Render
2. Vérifier les logs Supabase
3. Exécuter `npm run test:licenses`
4. Consulter CHANGELOG_LICENSE_SYSTEM.md

---

## 🎉 Conclusion

Une fois toutes ces étapes complétées :

✅ FREE = Gratuit à vie  
✅ PREMIUM = 5000 FCFA/mois  
✅ Système fonctionnel  

**Félicitations ! 🚀**

---

**Développé avec ❤️ par L!txx pour Lotus Business**
