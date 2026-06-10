// c:\Mes Travaux\Lotus Business\server\src\middlewares\isAdmin.js

/**
 * Vérifie que l'utilisateur est un admin
 */
const isAdmin = (req, res, next) => {
  if (req.userType !== 'admin') {
    return res.status(403).json({ 
      error: 'Accès réservé aux administrateurs' 
    });
  }
  next();
};

module.exports = isAdmin;
