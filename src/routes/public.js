const express = require('express');
const router = express.Router();
const infoController = require('../controllers/infoController');
const { addReaction, getReactionsByInfo, getReactionStats } = require('../controllers/reactionController');
const { getPublicProducts, getPublicShop } = require('../controllers/marketingController');

// Routes publiques pour les infos (pas d'authentification requise)
router.get('/infos', infoController.getAllInfos);

// Routes publiques pour les réactions
router.post('/infos/:infoId/reactions', addReaction);
router.get('/infos/:infoId/reactions', getReactionsByInfo);
router.get('/infos/:infoId/reactions/stats', getReactionStats);

// Routes publiques marketing (app mobile)
router.get('/marketing/products', getPublicProducts);
router.get('/marketing/shops/:shopId', getPublicShop);

module.exports = router;
