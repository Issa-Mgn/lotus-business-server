// c:\Mes Travaux\Lotus Business\server\src\controllers\notificationController.js

const prisma = require('../lib/prisma');

/**
 * Créer une notification
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

module.exports = {
  createNotification,
  getAllNotifications,
  markAsRead,
  markAllAsRead,
  getUnreadCount,
  deleteNotification,
};
