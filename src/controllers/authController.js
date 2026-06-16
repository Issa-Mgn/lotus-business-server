const jwt = require('jsonwebtoken');
const prisma = require('../lib/prisma');
const generateLicenseKey = require('../lib/generateLicenseKey');
const { welcomeTemplate, welcomeTemplateText } = require('../templates/welcome');
const getClientIp = require('../lib/getClientIp');

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

    // FREE = illimité (pas d'expiration), PREMIUM = 1 mois
    const activationDate = new Date();
    const expirationDate = null; // FREE n'expire jamais
    const maxSimultaneousLogins = 1; // FREE = 1 appareil seulement

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
        maxSimultaneousLogins,
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
        welcomeTemplate(firstName, licenseKey, expirationDate, 'FREE'),
        welcomeTemplateText(firstName, licenseKey, expirationDate, 'FREE')
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
 * Connexion User avec clé de licence + restriction IP pour FREE
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

    // Vérification expiration (seulement pour PREMIUM)
    if (user.licenseType === 'PREMIUM' && user.expirationDate) {
      if (new Date(user.expirationDate) < new Date()) {
        await prisma.user.update({
          where: { id: user.id },
          data: { 
            licenseStatus: 'EXPIRED',
            isOnline: false,
            activeSessionId: null,
            lastLoginIp: null
          },
        });

        return res.status(403).json({ 
          error: 'Votre abonnement PREMIUM a expiré. Veuillez renouveler.' 
        });
      }
    }

    // Vérification statut
    if (user.licenseStatus !== 'ACTIVE') {
      return res.status(403).json({ 
        error: `Licence ${user.licenseStatus.toLowerCase()}. Contactez l'administrateur.` 
      });
    }

    // 🔒 RÉCUPÉRER L'IP DU CLIENT ACTUEL
    const currentIp = getClientIp(req);
    console.log(`🔐 Tentative de connexion - Email: ${user.email}, Type: ${user.licenseType}, IP: ${currentIp}, IP stockée: ${user.lastLoginIp}, En ligne: ${user.isOnline}`);

    // 🔒 RESTRICTION IP POUR FREE : 1 seul appareil à la fois
    if (user.licenseType === 'FREE') {
      // Si déjà connecté avec une autre IP, refuser la connexion
      if (user.isOnline && user.lastLoginIp && user.lastLoginIp !== currentIp) {
        console.log(`❌ Connexion refusée FREE - IP différente détectée`);
        return res.status(403).json({ 
          error: 'Compte FREE déjà connecté sur un autre appareil. Déconnectez-vous d\'abord ou passez à PREMIUM pour connexions illimitées.' 
        });
      }
    }

    // ✅ PREMIUM : Pas de restriction IP, connexions illimitées
    if (user.licenseType === 'PREMIUM') {
      console.log(`✅ Connexion PREMIUM autorisée - Pas de restriction IP`);
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

    // Mettre à jour la session + IP
    const updatedUser = await prisma.user.update({
      where: { id: user.id },
      data: {
        isOnline: true,
        lastLoginAt: new Date(),
        activeSessionId: sessionId,
        lastLoginIp: currentIp // 🔒 Enregistrer l'IP pour la vérification FREE
      }
    });

    console.log(`✅ Connexion réussie - ${user.email} (${user.licenseType}) depuis IP: ${currentIp}`);

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

    // Renvoi email avec le template via Brevo (non bloquant)
    try {
      const { sendLicenseRecovery } = require('../services/mailService');
      sendLicenseRecovery(
        email,
        user?.firstName || 'Utilisateur',
        license.key,
        welcomeTemplate(user?.firstName || 'Utilisateur', license.key, user?.expirationDate || null, user?.licenseType || 'FREE'),
        welcomeTemplateText(user?.firstName || 'Utilisateur', license.key, user?.expirationDate || null, user?.licenseType || 'FREE')
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

    // Marquer comme hors ligne et réinitialiser l'IP pour FREE
    await prisma.user.update({
      where: { id: userId },
      data: {
        isOnline: false,
        activeSessionId: null,
        // NE PAS réinitialiser lastLoginIp ici - on garde l'historique
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
