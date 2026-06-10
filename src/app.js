// c:\Mes Travaux\Lotus Business\server\src\app.js

require('dotenv').config();
const express = require('express');
const cors = require('cors');

// Import des routes
const authRoutes = require('./routes/auth');
const adminRoutes = require('./routes/admin');
const { checkExpiredLicenses } = require('./lib/checkExpiredLicenses');

// Initialisation de l'app
const app = express();
const PORT = process.env.PORT || 5000;

// Middlewares globaux
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Vérification des licences expirées toutes les heures
setInterval(async () => {
  console.log('🔄 Vérification automatique des licences expirées...');
  await checkExpiredLicenses();
}, 60 * 60 * 1000); // 1 heure

// Vérification au démarrage
checkExpiredLicenses();

// Route de santé
app.get('/', (req, res) => {
  res.json({ 
    message: 'Bienvenue sur l\'API Lotus Business',
    version: '1.0.0',
    status: 'running'
  });
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/admin', adminRoutes);

// Middleware de gestion des routes non trouvées
app.use((req, res) => {
  res.status(404).json({ 
    error: 'Route introuvable' 
  });
});

// Middleware de gestion des erreurs globales
app.use((error, req, res, next) => {
  console.error('Erreur serveur:', error);
  res.status(500).json({ 
    error: 'Erreur interne du serveur' 
  });
});

// Démarrage du serveur
app.listen(PORT, () => {
  console.log(`🚀 Serveur Lotus Business démarré sur le port ${PORT}`);
  console.log(`📍 URL: http://localhost:${PORT}`);
});

module.exports = app;
