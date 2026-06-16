# 🔒 Restriction IP pour FREE - Documentation complète

## 📌 Vue d'ensemble

Cette fonctionnalité implémente une **restriction d'appareil basée sur l'IP** pour les comptes **FREE**, tout en permettant des **connexions illimitées** pour les comptes **PREMIUM**.

---

## 🎯 Objectif

### Compte FREE
- **Limitation** : 1 seul appareil à la fois
- **Méthode** : Vérification de l'adresse IP
- **Comportement** : 
  - ✅ L'utilisateur peut se connecter depuis un appareil (IP1)
  - ❌ Si déjà connecté sur IP1, la connexion depuis IP2 est **REFUSÉE**
  - ✅ Il peut SE DÉCONNECTER puis se reconnecter depuis IP2

### Compte PREMIUM
- **Limitation** : Aucune
- **Méthode** : Pas de vérification IP
- **Comportement** : 
  - ✅ Connexion simultanée depuis plusieurs appareils
  - ✅ Pas de limite d'IP

---

## 🛠️ Implémentation technique

### 1. Structure de base de données

**Nouvelle colonne dans `users`** :
```sql
lastLoginIp TEXT -- Stocke l'IP du dernier appareil connecté
```

**Colonnes existantes utilisées** :
- `licenseType` : FREE ou PREMIUM
- `isOnline` : Boolean pour savoir si connecté
- `activeSessionId` : ID unique de session

### 2. Fonction d'extraction IP

**Fichier** : `src/lib/getClientIp.js`

```javascript
function getClientIp(req) {
  // Priorité aux headers de proxy/load balancer
  const forwardedFor = req.headers['x-forwarded-for'];
  if (forwardedFor) {
    return forwardedFor.split(',')[0].trim();
  }

  // x-real-ip (Nginx)
  if (req.headers['x-real-ip']) {
    return req.headers['x-real-ip'];
  }

  // cf-connecting-ip (Cloudflare)
  if (req.headers['cf-connecting-ip']) {
    return req.headers['cf-connecting-ip'];
  }

  // Fallback
  return req.ip || req.connection?.remoteAddress || 'unknown';
}
```

**Pourquoi cette logique ?**
- Les serveurs en production (Render, Vercel, etc.) passent par des proxies/load balancers
- L'IP réelle du client est dans les headers `x-forwarded-for`, `x-real-ip`, etc.
- Sans cette logique, tous les utilisateurs auraient la même IP (celle du load balancer)

### 3. Logique de vérification dans le login

**Fichier** : `src/controllers/authController.js`

```javascript
const login = async (req, res) => {
  // ... vérifications préliminaires ...

  // Récupérer l'IP actuelle
  const currentIp = getClientIp(req);

  // 🔒 RESTRICTION POUR FREE
  if (user.licenseType === 'FREE') {
    if (user.isOnline && user.lastLoginIp && user.lastLoginIp !== currentIp) {
      return res.status(403).json({ 
        error: 'Compte FREE déjà connecté sur un autre appareil...' 
      });
    }
  }

  // ✅ PREMIUM : Pas de vérification

  // Enregistrer l'IP actuelle
  await prisma.user.update({
    where: { id: user.id },
    data: {
      isOnline: true,
      lastLoginIp: currentIp,
      activeSessionId: sessionId
    }
  });

  // Retourner le token
  res.json({ token, user });
};
```

---

## 🔄 Flux de connexion

### Scénario 1 : Première connexion FREE
```
1. User lance l'app sur Téléphone 1 (IP: 192.168.1.100)
2. Envoie clé de licence
3. Backend récupère IP = 192.168.1.100
4. Aucun lastLoginIp stocké → ✅ Connexion autorisée
5. Backend enregistre lastLoginIp = 192.168.1.100, isOnline = true
6. Token envoyé
```

### Scénario 2 : Connexion FREE sur 2ème appareil (REFUSÉE)
```
1. User lance l'app sur Tablette (IP: 10.0.0.50)
2. Envoie MÊME clé de licence
3. Backend récupère IP = 10.0.0.50
4. Voit que isOnline = true et lastLoginIp = 192.168.1.100
5. Compare 10.0.0.50 ≠ 192.168.1.100
6. ❌ Connexion REFUSÉE avec code 403
7. Message : "Compte FREE déjà connecté sur un autre appareil..."
```

### Scénario 3 : Reconnexion FREE sur même appareil (AUTORISÉE)
```
1. User rouvre l'app sur Téléphone 1 (IP: 192.168.1.100)
2. Envoie clé de licence
3. Backend récupère IP = 192.168.1.100
4. Voit que lastLoginIp = 192.168.1.100
5. Compare 192.168.1.100 = 192.168.1.100
6. ✅ Connexion autorisée (renouvellement session)
```

### Scénario 4 : Connexion PREMIUM multi-appareils (TOUJOURS AUTORISÉE)
```
1. User PREMIUM se connecte depuis Téléphone (IP1) → ✅
2. User PREMIUM se connecte depuis Tablette (IP2) → ✅
3. User PREMIUM se connecte depuis PC (IP3) → ✅
4. Pas de vérification IP pour PREMIUM
```

---

## 🧪 Tests

### Tests automatisés

**Fichier** : `test-ip-restriction.js`

**Commande** :
```bash
npm run test:ip
```

**Ce qui est testé** :
1. ✅ Création utilisateur FREE
2. ✅ Connexion FREE depuis IP1 (doit réussir)
3. ❌ Connexion FREE depuis IP2 (doit échouer)
4. ✅ Reconnexion FREE depuis IP1 (doit réussir)

### Tests manuels

**Test FREE** :
1. Créer un compte FREE via l'app mobile
2. Se connecter sur Téléphone 1
3. Essayer de se connecter sur Téléphone 2 avec même clé
4. Vérifier que le 2ème est refusé

**Test PREMIUM** :
1. Créer un compte et passer en PREMIUM via dashboard admin
2. Se connecter sur plusieurs appareils
3. Vérifier que tous réussissent

---

## 📊 Logs et monitoring

### Logs activés

Dans `authController.js`, des logs sont ajoutés pour faciliter le debugging :

```javascript
console.log(`🔐 Tentative connexion - Email: ${user.email}, Type: ${user.licenseType}, IP: ${currentIp}, IP stockée: ${user.lastLoginIp}`);

// Si FREE et IP différente
console.log(`❌ Connexion refusée FREE - IP différente détectée`);

// Si PREMIUM
console.log(`✅ Connexion PREMIUM autorisée - Pas de restriction IP`);

// Succès
console.log(`✅ Connexion réussie - ${user.email} (${user.licenseType}) depuis IP: ${currentIp}`);
```

### Monitoring sur Render

1. Aller sur Render Dashboard
2. Sélectionner votre service backend
3. Cliquer sur "Logs"
4. Filtrer par "🔐" ou "IP:"

---

## 🚨 Cas limites et solutions

### 1. IP dynamique (4G/5G qui change)
**Problème** : L'utilisateur FREE passe de 4G à WiFi, son IP change
**Comportement** : Il sera déconnecté et devra se reconnecter
**Solution future** : Permettre 1 changement d'IP par heure

### 2. VPN activé/désactivé
**Problème** : L'IP change lors de l'activation du VPN
**Comportement** : Considéré comme un nouvel appareil
**Solution** : User doit se déconnecter avant d'activer VPN

### 3. Famille sur même WiFi
**Problème** : Plusieurs appareils partagent la même IP publique
**Comportement** : Tous peuvent se connecter avec le même compte FREE
**Note** : Limite technique acceptable (difficile à détecter sans fingerprinting)

### 4. Proxies/CDN (Cloudflare, Nginx)
**Problème** : L'IP réelle est masquée
**Solution** : La fonction `getClientIp()` gère automatiquement les headers de proxy

---

## 🔐 Sécurité

### Ce qui est sécurisé
- ✅ Extraction correcte de l'IP réelle (via headers proxy)
- ✅ Vérification côté serveur (impossible à contourner depuis l'app)
- ✅ FREE ne peut pas simuler PREMIUM (vérification de `licenseType` en BDD)

### Ce qui n'est PAS sécurisé (limite acceptée)
- ⚠️ Famille sur même WiFi = même IP publique
- ⚠️ User peut utiliser un VPN pour changer d'IP (mais ça nécessite action manuelle)

---

## 📱 Expérience utilisateur

### Message d'erreur FREE

**Quand** : Tentative de connexion sur 2ème appareil

**Message affiché** :
```
Compte FREE déjà connecté sur un autre appareil. 
Déconnectez-vous d'abord ou passez à PREMIUM pour connexions illimitées.
```

**Action recommandée** :
1. Se déconnecter de l'appareil 1
2. OU passer à PREMIUM (5000 FCFA/mois)

### Bouton de déconnexion

L'app mobile devrait avoir un bouton "Se déconnecter" qui appelle :
```javascript
POST /api/auth/logout
```

Cela met `isOnline = false` et permet la connexion sur un autre appareil.

---

## 🎯 Résumé des règles

| Type    | Max Appareils | Vérification IP | Expiration  |
|---------|---------------|-----------------|-------------|
| FREE    | 1             | ✅ Oui          | ♾️ Jamais   |
| PREMIUM | ∞ Illimité    | ❌ Non          | 1 mois      |

---

## 🚀 Commandes utiles

```bash
# Installer les dépendances
npm install

# Régénérer Prisma client (après migration)
npm run prisma:generate

# Lancer le serveur en dev
npm run dev

# Tester la restriction IP
npm run test:ip

# Voir les logs Prisma
npm run prisma:studio
```

---

## ✅ Checklist de déploiement

- [ ] Migration SQL exécutée sur Supabase (ajouter colonne `lastLoginIp`)
- [ ] Prisma client régénéré (`npm run prisma:generate`)
- [ ] Code testé localement avec `npm run test:ip`
- [ ] Code poussé sur GitHub
- [ ] Render a redéployé automatiquement
- [ ] Tests manuels en production (FREE + PREMIUM)
- [ ] Logs vérifiés sur Render

---

## 📞 Support technique

Si la restriction IP ne fonctionne pas :

1. **Vérifier la colonne BDD** :
   ```sql
   SELECT id, email, licenseType, lastLoginIp, isOnline 
   FROM users 
   LIMIT 5;
   ```

2. **Vérifier les logs Render** :
   - Chercher "🔐 Tentative connexion"
   - Vérifier que l'IP est bien récupérée (pas "unknown")

3. **Tester l'extraction IP** :
   ```javascript
   console.log('IP:', getClientIp(req));
   ```

4. **Vérifier le type de licence** :
   ```javascript
   console.log('Type:', user.licenseType); // Doit être "FREE" ou "PREMIUM"
   ```

---

## 🎉 Conclusion

La restriction IP pour FREE est maintenant **active et fonctionnelle** :

- ✅ FREE = 1 appareil (basé sur IP)
- ✅ PREMIUM = illimité (pas de restriction)
- ✅ Messages d'erreur clairs
- ✅ Logs détaillés pour debugging
- ✅ Tests automatisés disponibles

**Prochaine étape** : Tester en production avec de vrais utilisateurs !
