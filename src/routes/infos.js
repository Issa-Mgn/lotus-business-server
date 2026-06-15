const express = require('express');
const router = express.Router();
const {
  getAllInfos,
  createInfo,
  updateInfo,
  deleteInfo,
  getImageKitAuth,
} = require('../controllers/infoController');
const authenticateAdmin = require('../middleware/auth');

// Routes publiques (pas d'auth)
router.get('/', getAllInfos);

// Routes protégées (admin seulement)
router.post('/', authenticateAdmin, createInfo);
router.patch('/:infoId', authenticateAdmin, updateInfo);
router.delete('/:infoId', authenticateAdmin, deleteInfo);

// Route pour obtenir auth ImageKit (admin seulement)
router.get('/imagekit-auth', authenticateAdmin, getImageKitAuth);

module.exports = router;
