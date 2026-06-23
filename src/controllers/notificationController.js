// c:\Mes Travaux\Lotus Business\server\src\controllers\notificationController.js

const prisma = require('../lib/prisma');

/**
 * Créer une notification (fonction helper)
 */
const createNotification = async (type, title, message, userId = null) => {
  try {
    const notification = await prisma.notification.create({
      data: {
        type,
        title,
        message,
        userId,
      },
    });
    return notification;
  } catch (error) {
    console.error('Erreur création notification:', error);
  }
};

/**
 * Créer une notification via API (route POST)
 */
const createNotificationHTTP = async (req, res) => {
  try {
    const { type, title, message, userId } = req.body;

    if (!type || !title || !message) {
      return res.status(400).json({ 
        error: 'Type, titre et message requis' 
      });
    }

    const notification = await prisma.notification.create({
      data: {
        type,
        title,
        message,
        userId: userId || null,
      },
      include: {
        user: userId ? {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
          },
        } : false,
      },
    });

    res.status(201).json({
      message: 'Notification créée avec succès',
      notification,
    });
  } catch (error) {
    console.error('Erreur création notification HTTP:', error);
    res.status(500).json({ error: 'Erreur création notification' });
  }
};

/**
 * Récupérer toutes les notifications
 */
const getAllNotifications = async (req, res) => {
  try {
    const { unreadOnly } = req.query;

    const where = {};
    if (unreadOnly === 'true') {
      where.isRead = false;
    }

    const notifications = await prisma.notification.findMany({
      where,
      include: {
        user: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    res.json({
      count: notifications.length,
      notifications,
    });
  } catch (error) {
    console.error('Erreur get notifications:', error);
    res.status(500).json({ error: 'Erreur récupération notifications' });
  }
};

/**
 * Marquer une notification comme lue
 */
const markAsRead = async (req, res) => {
  try {
    const { notificationId } = req.params;

    const notification = await prisma.notification.update({
      where: { id: notificationId },
      data: { isRead: true },
    });

    res.json({
      message: 'Notification marquée comme lue',
      notification,
    });
  } catch (error) {
    console.error('Erreur mark as read:', error);
    res.status(500).json({ error: 'Erreur marquage notification' });
  }
};

/**
 * Marquer toutes les notifications comme lues
 */
const markAllAsRead = async (req, res) => {
  try {
    await prisma.notification.updateMany({
      where: { isRead: false },
      data: { isRead: true },
    });

    res.json({
      message: 'Toutes les notifications marquées comme lues',
    });
  } catch (error) {
    console.error('Erreur mark all as read:', error);
    res.status(500).json({ error: 'Erreur marquage notifications' });
  }
};

/**
 * Compter les notifications non lues
 */
const getUnreadCount = async (req, res) => {
  try {
    const count = await prisma.notification.count({
      where: { isRead: false },
    });

    res.json({ unreadCount: count });
  } catch (error) {
    console.error('Erreur count unread:', error);
    res.status(500).json({ error: 'Erreur comptage notifications' });
  }
};

/**
 * Supprimer une notification
 */
const deleteNotification = async (req, res) => {
  try {
    const { notificationId } = req.params;

    await prisma.notification.delete({
      where: { id: notificationId },
    });

    res.json({
      message: 'Notification supprimée',
    });
  } catch (error) {
    console.error('Erreur delete notification:', error);
    res.status(500).json({ error: 'Erreur suppression notification' });
  }
};

/**
 * Récupérer les notifications d'un utilisateur spécifique
 */
const getUserNotifications = async (req, res) => {
  try {
    const userId = req.userId; // Depuis le middleware auth
    const { unreadOnly } = req.query;

    const where = {
      OR: [
        { userId: userId },      // Notifications spécifiques à l'utilisateur
        { userId: null },        // Notifications globales
      ],
    };

    if (unreadOnly === 'true') {
      where.isRead = false;
    }

    const notifications = await prisma.notification.findMany({
      where,
      orderBy: {
        createdAt: 'desc',
      },
      select: {
        id: true,
        type: true,
        title: true,
        message: true,
        isRead: true,
        createdAt: true,
        userId: true,
      },
    });

    res.json({
      count: notifications.length,
      notifications,
    });
  } catch (error) {
    console.error('Erreur get user notifications:', error);
    res.status(500).json({ error: 'Erreur récupération notifications' });
  }
};

/**
 * Compter les notifications non lues pour un utilisateur
 */
const getUserUnreadCount = async (req, res) => {
  try {
    const userId = req.userId;

    const count = await prisma.notification.count({
      where: {
        isRead: false,
        OR: [
          { userId: userId },
          { userId: null },
        ],
      },
    });

    res.json({ unreadCount: count });
  } catch (error) {
    console.error('Erreur count user unread:', error);
    res.status(500).json({ error: 'Erreur comptage notifications' });
  }
};

module.exports = {
  createNotification,
  createNotificationHTTP,
  getAllNotifications,
  getUserNotifications,
  getUserUnreadCount,
  markAsRead,
  markAllAsRead,
  getUnreadCount,
  deleteNotification,
};
