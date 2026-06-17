/**
 * Routes pour la génération de documents comptables (Premium uniquement)
 */

const express = require('express');
const router = express.Router();
const auth = require('../middlewares/auth');
const {
  generateCompteResultat,
  generateBilan,
  generateFicheStock,
  testAI
} = require('../controllers/documentController');

// Toutes les routes nécessitent l'authentification utilisateur
router.use(auth);

// Génération de documents comptables (Premium uniquement)
router.post('/compte-resultat', generateCompteResultat);
router.post('/bilan', generateBilan);
router.post('/fiche-stock', generateFicheStock);

// Test des services IA (tous les users peuvent tester)
router.get('/test-ai', testAI);

module.exports = router;
