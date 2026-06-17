# 🔑 Guide : Obtenir les clés API Mistral et Groq (GRATUIT)

## 📋 Résumé

Lotus Business utilise **2 services IA gratuits** pour générer les documents comptables :
1. **Mistral AI** (prioritaire) - Français natif, excellent en comptabilité
2. **Groq** (fallback) - Ultra rapide, fiable

Le système bascule automatiquement vers Groq si Mistral est lent ou indisponible.

---

## 🎯 Étape 1 : Obtenir la clé Mistral AI (2 minutes)

### 1. Créer un compte

1. Va sur : **https://console.mistral.ai/**
2. Clique sur **"Sign Up"**
3. Inscris-toi avec ton email (ou Google/GitHub)
4. Confirme ton email

### 2. Générer la clé API

1. Une fois connecté, va dans **"API Keys"** (menu à gauche)
2. Clique sur **"Create new key"**
3. Donne un nom : `Lotus Business`
4. Clique sur **"Create"**
5. **COPIE LA CLÉ** (elle ne s'affichera qu'une fois !)

### 3. Ajouter dans `.env`

```env
MISTRAL_API_KEY=ta_cle_mistral_ici
```

### ✅ Limites gratuites Mistral

- **3 millions de tokens/mois** gratuits
- Largement suffisant pour démarrer !
- Pas de carte bancaire requise

---

## ⚡ Étape 2 : Obtenir la clé Groq (2 minutes)

### 1. Créer un compte

1. Va sur : **https://console.groq.com/**
2. Clique sur **"Sign Up"**
3. Inscris-toi avec ton email (ou Google/GitHub)

### 2. Générer la clé API

1. Une fois connecté, va dans **"API Keys"**
2. Clique sur **"Create API Key"**
3. Donne un nom : `Lotus Business`
4. **COPIE LA CLÉ** immédiatement !

### 3. Ajouter dans `.env`

```env
GROQ_API_KEY=ta_cle_groq_ici
```

### ✅ Limites gratuites Groq

- **30 requêtes/minute**
- **14 400 requêtes/jour**
- 100% gratuit, pas de carte bancaire

---

## 🔧 Étape 3 : Configurer le fichier `.env`

Ton fichier `.env` doit contenir :

```env
# ... autres variables ...

# IA pour génération documents comptables
MISTRAL_API_KEY=ta_cle_mistral_ici
GROQ_API_KEY=ta_cle_groq_ici
```

---

## 🧪 Étape 4 : Tester les services IA

```bash
npm run test:ai
```

Ce script va :
1. ✅ Vérifier la disponibilité de Mistral AI
2. ✅ Vérifier la disponibilité de Groq
3. ✅ Générer un compte de résultat de test
4. ✅ Générer un bilan simplifié de test
5. ✅ Générer une fiche de stock de test

**Résultat attendu :**
```
✅ TOUS LES TESTS RÉUSSIS !
📋 Résumé:
   ✅ Compte de résultat généré via mistral
   ✅ Bilan simplifié généré via mistral
   ✅ Fiche de stock générée via mistral
🚀 Le système de fallback fonctionne correctement !
```

---

## 📊 Comment ça fonctionne ?

### Système de fallback automatique

```
Requête de génération
         ↓
    Mistral AI (prioritaire)
         ↓
   Succès ? → ✅ Retourne le document
         ↓
   Échec/Lent ? → Bascule vers Groq
         ↓
       Groq (fallback)
         ↓
   Succès ? → ✅ Retourne le document
         ↓
   Échec ? → ❌ Erreur affichée
```

### Avantages

- ✅ **Résilience** : Si un service tombe, l'autre prend le relais
- ✅ **Performance** : Groq est ultra rapide en backup
- ✅ **Gratuit** : Les deux services sont gratuits
- ✅ **Qualité** : Mistral excelle en français et comptabilité

---

## 🔌 API Endpoints disponibles

### 1. Générer un compte de résultat

```http
POST /api/documents/compte-resultat
Authorization: Bearer {user_token}
Content-Type: application/json

{
  "periode": "Janvier 2026",
  "dateDebut": "2026-01-01",
  "dateFin": "2026-01-31"
}
```

**Réponse :**
```json
{
  "message": "Compte de résultat généré avec succès",
  "provider": "mistral",
  "document": {
    "titre": "Compte de Résultat Simplifié",
    "periode": "Janvier 2026",
    "produits": { ... },
    "charges": { ... },
    "resultats": { ... }
  }
}
```

### 2. Générer un bilan simplifié

```http
POST /api/documents/bilan
Authorization: Bearer {user_token}

{
  "periode": "Janvier 2026"
}
```

### 3. Générer une fiche de stock

```http
POST /api/documents/fiche-stock
Authorization: Bearer {user_token}

{
  "produitNom": "Savon Parfumé 100g",
  "periode": "Janvier 2026"
}
```

### 4. Tester les services IA

```http
GET /api/documents/test-ai
Authorization: Bearer {user_token}
```

---

## 🚨 Dépannage

### Erreur : "Mistral API key manquante"

**Solution :**
1. Vérifie que `MISTRAL_API_KEY` est bien dans `.env`
2. Relance le serveur : `npm run dev`

### Erreur : "Tous les services IA sont indisponibles"

**Solutions possibles :**
1. Vérifie ta connexion Internet
2. Vérifie que les deux clés API sont correctes
3. Teste avec `npm run test:ai`

### Mistral est lent

**Pas de problème !** Le système basculera automatiquement vers Groq qui est ultra rapide.

---

## 💰 Coûts estimés (tous gratuits !)

Pour **100 utilisateurs Premium** générant **3 documents/mois** :

- 300 générations/mois
- **Mistral** : Gratuit (largement dans les limites)
- **Groq** : Gratuit (largement dans les limites)
- **Coût total : 0 FCFA** ✅

---

## 🎯 Prochaines étapes

1. ✅ Obtenir les clés API Mistral et Groq
2. ✅ Ajouter dans `.env`
3. ✅ Tester avec `npm run test:ai`
4. ✅ Intégrer dans le dashboard commerçant
5. ✅ Déployer sur Render

---

## 📞 Support

Si tu rencontres des problèmes :
1. Vérifie que les clés API sont valides
2. Teste avec `npm run test:ai`
3. Consulte les logs du serveur
4. Vérifie la documentation des APIs :
   - Mistral: https://docs.mistral.ai/
   - Groq: https://console.groq.com/docs/

---

## 🎉 C'est prêt !

Ton système de génération de documents comptables avec IA est maintenant configuré et prêt à l'emploi ! 🚀
