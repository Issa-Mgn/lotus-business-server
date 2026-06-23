const express = require('express');
const {
  trackDownload,
  getDownloadCount,
  getDownloadStats,
} = require('../controllers/downloadController');
const auth = require('../middlewares/auth');
const isAdmin = require('../middlewares/isAdmin');

const router = express.Router();

// Route publique pour enregistrer un téléchargement
router.post('/track', trackDownload);

// Routes protégées pour les admins
router.get('/count', auth, isAdmin, getDownloadCount);
router.get('/stats', auth, isAdmin, getDownloadStats);

module.exports = router;
