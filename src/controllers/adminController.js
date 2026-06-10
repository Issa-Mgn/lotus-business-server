const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const prisma = require('../lib/prisma');
const { sendMail } = require('../lib/sendMail');

const publicAdminFields = {
  id: true,
  email: true,
  phone: true,
  createdAt: true,
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
};
