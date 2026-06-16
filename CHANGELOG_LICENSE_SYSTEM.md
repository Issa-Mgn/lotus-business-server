# 🔄 Changelog - Nouveau Système de Licences

**Date :** 16 Juin 2026  
**Version :** 2.0.0

---

## 📋 Résumé des Changements

Le système de licences a été complètement revu pour offrir une meilleure flexibilité aux utilisateurs.

---

## 🆓 Mode FREE (Gratuit)

### Avant
- ❌ Limité à 1 mois après inscription
- ❌ Expiration automatique

### Maintenant
- ✅ **Illimité** - Plus d'expiration
- ✅ Disponible à vie après inscription

### Caractéristiques FREE
| Fonctionnalité | Disponible |
|----------------|-----------|
| **Durée** | ♾️ Illimitée |
| **Factures** | ✅ Oui |
| **Bilan** | ✅ Oui |
| **Autres livres comptables** | ❌ Non |
| **Publicités** | ✅ Oui (dans l'app mobile) |
| **Stockage cloud** | ⚠️ Local* |
| **Connexions simultanées** | 1️⃣ Un seul appareil |
| **Prix** | 🆓 Gratuit |

\* *Note dev : En réalité stocké en cloud, mais présenté comme "local" à l'utilisateur pour encourager l'upgrade*

---

## 💎 Mode PREMIUM

### Avant
- 🗓️ Durée : 1 an
- 💰 Prix : Variable

### Maintenant
- 🗓️ **Durée : 1 mois**
- 💰 **Prix : 5000 FCFA/mois**

### Caractéristiques PREMIUM
| Fonctionnalité | Disponible |
|----------------|-----------|
| **Durée** | 📅 1 mois (renouvelable) |
| **Factures** | ✅ Oui |
| **Bilan** | ✅ Oui |
| **Autres livres comptables** | ✅ Oui (tous) |
| **Publicités** | ❌ Sans pub |
| **Stockage cloud** | ☁️ Illimité |
| **Connexions simultanées** | ♾️ Illimitées |
| **Prix** | 💰 5000 FCFA/mois |

---

## 🔧 Modifications Techniques

### Base de données (Prisma Schema)

```prisma
model User {
  expirationDate        DateTime?     // ✅ Nullable - null pour FREE
  maxSimultaneousLogins Int @default(1) // ✅ 1 pour FREE, 999 pour PREMIUM
}
```

### Backend (Controllers)

#### authController.js
- ✅ `register()` : FREE sans expiration
- ✅ `login()` : Vérification expiration seulement pour PREMIUM

#### adminController.js
- ✅ `upgradeToPremium()` : 1 mois au lieu de 1 an
- ✅ `reactivateLicense()` : Gestion FREE illimité

#### checkExpiredLicenses.js
- ✅ Vérifie uniquement les licences PREMIUM
- ✅ Ignore les licences FREE

---

## 📊 Migration Base de Données

### Étapes

1. **Exécuter la migration SQL** :
   ```bash
   # Depuis Supabase SQL Editor
   # Coller le contenu de MIGRATION_FREE_UNLIMITED.sql
   ```

2. **Regénérer le client Prisma** :
   ```bash
   npm run prisma:generate
   ```

3. **Redémarrer le serveur** :
   ```bash
   npm start
   ```

### Script de Migration

Voir fichier : `MIGRATION_FREE_UNLIMITED.sql`

---

## 🎯 Variables d'Environnement Dashboard

Mettre à jour `.env` du dashboard :

```env
# Avant
VITE_MONTHLY_PRICE_FCFA=5000
VITE_ANNUAL_PRICE_FCFA=50000

# Maintenant (PREMIUM = 1 mois)
VITE_PREMIUM_PRICE_FCFA=5000
```

---

## 📱 Impact sur l'Application Mobile

### FREE
```javascript
// L'app doit vérifier licenseType
if (user.licenseType === 'FREE') {
  // Afficher les pubs
  showAds();
  
  // Limiter les fonctionnalités
  disableAdvancedReports();
  
  // Forcer stockage local (UX)
  showLocalStorageMessage();
  
  // Bloquer multi-connexion
  maxDevices = 1;
}
```

### PREMIUM
```javascript
// L'app doit vérifier expirationDate
if (user.licenseType === 'PREMIUM') {
  // Vérifier expiration
  if (new Date(user.expirationDate) < new Date()) {
    showRenewalPrompt();
  }
  
  // Activer toutes les fonctionnalités
  hideAds();
  enableAllReports();
  enableCloudStorage();
  allowMultipleDevices();
}
```

---

## ✅ Checklist de Déploiement

### Backend
- [x] Modifier Prisma schema
- [x] Mettre à jour authController
- [x] Mettre à jour adminController
- [x] Mettre à jour checkExpiredLicenses
- [ ] Exécuter migration SQL sur Supabase
- [ ] Générer client Prisma
- [ ] Tester inscription FREE
- [ ] Tester upgrade PREMIUM
- [ ] Déployer sur Render

### Dashboard
- [ ] Mettre à jour affichage licences
- [ ] Afficher "Illimité" pour FREE
- [ ] Mettre à jour prix (5000 FCFA/mois)
- [ ] Tester interface admin
- [ ] Déployer sur Vercel/Netlify

### Mobile
- [ ] Implémenter logique FREE vs PREMIUM
- [ ] Intégrer système de pubs (FREE)
- [ ] Implémenter restrictions FREE
- [ ] Tester multi-connexion PREMIUM
- [ ] Tester flow d'abonnement

---

## 🐛 Points d'Attention

### FREE
⚠️ **Attention** : Même si FREE est "local" pour l'UX, les données sont stockées en cloud côté serveur. Ne pas exposer cela dans l'app mobile.

### PREMIUM
⚠️ **Attention** : L'expiration est maintenant à 1 mois (plus 1 an). Bien vérifier les calculs de revenus dans le dashboard.

### Migration
⚠️ **Attention** : Les utilisateurs FREE existants doivent avoir leur `expirationDate` mise à `NULL` par la migration.

---

## 📊 Impact sur les Revenus

### Avant
- FREE : 0 FCFA (1 mois)
- PREMIUM : 50000 FCFA/an

### Maintenant
- FREE : 0 FCFA (illimité)
- PREMIUM : 5000 FCFA/mois = 60000 FCFA/an

✅ **Augmentation potentielle** si les utilisateurs renouvellent mensuellement.

---

## 📞 Support

Pour toute question sur cette migration, contacter l'équipe dev.

**Développé avec ❤️ par L!txx pour Lotus Business**
