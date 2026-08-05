const prisma = require('../lib/prisma');
const kkiapayService = require('../services/kkiapayService');

/**
 * Créer une intention de paiement
 * POST /api/payments/create
 */
const createPayment = async (req, res) => {
  try {
    const userId = req.userId; // depuis le middleware auth
    const { type, subscriptionType, backupId, phone } = req.body;

    // Validation du type de paiement
    const validTypes = ['UPGRADE_PREMIUM', 'RENEW_PREMIUM', 'BACKUP_ACCESS'];
    if (!type || !validTypes.includes(type)) {
      return res.status(400).json({ 
        error: 'Type de paiement invalide',
        validTypes,
      });
    }

    // Récupérer l'utilisateur
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      return res.status(404).json({ error: 'Utilisateur introuvable' });
    }

    // Calculer le montant selon le type de paiement
    let amount = 0;
    let reason = '';
    let metadata = { userId, type };

    if (type === 'UPGRADE_PREMIUM' || type === 'RENEW_PREMIUM') {
      const subType = subscriptionType || 'MONTHLY';
      amount = kkiapayService.getSubscriptionAmount(subType);
      reason = subType === 'ANNUAL' 
        ? 'Lotus Business - Abonnement Premium Annuel (10000 FCFA)'
        : 'Lotus Business - Abonnement Premium Mensuel (999 FCFA)';
      metadata.subscriptionType = subType;
    } else if (type === 'BACKUP_ACCESS') {
      if (!backupId) {
        return res.status(400).json({ error: 'backupId requis pour BACKUP_ACCESS' });
      }
      
      // Vérifier que le backup existe et appartient à l'utilisateur
      const backup = await prisma.userBackup.findFirst({
        where: { id: backupId, userId },
      });

      if (!backup) {
        return res.status(404).json({ error: 'Backup introuvable' });
      }

      if (backup.isAccessible) {
        return res.status(400).json({ error: 'Ce backup est déjà accessible' });
      }

      amount = 999; // Prix pour accéder à un backup
      reason = 'Lotus Business - Accès Backup';
      metadata.backupId = backupId;
    }

    // Créer le paiement dans la DB
    const payment = await prisma.payment.create({
      data: {
        userId,
        amount,
        currency: 'XOF',
        type,
        status: 'PENDING',
        metadata,
      },
    });

    // Initialiser le paiement KKiaPay
    const paymentPhone = phone || user.phone;
    const kkiapayResult = await kkiapayService.initializePayment({
      amount,
      reason,
      firstName: user.firstName,
      lastName: user.lastName,
      phone: paymentPhone,
      email: user.email,
      metadata: {
        paymentId: payment.id,
        userId: user.id,
      },
    });

    if (!kkiapayResult.success) {
      // Marquer le paiement comme échoué
      await prisma.payment.update({
        where: { id: payment.id },
        data: { 
          status: 'FAILED',
          metadata: {
            ...metadata,
            error: kkiapayResult.error,
          },
        },
      });

      return res.status(502).json({ 
        error: 'Erreur initialisation paiement',
        details: kkiapayResult.error,
      });
    }

    // Mettre à jour le paiement avec le transactionId
    const updatedPayment = await prisma.payment.update({
      where: { id: payment.id },
      data: { 
        transactionId: kkiapayResult.transactionId,
      },
    });

    res.json({
      message: 'Paiement initialisé',
      payment: updatedPayment,
      transactionId: kkiapayResult.transactionId,
      paymentUrl: kkiapayResult.paymentUrl,
    });
  } catch (error) {
    console.error('[Payment] Erreur création paiement:', error);
    res.status(500).json({ 
      error: 'Erreur création paiement',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
};

/**
 * Vérifier le statut d'un paiement
 * GET /api/payments/verify/:transactionId
 */
const verifyPayment = async (req, res) => {
  try {
    const { transactionId } = req.params;
    const userId = req.userId;

    // Récupérer le paiement dans la DB
    const payment = await prisma.payment.findUnique({
      where: { transactionId },
      include: { user: true },
    });

    if (!payment) {
      return res.status(404).json({ error: 'Paiement introuvable' });
    }

    // Vérifier que le paiement appartient à l'utilisateur
    if (payment.userId !== userId && req.userType !== 'admin') {
      return res.status(403).json({ error: 'Accès non autorisé' });
    }

    // Si déjà SUCCESS, retourner le résultat
    if (payment.status === 'SUCCESS') {
      return res.json({
        message: 'Paiement déjà confirmé',
        payment,
        status: 'SUCCESS',
      });
    }

    // Vérifier auprès de KKiaPay
    const kkiapayResult = await kkiapayService.verifyPayment(transactionId);

    if (!kkiapayResult.success) {
      return res.status(502).json({ 
        error: 'Erreur vérification paiement',
        details: kkiapayResult.error,
      });
    }

    // Mettre à jour le statut dans la DB
    if (kkiapayResult.isPaid && payment.status !== 'SUCCESS') {
      // Traiter le paiement confirmé
      await processSuccessfulPayment(payment, kkiapayResult.transaction);
    }

    // Récupérer le paiement mis à jour
    const updatedPayment = await prisma.payment.findUnique({
      where: { id: payment.id },
      include: { user: true },
    });

    res.json({
      message: kkiapayResult.isPaid ? 'Paiement confirmé' : 'Paiement en attente',
      payment: updatedPayment,
      status: kkiapayResult.status,
    });
  } catch (error) {
    console.error('[Payment] Erreur vérification paiement:', error);
    res.status(500).json({ 
      error: 'Erreur vérification paiement',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
};

/**
 * Webhook KKiaPay
 * POST /api/payments/webhook
 */
const handleWebhook = async (req, res) => {
  try {
    const signature = req.headers['x-kkiapay-signature'];
    const payload = req.body;

    console.log('[Payment] Webhook KKiaPay reçu:', {
      transactionId: payload.transactionId,
      status: payload.status,
    });

    // Vérifier la signature
    const webhookResult = await kkiapayService.handleWebhook(payload, signature);

    if (!webhookResult.success) {
      console.error('[Payment] Webhook invalide:', webhookResult.error);
      return res.status(400).json({ error: 'Webhook invalide' });
    }

    const { transactionId } = payload;

    // IDEMPOTENCE : Vérifier si cette transaction a déjà été traitée
    const existingTransaction = await prisma.paymentTransaction.findUnique({
      where: { transactionId },
    });

    if (existingTransaction) {
      console.log('[Payment] Transaction déjà traitée (idempotence):', transactionId);
      return res.json({ message: 'Transaction déjà traitée' });
    }

    // Vérifier le statut réel de la transaction auprès de KKiaPay (ne pas faire confiance au webhook seul)
    const verifyResult = await kkiapayService.verifyPayment(transactionId);

    if (!verifyResult.success || !verifyResult.isPaid) {
      console.error('[Payment] Transaction non confirmée:', transactionId);
      
      // Créer un enregistrement FAILED pour traçabilité
      await prisma.paymentTransaction.create({
        data: {
          userId: payload.metadata?.userId || 'unknown',
          provider: 'KKIAPAY',
          transactionId,
          amount: payload.amount || 0,
          status: 'FAILED',
          metadata: payload,
        },
      });

      return res.json({ message: 'Transaction non confirmée' });
    }

    // Récupérer l'utilisateur depuis les metadata
    const userId = payload.metadata?.userId || payload.userId;
    
    if (!userId) {
      console.error('[Payment] userId manquant dans le webhook');
      return res.status(400).json({ error: 'userId manquant' });
    }

    const user = await prisma.user.findUnique({ where: { id: userId } });

    if (!user) {
      console.error('[Payment] Utilisateur introuvable:', userId);
      return res.status(404).json({ error: 'Utilisateur introuvable' });
    }

    // Déterminer le type d'abonnement selon le montant
    const amount = parseInt(payload.amount) || 0;
    let subscriptionType = 'MONTHLY';
    let expirationDate = new Date();

    if (amount >= 10000) {
      subscriptionType = 'ANNUAL';
      expirationDate.setFullYear(expirationDate.getFullYear() + 1);
    } else {
      expirationDate.setMonth(expirationDate.getMonth() + 1);
    }

    // Transaction atomique : Upgrade user + créer PaymentTransaction
    await prisma.$transaction(async (tx) => {
      // 1. Upgrade l'utilisateur vers PREMIUM
      await tx.user.update({
        where: { id: userId },
        data: {
          licenseType: 'PREMIUM',
          licenseStatus: 'ACTIVE',
          subscriptionType,
          activationDate: new Date(),
          expirationDate,
          maxSimultaneousLogins: 999,
        },
      });

      // 2. Rendre tous les backups accessibles
      await tx.userBackup.updateMany({
        where: { userId, isAccessible: false },
        data: {
          isAccessible: true,
          accessGrantedAt: new Date(),
        },
      });

      // 3. Créer l'enregistrement PaymentTransaction
      await tx.paymentTransaction.create({
        data: {
          userId,
          provider: 'KKIAPAY',
          transactionId,
          amount,
          status: 'SUCCESS',
          subscriptionType,
          metadata: payload,
        },
      });

      // 4. Créer une notification pour l'utilisateur
      await tx.notification.create({
        data: {
          type: 'USER_UPGRADED',
          title: 'Félicitations ! Compte Premium activé',
          message: `Votre compte a été upgradé vers Premium ${subscriptionType === 'ANNUAL' ? 'Annuel' : 'Mensuel'}. Profitez de toutes les fonctionnalités !`,
          userId,
        },
      });

      // 5. Log dans ActivityLog (besoin d'un admin fictif pour la relation)
      // Trouver le premier admin pour les logs automatiques
      const firstAdmin = await tx.admin.findFirst();
      if (firstAdmin) {
        await tx.activityLog.create({
          data: {
            type: 'LICENSE_UPGRADED',
            description: `Upgrade automatique vers PREMIUM ${subscriptionType} via KKiaPay (${amount} FCFA)`,
            adminId: firstAdmin.id,
            targetId: userId,
            metadata: JSON.stringify({
              source: 'AUTO_KKIAPAY',
              transactionId,
              amount,
              subscriptionType,
            }),
          },
        });
      }
    });

    // Envoyer email de confirmation (asynchrone, ne pas bloquer la réponse)
    try {
      const mailService = require('../services/mailService');
      await mailService.sendCustomEmail(
        user.email,
        '',
        'Bienvenue dans Lotus Business Premium !',
        `<h2>Félicitations ${user.firstName} !</h2>
         <p>Votre compte a été upgradé vers Premium ${subscriptionType === 'ANNUAL' ? 'Annuel' : 'Mensuel'}.</p>
         <p>Montant : ${amount} FCFA</p>
         <p>Valide jusqu'au : ${expirationDate.toLocaleDateString('fr-FR')}</p>
         <p>Vous avez maintenant accès à toutes les fonctionnalités Premium !</p>`,
        `Félicitations ! Votre compte Premium est activé.`
      );
    } catch (emailError) {
      console.error('[Payment] Erreur envoi email:', emailError);
      // Ne pas bloquer le webhook si l'email échoue
    }

    console.log('[Payment] Upgrade automatique réussi:', userId);
    res.json({ message: 'Webhook traité avec succès' });
    
  } catch (error) {
    console.error('[Payment] Erreur traitement webhook:', error);
    res.status(500).json({ error: 'Erreur traitement webhook' });
  }
};

/**
 * Récupérer l'historique des paiements d'un utilisateur
 * GET /api/payments/history
 */
const getPaymentHistory = async (req, res) => {
  try {
    const userId = req.userId;

    const payments = await prisma.payment.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });

    res.json({
      count: payments.length,
      payments,
    });
  } catch (error) {
    console.error('[Payment] Erreur récupération historique:', error);
    res.status(500).json({ error: 'Erreur récupération historique' });
  }
};

/**
 * [ADMIN] Récupérer tous les paiements
 * GET /api/payments/admin/all
 */
const getAllPayments = async (req, res) => {
  try {
    const { status, type, limit = 100 } = req.query;

    const where = {};
    if (status) where.status = status;
    if (type) where.type = type;

    const payments = await prisma.payment.findMany({
      where,
      include: {
        user: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            licenseType: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: parseInt(limit),
    });

    const stats = await prisma.payment.groupBy({
      by: ['status'],
      _count: true,
      _sum: { amount: true },
    });

    res.json({
      count: payments.length,
      payments,
      stats,
    });
  } catch (error) {
    console.error('[Payment] Erreur récupération paiements admin:', error);
    res.status(500).json({ error: 'Erreur récupération paiements' });
  }
};

/**
 * [ADMIN] Accorder l'accès à un backup manuellement
 * POST /api/payments/admin/grant-backup-access
 */
const grantBackupAccess = async (req, res) => {
  try {
    const { backupId, userId } = req.body;

    if (!backupId || !userId) {
      return res.status(400).json({ error: 'backupId et userId requis' });
    }

    // Vérifier que le backup existe et appartient à l'utilisateur
    const backup = await prisma.userBackup.findFirst({
      where: { id: backupId, userId },
    });

    if (!backup) {
      return res.status(404).json({ error: 'Backup introuvable' });
    }

    if (backup.isAccessible) {
      return res.status(400).json({ error: 'Ce backup est déjà accessible' });
    }

    // Accorder l'accès
    const updatedBackup = await prisma.userBackup.update({
      where: { id: backupId },
      data: {
        isAccessible: true,
        accessGrantedAt: new Date(),
      },
    });

    // Créer un paiement manuel pour traçabilité
    await prisma.payment.create({
      data: {
        userId,
        amount: 0,
        currency: 'XOF',
        type: 'BACKUP_ACCESS',
        status: 'SUCCESS',
        method: 'admin_grant',
        completedAt: new Date(),
        metadata: {
          backupId,
          grantedBy: req.userId, // Admin qui accorde l'accès
          note: 'Accès accordé manuellement par admin',
        },
      },
    });

    res.json({
      message: 'Accès au backup accordé',
      backup: updatedBackup,
    });
  } catch (error) {
    console.error('[Payment] Erreur grant backup access:', error);
    res.status(500).json({ error: 'Erreur grant backup access' });
  }
};

/**
 * Fonction utilitaire : Traiter un paiement réussi
 */
async function processSuccessfulPayment(payment, transactionData) {
  try {
    console.log('[Payment] Traitement paiement réussi:', payment.id);

    const metadata = payment.metadata || {};

    // Mettre à jour le statut du paiement
    await prisma.payment.update({
      where: { id: payment.id },
      data: {
        status: 'SUCCESS',
        method: transactionData.method || transactionData.paymentMethod,
        completedAt: new Date(),
        metadata: {
          ...metadata,
          transactionData,
        },
      },
    });

    // Traiter selon le type de paiement
    if (payment.type === 'UPGRADE_PREMIUM') {
      await upgradeToPremium(payment.userId, metadata.subscriptionType || 'MONTHLY');
    } else if (payment.type === 'RENEW_PREMIUM') {
      await renewPremium(payment.userId, metadata.subscriptionType || 'MONTHLY');
    } else if (payment.type === 'BACKUP_ACCESS') {
      await grantBackupAccessById(metadata.backupId);
    }

    console.log('[Payment] Paiement traité avec succès:', payment.id);
  } catch (error) {
    console.error('[Payment] Erreur traitement paiement:', error);
    throw error;
  }
}

/**
 * Upgrade un utilisateur vers PREMIUM
 */
async function upgradeToPremium(userId, subscriptionType) {
  const expirationDate = kkiapayService.calculateExpirationDate(new Date(), subscriptionType);

  await prisma.user.update({
    where: { id: userId },
    data: {
      licenseType: 'PREMIUM',
      licenseStatus: 'ACTIVE',
      subscriptionType,
      activationDate: new Date(),
      expirationDate,
      maxSimultaneousLogins: 999,
    },
  });

  // Rendre tous les backups accessibles
  await prisma.userBackup.updateMany({
    where: { userId, isAccessible: false },
    data: {
      isAccessible: true,
      accessGrantedAt: new Date(),
    },
  });

  console.log('[Payment] Utilisateur upgradé vers PREMIUM:', userId);
}

/**
 * Renouveler l'abonnement PREMIUM
 */
async function renewPremium(userId, subscriptionType) {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  
  if (!user) {
    throw new Error('Utilisateur introuvable');
  }

  // Calculer la nouvelle date d'expiration
  const currentExpiration = user.expirationDate && new Date(user.expirationDate) > new Date()
    ? new Date(user.expirationDate)
    : new Date();

  const newExpirationDate = kkiapayService.calculateExpirationDate(currentExpiration, subscriptionType);

  await prisma.user.update({
    where: { id: userId },
    data: {
      licenseType: 'PREMIUM',
      licenseStatus: 'ACTIVE',
      subscriptionType,
      expirationDate: newExpirationDate,
      maxSimultaneousLogins: 999,
    },
  });

  console.log('[Payment] Abonnement PREMIUM renouvelé:', userId);
}

/**
 * Accorder l'accès à un backup spécifique
 */
async function grantBackupAccessById(backupId) {
  await prisma.userBackup.update({
    where: { id: backupId },
    data: {
      isAccessible: true,
      accessGrantedAt: new Date(),
    },
  });

  console.log('[Payment] Accès backup accordé:', backupId);
}

/**
 * [ADMIN] Récupérer toutes les transactions de paiement (auto + manuelles)
 * GET /api/payments/admin/transactions
 */
const getAllTransactions = async (req, res) => {
  try {
    const { provider, status, limit = 100 } = req.query;

    const where = {};
    if (provider) where.provider = provider;
    if (status) where.status = status;

    const transactions = await prisma.paymentTransaction.findMany({
      where,
      include: {
        user: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            licenseType: true,
            phone: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: parseInt(limit),
    });

    // Statistiques
    const stats = await prisma.paymentTransaction.groupBy({
      by: ['provider', 'status'],
      _count: true,
      _sum: { amount: true },
    });

    // Total revenus
    const totalRevenue = await prisma.paymentTransaction.aggregate({
      where: { status: 'SUCCESS' },
      _sum: { amount: true },
    });

    res.json({
      count: transactions.length,
      transactions,
      stats,
      totalRevenue: totalRevenue._sum.amount || 0,
    });
  } catch (error) {
    console.error('[Payment] Erreur récupération transactions:', error);
    res.status(500).json({ error: 'Erreur récupération transactions' });
  }
};

module.exports = {
  createPayment,
  verifyPayment,
  handleWebhook,
  getPaymentHistory,
  getAllPayments,
  getAllTransactions, // Nouvelle fonction
  grantBackupAccess,
};
