/**
 * Contrôleur pour la génération de documents comptables (Premium uniquement)
 */

const prisma = require('../lib/prisma');
const aiService = require('../services/aiService');

/**
 * Génère un compte de résultat
 * POST /api/documents/compte-resultat
 */
const generateCompteResultat = async (req, res) => {
  try {
    const userId = req.userId;
    const { periode, dateDebut, dateFin } = req.body;

    // Vérifier que l'utilisateur est PREMIUM
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { licenseType: true, email: true }
    });

    if (!user || user.licenseType !== 'PREMIUM') {
      return res.status(403).json({ 
        error: 'Cette fonctionnalité est réservée aux abonnés Premium' 
      });
    }

    // TODO: Récupérer les vraies données depuis la base de données
    // Pour l'instant, données de démonstration
    const chiffreAffaires = 500000; // À remplacer par vraies données
    const coutAchat = 300000;
    const chargesDiverses = 50000;

    console.log(`📊 Génération compte de résultat pour ${user.email}`);

    const result = await aiService.generateCompteResultat({
      chiffreAffaires,
      coutAchat,
      chargesDiverses,
      periode: periode || `${dateDebut} - ${dateFin}`,
      devise: 'FCFA'
    });

    res.json({
      message: 'Compte de résultat généré avec succès',
      provider: result.provider,
      document: result.data
    });

  } catch (error) {
    console.error('Erreur génération compte de résultat:', error);
    res.status(500).json({ 
      error: 'Erreur lors de la génération du document',
      details: error.message 
    });
  }
};

/**
 * Génère un bilan simplifié
 * POST /api/documents/bilan
 */
const generateBilan = async (req, res) => {
  try {
    const userId = req.userId;
    const { periode, dateDebut, dateFin } = req.body;

    // Vérifier que l'utilisateur est PREMIUM
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { licenseType: true, email: true }
    });

    if (!user || user.licenseType !== 'PREMIUM') {
      return res.status(403).json({ 
        error: 'Cette fonctionnalité est réservée aux abonnés Premium' 
      });
    }

    // TODO: Récupérer les vraies données depuis la base de données
    const stockFinal = 100000;
    const tresorerie = 200000;

    console.log(`📊 Génération bilan pour ${user.email}`);

    const result = await aiService.generateBilanSimplifie({
      stockFinal,
      tresorerie,
      periode: periode || `${dateDebut} - ${dateFin}`,
      devise: 'FCFA'
    });

    res.json({
      message: 'Bilan simplifié généré avec succès',
      provider: result.provider,
      document: result.data
    });

  } catch (error) {
    console.error('Erreur génération bilan:', error);
    res.status(500).json({ 
      error: 'Erreur lors de la génération du document',
      details: error.message 
    });
  }
};

/**
 * Génère une fiche de stock
 * POST /api/documents/fiche-stock
 */
const generateFicheStock = async (req, res) => {
  try {
    const userId = req.userId;
    const { produitNom, periode, dateDebut, dateFin } = req.body;

    // Vérifier que l'utilisateur est PREMIUM
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { licenseType: true, email: true }
    });

    if (!user || user.licenseType !== 'PREMIUM') {
      return res.status(403).json({ 
        error: 'Cette fonctionnalité est réservée aux abonnés Premium' 
      });
    }

    if (!produitNom) {
      return res.status(400).json({ error: 'Le nom du produit est requis' });
    }

    // TODO: Récupérer les vraies données depuis la base de données
    const stockInitial = 50;
    const entrees = 100;
    const sorties = 80;

    console.log(`📊 Génération fiche de stock pour ${user.email} - Produit: ${produitNom}`);

    const result = await aiService.generateFicheStock({
      produitNom,
      stockInitial,
      entrees,
      sorties,
      periode: periode || `${dateDebut} - ${dateFin}`
    });

    res.json({
      message: 'Fiche de stock générée avec succès',
      provider: result.provider,
      document: result.data
    });

  } catch (error) {
    console.error('Erreur génération fiche de stock:', error);
    res.status(500).json({ 
      error: 'Erreur lors de la génération du document',
      details: error.message 
    });
  }
};

/**
 * Test de disponibilité des services IA
 * GET /api/documents/test-ai
 */
const testAI = async (req, res) => {
  try {
    console.log('🧪 Test des services IA...');
    const results = await aiService.testAIServices();
    
    res.json({
      message: 'Test des services IA terminé',
      results
    });

  } catch (error) {
    console.error('Erreur test IA:', error);
    res.status(500).json({ 
      error: 'Erreur lors du test des services IA',
      details: error.message 
    });
  }
};

module.exports = {
  generateCompteResultat,
  generateBilan,
  generateFicheStock,
  testAI
};
