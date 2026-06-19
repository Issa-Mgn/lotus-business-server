# 🤖 Guide Complet UptimeRobot - Lotus Business

## 📖 Table des Matières

1. [Introduction](#introduction)
2. [Configuration Initiale](#configuration-initiale)
3. [Utilisation via le Dashboard](#utilisation-via-le-dashboard)
4. [API Endpoints](#api-endpoints)
5. [Tests et Debugging](#tests-et-debugging)
6. [Problèmes Courants](#problèmes-courants)

---

## Introduction

UptimeRobot est maintenant intégré directement dans le dashboard admin de Lotus Business. Tu peux :

- ✅ Créer et gérer des monitors sans quitter le dashboard
- ✅ Voir les statistiques de disponibilité en temps réel
- ✅ Activer/désactiver les monitors
- ✅ Configuration rapide en un clic
- ✅ Gérer tout depuis l'interface admin

---

## Configuration Initiale

### 1. Obtenir la clé API

1. Va sur **https://uptimerobot.com**
2. Crée un compte (gratuit)
3. Va dans **My Settings → API Settings**
4. Copie ta **Main API Key**

📖 Guide détaillé: Voir `UPTIMEROBOT_API_KEY.md`

### 2. Configurer le serveur

Ajoute la clé dans `server/.env` :

```env
UPTIMEROBOT_API_KEY=u1234567-abcdef1234567890abcdef1234567890
```

### 3. Redémarrer le serveur

```bash
cd server
npm run dev
```

### 4. Tester la configuration

```bash
npm run test:uptimerobot
```

Tu devrais voir :
```
✅ Clé API présente
✅ Compte récupéré avec succès
✅ Monitors récupérés: X
```

---

## Utilisation via le Dashboard

### Accéder à la page UptimeRobot

1. Ouvre le dashboard admin
2. Connecte-toi avec tes identifiants admin
3. Clique sur **"UptimeRobot"** dans le menu (icône éclair ⚡)

### Configuration Rapide

Pour configurer rapidement tes monitors :

1. Clique sur **"Config Rapide"**
2. Entre l'URL de ton serveur : `https://lotus-business-server.onrender.com`
3. (Optionnel) Entre l'URL de ton dashboard Netlify
4. Clique sur **"Configurer"**

✨ Deux monitors seront créés automatiquement :
- `Lotus Business API` - surveille ton serveur
- `Lotus Business Dashboard` - surveille ton frontend

### Ajouter un Monitor Manuellement

1. Clique sur **"Nouveau Monitor"**
2. Remplis le formulaire :
   - **Nom** : Ex: "API Production"
   - **URL** : Ex: "https://api.example.com"
   - **Intervalle** : 5 minutes (recommandé)
3. Clique sur **"Ajouter"**

### Gérer les Monitors

Chaque monitor affiche :
- 📊 **Status** : EN LIGNE, HORS LIGNE, EN PAUSE
- 📈 **Disponibilité** : Pourcentage d'uptime
- ⚡ **Temps de réponse** : En millisecondes

Actions disponibles :
- 🔴 **Pause** : Mettre en pause la surveillance
- 🟢 **Activer** : Reprendre la surveillance
- 🗑️ **Supprimer** : Supprimer le monitor

---

## API Endpoints

L'intégration UptimeRobot expose plusieurs endpoints :

### Récupérer tous les monitors

```http
GET /api/uptimerobot/monitors
Authorization: Bearer {token}
```

**Réponse** :
```json
{
  "monitors": [
    {
      "id": 123456,
      "name": "Lotus Business API",
      "url": "https://lotus-business-server.onrender.com",
      "status": "UP",
      "uptimeRatio": "99.98",
      "responseTime": "245"
    }
  ]
}
```

### Créer un monitor

```http
POST /api/uptimerobot/monitors
Authorization: Bearer {token}
Content-Type: application/json

{
  "friendlyName": "Mon Service",
  "url": "https://example.com",
  "interval": 300
}
```

### Mettre à jour un monitor

```http
PATCH /api/uptimerobot/monitors/:monitorId
Authorization: Bearer {token}
Content-Type: application/json

{
  "status": 0  // 0 = pause, 1 = resume
}
```

### Supprimer un monitor

```http
DELETE /api/uptimerobot/monitors/:monitorId
Authorization: Bearer {token}
```

### Récupérer les infos du compte

```http
GET /api/uptimerobot/account
Authorization: Bearer {token}
```

### Configuration rapide

```http
POST /api/uptimerobot/quick-setup
Authorization: Bearer {token}
Content-Type: application/json

{
  "serverUrl": "https://lotus-business-server.onrender.com",
  "dashboardUrl": "https://ton-dashboard.netlify.app"
}
```

---

## Tests et Debugging

### Test de la clé API

```bash
npm run test:uptimerobot
```

Ce test vérifie :
- ✅ Présence de la clé API
- ✅ Validité de la clé
- ✅ Informations du compte
- ✅ Liste des monitors
- ✅ Contacts d'alerte

### Test manuel avec curl

```bash
curl -X POST https://api.uptimerobot.com/v2/getAccountDetails \
  -H "Content-Type: application/json" \
  -d '{"api_key": "TA_CLÉ_API", "format": "json"}'
```

### Logs du serveur

Le serveur affiche des logs détaillés :

```
🔧 ImageKit Configuration: { hasPublicKey: true, ... }
✅ ImageKit client initialized
🚀 Serveur Lotus Business démarré sur le port 5000
```

---

## Problèmes Courants

### "Configuration requise" affiché dans le dashboard

**Cause** : La clé API n'est pas configurée

**Solution** :
1. Vérifie que `UPTIMEROBOT_API_KEY` est dans `.env`
2. Redémarre le serveur : `npm run dev`
3. Actualise le dashboard

### "Invalid API Key"

**Cause** : Clé API incorrecte ou expirée

**Solution** :
1. Va sur https://uptimerobot.com
2. Vérifie ta clé dans My Settings → API Settings
3. Copie la **Main API Key** (pas Monitor-Specific)
4. Mets à jour `.env` et redémarre

### Les monitors ne s'affichent pas

**Cause** : Aucun monitor créé ou erreur de connexion

**Solution** :
1. Lance `npm run test:uptimerobot` pour vérifier la connexion
2. Si le test passe mais aucun monitor : utilise "Config Rapide"
3. Vérifie ta connexion internet

### Erreur 401 Unauthorized

**Cause** : Token admin expiré ou invalide

**Solution** :
1. Déconnecte-toi du dashboard
2. Reconnecte-toi
3. Réessaie

### Le serveur Render s'endort quand même

**Cause** : Monitor en pause ou intervalle trop long

**Solution** :
1. Vérifie que le monitor est actif (status UP)
2. Utilise un intervalle de 5 minutes maximum
3. Vérifie sur UptimeRobot.com que les checks fonctionnent

---

## Architecture Technique

```
Dashboard (React)
    ↓
API /api/uptimerobot/* (Express)
    ↓
uptimeRobotService.js
    ↓
UptimeRobot API v2
    ↓
Monitors Lotus Business
```

### Fichiers créés

**Backend** :
- `src/services/uptimeRobotService.js` - Service principal
- `src/controllers/uptimeRobotController.js` - Contrôleurs API
- `src/routes/uptimeRobot.js` - Routes Express
- `test-uptimerobot.js` - Script de test

**Frontend** :
- `src/pages/UptimeRobot.jsx` - Interface admin
- Styles modals dans `index.css`

**Documentation** :
- `UPTIMEROBOT_SETUP.md` - Guide général
- `UPTIMEROBOT_API_KEY.md` - Obtenir la clé API
- `UPTIMEROBOT_COMPLETE_GUIDE.md` - Ce fichier

---

## Limites du Plan Gratuit

- ⏱️ Checks toutes les **5 minutes** minimum
- 📊 **50 monitors** maximum
- 📧 Alertes par **email** uniquement (SMS = PRO)
- 📅 **2 mois** d'historique
- ✅ **Illimité** pour : checks, alertes emails, status pages

💡 **C'est largement suffisant pour Lotus Business !**

---

## Avantages pour Render

Sur Render gratuit, ton serveur s'endort après 15 minutes d'inactivité.

Avec UptimeRobot qui ping toutes les 5 minutes :
- ✅ Serveur toujours actif
- ✅ Réponse instantanée pour les utilisateurs
- ✅ Pas de délai de "réveil" de 30-60 secondes
- ✅ Meilleure expérience utilisateur
- ✅ Monitoring inclus (détection de pannes)

---

## 🎉 Conclusion

Tu as maintenant un système de monitoring professionnel intégré directement dans ton dashboard admin !

**Prochaines étapes** :
1. Configure ta clé API UptimeRobot
2. Lance "Configuration Rapide"
3. Profite de ton serveur toujours actif 24/7

**Questions ?**
Consulte la documentation UptimeRobot : https://uptimerobot.com/api/
