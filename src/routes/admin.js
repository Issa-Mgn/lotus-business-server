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
  deleteInfo
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

// Routes protégées admin
router.use(auth);
router.use(isAdmin);

router.get('/users', getAllUsers);
router.get('/admins', getAllAdmins);
router.get('/mail-status', mailStatus);
router.post('/upgrade-premium', upgradeToPremium);
router.patch('/suspend/:userId', suspendUser);
router.post('/reactivate-license', reactivateLicense);
router.post('/force-logout/:userId', forceLogout);
router.post('/test-email', testEmail);
router.post('/send-email', sendManualEmail);
router.post('/send-license-email', sendUserLicenseEmail);
router.get('/infos', getAllInfos);
router.post('/infos', createInfo);
router.patch('/infos/:infoId', updateInfo);
router.delete('/infos/:infoId', deleteInfo);

module.exports = router;
