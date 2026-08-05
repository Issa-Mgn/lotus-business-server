const express = require('express');
const router = express.Router();
const paymentController = require('../controllers/paymentController');
const auth = require('../middlewares/auth');
const isAdmin = require('../middlewares/isAdmin');

/**
 * Routes utilisateur (authentification requise)
 */

// Créer un paiement
router.post('/create', auth, paymentController.createPayment);

// Vérifier le statut d'un paiement
router.get('/verify/:transactionId', auth, paymentController.verifyPayment);

// Historique des paiements de l'utilisateur
router.get('/history', auth, paymentController.getPaymentHistory);

/**
 * Webhook KKiaPay (public, mais avec vérification de signature)
 */
router.post('/webhook', paymentController.handleWebhook);

/**
 * Routes admin (authentification admin requise)
 */

// Récupérer tous les paiements
router.get('/admin/all', auth, isAdmin, paymentController.getAllPayments);

// Récupérer toutes les transactions (auto + manuelles)
router.get('/admin/transactions', auth, isAdmin, paymentController.getAllTransactions);

// Accorder l'accès à un backup manuellement
router.post('/admin/grant-backup-access', auth, isAdmin, paymentController.grantBackupAccess);

module.exports = router;
