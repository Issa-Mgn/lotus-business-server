const prisma = require('../lib/prisma');

/**
 * Enregistrer un téléchargement d'app
 */
const trackDownload = async (req, res) => {
  try {
    const { source } = req.body;
    const ipAddress = req.headers['x-forwarded-for'] || req.connection.remoteAddress;
    const userAgent = req.headers['user-agent'];

    const download = await prisma.appDownload.create({
      data: {
        ipAddress,
        userAgent,
        source: source || 'website',
      },
    });

    res.status(201).json({
      message: 'Téléchargement enregistré',
      downloadId: download.id,
    });
  } catch (error) {
    console.error('Erreur track download:', error);
    res.status(500).json({ error: 'Erreur enregistrement téléchargement' });
  }
};

/**
 * Obtenir le nombre total de téléchargements
 */
const getDownloadCount = async (req, res) => {
  try {
    const totalDownloads = await prisma.appDownload.count();
    
    // Téléchargements aujourd'hui
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const todayDownloads = await prisma.appDownload.count({
      where: {
        createdAt: {
          gte: today,
        },
      },
    });

    // Téléchargements ce mois
    const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    
    const monthDownloads = await prisma.appDownload.count({
      where: {
        createdAt: {
          gte: firstDayOfMonth,
        },
      },
    });

    res.json({
      total: totalDownloads,
      today: todayDownloads,
      month: monthDownloads,
    });
  } catch (error) {
    console.error('Erreur get download count:', error);
    res.status(500).json({ error: 'Erreur récupération compteur' });
  }
};

/**
 * Obtenir les statistiques détaillées des téléchargements
 */
const getDownloadStats = async (req, res) => {
  try {
    const { period = '7d' } = req.query; // 7d, 30d, 90d, all

    let startDate = new Date();
    if (period === '7d') {
      startDate.setDate(startDate.getDate() - 7);
    } else if (period === '30d') {
      startDate.setDate(startDate.getDate() - 30);
    } else if (period === '90d') {
      startDate.setDate(startDate.getDate() - 90);
    } else {
      startDate = new Date(0); // Tous
    }

    const downloads = await prisma.appDownload.findMany({
      where: {
        createdAt: {
          gte: startDate,
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    // Grouper par source
    const bySource = downloads.reduce((acc, download) => {
      const source = download.source || 'unknown';
      acc[source] = (acc[source] || 0) + 1;
      return acc;
    }, {});

    // Grouper par jour
    const byDay = downloads.reduce((acc, download) => {
      const day = download.createdAt.toISOString().split('T')[0];
      acc[day] = (acc[day] || 0) + 1;
      return acc;
    }, {});

    res.json({
      total: downloads.length,
      bySource,
      byDay,
      period,
    });
  } catch (error) {
    console.error('Erreur get download stats:', error);
    res.status(500).json({ error: 'Erreur récupération statistiques' });
  }
};

module.exports = {
  trackDownload,
  getDownloadCount,
  getDownloadStats,
};
