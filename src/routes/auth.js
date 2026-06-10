// c:\Mes Travaux\Lotus Business\server\src\routes\auth.js

const express = require('express');
const { register, login, logout, forgotKey } = require('../controllers/authController');
const auth = require('../middlewares/auth');

const router = express.Router();

// Routes publiques
router.post('/register', register);
router.post('/login', login);
router.post('/forgot-key', forgotKey);

// Route protégée
router.post('/logout', auth, logout);

module.exports = router;
