const prisma = require('../lib/prisma');
const kkiapayService = require('../services/kkiapayService');

/**
 * Vérifier et finaliser un paiement après succès côté widget KKiaPay
 * POST /api/payments/verify-and-upgrade
 *
 * Le flow KKiaPay est:
 *  1. App mobile ouvre le widget KKiaPay (avec la public key)
 *  2. L'utilisateur paie → KKiaPay renvoie un transactionId au client
 *  3. Le client envoie ce transactionId à ce endpoint
 *  4. Le backend vérifie le statut réel via le SDK KKiaPay
 *  5. Si SUCCESS → upgrade
 */
const verifyAndUpgrade = async (req, res) => {
  try {
    const userId = req.userId;
    const { transactionId, type, subscriptionType, backupId } = req.body;

    if (!transactionId) {
      return res.status(400).json({ error: 'transactionId requis' });
    }

    const validTypes = ['UPGRADE_PREMIUM', 'RENEW_PREMIUM', 'BACKUP_ACCESS'];
    if (!type || !validTypes.includes(type)) {
      return res.status(400).json({ error: 'type invalide', validTypes });
    }

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) return res.status(404).json({ error: 'Utilisateur introuvable' });

    // IDEMPOTENCE : Vérifier si déjà traité
    const existing = await prisma.paymentTransaction.findUnique({
      where: { transactionId },
    });
    if (existing) {
      return res.json({
        message: 'Paiement déjà traité',
        status: existing.status,
        transaction: existing,
      });
    }

    // Vérifier le statut réel via le SDK KKiaPay
    const verifyResult = await kkiapayService.verifyTransaction(transactionId);

    if (!verifyResult.success) {
      return res.status(502).json({
        error: 'Erreur vérification paiement KKiaPay',
        details: verifyResult.error,
      });
    }

    const amount = verifyResult.transaction?.amount || kkiapayService.getSubscriptionAmount(subscriptionType || 'MONTHLY');
    const subType = subscriptionType || (amount >= 10000 ? 'ANNUAL' : 'MONTHLY');

    if (!verifyResult.isPaid) {
      // Paiement échoué ou en attente → enregistrer pour traçabilité
      await prisma.paymentTransaction.create({
        data: {
          userId,
          provider: 'KKIAPAY',
          transactionId,
          amount,
          status: 'FAILED',
          subscriptionType: subType,
          metadata: { type, raw: verifyResult.transaction },
        },
      });

      return res.status(400).json({
        error: 'Paiement non confirmé',
        status: verifyResult.status,
      });
    }

    // Paiement confirmé → traiter
    const expirationDate = kkiapayService.calculateExpirationDate(new Date(), subType);

    await prisma.$transaction(async (tx) => {
      // 1. Upgrade ou action selon le type
      if (type === 'UPGRADE_PREMIUM' || type === 'RENEW_PREMIUM') {
        await tx.user.update({
          where: { id: userId },
          data: {
            licenseType: 'PREMIUM',
            licenseStatus: 'ACTIVE',
            subscriptionType: subType,
            activationDate: new Date(),
            expirationDate,
            maxSimultaneousLogins: 999,
          },
        });

        // Rendre tous les backups accessibles
        await tx.userBackup.updateMany({
          where: { userId, isAccessible: false },
          data: { isAccessible: true, accessGrantedAt: new Date() },
        });
      } else if (type === 'BACKUP_ACCESS' && backupId) {
        await tx.userBackup.update({
          where: { id: backupId },
          data: { isAccessible: true, accessGrantedAt: new Date() },
        });
      }

      // 2. Enregistrer la transaction
      await tx.paymentTransaction.create({
        data: {
          userId,
          provider: 'KKIAPAY',
          transactionId,
          amount,
          status: 'SUCCESS',
          subscriptionType: subType,
          metadata: { type, raw: verifyResult.transaction },
        },
      });

      // 3. Notification in-app
      await tx.notification.create({
        data: {
          type: 'USER_UPGRADED',
          title: '🎉 Compte Premium activé',
          message: `Votre compte a été upgradé vers Premium ${subType === 'ANNUAL' ? 'Annuel' : 'Mensuel'}. Profitez de toutes les fonctionnalités !`,
          userId,
        },
      });

      // 4. Log d'activité
      const firstAdmin = await tx.admin.findFirst();
      if (firstAdmin) {
        await tx.activityLog.create({
          data: {
            type: 'LICENSE_UPGRADED',
            description: `Upgrade automatique PREMIUM ${subType} via KKiaPay (${amount} FCFA)`,
            adminId: firstAdmin.id,
            targetId: userId,
            metadata: JSON.stringify({ source: 'AUTO_KKIAPAY', transactionId, amount }),
          },
        });
      }
    });

    // Email de confirmation (non bloquant)
    try {
      const mailService = require('../services/mailService');
      await mailService.sendCustomEmail(
        user.email, '',
        '🎉 Lotus Business Premium activé !',
        `<p>Bonjour ${user.firstName},</p>
         <p>Votre compte est maintenant <strong>Premium ${subType === 'ANNUAL' ? 'Annuel' : 'Mensuel'}</strong>.</p>
         <p>Montant payé : <strong>${amount} FCFA</strong></p>
         <p>Valide jusqu'au : <strong>${expirationDate.toLocaleDateString('fr-FR')}</strong></p>`,
        `Lotus Business Premium activé. Montant : ${amount} FCFA.`
      );
    } catch (emailErr) {
      console.error('[Payment] Email non envoyé:', emailErr.message);
    }

    const updatedUser = await prisma.user.findUnique({ where: { id: userId } });

    return res.json({
      message: 'Paiement confirmé et compte upgradé !',
      status: 'SUCCESS',
      type,
      subscriptionType: subType,
      expirationDate: type !== 'BACKUP_ACCESS' ? expirationDate : undefined,
      user: updatedUser,
    });

  } catch (error) {
    console.error('[Payment] Erreur verifyAndUpgrade:', error);
    res.status(500).json({
      error: 'Erreur traitement paiement',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
};

/**
 * Webhook KKiaPay (server-to-server)
 * POST /api/payments/webhook
 */
const handleWebhook = async (req, res) => {
  try {
    const signature = req.headers['x-kkiapay-signature'];
    const payload   = req.body;

    console.log('[Payment] Webhook reçu:', { transactionId: payload.transactionId, status: payload.status });

    // Vérification de signature si présente
    if (signature && !kkiapayService.verifyWebhookSignature(signature, payload)) {
      console.error('[Payment] Signature webhook invalide');
      return res.status(400).json({ error: 'Signature invalide' });
    }

    const { transactionId } = payload;
    if (!transactionId) {
      return res.status(400).json({ error: 'transactionId manquant' });
    }

    // Idempotence
    const existing = await prisma.paymentTransaction.findUnique({ where: { transactionId } });
    if (existing) {
      console.log('[Payment] Webhook déjà traité (idempotence):', transactionId);
      return res.json({ message: 'Déjà traité' });
    }

    // Double vérification via SDK KKiaPay
    const verifyResult = await kkiapayService.verifyTransaction(transactionId);

    if (!verifyResult.success || !verifyResult.isPaid) {
      await prisma.paymentTransaction.create({
        data: {
          userId: payload.metadata?.userId || 'unknown',
          provider: 'KKIAPAY',
          transactionId,
          amount: payload.amount || 0,
          status: 'FAILED',
          metadata: payload,
        },
      }).catch(() => {}); // ignore si userId invalide

      return res.json({ message: 'Transaction non confirmée' });
    }

    const userId = payload.metadata?.userId || payload.userId;
    if (!userId) {
      console.error('[Payment] userId manquant dans webhook');
      return res.status(400).json({ error: 'userId manquant dans metadata' });
    }

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) return res.status(404).json({ error: 'Utilisateur introuvable' });

    const amount = parseInt(payload.amount) || 999;
    const subType = amount >= 10000 ? 'ANNUAL' : 'MONTHLY';
    const expirationDate = kkiapayService.calculateExpirationDate(new Date(), subType);

    await prisma.$transaction(async (tx) => {
      await tx.user.update({
        where: { id: userId },
        data: {
          licenseType: 'PREMIUM',
          licenseStatus: 'ACTIVE',
          subscriptionType: subType,
          activationDate: new Date(),
          expirationDate,
          maxSimultaneousLogins: 999,
        },
      });

      await tx.userBackup.updateMany({
        where: { userId, isAccessible: false },
        data: { isAccessible: true, accessGrantedAt: new Date() },
      });

      await tx.paymentTransaction.create({
        data: {
          userId,
          provider: 'KKIAPAY',
          transactionId,
          amount,
          status: 'SUCCESS',
          subscriptionType: subType,
          metadata: payload,
        },
      });

      await tx.notification.create({
        data: {
          type: 'USER_UPGRADED',
          title: '🎉 Compte Premium activé',
          message: `Upgrade automatique via KKiaPay. Premium ${subType === 'ANNUAL' ? 'Annuel' : 'Mensuel'}.`,
          userId,
        },
      });

      const firstAdmin = await tx.admin.findFirst();
      if (firstAdmin) {
        await tx.activityLog.create({
          data: {
            type: 'LICENSE_UPGRADED',
            description: `Upgrade PREMIUM ${subType} via webhook KKiaPay (${amount} FCFA)`,
            adminId: firstAdmin.id,
            targetId: userId,
            metadata: JSON.stringify({ source: 'AUTO_KKIAPAY', transactionId, amount }),
          },
        });
      }
    });

    console.log('[Payment] Webhook traité avec succès:', userId);
    res.json({ message: 'OK' });

  } catch (error) {
    console.error('[Payment] Erreur webhook:', error);
    res.status(500).json({ error: 'Erreur traitement webhook' });
  }
};

/**
 * Historique des paiements d'un utilisateur
 * GET /api/payments/history
 */
const getPaymentHistory = async (req, res) => {
  try {
    const transactions = await prisma.paymentTransaction.findMany({
      where: { userId: req.userId },
      orderBy: { createdAt: 'desc' },
    });
    res.json({ count: transactions.length, transactions });
  } catch (error) {
    console.error('[Payment] Erreur historique:', error);
    res.status(500).json({ error: 'Erreur récupération historique' });
  }
};

/**
 * [ADMIN] Toutes les transactions
 * GET /api/payments/admin/transactions
 */
const getAllTransactions = async (req, res) => {
  try {
    const { provider, status, limit = 100 } = req.query;
    const where = {};
    if (provider) where.provider = provider;
    if (status)   where.status   = status;

    const transactions = await prisma.paymentTransaction.findMany({
      where,
      include: {
        user: {
          select: { id: true, email: true, firstName: true, lastName: true, licenseType: true, phone: true },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: parseInt(limit),
    });

    const stats = await prisma.paymentTransaction.groupBy({
      by: ['provider', 'status'],
      _count: true,
      _sum: { amount: true },
    });

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
    console.error('[Payment] Erreur transactions admin:', error);
    res.status(500).json({ error: 'Erreur récupération transactions' });
  }
};

/**
 * [ADMIN] Tous les paiements (table payments)
 * GET /api/payments/admin/all
 */
const getAllPayments = async (req, res) => {
  try {
    const { status, limit = 100 } = req.query;
    const where = {};
    if (status) where.status = status;

    const payments = await prisma.payment.findMany({
      where,
      include: {
        user: { select: { id: true, email: true, firstName: true, lastName: true, licenseType: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: parseInt(limit),
    });

    res.json({ count: payments.length, payments });
  } catch (error) {
    console.error('[Payment] Erreur paiements admin:', error);
    res.status(500).json({ error: 'Erreur récupération paiements' });
  }
};

/**
 * [ADMIN] Accorder accès backup manuellement
 * POST /api/payments/admin/grant-backup-access
 */
const grantBackupAccess = async (req, res) => {
  try {
    const { backupId, userId } = req.body;
    if (!backupId || !userId) return res.status(400).json({ error: 'backupId et userId requis' });

    const backup = await prisma.userBackup.findFirst({ where: { id: backupId, userId } });
    if (!backup) return res.status(404).json({ error: 'Backup introuvable' });
    if (backup.isAccessible) return res.status(400).json({ error: 'Backup déjà accessible' });

    const updatedBackup = await prisma.userBackup.update({
      where: { id: backupId },
      data: { isAccessible: true, accessGrantedAt: new Date() },
    });

    await prisma.paymentTransaction.create({
      data: {
        userId,
        provider: 'MANUAL_ADMIN',
        transactionId: null,
        amount: 0,
        status: 'SUCCESS',
        metadata: { backupId, grantedBy: req.userId, note: 'Accès accordé manuellement' },
      },
    });

    res.json({ message: 'Accès au backup accordé', backup: updatedBackup });
  } catch (error) {
    console.error('[Payment] Erreur grant backup:', error);
    res.status(500).json({ error: 'Erreur grant backup access' });
  }
};

module.exports = {
  verifyAndUpgrade,
  handleWebhook,
  getPaymentHistory,
  getAllTransactions,
  getAllPayments,
  grantBackupAccess,
};
