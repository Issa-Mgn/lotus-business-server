// c:\Mes Travaux\Lotus Business\server\src\controllers\authController.js

const jwt = require('jsonwebtoken');
const prisma = require('../lib/prisma');
const generateLicenseKey = require('../lib/generateLicenseKey');
const { sendMail } = require('../lib/sendMail');
const { welcomeTemplate, welcomeTemplateText } = require('../templates/welcome');

/**
 * Inscription User : Génère clé + enregistre dans Users et Licenses
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

    // Vérification email unique
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return res.status(400).json({ 
        error: 'Cet email est déjà utilisé' 
      });
    }

    // Vérification téléphone unique
    const existingPhone = await prisma.user.findUnique({
      where: { phone },
    });

    if (existingPhone) {
      return res.status(400).json({ 
        error: 'Ce numéro est déjà utilisé' 
      });
    }

    // Génération de la clé
    const licenseKey = generateLicenseKey();

    // Date d'expiration : FREE = 1 mois
    const activationDate = new Date();
    const expirationDate = new Date();
    expirationDate.setMonth(expirationDate.getMonth() + 1);

    // Création dans Users
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

    // Création dans Licenses (pour retrouver rapidement)
    await prisma.license.create({
      data: {
        email,
        key: licenseKey,
      },
    });

    // Envoi email de bienvenue en arrière-plan (ne pas bloquer la réponse)
    sendMail(
      email,
      'Bienvenue sur Lotus Business 🎉',
      welcomeTemplate(firstName, licenseKey, expirationDate),
      welcomeTemplateText(firstName, licenseKey, expirationDate)
    ).catch((error) => {
      console.error('❌ Erreur envoi email (non bloquant):', error);
    });

    res.status(201).json({
      message: 'Inscription réussie ! Votre clé a été envoyée par email.',
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
 * Connexion User avec clé de licence + session unique
 */
const login = async (req, res) => {
  try {
    const { licenseKey } = req.body;

    if (!licenseKey) {
      return res.status(400).json({ error: 'Clé de licence requise' });
    }

    // Vérifier les licences expirées d'abord
    const { checkExpiredLicenses } = require('../lib/checkExpiredLicenses');
    await checkExpiredLicenses();

    // Recherche du user par sa clé
    const user = await prisma.user.findUnique({
      where: { licenseKey },
    });

    if (!user) {
      return res.status(401).json({ error: 'Clé invalide' });
    }

    // Vérification expiration (double vérification)
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
        error: 'Votre licence a expiré. Contactez l\'administrateur.' 
      });
    }

    // Vérification statut
    if (user.licenseStatus !== 'ACTIVE') {
      return res.status(403).json({ 
        error: `Licence ${user.licenseStatus.toLowerCase()}. Contactez l\'administrateur.` 
      });
    }

    // Vérifier si déjà connecté ailleurs
    if (user.isOnline && user.activeSessionId) {
      // Déconnecter l'ancienne session (le token devient invalide)
      console.log(`🔄 Déconnexion forcée de l'utilisateur ${user.email} (nouvelle connexion)`);
    }

    // Générer nouveau token de session
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

    // Mettre à jour la session
    const updatedUser = await prisma.user.update({
      where: { id: user.id },
      data: {
        isOnline: true,
        lastLoginAt: new Date(),
        activeSessionId: sessionId
      }
    });

    res.json({
      message: 'Connexion réussie',
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
 * Récupération clé par email
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

    // Récupération du user pour le prénom
    const user = await prisma.user.findUnique({
      where: { email },
    });

    // Renvoi email avec le template
    sendMail(
      email,
      'Votre clé de licence Lotus Business 🔑',
      welcomeTemplate(user?.firstName || 'Utilisateur', license.key, user?.expirationDate || new Date()),
      welcomeTemplateText(user?.firstName || 'Utilisateur', license.key, user?.expirationDate || new Date())
    ).catch((error) => {
      console.error('❌ Erreur envoi email (non bloquant):', error);
    });

    res.json({
      message: 'Clé renvoyée par email',
      email: email.replace(/(.{2})(.*)(@.*)/, '$1***$3'),
    });
  } catch (error) {
    console.error('Erreur forgot key:', error);
    res.status(500).json({ error: 'Erreur récupération clé' });
  }
};

/**
 * Déconnexion User
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
      message: 'Déconnexion réussie'
    });
  } catch (error) {
    console.error('Erreur déconnexion:', error);
    res.status(500).json({ error: 'Erreur déconnexion' });
  }
};

module.exports = {
  register,
  login,
  logout,
  forgotKey,
};
