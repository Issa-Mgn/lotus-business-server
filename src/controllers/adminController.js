const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const prisma = require('../lib/prisma');
const { welcomeTemplate, welcomeTemplateText } = require('../templates/welcome');
const mailService = require('../services/mailService');
const { brevo } = require('../config/mailer');

const publicAdminFields = {
  id: true,
  email: true,
  phone: true,
  createdAt: true,
};

const buildManualEmailHtml = (message) => {
  const safeMessage = String(message)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/\n/g, '<br>');

  return `
    <div style="margin:0; padding:0; background:#0A0A0A; font-family:Arial, Helvetica, sans-serif; color:#E5E5E5;">
      <div style="max-width:560px; margin:0 auto; background:#111111; border:1px solid #2A2A2A; border-radius:14px; overflow:hidden;">
        <div style="padding:24px 28px; border-bottom:1px solid #2A2A2A;">
          <p style="margin:0 0 8px 0; color:#6B6B6B; font-size:12px; font-weight:700; letter-spacing:0.12em; text-transform:uppercase;">Lotus Business</p>
          <h1 style="margin:0; color:#FFFFFF; font-size:22px; line-height:1.3;">Message de l'administration</h1>
        </div>
        <div style="padding:28px; color:#D6D6D6; font-size:15px; line-height:1.7;">
          ${safeMessage}
        </div>
        <div style="padding:18px 28px; background:#0F0F0F; border-top:1px solid #2A2A2A;">
          <p style="margin:0; color:#6B6B6B; font-size:12px; line-height:1.6;">Email envoyé par Lotus Business.</p>
        </div>
      </div>
    </div>
  `;
};

const loginAdmin = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email et mot de passe requis' });
    }

    const admin = await prisma.admin.findUnique({ where: { email } });

    if (!admin) {
      return res.status(401).json({ error: 'Identifiants invalides' });
    }

    const isValid = await bcrypt.compare(password, admin.password);

    if (!isValid) {
      return res.status(401).json({ error: 'Identifiants invalides' });
    }

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

const getAllAdmins = async (req, res) => {
  try {
    const admins = await prisma.admin.findMany({
      orderBy: { createdAt: 'desc' },
      select: publicAdminFields,
    });

    res.json({
      count: admins.length,
      admins,
    });
  } catch (error) {
    console.error('Erreur get admins:', error);
    res.status(500).json({ error: 'Erreur récupération admins' });
  }
};

const upgradeToPremium = async (req, res) => {
  try {
    const { userId } = req.body;

    if (!userId) {
      return res.status(400).json({ error: 'userId requis' });
    }

    const user = await prisma.user.findUnique({ where: { id: userId } });

    if (!user) {
      return res.status(404).json({ error: 'User introuvable' });
    }

    // PREMIUM = 1 mois (999 FCFA/mois selon CDC)
    const newExpirationDate = new Date();
    newExpirationDate.setMonth(newExpirationDate.getMonth() + 1);

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        licenseType: 'PREMIUM',
        licenseStatus: 'ACTIVE',
        activationDate: new Date(),
        expirationDate: newExpirationDate,
        maxSimultaneousLogins: 999, // PREMIUM = connexions illimitées
      },
    });

    res.json({
      message: 'User upgradé en PREMIUM (1 mois)',
      user: updatedUser,
    });
  } catch (error) {
    console.error('Erreur upgrade:', error);
    res.status(500).json({ error: 'Erreur upgrade' });
  }
};

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

const reactivateLicense = async (req, res) => {
  try {
    const { userId, licenseType } = req.body;

    if (!userId || !licenseType) {
      return res.status(400).json({ error: 'userId et licenseType requis' });
    }

    const user = await prisma.user.findUnique({ where: { id: userId } });

    if (!user) {
      return res.status(404).json({ error: 'User introuvable' });
    }

    const newActivationDate = new Date();
    let newExpirationDate = null;
    let maxSimultaneousLogins = 1;

    if (licenseType === 'FREE') {
      // FREE = illimité (pas d'expiration)
      newExpirationDate = null;
      maxSimultaneousLogins = 1;
    } else if (licenseType === 'PREMIUM') {
      // PREMIUM = 1 mois (999 FCFA/mois selon CDC)
      newExpirationDate = new Date();
      newExpirationDate.setMonth(newExpirationDate.getMonth() + 1);
      maxSimultaneousLogins = 999; // Illimité
    }

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        licenseType,
        licenseStatus: 'ACTIVE',
        activationDate: newActivationDate,
        expirationDate: newExpirationDate,
        maxSimultaneousLogins,
        isOnline: false,
        activeSessionId: null,
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

const forceLogout = async (req, res) => {
  try {
    const { userId } = req.params;

    const user = await prisma.user.update({
      where: { id: userId },
      data: {
        isOnline: false,
        activeSessionId: null,
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

const createAdmin = async (req, res) => {
  try {
    const { email, phone, password } = req.body;

    if (!email || !phone || !password) {
      return res.status(400).json({ error: 'Email, téléphone et mot de passe requis' });
    }

    const existingAdmin = await prisma.admin.findUnique({ where: { email } });

    if (existingAdmin) {
      return res.status(400).json({ error: 'Un admin avec cet email existe déjà' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const newAdmin = await prisma.admin.create({
      data: {
        email,
        phone,
        password: hashedPassword,
      },
      select: publicAdminFields,
    });

    res.status(201).json({
      message: 'Admin créé avec succès',
      admin: newAdmin,
    });
  } catch (error) {
    console.error('Erreur création admin:', error);
    res.status(500).json({ error: 'Erreur création admin' });
  }
};

/**
 * Créer un utilisateur depuis le dashboard admin
 * Génère automatiquement une clé et envoie l'email de bienvenue
 */
const createUserFromAdmin = async (req, res) => {
  try {
    const { email, phone, firstName, lastName, licenseType = 'FREE' } = req.body;

    if (!email || !phone || !firstName || !lastName) {
      return res.status(400).json({ 
        error: 'Email, téléphone, prénom et nom requis' 
      });
    }

    // Vérifier si l'utilisateur existe déjà
    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return res.status(400).json({ 
        error: 'Un utilisateur avec cet email existe déjà' 
      });
    }

    // Générer une clé de licence unique
    const { v4: uuidv4 } = require('uuid');
    const generateLicenseKey = () => {
      const uuid = uuidv4().replace(/-/g, '');
      const part1 = uuid.substring(0, 4);
      const part2 = uuid.substring(4, 8);
      const part3 = uuid.substring(8, 12);
      return `LOT-${part1}-${part2}-${part3}`;
    };

    let licenseKey = generateLicenseKey();
    let keyExists = await prisma.license.findUnique({ where: { licenseKey } });
    
    while (keyExists) {
      licenseKey = generateLicenseKey();
      keyExists = await prisma.license.findUnique({ where: { licenseKey } });
    }

    // Déterminer la date d'expiration et le nombre d'appareils
    const activationDate = new Date();
    let expirationDate = null;
    let maxSimultaneousLogins = 1;

    if (licenseType === 'PREMIUM') {
      expirationDate = new Date();
      expirationDate.setMonth(expirationDate.getMonth() + 1);
      maxSimultaneousLogins = 999;
    }

    // Créer l'utilisateur
    const newUser = await prisma.user.create({
      data: {
        email,
        phone,
        firstName,
        lastName,
        licenseKey,
        licenseType,
        licenseStatus: 'ACTIVE',
        activationDate,
        expirationDate,
        maxSimultaneousLogins,
      },
    });

    // Créer l'entrée dans la table licenses
    await prisma.license.create({
      data: {
        email,
        licenseKey,
      },
    });

    // Envoyer l'email de bienvenue avec la clé
    try {
      const { welcomeTemplate, welcomeTemplateText } = require('../templates/welcome');
      await mailService.sendLicenseConfirmation(
        email,
        firstName,
        licenseKey,
        welcomeTemplate(firstName, licenseKey, expirationDate),
        welcomeTemplateText(firstName, licenseKey, expirationDate)
      );
    } catch (emailError) {
      console.error('Erreur envoi email:', emailError);
      // On continue même si l'email échoue
    }

    res.status(201).json({
      message: 'Utilisateur créé avec succès. Un email a été envoyé avec la clé de licence.',
      user: newUser,
    });
  } catch (error) {
    console.error('Erreur création utilisateur:', error);
    res.status(500).json({ error: 'Erreur création utilisateur' });
  }
};

const testEmail = async (req, res) => {
  try {
    const admin = await prisma.admin.findUnique({
      where: { id: req.userId },
      select: publicAdminFields,
    });
    const to = req.body?.email || admin?.email || process.env.BREVO_SENDER_EMAIL;

    if (!to) {
      return res.status(400).json({ error: 'Aucun email destinataire disponible' });
    }

    // Envoi via Brevo
    try {
      const result = await mailService.sendCustomEmail(
        to,
        admin?.email || '',
        'Test email Lotus Business',
        '<p>Le service email Lotus Business fonctionne correctement.</p>',
        'Le service email Lotus Business fonctionne correctement.'
      );

      if (!result.success) {
        return res.status(502).json({ error: 'Echec envoi email', detail: result.error });
      }

      return res.json({ message: 'Email de test envoyé', to, messageId: result.messageId });
    } catch (err) {
      console.error('Erreur test email:', err);
      return res.status(500).json({ error: 'Erreur test email' });
    }
  } catch (error) {
    console.error('Erreur test email:', error);
    res.status(500).json({ error: 'Erreur test email' });
  }
};

const sendManualEmail = async (req, res) => {
  try {
    const { recipientType, recipientId, email, subject, message } = req.body;

    // Trace minimal des requêtes admin pour faciliter le debug
    try {
      const debugAdmin = process.env.DEBUG_ADMIN === '1' || process.env.DEBUG_ADMIN === 'true';
      if (debugAdmin) {
        console.log('[adminController] sendManualEmail called', {
          adminId: req.userId,
          ip: req.ip,
          recipientType,
          recipientId,
          email,
          subject,
          hasAuth: !!(req.headers && req.headers.authorization),
        });
      } else {
        console.log(`[adminController] sendManualEmail called by adminId=${req.userId} recipient=${email || recipientId}`);
      }
    } catch (e) {
      console.warn('[adminController] Erreur logging sendManualEmail', e && e.message ? e.message : e);
    }

    if (!subject || !message) {
      return res.status(400).json({ error: 'Sujet et message requis' });
    }

    let recipientEmail = email;

    if (!recipientEmail && recipientType === 'user' && recipientId) {
      const user = await prisma.user.findUnique({
        where: { id: recipientId },
        select: { email: true },
      });
      recipientEmail = user?.email;
    }

    if (!recipientEmail && recipientType === 'admin' && recipientId) {
      const admin = await prisma.admin.findUnique({
        where: { id: recipientId },
        select: { email: true },
      });
      recipientEmail = admin?.email;
    }

    if (!recipientEmail) {
      return res.status(400).json({ error: 'Destinataire introuvable' });
    }

    // Envoi via Brevo
    try {
      const html = buildManualEmailHtml(message);
      const result = await mailService.sendCustomEmail(recipientEmail, '', subject, html, message);

      if (!result.success) {
        return res.status(502).json({ error: 'Echec envoi email', detail: result.error });
      }

      return res.json({ message: 'Email envoyé', to: recipientEmail, messageId: result.messageId });
    } catch (err) {
      console.error('Erreur envoi email manuel:', err);
      return res.status(500).json({ error: 'Erreur envoi email manuel' });
    }
  } catch (error) {
    console.error('Erreur envoi email manuel:', error);
    res.status(500).json({ error: 'Erreur envoi email manuel' });
  }
};

// Debug: envoi manuel sans authentification lorsque DEBUG_ADMIN=1
const sendManualEmailDebug = async (req, res) => {
  if (!(process.env.DEBUG_ADMIN === '1' || process.env.DEBUG_ADMIN === 'true')) {
    return res.status(404).json({ error: 'Not found' });
  }

  try {
    const { recipientType, recipientId, email, subject, message } = req.body;

    // Minimal logging
    try {
      console.log('[adminController][DEBUG] sendManualEmailDebug called', { recipientType, recipientId, email, subject });
    } catch (e) {
      /* ignore */
    }

    if (!subject || !message) {
      return res.status(400).json({ error: 'Sujet et message requis' });
    }

    let recipientEmail = email;

    if (!recipientEmail && recipientType === 'user' && recipientId) {
      const user = await prisma.user.findUnique({ where: { id: recipientId }, select: { email: true } });
      recipientEmail = user?.email;
    }

    if (!recipientEmail && recipientType === 'admin' && recipientId) {
      const admin = await prisma.admin.findUnique({ where: { id: recipientId }, select: { email: true } });
      recipientEmail = admin?.email;
    }

    if (!recipientEmail) {
      return res.status(400).json({ error: 'Destinataire introuvable' });
    }

    const html = buildManualEmailHtml(message);
    try {
      const result = await mailService.sendCustomEmail(recipientEmail, '', subject, html, message);
      if (!result.success) {
        return res.status(502).json({ error: 'Echec envoi email', detail: result });
      }
      return res.json({ message: 'Email envoyé (debug)', to: recipientEmail, messageId: result.messageId, data: result.data });
    } catch (err) {
      console.error('[adminController][DEBUG] erreur envoi email debug:', err);
      return res.status(500).json({ error: 'Erreur envoi email debug', detail: err && err.message ? err.message : String(err) });
    }
  } catch (error) {
    console.error('[adminController][DEBUG] sendManualEmailDebug:', error);
    res.status(500).json({ error: 'Erreur envoi email debug' });
  }
};

const sendUserLicenseEmail = async (req, res) => {
  try {
    const { userId } = req.body;

    // Logging d'entrée pour debug (activez DEBUG_ADMIN=1)
    try {
      const debugAdmin = process.env.DEBUG_ADMIN === '1' || process.env.DEBUG_ADMIN === 'true';
      if (debugAdmin) {
        console.log('[adminController] sendUserLicenseEmail called', {
          adminId: req.userId,
          ip: req.ip,
          userId,
          hasAuth: !!(req.headers && req.headers.authorization),
        });
      } else {
        console.log(`[adminController] sendUserLicenseEmail called by adminId=${req.userId} userId=${userId}`);
      }
    } catch (e) {
      console.warn('[adminController] Erreur logging sendUserLicenseEmail', e && e.message ? e.message : e);
    }

    if (!userId) {
      return res.status(400).json({ error: 'userId requis' });
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        email: true,
        firstName: true,
        licenseKey: true,
        expirationDate: true,
      },
    });

    if (!user) {
      return res.status(404).json({ error: 'Utilisateur introuvable' });
    }

    try {
      const result = await mailService.sendLicenseConfirmation(
        user.email,
        user.firstName || 'Utilisateur',
        user.licenseKey,
        welcomeTemplate(user.firstName || 'Utilisateur', user.licenseKey, user.expirationDate),
        welcomeTemplateText(user.firstName || 'Utilisateur', user.licenseKey, user.expirationDate)
      );

      if (!result.success) {
        return res.status(502).json({ error: 'Echec envoi email', detail: result.error });
      }

      return res.json({ message: 'Email de licence envoyé', to: user.email, messageId: result.messageId });
    } catch (err) {
      console.error('Erreur envoi email licence:', err);
      return res.status(500).json({ error: 'Erreur envoi email licence' });
    }
  } catch (error) {
    console.error('Erreur envoi email licence:', error);
    res.status(500).json({ error: 'Erreur envoi email licence' });
  }
};

const getPublishedInfos = async (req, res) => {
  try {
    const infos = await prisma.info.findMany({
      where: { published: true },
      orderBy: { publishedAt: 'desc' },
    });

    res.json({
      count: infos.length,
      infos,
    });
  } catch (error) {
    console.error('Erreur récupération infos publiques:', error);
    res.status(500).json({ error: 'Erreur récupération infos' });
  }
};

const getAllInfos = async (req, res) => {
  try {
    const infos = await prisma.info.findMany({
      orderBy: { createdAt: 'desc' },
    });

    res.json({
      count: infos.length,
      infos,
    });
  } catch (error) {
    console.error('Erreur récupération infos:', error);
    res.status(500).json({ error: 'Erreur récupération infos' });
  }
};

const mailStatus = async (req, res) => {
  try {
    const status = {
      BREVO_API_KEY: !!process.env.BREVO_API_KEY,
      BREVO_SENDER_EMAIL: !!process.env.BREVO_SENDER_EMAIL,
      brevoInitialized: !!brevo,
    };

    if (!brevo) {
      return res.json({ status, apiCheck: null, message: 'Brevo client non initialisé' });
    }

    try {
      // appel léger pour vérifier la validité de la clé (requiert peu de droit)
      const result = await brevo.transactionalEmails.getBlockedDomains();
      return res.json({ status, apiCheck: { ok: true, info: result } });
    } catch (err) {
      console.error('[adminController] mailStatus - erreur API Brevo:', err && err.message ? err.message : err);
      const info = err && err.message ? err.message : String(err);
      return res.status(502).json({ status, apiCheck: { ok: false, error: info } });
    }
  } catch (error) {
    console.error('[adminController] mailStatus erreur:', error);
    res.status(500).json({ error: 'Erreur mailStatus' });
  }
};

const createInfo = async (req, res) => {
  try {
    const { title, content, imageUrl, published = true } = req.body;

    if (!title || !content) {
      return res.status(400).json({ error: 'Titre et contenu requis' });
    }

    const info = await prisma.info.create({
      data: {
        title,
        content,
        imageUrl: imageUrl || null,
        published: Boolean(published),
        publishedAt: new Date(),
      },
    });

    res.status(201).json({
      message: 'Info publiée',
      info,
    });
  } catch (error) {
    console.error('Erreur création info:', error);
    res.status(500).json({ error: 'Erreur création info' });
  }
};

const updateInfo = async (req, res) => {
  try {
    const { infoId } = req.params;
    const { title, content, imageUrl, published } = req.body;

    const info = await prisma.info.update({
      where: { id: infoId },
      data: {
        ...(title !== undefined ? { title } : {}),
        ...(content !== undefined ? { content } : {}),
        ...(imageUrl !== undefined ? { imageUrl: imageUrl || null } : {}),
        ...(published !== undefined ? { published: Boolean(published) } : {}),
      },
    });

    res.json({
      message: 'Info mise à jour',
      info,
    });
  } catch (error) {
    console.error('Erreur mise à jour info:', error);
    res.status(500).json({ error: 'Erreur mise à jour info' });
  }
};

const deleteInfo = async (req, res) => {
  try {
    const { infoId } = req.params;

    await prisma.info.delete({
      where: { id: infoId },
    });

    res.json({ message: 'Info supprimée' });
  } catch (error) {
    console.error('Erreur suppression info:', error);
    res.status(500).json({ error: 'Erreur suppression info' });
  }
};

/**
 * Récupérer le profil de l'admin connecté
 */
const getProfile = async (req, res) => {
  try {
    const adminId = req.userId; // depuis le middleware auth

    const admin = await prisma.admin.findUnique({
      where: { id: adminId },
      select: publicAdminFields,
    });

    if (!admin) {
      return res.status(404).json({ error: 'Admin introuvable' });
    }

    res.json({ admin });
  } catch (error) {
    console.error('Erreur get profile:', error);
    res.status(500).json({ error: 'Erreur récupération profil' });
  }
};

/**
 * Changer le mot de passe de l'admin connecté
 */
const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const adminId = req.userId; // depuis le middleware auth

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ 
        error: 'Mot de passe actuel et nouveau mot de passe requis' 
      });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ 
        error: 'Le nouveau mot de passe doit contenir au moins 6 caractères' 
      });
    }

    const admin = await prisma.admin.findUnique({
      where: { id: adminId },
    });

    if (!admin) {
      return res.status(404).json({ error: 'Admin introuvable' });
    }

    const isValid = await bcrypt.compare(currentPassword, admin.password);

    if (!isValid) {
      return res.status(401).json({ 
        error: 'Mot de passe actuel incorrect' 
      });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    await prisma.admin.update({
      where: { id: adminId },
      data: { password: hashedPassword },
    });

    res.json({
      message: 'Mot de passe changé avec succès',
    });
  } catch (error) {
    console.error('Erreur changement mot de passe:', error);
    res.status(500).json({ error: 'Erreur changement mot de passe' });
  }
};

/**
 * Mettre à jour un utilisateur
 */
const updateUser = async (req, res) => {
  try {
    const { userId } = req.params;
    const {
      email,
      phone,
      firstName,
      lastName,
      licenseType,
      licenseStatus,
      expirationDate,
      maxSimultaneousLogins,
      lastLoginIp,
    } = req.body;

    const user = await prisma.user.findUnique({ where: { id: userId } });

    if (!user) {
      return res.status(404).json({ error: 'Utilisateur introuvable' });
    }

    const updateData = {};

    if (email) updateData.email = email;
    if (phone) updateData.phone = phone;
    if (firstName) updateData.firstName = firstName;
    if (lastName) updateData.lastName = lastName;
    if (licenseType) updateData.licenseType = licenseType;
    if (licenseStatus) updateData.licenseStatus = licenseStatus;
    if (maxSimultaneousLogins !== undefined) updateData.maxSimultaneousLogins = maxSimultaneousLogins;
    if (lastLoginIp !== undefined) updateData.lastLoginIp = lastLoginIp || null;
    
    // Gestion de expirationDate
    if (expirationDate !== undefined) {
      if (expirationDate === '' || expirationDate === null) {
        updateData.expirationDate = null; // FREE = illimité
      } else {
        updateData.expirationDate = new Date(expirationDate);
      }
    }

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: updateData,
    });

    res.json({
      message: 'Utilisateur modifié avec succès',
      user: updatedUser,
    });
  } catch (error) {
    console.error('Erreur modification utilisateur:', error);
    res.status(500).json({ error: 'Erreur modification utilisateur' });
  }
};

/**
 * Supprimer un utilisateur
 */
const deleteUser = async (req, res) => {
  try {
    const { userId } = req.params;

    const user = await prisma.user.findUnique({ where: { id: userId } });

    if (!user) {
      return res.status(404).json({ error: 'Utilisateur introuvable' });
    }

    await prisma.user.delete({
      where: { id: userId },
    });

    res.json({
      message: 'Utilisateur supprimé avec succès',
    });
  } catch (error) {
    console.error('Erreur suppression utilisateur:', error);
    res.status(500).json({ error: 'Erreur suppression utilisateur' });
  }
};

module.exports = {
  loginAdmin,
  getAllUsers,
  getAllAdmins,
  upgradeToPremium,
  suspendUser,
  reactivateLicense,
  forceLogout,
  createAdmin,
  createUserFromAdmin,
  testEmail,
  sendManualEmail,
  sendManualEmailDebug,
  sendUserLicenseEmail,
  mailStatus,
  getPublishedInfos,
  getAllInfos,
  createInfo,
  updateInfo,
  deleteInfo,
  getProfile,
  changePassword,
  updateUser,
  deleteUser,
};
