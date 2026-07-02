

const express = require('express');
const { register, login, logout, forgotKey } = require('../controllers/authController');
const auth = require('../middlewares/auth');
const { authLimiter, adminLoginLimiter, forgotKeyLimiter } = require('../middlewares/rateLimiter');
const { validate, registerSchema, loginSchema, forgotKeySchema } = require('../validators/authValidators');
const infoController = require('../controllers/infoController');
const notificationController = require('../controllers/notificationController');

const router = express.Router();

// Routes publiques avec rate limiting et validation
router.post('/register', authLimiter, validate(registerSchema), register);
router.post('/login', authLimiter, validate(loginSchema), login);
router.post('/forgot-key', forgotKeyLimiter, validate(forgotKeySchema), forgotKey);

// Route protégée
router.post('/logout', auth, logout);

// Routes Notifications pour utilisateurs connectés
router.get('/notifications', auth, notificationController.getUserNotifications);
router.get('/notifications/unread-count', auth, notificationController.getUserUnreadCount);
router.patch('/notifications/:notificationId/read', auth, notificationController.markAsRead);
router.patch('/notifications/mark-all-read', auth, notificationController.markAllAsRead);

module.exports = router;
