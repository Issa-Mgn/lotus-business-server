# 🤖 UptimeRobot - Guide Simple (5 minutes)

## Objectif
Empêcher ton serveur Render de s'endormir après 15 minutes d'inactivité.

---

## Étapes

### 1. Créer un compte (gratuit)
- Va sur **https://uptimerobot.com**
- Clique sur **"Sign Up Free"**
- Inscris-toi avec ton email
- Vérifie ton email et active ton compte

### 2. Ajouter un monitor
1. **Connecte-toi** à UptimeRobot
2. Clique sur **"+ Add New Monitor"** (gros bouton vert)
3. Remplis le formulaire :

```
Monitor Type: HTTP(s)
Friendly Name: Lotus Business API
URL (or IP): https://lotus-business-server.onrender.com/api/health
Monitoring Interval: 5 minutes
```

> ⚠️ Remplace `lotus-business-server.onrender.com` par ton URL Render réelle
> 💡 Utilise `/api/health` ou `/health` - route dédiée au monitoring

4. Clique sur **"Create Monitor"**

### 3. C'est terminé ! ✅

UptimeRobot va maintenant :
- ✅ Ping ton serveur toutes les 5 minutes
- ✅ Empêcher Render de le mettre en veille
- ✅ T'envoyer un email si le serveur tombe
- ✅ Afficher les statistiques de disponibilité

---

## Vérification

Sur le dashboard UptimeRobot, tu devrais voir :

```
┌─────────────────────────────────┐
│ Lotus Business API              │
│ Status: UP ✅                   │
│ Uptime: 100%                    │
│ Response Time: ~200ms           │
└─────────────────────────────────┘
```

---

## Bonus : Dashboard (optionnel)

Si tu veux aussi monitorer ton dashboard Netlify :

1. Clique sur **"+ Add New Monitor"**
2. Configure :

```
Monitor Type: HTTP(s)
Friendly Name: Lotus Business Dashboard
URL: https://ton-dashboard.netlify.app
Monitoring Interval: 5 minutes
```

---

## Limitations du plan gratuit

- ⏱️ Checks toutes les **5 minutes** (suffisant !)
- 📊 **50 monitors** maximum
- 📧 Alertes par **email** uniquement
- 📅 **2 mois** d'historique

💡 **C'est gratuit à vie et parfait pour ton besoin !**

---

## Résultat

Avant UptimeRobot :
- ❌ Serveur s'endort après 15 min
- ❌ Première requête = 30-60 secondes d'attente
- ❌ Mauvaise expérience utilisateur

Après UptimeRobot :
- ✅ Serveur toujours actif
- ✅ Réponse instantanée
- ✅ Monitoring inclus

---

## C'est tout ! 🎉

Pas de code, pas de configuration complexe. Juste un service externe qui ping ton API toutes les 5 minutes.
