// c:\Mes Travaux\Lotus Business\server\src\controllers\adminController.js

const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const prisma = require('../lib/prisma');

/**
 * Connexion Admin (email + password)
 */
const loginAdmin = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ 
        error: 'Email et mot de passe requis' 
      });
    }

    // Recherche admin
    const admin = await prisma.admin.findUnique({
      where: { email },
    });

    if (!admin) {
      return res.status(401).json({ 
        error: 'Identifiants invalides' 
      });
    }

    // Vérification mot de passe
    const isValid = await bcrypt.compare(password, admin.password);

    if (!isValid) {
      return res.status(401).json({ 
        error: 'Identifiants invalides' 
      });
    }

    // Token JWT
    const token = jwt.sign(
      { adminId: admin.id, type: 'admin' },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({
      message: 'Connexion admin réussie',
      token,
      admin: {
        id: admin.id,
        email: admin.email,
        phone: admin.phone,
      },
    });
  } catch (error) {
    console.error('Erreur login admin:', error);
    res.status(500).json({ error: 'Erreur connexion admin' });
  }
};

/**
 * Liste tous les users
 */
const getAllUsers = async (req, res) => {
  try {
    const users = await prisma.user.findMany({
      orderBy: { createdAt: 'desc' },
    });

    res.json({
      count: users.length,
      users,
    });
  } catch (error) {
    console.error('Erreur get users:', error);
    res.status(500).json({ error: 'Erreur récupération users' });
  }
};

/**
 * Upgrade user FREE → PREMIUM (1 an)
 */
const upgradeToPremium = async (req, res) => {
  try {
    const { userId } = req.body;

    if (!userId) {
      return res.status(400).json({ error: 'userId requis' });
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      return res.status(404).json({ error: 'User introuvable' });
    }

    // Nouvelle date d'expiration : 1 an
    const newExpirationDate = new Date();
    newExpirationDate.setFullYear(newExpirationDate.getFullYear() + 1);

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        licenseType: 'PREMIUM',
        licenseStatus: 'ACTIVE',
        activationDate: new Date(),
        expirationDate: newExpirationDate,
      },
    });

    res.json({
      message: 'User upgradé en PREMIUM',
      user: updatedUser,
    });
  } catch (error) {
    console.error('Erreur upgrade:', error);
    res.status(500).json({ error: 'Erreur upgrade' });
  }
};

/**
 * Suspendre un user
 */
const suspendUser = async (req, res) => {
  try {
    const { userId } = req.params;

    const user = await prisma.user.update({
      where: { id: userId },
      data: { licenseStatus: 'SUSPENDED' },
    });

    res.json({
      message: 'User suspendu',
      user,
    });
  } catch (error) {
    console.error('Erreur suspend:', error);
    res.status(500).json({ error: 'Erreur suspension' });
  }
};

/**
 * Réactiver une licence expirée (admin)
 */
const reactivateLicense = async (req, res) => {
  try {
    const { userId, licenseType, duration } = req.body;

    if (!userId || !licenseType) {
      return res.status(400).json({ 
        error: 'userId et licenseType requis' 
      });
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      return res.status(404).json({ error: 'User introuvable' });
    }

    // Calculer nouvelle date d'expiration
    const newActivationDate = new Date();
    const newExpirationDate = new Date();
    
    if (licenseType === 'FREE') {
      newExpirationDate.setMonth(newExpirationDate.getMonth() + 1); // 1 mois
    } else if (licenseType === 'PREMIUM') {
      newExpirationDate.setFullYear(newExpirationDate.getFullYear() + 1); // 1 an
    }

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        licenseType,
        licenseStatus: 'ACTIVE',
        activationDate: newActivationDate,
        expirationDate: newExpirationDate,
        isOnline: false, // Forcer reconnexion
        activeSessionId: null
      },
    });

    res.json({
      message: `Licence réactivée en ${licenseType}`,
      user: updatedUser,
    });
  } catch (error) {
    console.error('Erreur réactivation:', error);
    res.status(500).json({ error: 'Erreur réactivation licence' });
  }
};

/**
 * Forcer la déconnexion d'un user
 */
const forceLogout = async (req, res) => {
  try {
    const { userId } = req.params;

    const user = await prisma.user.update({
      where: { id: userId },
      data: { 
        isOnline: false,
        activeSessionId: null 
      },
    });

    res.json({
      message: 'Utilisateur déconnecté avec succès',
      user,
    });
  } catch (error) {
    console.error('Erreur force logout:', error);
    res.status(500).json({ error: 'Erreur déconnexion forcée' });
  }
};

module.exports = {
  loginAdmin,
  getAllUsers,
  upgradeToPremium,
  suspendUser,
  reactivateLicense,
  forceLogout,
};
