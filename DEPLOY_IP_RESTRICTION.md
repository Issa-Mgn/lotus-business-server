# 🚀 Guide de Déploiement - Restriction IP pour FREE

## 📋 Résumé de la fonctionnalité

Cette mise à jour implémente la **restriction d'appareil pour les comptes FREE** :

- **FREE** : Peut se connecter depuis **1 seul appareil** à la fois (vérification par IP)
- **PREMIUM** : Peut se connecter depuis **plusieurs appareils** simultanément (pas de restriction IP)

## 🔧 Modifications apportées

### 1. Base de données
- Ajout colonne `lastLoginIp` dans la table `users` pour stocker l'IP du dernier appareil connecté

### 2. Backend
- **`src/controllers/authController.js`** : Logique de vérification IP lors du login
- **`src/lib/getClientIp.js`** : Fonction pour extraire l'IP réelle du client (gère proxies, load balancers, Cloudflare, etc.)

### 3. Logique de restriction
```javascript
// Pour FREE uniquement
if (user.licenseType === 'FREE') {
  if (user.isOnline && user.lastLoginIp && user.lastLoginIp !== currentIp) {
    return 403; // Connexion refusée
  }
}

// Pour PREMIUM : pas de vérification IP
```

---

## 🚀 Étapes de déploiement

### Étape 1 : Exécuter la migration SQL sur Supabase

1. Connectez-vous à votre dashboard Supabase
2. Allez dans **SQL Editor**
3. Copiez et exécutez le contenu de `MIGRATION_FREE_UNLIMITED.sql`

```sql
-- Migration : FREE illimité + PREMIUM 1 mois + Restriction IP
-- Date : 2026-06-16

-- 1. Ajouter la colonne maxSimultaneousLogins
ALTER TABLE "users" 
ADD COLUMN IF NOT EXISTS "maxSimultaneousLogins" INTEGER DEFAULT 1;

-- 2. Rendre expirationDate nullable
ALTER TABLE "users" 
ALTER COLUMN "expirationDate" DROP NOT NULL;

-- 3. Ajouter la colonne lastLoginIp pour la restriction FREE
ALTER TABLE "users" 
ADD COLUMN IF NOT EXISTS "lastLoginIp" TEXT;
```

4. Vérifiez que la migration s'est bien passée :
```sql
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'users'
AND column_name IN ('lastLoginIp', 'maxSimultaneousLogins', 'expirationDate');
```

### Étape 2 : Régénérer Prisma Client

Sur votre machine locale ET sur Render :

```bash
npm run prisma:generate
```

Ou manuellement :
```bash
npx prisma generate
```

### Étape 3 : Tester localement

1. Démarrer le serveur local :
```bash
npm run dev
```

2. Exécuter les tests de restriction IP :
```bash
node test-ip-restriction.js
```

3. Vérifier que :
   - ✅ Un compte FREE peut se connecter depuis IP1
   - ❌ Un compte FREE NE PEUT PAS se connecter depuis IP2 (différente)
   - ✅ Un compte FREE peut SE RECONNECTER depuis IP1 (même IP)
   - ✅ Un compte PREMIUM peut se connecter depuis n'importe quelle IP

### Étape 4 : Déployer sur Render

1. Commit et push vers GitHub :
```bash
git add .
git commit -m "feat: Add IP-based device restriction for FREE users"
git push origin main
```

2. Render va automatiquement :
   - Installer les dépendances
   - Exécuter `npx prisma generate`
   - Redémarrer le serveur

3. Vérifier les logs Render pour confirmer le déploiement

### Étape 5 : Tester en production

1. Créer un compte FREE via l'application mobile
2. Se connecter depuis un appareil
3. Essayer de se connecter depuis un autre appareil (devrait être refusé)
4. Créer un compte PREMIUM
5. Se connecter depuis plusieurs appareils (devrait réussir)

---

## 🧪 Tests manuels

### Test FREE - 1 appareil

1. **Appareil 1 (Téléphone)** :
   - Se connecter avec clé FREE
   - ✅ Devrait réussir
   - Rester connecté

2. **Appareil 2 (Tablette)** :
   - Essayer de se connecter avec la MÊME clé FREE
   - ❌ Devrait afficher : "Compte FREE déjà connecté sur un autre appareil..."

3. **Appareil 1 (Téléphone)** :
   - Se déconnecter (logout)

4. **Appareil 2 (Tablette)** :
   - Réessayer de se connecter
   - ✅ Devrait maintenant réussir

### Test PREMIUM - Multi-appareils

1. **Appareil 1** : Se connecter avec clé PREMIUM → ✅ Réussit
2. **Appareil 2** : Se connecter avec MÊME clé PREMIUM → ✅ Réussit
3. **Appareil 3** : Se connecter avec MÊME clé PREMIUM → ✅ Réussit

---

## 📊 Logs et debugging

### Activer les logs détaillés

Les logs IP sont déjà activés dans `authController.js` :

```javascript
console.log(`🔐 Tentative de connexion - Email: ${user.email}, Type: ${user.licenseType}, IP: ${currentIp}`);
console.log(`❌ Connexion refusée FREE - IP différente détectée`);
console.log(`✅ Connexion PREMIUM autorisée - Pas de restriction IP`);
```

### Vérifier les logs sur Render

1. Aller sur Render Dashboard
2. Sélectionner le service backend
3. Cliquer sur "Logs"
4. Chercher les logs contenant "🔐" ou "IP:"

---

## 🔒 Sécurité et edge cases

### Problèmes possibles et solutions

#### 1. IP dynamique (4G/5G)
**Problème** : L'utilisateur FREE change d'IP (ex: 4G → WiFi)
**Solution actuelle** : Il devra se déconnecter puis se reconnecter
**Amélioration future** : Permettre 1 changement d'IP par heure

#### 2. VPN
**Problème** : L'utilisateur FREE active/désactive son VPN
**Solution** : Déconnexion automatique lors du changement d'IP

#### 3. Proxies/Load balancers
**Solution** : `getClientIp()` gère automatiquement :
- `x-forwarded-for`
- `x-real-ip`
- `cf-connecting-ip` (Cloudflare)

#### 4. Partage de connexion familiale
**Problème** : Plusieurs appareils sur même WiFi = même IP publique
**Solution** : Ils peuvent tous se connecter (limite technique acceptable)

---

## 🎯 Vérification post-déploiement

### Checklist

- [ ] Migration SQL exécutée sur Supabase
- [ ] Colonne `lastLoginIp` existe dans table `users`
- [ ] Prisma client régénéré localement
- [ ] Tests locaux passent (test-ip-restriction.js)
- [ ] Code poussé sur GitHub
- [ ] Render a redéployé automatiquement
- [ ] Tests manuels en production réussis (FREE + PREMIUM)
- [ ] Logs visibles sur Render
- [ ] Dashboard affiche correctement les types de licence

---

## 📞 Support

En cas de problème :

1. Vérifier les logs Render pour les erreurs Prisma
2. Vérifier que la colonne `lastLoginIp` existe dans Supabase
3. Tester avec `test-ip-restriction.js` localement
4. Vérifier que `getClientIp()` retourne une IP valide

---

## 🎉 Fonctionnalité déployée !

Une fois tous les tests validés, la restriction IP pour FREE est active :

- **FREE** : 1 appareil seulement (restriction IP)
- **PREMIUM** : Appareils illimités (pas de restriction)

Les utilisateurs FREE verront le message :
> "Compte FREE déjà connecté sur un autre appareil. Déconnectez-vous d'abord ou passez à PREMIUM pour connexions illimitées."
