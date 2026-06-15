// c:\Mes Travaux\Lotus Business\server\src\routes\notifications.js

const express = require('express');
const {
  getAllNotifications,
  markAsRead,
  markAllAsRead,
  getUnreadCount,
  deleteNotification,
} = require('../controllers/notificationController');
const auth = require('../middlewares/auth');
const isAdmin = require('../middlewares/isAdmin');

const router = express.Router();

// Toutes les routes sont protégées
router.use(auth);
router.use(isAdmin);

router.get('/', getAllNotifications);
router.get('/unread-count', getUnreadCount);
router.patch('/:notificationId/read', markAsRead);
router.patch('/mark-all-read', markAllAsRead);
router.delete('/:notificationId', deleteNotification);

module.exports = router;
