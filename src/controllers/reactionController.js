const prisma = require('../lib/prisma');
const { getClientIp } = require('../lib/getClientIp');

/**
 * Ajouter une réaction à une info
 * Public - pas besoin d'authentification
 */
const addReaction = async (req, res) => {
  try {
    const { infoId } = req.params;
    const { reactionType, userId } = req.body;

    // Vérifier que le type de réaction est valide
    const validReactionTypes = [
      'LIKE', 'LOVE', 'HAHA', 'WOW', 'SAD', 'ANGRY',
      'THUMBS_UP', 'THUMBS_DOWN', 'FIRE', 'HEART_EYES', 'CLAP', 'THINKING'
    ];

    if (!reactionType || !validReactionTypes.includes(reactionType)) {
      return res.status(400).json({ 
        error: 'Type de réaction invalide',
        validTypes: validReactionTypes
      });
    }

    // Vérifier que l'info existe
    const info = await prisma.info.findUnique({
      where: { id: infoId },
    });

    if (!info) {
      return res.status(404).json({ error: 'Info non trouvée' });
    }

    // Récupérer l'IP et user agent
    const ipAddress = getClientIp(req);
    const userAgent = req.headers['user-agent'] || null;

    // Créer la réaction
    const reaction = await prisma.reaction.create({
      data: {
        infoId,
        reactionType,
        userId: userId || null,
        ipAddress,
        userAgent,
      },
    });

    res.status(201).json({ 
      message: 'Réaction ajoutée avec succès',
      reaction 
    });
  } catch (error) {
    console.error('Erreur ajout réaction:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
};

/**
 * Obtenir toutes les réactions d'une info
 */
const getReactionsByInfo = async (req, res) => {
  try {
    const { infoId } = req.params;

    const reactions = await prisma.reaction.findMany({
      where: { infoId },
      orderBy: { createdAt: 'desc' },
    });

    res.json({ reactions });
  } catch (error) {
    console.error('Erreur récupération réactions:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
};

/**
 * Obtenir les statistiques de réactions d'une info
 */
const getReactionStats = async (req, res) => {
  try {
    const { infoId } = req.params;

    // Compter les réactions par type
    const reactionCounts = await prisma.reaction.groupBy({
      by: ['reactionType'],
      where: { infoId },
      _count: {
        reactionType: true,
      },
    });

    // Formater en objet
    const stats = {};
    reactionCounts.forEach(item => {
      stats[item.reactionType] = item._count.reactionType;
    });

    // Total de réactions
    const total = Object.values(stats).reduce((acc, count) => acc + count, 0);

    res.json({ 
      infoId,
      total,
      stats 
    });
  } catch (error) {
    console.error('Erreur récupération stats réactions:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
};

module.exports = {
  addReaction,
  getReactionsByInfo,
  getReactionStats,
};
