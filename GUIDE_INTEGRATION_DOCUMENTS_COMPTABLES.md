# Guide d'Intégration - Documents Comptables

## 📊 Comment fonctionne la génération de documents comptables

### Architecture Actuelle

```
Frontend (Dashboard)
    ↓
    POST /api/documents/compte-resultat
    Body: { periode, dateDebut, dateFin, chiffreAffaires, coutAchat, chargesDiverses }
    ↓
Backend (documentController.js)
    ↓
    Vérifie que l'utilisateur est PREMIUM
    ↓
    Récupère les données (TODO: depuis la DB ou body)
    ↓
    Appelle aiService.js
    ↓
    IA (Mistral ou Groq) génère le document JSON
    ↓
    Retourne le document au frontend
```

---

## 🎯 Réponse à Votre Question

**OUI, le frontend peut envoyer les données de l'utilisateur !**

### Deux approches possibles :

#### **Approche 1 : Frontend envoie les données (RECOMMANDÉ)**

Le frontend envoie directement les données financières de l'utilisateur :

```javascript
// Exemple d'appel depuis le frontend
const response = await fetch('/api/documents/compte-resultat', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    periode: 'Juin 2026',
    dateDebut: '2026-06-01',
    dateFin: '2026-06-30',
    chiffreAffaires: 1500000,  // Données de l'utilisateur
    coutAchat: 800000,         // Données de l'utilisateur
    chargesDiverses: 250000    // Données de l'utilisateur
  })
});
```

#### **Approche 2 : Backend récupère les données depuis la DB**

Le backend récupère automatiquement les données depuis les tables de ventes/achats :

```javascript
// Dans documentController.js (futur)
const ventes = await prisma.vente.aggregate({
  where: { userId, date: { gte: dateDebut, lte: dateFin } },
  _sum: { montant: true }
});

const achats = await prisma.achat.aggregate({
  where: { userId, date: { gte: dateDebut, lte: dateFin } },
  _sum: { montant: true }
});
```

---

## 📝 Format des Données Attendues

### **1. Compte de Résultat**

```json
{
  "periode": "Juin 2026",
  "dateDebut": "2026-06-01",
  "dateFin": "2026-06-30",
  "chiffreAffaires": 1500000,
  "coutAchat": 800000,
  "chargesDiverses": 250000
}
```

**Champs obligatoires** :
- `chiffreAffaires` : Total des ventes (nombre)
- `coutAchat` : Coût d'achat des marchandises (nombre)
- `chargesDiverses` : Autres charges (transport, location, salaires, etc.) (nombre)

**Champs optionnels** :
- `periode` : String descriptive (ex: "Juin 2026")
- `dateDebut` : Date de début (pour historique)
- `dateFin` : Date de fin (pour historique)
- `devise` : Devise (défaut: "FCFA")

---

### **2. Bilan Simplifié**

```json
{
  "periode": "Juin 2026",
  "dateDebut": "2026-06-01",
  "dateFin": "2026-06-30",
  "stockFinal": 500000,
  "tresorerie": 300000
}
```

**Champs obligatoires** :
- `stockFinal` : Valeur du stock actuel (nombre)
- `tresorerie` : Solde bancaire + caisse (nombre)

**Champs optionnels** :
- `periode`, `dateDebut`, `dateFin`, `devise`

---

### **3. Fiche de Stock**

```json
{
  "produitNom": "Riz",
  "periode": "Juin 2026",
  "dateDebut": "2026-06-01",
  "dateFin": "2026-06-30",
  "stockInitial": 100,
  "entrees": 200,
  "sorties": 150
}
```

**Champs obligatoires** :
- `produitNom` : Nom du produit (string)
- `stockInitial` : Stock au début de période (nombre)
- `entrees` : Quantité entrée (nombre)
- `sorties` : Quantité sortie (nombre)

**Champs optionnels** :
- `periode`, `dateDebut`, `dateFin`

---

## 🎨 Exemple d'Intégration Frontend

### **Composant React pour Compte de Résultat**

```jsx
import { useState } from 'react';
import { documentsAPI } from '../services/api';

const CompteResultatForm = () => {
  const [formData, setFormData] = useState({
    periode: '',
    dateDebut: '',
    dateFin: '',
    chiffreAffaires: '',
    coutAchat: '',
    chargesDiverses: ''
  });
  
  const [resultat, setResultat] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      const response = await documentsAPI.generateCompteResultat({
        ...formData,
        chiffreAffaires: parseFloat(formData.chiffreAffaires),
        coutAchat: parseFloat(formData.coutAchat),
        chargesDiverses: parseFloat(formData.chargesDiverses)
      });
      
      setResultat(response.document);
    } catch (error) {
      console.error('Erreur:', error);
      alert(error.response?.data?.error || 'Erreur lors de la génération');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="document-form">
      <h2>Générer un Compte de Résultat</h2>
      
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label>Période</label>
          <input
            type="text"
            value={formData.periode}
            onChange={(e) => setFormData({...formData, periode: e.target.value})}
            placeholder="Ex: Juin 2026"
            required
          />
        </div>

        <div className="form-group">
          <label>Chiffre d'Affaires (FCFA)</label>
          <input
            type="number"
            value={formData.chiffreAffaires}
            onChange={(e) => setFormData({...formData, chiffreAffaires: e.target.value})}
            placeholder="Ex: 1500000"
            required
          />
        </div>

        <div className="form-group">
          <label>Coût d'Achat (FCFA)</label>
          <input
            type="number"
            value={formData.coutAchat}
            onChange={(e) => setFormData({...formData, coutAchat: e.target.value})}
            placeholder="Ex: 800000"
            required
          />
        </div>

        <div className="form-group">
          <label>Charges Diverses (FCFA)</label>
          <input
            type="number"
            value={formData.chargesDiverses}
            onChange={(e) => setFormData({...formData, chargesDiverses: e.target.value})}
            placeholder="Ex: 250000"
            required
          />
        </div>

        <button type="submit" disabled={loading}>
          {loading ? 'Génération en cours...' : 'Générer le document'}
        </button>
      </form>

      {resultat && (
        <div className="resultat">
          <h3>Résultat :</h3>
          <pre>{JSON.stringify(resultat, null, 2)}</pre>
        </div>
      )}
    </div>
  );
};

export default CompteResultatForm;
```

---

## 🔄 Récupération Automatique des Données (Futur)

### **Option A : Depuis les ventes et achats**

Si vous avez des tables `Vente` et `Achat` dans Prisma :

```javascript
// Dans documentController.js
const generateCompteResultat = async (req, res) => {
  const userId = req.userId;
  const { dateDebut, dateFin } = req.body;

  // Récupérer automatiquement les ventes
  const ventes = await prisma.vente.aggregate({
    where: {
      userId,
      date: {
        gte: new Date(dateDebut),
        lte: new Date(dateFin)
      }
    },
    _sum: {
      montantTotal: true
    }
  });

  // Récupérer automatiquement les achats
  const achats = await prisma.achat.aggregate({
    where: {
      userId,
      date: {
        gte: new Date(dateDebut),
        lte: new Date(dateFin)
      }
    },
    _sum: {
      montantTotal: true
    }
  });

  const chiffreAffaires = ventes._sum.montantTotal || 0;
  const coutAchat = achats._sum.montantTotal || 0;

  // Générer le document avec les vraies données
  const result = await aiService.generateCompteResultat({
    chiffreAffaires,
    coutAchat,
    chargesDiverses: 0, // À calculer selon vos besoins
    periode: `${dateDebut} - ${dateFin}`
  });

  res.json(result);
};
```

### **Option B : Depuis un formulaire de saisie**

L'utilisateur remplit un formulaire avec ses données financières :

```javascript
// Frontend
const handleSubmit = async () => {
  // L'utilisateur saisit ses données
  const donnees = {
    chiffreAffaires: totalVentes,      // Calculé depuis le frontend
    coutAchat: totalAchats,            // Calculé depuis le frontend
    chargesDiverses: totalCharges      // Calculé depuis le frontend
  };

  // Envoi au backend
  await documentsAPI.generateCompteResultat(donnees);
};
```

---

## ✅ Ce qui est déjà fonctionnel

1. ✅ **Backend** : Routes API créées (`/api/documents/*`)
2. ✅ **IA** : Mistral + Groq fonctionnels
3. ✅ **Frontend** : API endpoints ajoutés dans `api.js`
4. ✅ **Premium** : Vérification licence PREMIUM
5. ✅ **Format** : JSON structuré retourné

## ⚠️ Ce qui reste à faire

1. ⚠️ **Backend** : Récupérer les vraies données depuis la DB (actuellement données de démo)
2. ⚠️ **Frontend** : Créer les formulaires de saisie
3. ⚠️ **Frontend** : Afficher les résultats de manière élégante
4. ⚠️ **DB** : Créer les tables `Vente`, `Achat`, `Charge` si nécessaire

---

## 🧪 Test avec Postman

```http
POST {{base_url}}/api/documents/compte-resultat
Authorization: Bearer {{user_token}}
Content-Type: application/json

{
  "periode": "Juin 2026",
  "dateDebut": "2026-06-01",
  "dateFin": "2026-06-30",
  "chiffreAffaires": 1500000,
  "coutAchat": 800000,
  "chargesDiverses": 250000
}
```

**Réponse** :
```json
{
  "message": "Compte de résultat généré avec succès",
  "provider": "mistral",
  "document": {
    "titre": "Compte de Résultat Simplifié",
    "periode": "Juin 2026",
    "produits": {
      "chiffreAffaires": 1500000
    },
    "charges": {
      "coutAchat": 800000,
      "chargesDiverses": 250000,
      "total": 1050000
    },
    "resultats": {
      "margeCommerciale": 700000,
      "resultatExploitation": 450000,
      "resultatNet": 450000
    }
  }
}
```

---

## 🎯 Conclusion

**OUI, c'est possible !** Le frontend peut envoyer les données utilisateur en format JSON et l'IA génère les documents comptables en fonction de ces données.

**Pour l'instant** : Données de démonstration (hardcodées)
**Après intégration** : Données réelles depuis la DB ou saisies par l'utilisateur