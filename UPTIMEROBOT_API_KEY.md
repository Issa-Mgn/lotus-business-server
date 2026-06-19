# 🔑 Comment obtenir votre clé API UptimeRobot

## Étape 1 : Créer un compte UptimeRobot

1. Va sur **https://uptimerobot.com**
2. Clique sur **"Sign Up Free"**
3. Remplis le formulaire d'inscription ou connecte-toi avec Google
4. Vérifie ton email et active ton compte

---

## Étape 2 : Obtenir la clé API

### Option A : Via les paramètres du compte

1. **Connecte-toi** à UptimeRobot
2. Clique sur ton email/avatar en haut à droite
3. Sélectionne **"My Settings"**
4. Clique sur l'onglet **"API Settings"** (dans le menu latéral)
5. Tu verras ta **Main API Key** (commence par `u` suivi de chiffres et lettres)
6. Clique sur **"Show"** pour révéler la clé complète
7. Copie la clé

### Option B : Accès direct

1. Va directement sur : **https://uptimerobot.com/dashboard.php#mySettings**
2. Clique sur **"API Settings"** dans le menu de gauche
3. Copie ta **Main API Key**

---

## Étape 3 : Ajouter la clé dans le fichier .env

1. Ouvre le fichier `.env` dans le dossier `server/`
2. Ajoute cette ligne à la fin du fichier :

```env
UPTIMEROBOT_API_KEY=ta_clé_api_ici
```

Exemple :
```env
UPTIMEROBOT_API_KEY=u1234567-abcdef1234567890abcdef1234567890
```

3. **Sauvegarde** le fichier
4. **Redémarre le serveur** : 
   ```bash
   npm run dev
   ```

---

## Étape 4 : Tester la configuration

1. Ouvre le dashboard admin
2. Va dans **UptimeRobot** dans le menu
3. Si tu vois "Configuration requise", vérifie que :
   - La clé API est bien dans le `.env`
   - Le serveur a été redémarré après l'ajout
   - Il n'y a pas d'espace avant ou après la clé

4. Si tout est OK, tu verras tes monitors (ou un message pour en créer)

---

## ⚠️ Sécurité

- **NE PARTAGE JAMAIS** ta clé API publiquement
- **NE LA COMMIT PAS** dans Git (le fichier `.env` est déjà dans `.gitignore`)
- Si tu penses que ta clé a été compromise :
  1. Va dans **My Settings → API Settings**
  2. Clique sur **"Generate New API Key"**
  3. Mets à jour ton fichier `.env` avec la nouvelle clé

---

## 📊 Types de clés API UptimeRobot

UptimeRobot propose 2 types de clés :

### 1. Main API Key (recommandée)
- ✅ Accès complet à tous les monitors
- ✅ Peut créer, modifier, supprimer des monitors
- ✅ C'est celle que tu dois utiliser

### 2. Monitor-Specific API Keys
- Accès limité à un seul monitor
- Utile si tu veux partager l'accès à un monitor spécifique
- Pas nécessaire pour notre cas

---

## 🔍 Vérifier que ça fonctionne

### Test rapide dans le terminal :

```bash
curl -X POST https://api.uptimerobot.com/v2/getAccountDetails \
  -H "Content-Type: application/json" \
  -d '{"api_key": "TA_CLÉ_API_ICI", "format": "json"}'
```

Si ça fonctionne, tu recevras :
```json
{
  "stat": "ok",
  "account": {
    "email": "ton@email.com",
    "monitor_limit": 50,
    "monitor_interval": 5,
    ...
  }
}
```

---

## ❓ Problèmes courants

### Erreur "Invalid API Key"
- Vérifie que tu as copié la **clé complète** sans espaces
- Assure-toi d'utiliser la **Main API Key** et non une Monitor-Specific Key

### Erreur "setupRequired: true"
- La variable d'environnement n'est pas chargée
- Redémarre le serveur après avoir ajouté la clé dans `.env`
- Vérifie que le fichier `.env` est bien à la racine du dossier `server/`

### Aucune réponse / timeout
- Vérifie ta connexion internet
- Les serveurs UptimeRobot peuvent être temporairement indisponibles

---

## ✅ Checklist Finale

- [ ] Compte UptimeRobot créé
- [ ] Clé API copiée depuis My Settings → API Settings
- [ ] Clé ajoutée dans `server/.env` comme `UPTIMEROBOT_API_KEY=...`
- [ ] Serveur redémarré avec `npm run dev`
- [ ] Page UptimeRobot accessible dans le dashboard
- [ ] Monitors visibles ou message de configuration rapide affiché

---

## 🎉 C'est prêt !

Tu peux maintenant gérer tes monitors UptimeRobot directement depuis le dashboard admin de Lotus Business !
