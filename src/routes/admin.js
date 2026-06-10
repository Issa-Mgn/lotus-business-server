// c:\Mes Travaux\Lotus Business\server\src\routes\admin.js

const express = require('express');
const { 
  loginAdmin,
  getAllUsers, 
  upgradeToPremium, 
  suspendUser,
  reactivateLicense,
  forceLogout,
  createAdmin
} = require('../controllers/adminController');
const auth = require('../middlewares/auth');
const isAdmin = require('../middlewares/isAdmin');

const router = express.Router();

// Login admin (public)
router.post('/login', loginAdmin);

// Créer un admin (public pour le premier admin, à sécuriser ensuite)
router.post('/create', createAdmin);

// Routes protégées admin
router.use(auth);
router.use(isAdmin);

router.get('/users', getAllUsers);
router.post('/upgrade-premium', upgradeToPremium);
router.patch('/suspend/:userId', suspendUser);
router.post('/reactivate-license', reactivateLicense);
router.post('/force-logout/:userId', forceLogout);

module.exports = router;
