const express = require('express');
const router  = express.Router();
const paymentController = require('../controllers/paymentController');
const auth    = require('../middlewares/auth');
const isAdmin = require('../middlewares/isAdmin');

/**
 * Routes utilisateur (authentification requise)
 *
 * FLOW KKiaPay:
 *  1. App mobile: ouvre le widget KKiaPay avec KKIAPAY_PUBLIC_KEY
 *  2. Utilisateur paie → KKiaPay retourne un transactionId
 *  3. App appelle POST /api/payments/verify-and-upgrade avec le transactionId
 *  4. Backend vérifie via SDK et fait l'upgrade automatiquement
 */

// Vérifier un paiement et upgrader (principal endpoint pour l'app mobile)
router.post('/verify-and-upgrade', auth, paymentController.verifyAndUpgrade);

// Historique des paiements de l'utilisateur
router.get('/history', auth, paymentController.getPaymentHistory);

/**
 * Webhook KKiaPay (public, avec vérification de signature)
 * KKiaPay appelle automatiquement cette URL après chaque paiement
 */
router.post('/webhook', paymentController.handleWebhook);

/**
 * Routes admin
 */
router.get('/admin/transactions', auth, isAdmin, paymentController.getAllTransactions);
router.get('/admin/all',          auth, isAdmin, paymentController.getAllPayments);
router.post('/admin/grant-backup-access', auth, isAdmin, paymentController.grantBackupAccess);

module.exports = router;
