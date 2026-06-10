// c:\Mes Travaux\Lotus Business\server\src\middlewares\checkLicense.js

const prisma = require('../lib/prisma');

/**
 * Middleware de vérification de la licence active
 * Doit être utilisé après le middleware auth
 */
const checkLicense = async (req, res, next) => {
  try {
    // Récupération de la licence de l'utilisateur
    const license = await prisma.license.findUnique({
      where: { userId: req.userId },
    });

    // Vérification de l'existence de la licence
    if (!license) {
      return res.status(403).json({ 
        error: 'Aucune licence trouvée. Veuillez acheter une licence.' 
      });
    }

    // Vérification du statut de la licence
    if (license.status !== 'ACTIVE') {
      return res.status(403).json({ 
        error: 'Votre licence est inactive. Veuillez acheter une licence.' 
      });
    }

    // Vérification de la date d'expiration
    if (new Date(license.endDate) < new Date()) {
      // Mise à jour automatique du statut en EXPIRED
      await prisma.license.update({
        where: { id: license.id },
        data: { status: 'EXPIRED' },
      });

      return res.status(403).json({ 
        error: 'Votre licence a expiré. Veuillez acheter une licence.' 
      });
    }

    // Licence valide, on continue
    req.license = license;
    next();
  } catch (error) {
    console.error('Erreur dans checkLicense:', error);
    return res.status(500).json({ 
      error: 'Erreur lors de la vérification de la licence' 
    });
  }
};

module.exports = checkLicense;
