

require('dotenv').config();
const express = require('express');
const cors = require('cors');

// Import des routes
const authRoutes = require('./routes/auth');
const adminRoutes = require('./routes/admin');
const activityRoutes = require('./routes/activity');
const notificationRoutes = require('./routes/notifications');
const documentRoutes = require('./routes/documents');
const downloadRoutes = require('./routes/downloads');
const legalRoutes = require('./routes/legal');
const publicRoutes = require('./routes/public');
const { checkExpiredLicenses } = require('./lib/checkExpiredLicenses');

// Initialisation de l'app
const app = express();
const PORT = process.env.PORT || 5000;

// Middlewares globaux
app.use(cors());
// Augmenter la limite de taille pour accepter les images base64 (10MB)
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

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

// Route health check pour UptimeRobot
app.get('/health', (req, res) => {
  res.status(200).json({ 
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

app.get('/api/health', (req, res) => {
  res.status(200).json({ 
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// Routes
app.use('/api/public', publicRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/activity', activityRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/documents', documentRoutes);
app.use('/api/downloads', downloadRoutes);
// Routes légales (CGU / Privacy)
app.use('/', legalRoutes);

// Servir fichiers statiques à la racine (permet l'accès à terms-of-service.html et privacy-policy.html)
app.use(express.static(process.cwd()));

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
