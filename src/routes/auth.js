// c:\Mes Travaux\Lotus Business\server\src\routes\auth.js

const express = require('express');
const { register, login, logout, forgotKey } = require('../controllers/authController');
const auth = require('../middlewares/auth');
const infoController = require('../controllers/infoController');
const notificationController = require('../controllers/notificationController');

const router = express.Router();

// Routes publiques
router.post('/register', register);
router.post('/login', login);
router.post('/forgot-key', forgotKey);

// Route protégée
router.post('/logout', auth, logout);

// Routes Infos pour utilisateurs connectés
router.get('/infos', auth, infoController.getAllInfos);

// Routes Notifications pour utilisateurs connectés
router.get('/notifications', auth, notificationController.getUserNotifications);
router.get('/notifications/unread-count', auth, notificationController.getUserUnreadCount);
router.patch('/notifications/:notificationId/read', auth, notificationController.markAsRead);
router.patch('/notifications/mark-all-read', auth, notificationController.markAllAsRead);

module.exports = router;
