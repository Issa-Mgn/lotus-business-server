const express = require('express');
const router = express.Router();
const prisma = require('../lib/prisma');
const auth = require('../middlewares/auth');
const isAdmin = require('../middlewares/isAdmin');
const { sendLegalUpdateEmails } = require('../services/brevoLegal');
const { sendPushNotifications } = require('../services/pushLegal');

// POST /admin/legal - créer un document légal et notifier les users
router.post('/admin/legal', auth, isAdmin, async (req, res) => {
  try {
    const { type, version, content } = req.body;
    if (!type || !version || !content) {
      return res.status(400).json({ error: 'type, version et content requis' });
    }

    const doc = await prisma.legalDocument.create({
      data: { type, version, content }
    });

    // Récupérer tous les users pour notifications
    const users = await prisma.user.findMany({ select: { id: true, email: true, firstName: true, lastName: true, expoPushToken: true } });

    // Envoyer emails et push (ne pas attendre pour tout terminer mais catch les erreurs)
    sendLegalUpdateEmails(users, doc).catch(err => console.error('Mail send error:', err));
    sendPushNotifications(users, doc).catch(err => console.error('Push send error:', err));

    return res.json({ success: true, documentId: doc.id });
  } catch (error) {
    console.error('POST /admin/legal error:', error);
    return res.status(500).json({ error: 'Erreur interne' });
  }
});

// GET /legal/latest - retourne les derniers CGU et PRIVACY_POLICY
router.get('/legal/latest', auth, async (req, res) => {
  try {
    // Dernière CGU
    const latestCgu = await prisma.legalDocument.findFirst({ where: { type: 'CGU' }, orderBy: { publishedAt: 'desc' } });
    const latestPrivacy = await prisma.legalDocument.findFirst({ where: { type: 'PRIVACY_POLICY' }, orderBy: { publishedAt: 'desc' } });

    const userId = req.userId;

    const acceptedCgu = latestCgu
      ? await prisma.userLegalAcceptance.findUnique({ where: { userId_documentId: { userId, documentId: latestCgu.id } } }).then(r => !!r)
      : false;

    const acceptedPrivacy = latestPrivacy
      ? await prisma.userLegalAcceptance.findUnique({ where: { userId_documentId: { userId, documentId: latestPrivacy.id } } }).then(r => !!r)
      : false;

    return res.json({
      cgu: latestCgu ? { ...latestCgu, accepted: acceptedCgu } : null,
      privacyPolicy: latestPrivacy ? { ...latestPrivacy, accepted: acceptedPrivacy } : null
    });
  } catch (error) {
    console.error('GET /legal/latest error:', error);
    return res.status(500).json({ error: 'Erreur interne' });
  }
});

// POST /legal/accept - l'utilisateur accepte un document
router.post('/legal/accept', auth, async (req, res) => {
  try {
    const { documentId } = req.body;
    if (!documentId) return res.status(400).json({ error: 'documentId requis' });

    const userId = req.userId;

    // Upsert: créer si n'existe pas
    await prisma.userLegalAcceptance.upsert({
      where: { userId_documentId: { userId, documentId } },
      update: { acceptedAt: new Date() },
      create: { userId, documentId }
    });

    return res.json({ success: true });
  } catch (error) {
    console.error('POST /legal/accept error:', error);
    return res.status(500).json({ error: 'Erreur interne' });
  }
});

// Public: servir fichiers statiques (si app ne le fait pas globalement)
router.get('/terms-of-service', (req, res) => {
  return res.sendFile('terms-of-service.html', { root: process.cwd() });
});

router.get('/privacy-policy', (req, res) => {
  return res.sendFile('privacy-policy.html', { root: process.cwd() });
});

module.exports = router;
