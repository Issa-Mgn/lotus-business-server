# 🤖 Configuration UptimeRobot pour Lotus Business

## 📋 Qu'est-ce qu'UptimeRobot ?

UptimeRobot est un service de monitoring gratuit qui :
- ✅ Vérifie que ton serveur est en ligne 24/7
- ✅ Empêche Render de mettre ton serveur en veille (plan gratuit)
- ✅ T'alerte par email si ton serveur tombe
- ✅ Fournit des statistiques de disponibilité
- ✅ **100% GRATUIT** pour jusqu'à 50 monitors

---

## 🚀 Étapes de Configuration

### 1️⃣ Créer un compte UptimeRobot

1. Va sur **https://uptimerobot.com**
2. Clique sur **"Sign Up Free"**
3. Inscris-toi avec ton email (ou connecte-toi avec Google)
4. Vérifie ton email et active ton compte

---

### 2️⃣ Créer un Monitor pour ton serveur

1. **Connecte-toi** à UptimeRobot
2. Clique sur **"+ Add New Monitor"**
3. Configure comme suit :

#### Configuration du Monitor

```
Monitor Type: HTTP(s)
Friendly Name: Lotus Business API
URL (or IP): https://lotus-business-server.onrender.com
Monitoring Interval: 5 minutes (gratuit)
```

> ⚠️ **Important** : Remplace `lotus-business-server.onrender.com` par l'URL réelle de ton serveur Render

#### Options avancées (optionnelles)

```
Alert Contacts: Ton email (ajouté automatiquement)
Monitor Timeout: 30 seconds
HTTP Method: GET
HTTP Auth Type: None
POST Value: (vide)
Custom HTTP Headers: (vide)
```

4. Clique sur **"Create Monitor"**

---

### 3️⃣ Ajouter un Monitor pour le Dashboard (optionnel)

Si ton dashboard est aussi sur Netlify :

1. Clique sur **"+ Add New Monitor"**
2. Configure :

```
Monitor Type: HTTP(s)
Friendly Name: Lotus Business Dashboard
URL: https://ton-dashboard.netlify.app
Monitoring Interval: 5 minutes
```

> ⚠️ Remplace par ton URL Netlify

---

### 4️⃣ Créer une Page de Status Publique (optionnel)

Pour afficher l'état de tes services publiquement :

1. Va dans **"Status Pages"** dans le menu
2. Clique sur **"+ Add Status Page"**
3. Configure :

```
Name: Lotus Business Status
Friendly URL: lotus-business-status (ou ce que tu veux)
Monitors to Show: ✅ Lotus Business API
                  ✅ Lotus Business Dashboard
Custom Domain: (optionnel - tu peux utiliser ton propre domaine)
```

4. Clique sur **"Create Status Page"**
5. Tu auras une URL publique comme : `https://stats.uptimerobot.com/xxxxx`

---

## 📧 Configuration des Alertes Email

Par défaut, tu recevras des emails quand :
- ❌ Le serveur tombe (DOWN)
- ✅ Le serveur revient en ligne (UP)

### Personnaliser les alertes :

1. Va dans **"My Settings"** → **"Alert Contacts"**
2. Ton email est déjà ajouté par défaut
3. Tu peux ajouter d'autres emails ou même :
   - SMS (avec Twilio)
   - Slack
   - Discord
   - Telegram
   - Webhook

---

## 🎯 Avantages pour Render (Plan Gratuit)

Sur Render gratuit, le serveur s'endort après **15 minutes d'inactivité**.

Avec UptimeRobot qui ping toutes les **5 minutes** :
- ✅ Ton serveur reste **toujours actif**
- ✅ Pas de délai de "réveil" pour les utilisateurs
- ✅ Meilleure expérience utilisateur
- ✅ Le serveur répond instantanément

---

## 📊 Tableau de Bord UptimeRobot

Une fois configuré, tu verras :

```
┌─────────────────────────────────────────┐
│ Lotus Business API                      │
│ Status: UP ✅                           │
│ Uptime: 99.98%                          │
│ Response Time: 245ms                    │
│ Last Check: 2 minutes ago               │
└─────────────────────────────────────────┘
```

---

## 🔧 Vérification de la Configuration

### Test 1 : Vérifier que ton serveur répond

```bash
curl https://lotus-business-server.onrender.com
```

Tu devrais recevoir :
```json
{
  "message": "Bienvenue sur l'API Lotus Business",
  "version": "1.0.0",
  "status": "running"
}
```

### Test 2 : Vérifier dans UptimeRobot

1. Va sur ton dashboard UptimeRobot
2. Regarde le statut de ton monitor
3. Il devrait être **UP** (vert) ✅

---

## 📱 Application Mobile UptimeRobot

Tu peux aussi surveiller tes services depuis ton téléphone :

- **iOS** : https://apps.apple.com/app/uptimerobot/id1104878581
- **Android** : https://play.google.com/store/apps/details?id=com.uptimerobot

---

## 🎁 Plan Gratuit vs Pro

### Plan GRATUIT (actuel) ✅
- ✅ 50 monitors
- ✅ Checks toutes les 5 minutes
- ✅ Alertes par email
- ✅ 2 mois d'historique
- ✅ Page de status publique

### Plan PRO (50$/an)
- ⭐ Checks toutes les 1 minute
- ⭐ SMS alerts
- ⭐ 12 mois d'historique
- ⭐ Advanced statistics

> 💡 **Pour débuter, le plan gratuit est amplement suffisant !**

---

## ⚠️ Notes Importantes

### 1. Render peut quand même avoir des limites
Sur le plan gratuit de Render :
- **750 heures/mois** d'activité gratuite
- Si tu dépasses, le service s'arrête
- Avec UptimeRobot actif 24/7 : ~720 heures/mois ✅

### 2. Alternative si tu atteins la limite
Si tu veux économiser les heures Render :
- Configure l'intervalle à **10-15 minutes** au lieu de 5
- Ou désactive UptimeRobot pendant les heures creuses

### 3. Plusieurs services Render ?
Si tu as plusieurs services sur Render (API, workers, etc.), compte bien tes heures car elles s'additionnent.

---

## 🔗 Ressources Utiles

- Site officiel : https://uptimerobot.com
- Documentation : https://uptimerobot.com/api/
- Status page example : https://stats.uptimerobot.com/
- Support : https://uptimerobot.com/contact

---

## ✅ Checklist Finale

- [ ] Compte UptimeRobot créé
- [ ] Monitor créé pour l'API (`https://lotus-business-server.onrender.com`)
- [ ] Monitor créé pour le Dashboard (optionnel)
- [ ] Alertes email configurées
- [ ] Status page créée (optionnel)
- [ ] Application mobile installée (optionnel)
- [ ] Premier check réussi (status UP ✅)

---

## 🎉 Félicitations !

Ton serveur Lotus Business est maintenant :
- ✅ Surveillé 24/7
- ✅ Toujours actif (pas de mise en veille)
- ✅ Alertes automatiques en cas de problème
- ✅ Statistiques de disponibilité

**Ton serveur ne s'endormira plus jamais !** 🚀
