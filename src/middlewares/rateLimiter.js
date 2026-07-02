const rateLimit = require('express-rate-limit');

/**
 * Rate limiter pour les routes d'authentification
 * Limite les tentatives pour éviter les attaques par force brute
 */
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // 10 tentatives par fenêtre
  message: {
    error: 'Trop de tentatives. Veuillez réessayer dans 15 minutes.'
  },
  standardHeaders: true,
  legacyHeaders: false,
  // Ignorer les erreurs de rate limiting en développement
  skip: () => process.env.NODE_ENV === 'development' && process.env.DEBUG_RATE_LIMIT === '1'
});

/**
 * Rate limiter strict pour le login admin
 * Plus restrictif car accès aux fonctionnalités critiques
 */
const adminLoginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 tentatives par fenêtre
  message: {
    error: 'Trop de tentatives de connexion admin. Veuillez réessayer dans 15 minutes.'
  },
  standardHeaders: true,
  legacyHeaders: false,
  skip: () => process.env.NODE_ENV === 'development' && process.env.DEBUG_RATE_LIMIT === '1'
});

/**
 * Rate limiter pour la récupération de clé
 * Évite le spam d'emails
 */
const forgotKeyLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 heure
  max: 5, // 5 tentatives par heure
  message: {
    error: 'Trop de demandes. Veuillez réessayer dans 1 heure.'
  },
  standardHeaders: true,
  legacyHeaders: false,
  skip: () => process.env.NODE_ENV === 'development' && process.env.DEBUG_RATE_LIMIT === '1'
});

module.exports = {
  authLimiter,
  adminLoginLimiter,
  forgotKeyLimiter,
};