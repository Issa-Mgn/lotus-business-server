// c:\Mes Travaux\Lotus Business\server\src\controllers\activityController.js

const prisma = require('../lib/prisma');

/**
 * Créer un log d'activité
 */
const createActivityLog = async (type, description, adminId, targetId = null, metadata = null, ipAddress = null) => {
  try {
    const log = await prisma.activityLog.create({
      data: {
        type,
        description,
        adminId,
        targetId,
        metadata: metadata ? JSON.stringify(metadata) : null,
        ipAddress,
      },
    });
    return log;
  } catch (error) {
    console.error('Erreur création log:', error);
  }
};

/**
 * Récupérer tous les logs (avec filtres optionnels)
 */
const getAllLogs = async (req, res) => {
  try {
    const { type, startDate, endDate, adminId } = req.query;

    const where = {};

    if (type) {
      where.type = type;
    }

    if (adminId) {
      where.adminId = adminId;
    }

    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) where.createdAt.gte = new Date(startDate);
      if (endDate) where.createdAt.lte = new Date(endDate);
    }

    const logs = await prisma.activityLog.findMany({
      where,
      include: {
        admin: {
          select: {
            id: true,
            email: true,
          },
        },
        target: {
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
      count: logs.length,
      logs: logs.map(log => ({
        ...log,
        metadata: log.metadata ? JSON.parse(log.metadata) : null,
      })),
    });
  } catch (error) {
    console.error('Erreur get logs:', error);
    res.status(500).json({ error: 'Erreur récupération logs' });
  }
};

/**
 * Récupérer les stats des logs
 */
const getLogsStats = async (req, res) => {
  try {
    const now = new Date();
    const startOfDay  = new Date(now); startOfDay.setHours(0, 0, 0, 0);
    const startOfWeek = new Date(now); startOfWeek.setDate(now.getDate() - now.getDay()); startOfWeek.setHours(0, 0, 0, 0);

    const [total, today, thisWeek, byType] = await Promise.all([
      prisma.activityLog.count(),
      prisma.activityLog.count({ where: { createdAt: { gte: startOfDay } } }),
      prisma.activityLog.count({ where: { createdAt: { gte: startOfWeek } } }),
      prisma.activityLog.groupBy({ by: ['type'], _count: true }),
    ]);

    res.json({
      stats: {
        total,
        today,
        thisWeek,
        byType: byType.map(item => ({ type: item.type, count: item._count })),
      },
    });
  } catch (error) {
    console.error('Erreur stats logs:', error);
    res.status(500).json({ error: 'Erreur récupération stats' });
  }
};

module.exports = {
  createActivityLog,
  getAllLogs,
  getLogsStats,
};
