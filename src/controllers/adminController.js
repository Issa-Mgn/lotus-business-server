const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const prisma = require('../lib/prisma');
const { sendMail } = require('../lib/sendMail');
const { welcomeTemplate, welcomeTemplateText } = require('../templates/welcome');

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
    const newExpirationDate = new Date();

    if (licenseType === 'FREE') {
      newExpirationDate.setMonth(newExpirationDate.getMonth() + 1);
    } else if (licenseType === 'PREMIUM') {
      newExpirationDate.setFullYear(newExpirationDate.getFullYear() + 1);
    }

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        licenseType,
        licenseStatus: 'ACTIVE',
        activationDate: newActivationDate,
        expirationDate: newExpirationDate,
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

const testEmail = async (req, res) => {
  try {
    const admin = await prisma.admin.findUnique({
      where: { id: req.userId },
      select: publicAdminFields,
    });
    const to = req.body?.email || admin?.email || process.env.MAIL_USER;

    if (!to) {
      return res.status(400).json({ error: 'Aucun email destinataire disponible' });
    }

    const result = await sendMail(
      to,
      'Test email Lotus Business',
      '<p>Le service email Lotus Business fonctionne correctement.</p>',
      'Le service email Lotus Business fonctionne correctement.'
    );

    if (!result.success) {
      return res.status(502).json({
        error: 'Echec envoi email',
        detail: result.error,
      });
    }

    res.json({
      message: 'Email de test envoyé',
      to,
      messageId: result.messageId,
    });
  } catch (error) {
    console.error('Erreur test email:', error);
    res.status(500).json({ error: 'Erreur test email' });
  }
};

const sendManualEmail = async (req, res) => {
  try {
    const { recipientType, recipientId, email, subject, message } = req.body;

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

    const result = await sendMail(
      recipientEmail,
      subject,
      buildManualEmailHtml(message),
      message
    );

    if (!result.success) {
      return res.status(502).json({
        error: 'Echec envoi email',
        detail: result.error,
      });
    }

    res.json({
      message: 'Email envoyé',
      to: recipientEmail,
      messageId: result.messageId,
    });
  } catch (error) {
    console.error('Erreur envoi email manuel:', error);
    res.status(500).json({ error: 'Erreur envoi email manuel' });
  }
};

const sendUserLicenseEmail = async (req, res) => {
  try {
    const { userId } = req.body;

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

    const result = await sendMail(
      user.email,
      'Votre licence Lotus Business',
      welcomeTemplate(user.firstName || 'Utilisateur', user.licenseKey, user.expirationDate),
      welcomeTemplateText(user.firstName || 'Utilisateur', user.licenseKey, user.expirationDate)
    );

    if (!result.success) {
      return res.status(502).json({
        error: 'Echec envoi email',
        detail: result.error,
      });
    }

    res.json({
      message: 'Email de licence envoyé',
      to: user.email,
      messageId: result.messageId,
    });
  } catch (error) {
    console.error('Erreur envoi email licence:', error);
    res.status(500).json({ error: 'Erreur envoi email licence' });
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
  testEmail,
  sendManualEmail,
  sendUserLicenseEmail,
};
