# 🔗 Guide d'Intégration Frontend - Lotus Business API

Ce guide explique comment connecter n'importe quel frontend (React, Vue, Angular, etc.) au backend Lotus Business.

---

## 🌐 Base URL

```javascript
const API_BASE_URL = 'http://localhost:5000';
// En production : 'https://votre-api.com'
```

---

## 📦 Configuration CORS

Le backend accepte toutes les origines en développement. Pour la production, le backend devra être configuré pour accepter uniquement votre domaine frontend.

---

## 🔐 Authentification

### 1. Stockage Local du Token

```javascript
// Après login réussi
localStorage.setItem('token', response.token);
localStorage.setItem('user', JSON.stringify(response.user));

// Lecture
const token = localStorage.getItem('token');
const user = JSON.parse(localStorage.getItem('user'));

// Suppression (logout)
localStorage.removeItem('token');
localStorage.removeItem('user');
```

### 2. Fonction Helper pour les Requêtes

```javascript
// api.js
const API_BASE_URL = 'http://localhost:5000';

async function apiRequest(endpoint, options = {}) {
  const token = localStorage.getItem('token');
  
  const config = {
    method: options.method || 'GET',
    headers: {
      'Content-Type': 'application/json',
      ...(token && { 'Authorization': `Bearer ${token}` }),
      ...options.headers,
    },
    ...(options.body && { body: JSON.stringify(options.body) }),
  };

  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, config);
    const data = await response.json();

    if (!response.ok) {
      // Gérer les erreurs spécifiques
      if (response.status === 401) {
        // Token invalide ou expiré
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = '/login';
      }
      throw new Error(data.error || 'Une erreur est survenue');
    }

    return data;
  } catch (error) {
    console.error('API Error:', error);
    throw error;
  }
}

export default apiRequest;
```

---

## 🎫 Fonctions Utilisateur

### Inscription

```javascript
// register.js
import apiRequest from './api';

async function register(email, phone, firstName, lastName) {
  try {
    const response = await apiRequest('/api/auth/register', {
      method: 'POST',
      body: { email, phone, firstName, lastName },
    });

    console.log('Clé de licence:', response.user.licenseKey);
    alert(`Inscription réussie ! Votre clé : ${response.user.licenseKey}`);
    
    if (response.emailSent) {
      alert('Un email vous a été envoyé avec votre clé de licence.');
    }

    return response;
  } catch (error) {
    alert(`Erreur : ${error.message}`);
    throw error;
  }
}

// Exemple d'utilisation
await register(
  'user@example.com',
  '+221771234567',
  'Jean',
  'Dupont'
);
```

### Connexion

```javascript
// login.js
import apiRequest from './api';

async function login(licenseKey) {
  try {
    const response = await apiRequest('/api/auth/login', {
      method: 'POST',
      body: { licenseKey },
    });

    // Sauvegarder le token et les infos user
    localStorage.setItem('token', response.token);
    localStorage.setItem('user', JSON.stringify(response.user));

    console.log('Connexion réussie:', response.user);
    
    // Rediriger vers le dashboard
    window.location.href = '/dashboard';

    return response;
  } catch (error) {
    alert(`Erreur de connexion : ${error.message}`);
    throw error;
  }
}

// Exemple d'utilisation
await login('LOT-1234-abcd-5678');
```

### Déconnexion

```javascript
// logout.js
import apiRequest from './api';

async function logout() {
  try {
    await apiRequest('/api/auth/logout', {
      method: 'POST',
    });

    // Nettoyer le storage local
    localStorage.removeItem('token');
    localStorage.removeItem('user');

    // Rediriger vers la page de connexion
    window.location.href = '/login';
  } catch (error) {
    // Même en cas d'erreur, nettoyer le storage
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = '/login';
  }
}
```

### Récupérer sa clé

```javascript
// forgotKey.js
import apiRequest from './api';

async function forgotKey(email) {
  try {
    const response = await apiRequest('/api/auth/forgot-key', {
      method: 'POST',
      body: { email },
    });

    alert('Un email vous a été envoyé avec votre clé de licence.');
    return response;
  } catch (error) {
    alert(`Erreur : ${error.message}`);
    throw error;
  }
}

// Exemple d'utilisation
await forgotKey('user@example.com');
```

---

## 👨‍💼 Fonctions Admin

### Connexion Admin

```javascript
// adminLogin.js
import apiRequest from './api';

async function adminLogin(email, password) {
  try {
    const response = await apiRequest('/api/admin/login', {
      method: 'POST',
      body: { email, password },
    });

    localStorage.setItem('adminToken', response.token);
    localStorage.setItem('admin', JSON.stringify(response.admin));

    window.location.href = '/admin/dashboard';
    return response;
  } catch (error) {
    alert(`Erreur : ${error.message}`);
    throw error;
  }
}
```

### Liste des Utilisateurs

```javascript
// getUsers.js
import apiRequest from './api';

async function getUsers() {
  try {
    const response = await apiRequest('/api/admin/users', {
      method: 'GET',
    });

    console.log('Utilisateurs:', response.users);
    return response.users;
  } catch (error) {
    console.error('Erreur:', error);
    throw error;
  }
}
```

### Upgrade vers PREMIUM

```javascript
// upgradePremium.js
import apiRequest from './api';

async function upgradePremium(userId) {
  try {
    const response = await apiRequest('/api/admin/upgrade-premium', {
      method: 'POST',
      body: { userId },
    });

    alert('Utilisateur upgradé vers PREMIUM avec succès !');
    return response.user;
  } catch (error) {
    alert(`Erreur : ${error.message}`);
    throw error;
  }
}
```

### Suspendre un Utilisateur

```javascript
// suspendUser.js
import apiRequest from './api';

async function suspendUser(userId) {
  try {
    const response = await apiRequest(`/api/admin/suspend/${userId}`, {
      method: 'PATCH',
    });

    alert('Utilisateur suspendu avec succès !');
    return response.user;
  } catch (error) {
    alert(`Erreur : ${error.message}`);
    throw error;
  }
}
```

### Réactiver une Licence

```javascript
// reactivateLicense.js
import apiRequest from './api';

async function reactivateLicense(userId, licenseType = 'FREE') {
  try {
    const response = await apiRequest('/api/admin/reactivate-license', {
      method: 'POST',
      body: { userId, licenseType },
    });

    alert(`Licence réactivée (${licenseType}) avec succès !`);
    return response.user;
  } catch (error) {
    alert(`Erreur : ${error.message}`);
    throw error;
  }
}
```

### Déconnecter un Utilisateur

```javascript
// forceLogout.js
import apiRequest from './api';

async function forceLogout(userId) {
  try {
    const response = await apiRequest(`/api/admin/force-logout/${userId}`, {
      method: 'POST',
    });

    alert('Utilisateur déconnecté avec succès !');
    return response;
  } catch (error) {
    alert(`Erreur : ${error.message}`);
    throw error;
  }
}
```

---

## 🛡️ Protection des Routes

### Vérifier si l'utilisateur est connecté

```javascript
// auth.guard.js
export function isAuthenticated() {
  const token = localStorage.getItem('token');
  const user = localStorage.getItem('user');
  return !!(token && user);
}

export function requireAuth() {
  if (!isAuthenticated()) {
    window.location.href = '/login';
    return false;
  }
  return true;
}

export function isAdmin() {
  const adminToken = localStorage.getItem('adminToken');
  const admin = localStorage.getItem('admin');
  return !!(adminToken && admin);
}

export function requireAdmin() {
  if (!isAdmin()) {
    window.location.href = '/admin/login';
    return false;
  }
  return true;
}
```

### Vérifier l'expiration de la licence

```javascript
// checkLicense.js
export function isLicenseExpired() {
  const userStr = localStorage.getItem('user');
  if (!userStr) return true;

  const user = JSON.parse(userStr);
  const expirationDate = new Date(user.expirationDate);
  const now = new Date();

  return expirationDate < now;
}

export function checkLicenseStatus() {
  const userStr = localStorage.getItem('user');
  if (!userStr) {
    window.location.href = '/login';
    return false;
  }

  const user = JSON.parse(userStr);

  if (user.licenseStatus === 'EXPIRED') {
    alert('Votre licence a expiré. Veuillez renouveler.');
    window.location.href = '/upgrade';
    return false;
  }

  if (user.licenseStatus === 'SUSPENDED') {
    alert('Votre compte a été suspendu.');
    localStorage.clear();
    window.location.href = '/login';
    return false;
  }

  if (isLicenseExpired()) {
    alert('Votre licence a expiré. Veuillez renouveler.');
    window.location.href = '/upgrade';
    return false;
  }

  return true;
}
```

---

## 🎨 Exemples de Composants

### React - Formulaire d'Inscription

```jsx
// RegisterForm.jsx
import React, { useState } from 'react';
import apiRequest from './api';

function RegisterForm() {
  const [formData, setFormData] = useState({
    email: '',
    phone: '',
    firstName: '',
    lastName: '',
  });
  const [loading, setLoading] = useState(false);
  const [licenseKey, setLicenseKey] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await apiRequest('/api/auth/register', {
        method: 'POST',
        body: formData,
      });

      setLicenseKey(response.user.licenseKey);
      alert('Inscription réussie ! Vérifiez votre email.');
    } catch (error) {
      alert(`Erreur : ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  if (licenseKey) {
    return (
      <div className="success-message">
        <h2>✅ Inscription réussie !</h2>
        <p>Votre clé de licence :</p>
        <div className="license-key">{licenseKey}</div>
        <p>Un email vous a été envoyé avec votre clé.</p>
        <button onClick={() => window.location.href = '/login'}>
          Se connecter
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit}>
      <input
        type="email"
        placeholder="Email"
        value={formData.email}
        onChange={(e) => setFormData({...formData, email: e.target.value})}
        required
      />
      <input
        type="tel"
        placeholder="Téléphone (+221771234567)"
        value={formData.phone}
        onChange={(e) => setFormData({...formData, phone: e.target.value})}
        required
      />
      <input
        type="text"
        placeholder="Prénom"
        value={formData.firstName}
        onChange={(e) => setFormData({...formData, firstName: e.target.value})}
        required
      />
      <input
        type="text"
        placeholder="Nom"
        value={formData.lastName}
        onChange={(e) => setFormData({...formData, lastName: e.target.value})}
        required
      />
      <button type="submit" disabled={loading}>
        {loading ? 'Inscription...' : "S'inscrire"}
      </button>
    </form>
  );
}

export default RegisterForm;
```

### React - Formulaire de Connexion

```jsx
// LoginForm.jsx
import React, { useState } from 'react';
import apiRequest from './api';

function LoginForm() {
  const [licenseKey, setLicenseKey] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await apiRequest('/api/auth/login', {
        method: 'POST',
        body: { licenseKey },
      });

      localStorage.setItem('token', response.token);
      localStorage.setItem('user', JSON.stringify(response.user));

      window.location.href = '/dashboard';
    } catch (error) {
      alert(`Erreur : ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <input
        type="text"
        placeholder="Clé de licence (LOT-XXXX-xxxx-XXXX)"
        value={licenseKey}
        onChange={(e) => setLicenseKey(e.target.value)}
        required
      />
      <button type="submit" disabled={loading}>
        {loading ? 'Connexion...' : 'Se connecter'}
      </button>
      <a href="/forgot-key">Clé oubliée ?</a>
    </form>
  );
}

export default LoginForm;
```

### React - Dashboard Utilisateur

```jsx
// UserDashboard.jsx
import React, { useEffect, useState } from 'react';
import { requireAuth, checkLicenseStatus } from './auth.guard';

function UserDashboard() {
  const [user, setUser] = useState(null);

  useEffect(() => {
    // Vérifier l'authentification
    if (!requireAuth()) return;
    if (!checkLicenseStatus()) return;

    // Charger les infos user
    const userStr = localStorage.getItem('user');
    setUser(JSON.parse(userStr));
  }, []);

  if (!user) return <div>Chargement...</div>;

  const daysRemaining = Math.ceil(
    (new Date(user.expirationDate) - new Date()) / (1000 * 60 * 60 * 24)
  );

  return (
    <div className="dashboard">
      <h1>Bienvenue {user.firstName} {user.lastName} !</h1>
      
      <div className="license-info">
        <h2>Votre Licence</h2>
        <p>Type : <strong>{user.licenseType}</strong></p>
        <p>Statut : <strong>{user.licenseStatus}</strong></p>
        <p>Clé : <code>{user.licenseKey}</code></p>
        <p>Expire dans : <strong>{daysRemaining} jours</strong></p>
        
        {user.licenseType === 'FREE' && (
          <button onClick={() => window.location.href = '/upgrade'}>
            Passer à PREMIUM
          </button>
        )}
      </div>
      
      <button onClick={logout}>Se déconnecter</button>
    </div>
  );
}

export default UserDashboard;
```

---

## 🎯 Gestion des Erreurs

```javascript
// errorHandler.js

export function handleApiError(error, response) {
  // Erreurs de connexion réseau
  if (!response) {
    return 'Erreur de connexion au serveur. Vérifiez votre connexion internet.';
  }

  // Erreurs spécifiques
  switch (response.status) {
    case 400:
      return error.message || 'Données invalides.';
    case 401:
      localStorage.clear();
      window.location.href = '/login';
      return 'Session expirée. Veuillez vous reconnecter.';
    case 403:
      return error.message || 'Accès refusé.';
    case 404:
      return 'Ressource non trouvée.';
    case 500:
      return 'Erreur serveur. Réessayez plus tard.';
    default:
      return error.message || 'Une erreur inattendue est survenue.';
  }
}
```

---

## 📱 Exemple d'Application Complète (Vue.js)

```vue
<!-- App.vue -->
<template>
  <div id="app">
    <router-view />
  </div>
</template>

<script>
export default {
  name: 'App',
  mounted() {
    // Vérifier le statut de la session au démarrage
    this.checkSession();
  },
  methods: {
    checkSession() {
      const token = localStorage.getItem('token');
      if (token && this.$route.path !== '/dashboard') {
        this.$router.push('/dashboard');
      }
    }
  }
}
</script>
```

---

## 🔄 Rafraîchissement Automatique du Token (optionnel)

Si vous implémentez un système de refresh token :

```javascript
// tokenRefresh.js
let refreshTimer = null;

export function startTokenRefresh() {
  const token = localStorage.getItem('token');
  if (!token) return;

  // Décoder le token pour obtenir l'expiration
  const payload = JSON.parse(atob(token.split('.')[1]));
  const expiresAt = payload.exp * 1000; // Convertir en millisecondes
  const now = Date.now();
  const timeUntilExpiry = expiresAt - now;

  // Rafraîchir 5 minutes avant expiration
  const refreshTime = timeUntilExpiry - (5 * 60 * 1000);

  if (refreshTime > 0) {
    refreshTimer = setTimeout(async () => {
      // Appeler l'endpoint de refresh (à implémenter dans le backend)
      // const newToken = await refreshToken();
      // localStorage.setItem('token', newToken);
      // startTokenRefresh(); // Relancer le timer
    }, refreshTime);
  }
}

export function stopTokenRefresh() {
  if (refreshTimer) {
    clearTimeout(refreshTimer);
    refreshTimer = null;
  }
}
```

---

## ✅ Checklist d'Intégration

- [ ] Configurer `API_BASE_URL`
- [ ] Implémenter la fonction `apiRequest`
- [ ] Créer les formulaires d'inscription et connexion
- [ ] Implémenter la gestion du localStorage
- [ ] Ajouter la protection des routes
- [ ] Implémenter la vérification de licence
- [ ] Gérer la déconnexion
- [ ] Tester tous les cas d'erreur
- [ ] Ajouter le dashboard utilisateur
- [ ] (Optionnel) Créer le panel admin

---

## 📞 Support

Pour toute question sur l'intégration frontend :
- Consulter `README.md` pour les détails de l'API
- Consulter `POSTMAN_TESTS.md` pour les exemples de requêtes
- Tester d'abord avec Postman avant d'intégrer au frontend

---

**Bonne intégration ! 🚀**
