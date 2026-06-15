// c:\Mes Travaux\Lotus Business\server\src\routes\admin.js

const express = require('express');
const { 
  loginAdmin,
  getAllUsers, 
  getAllAdmins,
  upgradeToPremium, 
  suspendUser,
  reactivateLicense,
  forceLogout,
  createAdmin,
  testEmail,
  sendManualEmail,
  sendUserLicenseEmail,
  mailStatus,
  getPublishedInfos,
  getAllInfos,
  createInfo,
  updateInfo,
  deleteInfo,
  getProfile,
  changePassword,
} = require('../controllers/adminController');
const auth = require('../middlewares/auth');
const isAdmin = require('../middlewares/isAdmin');

const router = express.Router();

// Login admin (public)
router.post('/login', loginAdmin);

// Créer un admin (public pour le premier admin, à sécuriser ensuite)
router.post('/create', createAdmin);

// Infos publiques consommables par l'application mobile
router.get('/infos/public', getPublishedInfos);

// Debug route (non authentifiée) : disponible uniquement si DEBUG_ADMIN=1
router.get('/mail-status-debug', (req, res) => {
  if (process.env.DEBUG_ADMIN === '1' || process.env.DEBUG_ADMIN === 'true') {
    // lazy require to avoid circular issues
    const { mailStatus } = require('../controllers/adminController');
    return mailStatus(req, res);
  }
  return res.status(404).json({ error: 'Not found' });
});

// Debug send email (public only when DEBUG_ADMIN=1)
router.post('/send-email-debug', (req, res) => {
  if (process.env.DEBUG_ADMIN === '1' || process.env.DEBUG_ADMIN === 'true') {
    const { sendManualEmailDebug } = require('../controllers/adminController');
    return sendManualEmailDebug(req, res);
  }
  return res.status(404).json({ error: 'Not found' });
});

// Routes protégées admin
// NOTE: debug routes that are public only when DEBUG_ADMIN=1 are defined above auth in this file.
router.use(auth);
router.use(isAdmin);

// Profil et paramètres
router.get('/profile', getProfile);
router.post('/change-password', changePassword);

// Gestion users
router.get('/users', getAllUsers);
router.post('/upgrade-premium', upgradeToPremium);
router.patch('/suspend/:userId', suspendUser);
router.post('/reactivate-license', reactivateLicense);
router.post('/force-logout/:userId', forceLogout);

// Gestion admins
router.get('/admins', getAllAdmins);

// Emails
router.get('/mail-status', mailStatus);
router.post('/test-email', testEmail);
router.post('/send-email', sendManualEmail);
router.post('/send-license-email', sendUserLicenseEmail);

// Infos publiques
router.get('/infos', getAllInfos);
router.post('/infos', createInfo);
router.patch('/infos/:infoId', updateInfo);
router.delete('/infos/:infoId', deleteInfo);

module.exports = router;
