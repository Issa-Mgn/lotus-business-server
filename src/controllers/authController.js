// c:\Mes Travaux\Lotus Business\server\src\controllers\authController.js

const jwt = require('jsonwebtoken');
const prisma = require('../lib/prisma');
const generateLicenseKey = require('../lib/generateLicenseKey');
const { welcomeTemplate, welcomeTemplateText } = require('../templates/welcome');

/**
 * Inscription User : GÃ©nÃ¨re clÃ© + enregistre dans Users et Licenses
 */
const register = async (req, res) => {
  try {
    const { email, phone, firstName, lastName } = req.body;

    // Validation
    if (!email || !phone || !firstName || !lastName) {
      return res.status(400).json({ 
        error: 'Tous les champs sont requis' 
      });
    }

    // VÃ©rification email unique
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return res.status(400).json({ 
        error: 'Cet email est dÃ©jÃ  utilisÃ©' 
      });
    }

    // VÃ©rification tÃ©lÃ©phone unique
    const existingPhone = await prisma.user.findUnique({
      where: { phone },
    });

    if (existingPhone) {
      return res.status(400).json({ 
        error: 'Ce numÃ©ro est dÃ©jÃ  utilisÃ©' 
      });
    }

    // GÃ©nÃ©ration de la clÃ©
    const licenseKey = generateLicenseKey();

    // Date d'expiration : FREE = 1 mois
    const activationDate = new Date();
    const expirationDate = new Date();
    expirationDate.setMonth(expirationDate.getMonth() + 1);

    // CrÃ©ation dans Users
    const user = await prisma.user.create({
      data: {
        email,
        phone,
        firstName,
        lastName,
        licenseKey,
        licenseType: 'FREE',
        licenseStatus: 'ACTIVE',
        activationDate,
        expirationDate,
      },
    });

    // Création ou mise à jour dans Licenses (upsert pour gérer les réinscriptions)
    await prisma.license.upsert({
      where: { email },
      update: {
        key: licenseKey,
      },
      create: {
        email,
        key: licenseKey,
      },
    });

    // Envoi email de bienvenue en arrière-plan via Brevo (non bloquant)
    try {
      const { sendLicenseConfirmation } = require('../services/mailService');
      sendLicenseConfirmation(
        email,
        firstName,
        licenseKey,
        welcomeTemplate(firstName, licenseKey, expirationDate),
        welcomeTemplateText(firstName, licenseKey, expirationDate)
      ).then((result) => {
        if (!result || !result.success) {
          console.error('Erreur envoi email inscription:', result?.error || 'unknown');
        }
      }).catch((error) => {
        console.error('Erreur envoi email inscription:', error);
      });
    } catch (err) {
      console.error('Erreur require mailService:', err);
    }

    res.status(201).json({
      message: 'Inscription rÃ©ussie ! Votre clÃ© a Ã©tÃ© envoyÃ©e par email.',
      user: {
        id: user.id,
        email: user.email,
        phone: user.phone,
        firstName: user.firstName,
        lastName: user.lastName,
        licenseKey: user.licenseKey,
        licenseType: user.licenseType,
        expirationDate: user.expirationDate,
      },
    });
  } catch (error) {
    console.error('Erreur inscription:', error);
    res.status(500).json({ error: 'Erreur lors de l\'inscription' });
  }
};

/**
 * Connexion User avec clÃ© de licence + session unique
 */
const login = async (req, res) => {
  try {
    const { licenseKey } = req.body;

    if (!licenseKey) {
      return res.status(400).json({ error: 'ClÃ© de licence requise' });
    }

    // VÃ©rifier les licences expirÃ©es d'abord
    const { checkExpiredLicenses } = require('../lib/checkExpiredLicenses');
    await checkExpiredLicenses();

    // Recherche du user par sa clÃ©
    const user = await prisma.user.findUnique({
      where: { licenseKey },
    });

    if (!user) {
      return res.status(401).json({ error: 'ClÃ© invalide' });
    }

    // VÃ©rification expiration (double vÃ©rification)
    if (new Date(user.expirationDate) < new Date()) {
      await prisma.user.update({
        where: { id: user.id },
        data: { 
          licenseStatus: 'EXPIRED',
          isOnline: false,
          activeSessionId: null 
        },
      });

      return res.status(403).json({ 
        error: 'Votre licence a expirÃ©. Contactez l\'administrateur.' 
      });
    }

    // VÃ©rification statut
    if (user.licenseStatus !== 'ACTIVE') {
      return res.status(403).json({ 
        error: `Licence ${user.licenseStatus.toLowerCase()}. Contactez l\'administrateur.` 
      });
    }

    // VÃ©rifier si dÃ©jÃ  connectÃ© ailleurs
    if (user.isOnline && user.activeSessionId) {
      // DÃ©connecter l'ancienne session (le token devient invalide)
      console.log(`ðŸ”„ DÃ©connexion forcÃ©e de l'utilisateur ${user.email} (nouvelle connexion)`);
    }

    // GÃ©nÃ©rer nouveau token de session
    const sessionId = require('crypto').randomUUID();
    const token = jwt.sign(
      { 
        userId: user.id, 
        type: 'user',
        sessionId: sessionId // Inclure l'ID de session dans le token
      },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    // Mettre Ã  jour la session
    const updatedUser = await prisma.user.update({
      where: { id: user.id },
      data: {
        isOnline: true,
        lastLoginAt: new Date(),
        activeSessionId: sessionId
      }
    });

    res.json({
      message: 'Connexion rÃ©ussie',
      token,
      user: {
        id: updatedUser.id,
        email: updatedUser.email,
        phone: updatedUser.phone,
        firstName: updatedUser.firstName,
        lastName: updatedUser.lastName,
        licenseKey: updatedUser.licenseKey,
        licenseType: updatedUser.licenseType,
        licenseStatus: updatedUser.licenseStatus,
        expirationDate: updatedUser.expirationDate,
        isOnline: updatedUser.isOnline,
        lastLoginAt: updatedUser.lastLoginAt,
      },
    });
  } catch (error) {
    console.error('Erreur connexion:', error);
    res.status(500).json({ error: 'Erreur lors de la connexion' });
  }
};

/**
 * RÃ©cupÃ©ration clÃ© par email
 */
const forgotKey = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ error: 'Email requis' });
    }

    // Recherche dans table Licenses
    const license = await prisma.license.findUnique({
      where: { email },
    });

    if (!license) {
      return res.status(404).json({ 
        error: 'Aucun compte avec cet email' 
      });
    }

    // RÃ©cupÃ©ration du user pour le prÃ©nom
    const user = await prisma.user.findUnique({
      where: { email },
    });

    // Renvoi email avec le template via Brevo (non bloquant)
    try {
      const { sendLicenseRecovery } = require('../services/mailService');
      sendLicenseRecovery(
        email,
        user?.firstName || 'Utilisateur',
        license.key,
        welcomeTemplate(user?.firstName || 'Utilisateur', license.key, user?.expirationDate || new Date()),
        welcomeTemplateText(user?.firstName || 'Utilisateur', license.key, user?.expirationDate || new Date())
      ).then((result) => {
        if (!result || !result.success) {
          console.error('Erreur envoi email forgot-key:', result?.error || 'unknown');
        }
      }).catch((error) => {
        console.error('Erreur envoi email forgot-key:', error);
      });
    } catch (err) {
      console.error('Erreur require mailService:', err);
    }

    res.json({
      message: 'ClÃ© renvoyÃ©e par email',
      email: email.replace(/(.{2})(.*)(@.*)/, '$1***$3'),
    });
  } catch (error) {
    console.error('Erreur forgot key:', error);
    res.status(500).json({ error: 'Erreur rÃ©cupÃ©ration clÃ©' });
  }
};

/**
 * DÃ©connexion User
 */
const logout = async (req, res) => {
  try {
    const userId = req.userId;

    // Marquer comme hors ligne
    await prisma.user.update({
      where: { id: userId },
      data: {
        isOnline: false,
        activeSessionId: null
      }
    });

    res.json({
      message: 'DÃ©connexion rÃ©ussie'
    });
  } catch (error) {
    console.error('Erreur dÃ©connexion:', error);
    res.status(500).json({ error: 'Erreur dÃ©connexion' });
  }
};

module.exports = {
  register,
  login,
  logout,
  forgotKey,
};




