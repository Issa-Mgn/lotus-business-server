# 🔒 Restriction IP - Guide Rapide

## 🎯 En bref

| Licence | Appareils | Restriction IP | Durée |
|---------|-----------|----------------|-------|
| **FREE** | 1 seul | ✅ Oui | ♾️ Illimité |
| **PREMIUM** | ∞ Illimité | ❌ Non | 30 jours |

---

## 🔄 Comment ça marche ?

### FREE (1 appareil)
```
📱 Appareil 1 (IP1) → Connexion → ✅ AUTORISÉE
   └─ IP1 enregistrée en BDD

📱 Appareil 2 (IP2) → Connexion → ❌ REFUSÉE
   └─ Message: "Déjà connecté sur un autre appareil"

📱 Appareil 1 (IP1) → Reconnexion → ✅ AUTORISÉE
   └─ Même IP détectée
```

### PREMIUM (illimité)
```
📱 Appareil 1 (IP1) → Connexion → ✅ AUTORISÉE
📱 Appareil 2 (IP2) → Connexion → ✅ AUTORISÉE
📱 Appareil 3 (IP3) → Connexion → ✅ AUTORISÉE
💻 Ordinateur (IP4) → Connexion → ✅ AUTORISÉE
```

---

## 📂 Fichiers modifiés

| Fichier | Rôle |
|---------|------|
| `src/controllers/authController.js` | Logique de vérification IP |
| `src/lib/getClientIp.js` | Extraction IP réelle |
| `prisma/schema.prisma` | Ajout champ `lastLoginIp` |
| `MIGRATION_FREE_UNLIMITED.sql` | Migration BDD |

---

## 🧪 Tester localement

```bash
# 1. Installer les dépendances
npm install

# 2. Exécuter migration SQL sur Supabase
# (copier le contenu de MIGRATION_FREE_UNLIMITED.sql)

# 3. Régénérer Prisma
npm run prisma:generate

# 4. Lancer le serveur
npm run dev

# 5. Tester la restriction IP
npm run test:ip
```

---

## 🚀 Déployer sur Render

```bash
# 1. Commit + push
git add .
git commit -m "feat: IP restriction for FREE users"
git push origin main

# 2. Render redéploie automatiquement

# 3. Vérifier les logs Render
# Chercher: "🔐 Tentative connexion"
```

---

## 🐛 Debugging

### Vérifier que ça marche

**1. Logs backend (Render)** :
```
🔐 Tentative connexion - Email: test@example.com, Type: FREE, IP: 192.168.1.100
✅ Connexion réussie
```

**2. Logs d'erreur FREE** :
```
❌ Connexion refusée FREE - IP différente détectée
```

**3. Vérifier BDD (Supabase)** :
```sql
SELECT email, licenseType, lastLoginIp, isOnline 
FROM users 
WHERE email = 'test@example.com';
```

### Problèmes courants

| Problème | Solution |
|----------|----------|
| IP toujours "unknown" | Vérifier headers proxy (`x-forwarded-for`) |
| Restriction ne fonctionne pas | Vérifier colonne `lastLoginIp` existe en BDD |
| Erreur Prisma | Exécuter `npm run prisma:generate` |
| Tous les users peuvent multi-connect | Vérifier `licenseType = 'FREE'` en BDD |

---

## 💬 Messages utilisateur

### Erreur FREE (code 403)
```json
{
  "error": "Compte FREE déjà connecté sur un autre appareil. Déconnectez-vous d'abord ou passez à PREMIUM pour connexions illimitées."
}
```

### Succès (code 200)
```json
{
  "message": "Connexion réussie",
  "token": "eyJhbGc...",
  "user": {
    "licenseType": "FREE",
    "expirationDate": null
  }
}
```

---

## 🔑 Endpoints concernés

### Login avec vérification IP
```http
POST /api/auth/login
Content-Type: application/json

{
  "licenseKey": "LOTUS-XXXX-XXXX-XXXX"
}

→ FREE: Vérifie IP avant d'autoriser
→ PREMIUM: Pas de vérification IP
```

### Logout (libère l'appareil FREE)
```http
POST /api/auth/logout
Authorization: Bearer <token>

→ Met isOnline = false
→ FREE peut maintenant se connecter depuis autre appareil
```

---

## 📊 Statistiques importantes

### Colonnes BDD utilisées
- `lastLoginIp` → IP du dernier appareil connecté
- `isOnline` → Boolean (connecté ou non)
- `licenseType` → FREE ou PREMIUM
- `activeSessionId` → ID unique de session

### Headers IP analysés
1. `x-forwarded-for` (proxies/load balancers)
2. `x-real-ip` (Nginx)
3. `cf-connecting-ip` (Cloudflare)
4. Fallback: `req.ip`

---

## ✅ Tests de validation

### Test FREE
- [ ] Connexion appareil 1 → ✅ Réussit
- [ ] Connexion appareil 2 (même clé) → ❌ Refusée
- [ ] Déconnexion appareil 1 → ✅ Réussit
- [ ] Connexion appareil 2 après logout → ✅ Réussit

### Test PREMIUM
- [ ] Connexion appareil 1 → ✅ Réussit
- [ ] Connexion appareil 2 (même clé) → ✅ Réussit
- [ ] Connexion appareil 3 (même clé) → ✅ Réussit

---

## 📞 Contact support

Si problème persistant :
1. Vérifier logs Render (section "Logs")
2. Exécuter `npm run test:ip` localement
3. Vérifier colonne `lastLoginIp` dans Supabase
4. S'assurer que Prisma client est à jour

---

## 🎉 Résumé

✅ FREE = 1 appareil (IP check)  
✅ PREMIUM = illimité (pas de check)  
✅ Message d'erreur clair  
✅ Logs détaillés  
✅ Tests automatisés  

**Prêt pour la production !** 🚀
