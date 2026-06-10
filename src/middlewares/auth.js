// c:\Mes Travaux\Lotus Business\server\src\middlewares\auth.js

const jwt = require('jsonwebtoken');
const prisma = require('../lib/prisma');

/**
 * Middleware d'authentification JWT avec vérification de session
 */
const auth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Token manquant' });
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    req.userId = decoded.userId || decoded.adminId;
    req.userType = decoded.type; // 'user' ou 'admin'

    // Vérification session pour les users (pas les admins)
    if (decoded.type === 'user' && decoded.sessionId) {
      const user = await prisma.user.findUnique({
        where: { id: decoded.userId },
        select: { activeSessionId: true, isOnline: true, licenseStatus: true }
      });

      if (!user) {
        return res.status(401).json({ error: 'Utilisateur introuvable' });
      }

      // Vérifier que c'est la session active
      if (user.activeSessionId !== decoded.sessionId) {
        return res.status(401).json({ 
          error: 'Session invalide. Vous avez été déconnecté d\'un autre appareil.' 
        });
      }

      // Vérifier que la licence est toujours active
      if (user.licenseStatus !== 'ACTIVE') {
        return res.status(403).json({ 
          error: 'Licence inactive. Contactez l\'administrateur.' 
        });
      }
    }
    
    next();
  } catch (error) {
    return res.status(401).json({ error: 'Token invalide' });
  }
};

module.exports = auth;
