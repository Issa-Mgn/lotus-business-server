const prisma = require('../lib/prisma');
const ImageKit = require('imagekit');

const imagekit = new ImageKit({
  publicKey:   process.env.IMAGEKIT_PUBLIC_KEY,
  privateKey:  process.env.IMAGEKIT_PRIVATE_KEY,
  urlEndpoint: process.env.IMAGEKIT_URL_ENDPOINT,
});

// ─── Helpers ────────────────────────────────────────────────────────────────

/**
 * Upload une image base64 vers ImageKit
 * @param {string} base64 - "data:image/jpeg;base64,..." ou raw base64
 * @param {string} fileName
 * @param {string} folder
 */
async function uploadImage(base64, fileName, folder = '/marketing') {
  // Extraire le contenu base64 pur
  const base64Data = base64.includes(',') ? base64.split(',')[1] : base64;
  const result = await imagekit.upload({
    file:   base64Data,
    fileName,
    folder,
    useUniqueFileName: true,
  });
  return { url: result.url, fileId: result.fileId };
}

async function deleteImage(fileId) {
  try {
    await imagekit.deleteFile(fileId);
  } catch (e) {
    console.error('[Marketing] Erreur suppression image ImageKit:', e.message);
  }
}

// ─── BOUTIQUE ────────────────────────────────────────────────────────────────

/**
 * GET /api/marketing/shop  (utilisateur connecté)
 * Récupère la boutique de l'utilisateur connecté (ou null)
 */
const getMyShop = async (req, res) => {
  try {
    const shop = await prisma.shop.findUnique({
      where: { userId: req.userId },
      include: { products: { orderBy: { createdAt: 'desc' } } },
    });
    res.json({ shop });
  } catch (error) {
    console.error('[Marketing] getMyShop:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
};

/**
 * POST /api/marketing/shop  (utilisateur Premium)
 * Crée ou met à jour la boutique
 */
const upsertShop = async (req, res) => {
  try {
    const { name, description, orderPhone, logoBase64 } = req.body;

    if (!name || !orderPhone) {
      return res.status(400).json({ error: 'name et orderPhone sont requis' });
    }

    // Vérifier que l'utilisateur est Premium
    const user = await prisma.user.findUnique({ where: { id: req.userId } });
    if (!user) return res.status(404).json({ error: 'Utilisateur introuvable' });
    if (user.licenseType !== 'PREMIUM' || user.licenseStatus !== 'ACTIVE') {
      return res.status(403).json({ error: 'Fonctionnalité réservée aux utilisateurs Premium actifs' });
    }

    let logoUrl, logoFileId;

    // Upload logo si fourni
    if (logoBase64) {
      const existing = await prisma.shop.findUnique({ where: { userId: req.userId } });
      if (existing?.logoFileId) await deleteImage(existing.logoFileId);
      const uploaded = await uploadImage(logoBase64, `shop_logo_${req.userId}`, '/marketing/logos');
      logoUrl   = uploaded.url;
      logoFileId = uploaded.fileId;
    }

    const data = {
      name: name.trim(),
      description: description?.trim() || null,
      orderPhone: orderPhone.trim(),
      ...(logoUrl   && { logoUrl }),
      ...(logoFileId && { logoFileId }),
    };

    const shop = await prisma.shop.upsert({
      where:  { userId: req.userId },
      update: data,
      create: { ...data, userId: req.userId },
      include: { products: { orderBy: { createdAt: 'desc' } } },
    });

    res.json({ message: 'Boutique sauvegardée', shop });
  } catch (error) {
    console.error('[Marketing] upsertShop:', error);
    res.status(500).json({ error: 'Erreur serveur', details: process.env.NODE_ENV === 'development' ? error.message : undefined });
  }
};

// ─── PRODUITS ────────────────────────────────────────────────────────────────

/**
 * POST /api/marketing/products  (utilisateur Premium)
 * Crée un article dans la boutique
 */
const createProduct = async (req, res) => {
  try {
    const { name, description, price, category, imageBase64, orderPhone } = req.body;

    if (!name || price === undefined || !category) {
      return res.status(400).json({ error: 'name, price et category sont requis' });
    }

    // Vérifier boutique existante
    const shop = await prisma.shop.findUnique({ where: { userId: req.userId } });
    if (!shop) return res.status(404).json({ error: 'Créez d\'abord votre boutique' });

    let imageUrl, imageFileId;
    if (imageBase64) {
      const uploaded = await uploadImage(imageBase64, `product_${Date.now()}`, '/marketing/products');
      imageUrl   = uploaded.url;
      imageFileId = uploaded.fileId;
    }

    const product = await prisma.product.create({
      data: {
        shopId:      shop.id,
        name:        name.trim(),
        description: description?.trim() || null,
        price:       parseFloat(price),
        category:    category.trim(),
        imageUrl,
        imageFileId,
        orderPhone:  orderPhone?.trim() || null,
      },
    });

    res.status(201).json({ message: 'Article créé', product });
  } catch (error) {
    console.error('[Marketing] createProduct:', error);
    res.status(500).json({ error: 'Erreur serveur', details: process.env.NODE_ENV === 'development' ? error.message : undefined });
  }
};

/**
 * PATCH /api/marketing/products/:productId
 */
const updateProduct = async (req, res) => {
  try {
    const { productId } = req.params;
    const { name, description, price, category, imageBase64, orderPhone, isAvailable } = req.body;

    // Vérifier que le produit appartient à l'utilisateur
    const product = await prisma.product.findFirst({
      where: { id: productId, shop: { userId: req.userId } },
    });
    if (!product) return res.status(404).json({ error: 'Article introuvable' });

    let imageUrl = product.imageUrl;
    let imageFileId = product.imageFileId;

    if (imageBase64) {
      if (product.imageFileId) await deleteImage(product.imageFileId);
      const uploaded = await uploadImage(imageBase64, `product_${Date.now()}`, '/marketing/products');
      imageUrl   = uploaded.url;
      imageFileId = uploaded.fileId;
    }

    const updated = await prisma.product.update({
      where: { id: productId },
      data: {
        ...(name        !== undefined && { name: name.trim() }),
        ...(description !== undefined && { description: description.trim() }),
        ...(price       !== undefined && { price: parseFloat(price) }),
        ...(category    !== undefined && { category: category.trim() }),
        ...(orderPhone  !== undefined && { orderPhone: orderPhone.trim() || null }),
        ...(isAvailable !== undefined && { isAvailable }),
        imageUrl,
        imageFileId,
      },
    });

    res.json({ message: 'Article mis à jour', product: updated });
  } catch (error) {
    console.error('[Marketing] updateProduct:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
};

/**
 * DELETE /api/marketing/products/:productId
 */
const deleteProduct = async (req, res) => {
  try {
    const { productId } = req.params;

    const product = await prisma.product.findFirst({
      where: { id: productId, shop: { userId: req.userId } },
    });
    if (!product) return res.status(404).json({ error: 'Article introuvable' });

    if (product.imageFileId) await deleteImage(product.imageFileId);

    await prisma.product.delete({ where: { id: productId } });
    res.json({ message: 'Article supprimé' });
  } catch (error) {
    console.error('[Marketing] deleteProduct:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
};

// ─── ROUTES PUBLIQUES ────────────────────────────────────────────────────────

/**
 * GET /api/public/marketing/products  (public, app mobile)
 * Tous les articles disponibles de toutes les boutiques actives
 */
const getPublicProducts = async (req, res) => {
  try {
    const { category, search, limit = 50, offset = 0 } = req.query;

    const where = {
      isAvailable: true,
      shop: { isActive: true, user: { licenseType: 'PREMIUM', licenseStatus: 'ACTIVE' } },
      ...(category && { category }),
      ...(search   && { name: { contains: search, mode: 'insensitive' } }),
    };

    const [products, total] = await Promise.all([
      prisma.product.findMany({
        where,
        include: {
          shop: {
            select: { id: true, name: true, orderPhone: true, logoUrl: true, userId: true },
          },
        },
        orderBy: { createdAt: 'desc' },
        take:    parseInt(limit),
        skip:    parseInt(offset),
      }),
      prisma.product.count({ where }),
    ]);

    // Catégories disponibles
    const categories = await prisma.product.findMany({
      where: { isAvailable: true, shop: { isActive: true } },
      select: { category: true },
      distinct: ['category'],
    });

    res.json({
      total,
      products,
      categories: categories.map(c => c.category),
    });
  } catch (error) {
    console.error('[Marketing] getPublicProducts:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
};

/**
 * GET /api/public/marketing/shops/:shopId  (public, app mobile)
 */
const getPublicShop = async (req, res) => {
  try {
    const { shopId } = req.params;
    const shop = await prisma.shop.findFirst({
      where: { id: shopId, isActive: true },
      include: {
        products: { where: { isAvailable: true }, orderBy: { createdAt: 'desc' } },
        user: { select: { firstName: true, lastName: true } },
      },
    });
    if (!shop) return res.status(404).json({ error: 'Boutique introuvable' });
    res.json({ shop });
  } catch (error) {
    res.status(500).json({ error: 'Erreur serveur' });
  }
};

// ─── ROUTES ADMIN ────────────────────────────────────────────────────────────

/**
 * GET /api/admin/marketing/shops
 * Liste toutes les boutiques (admin)
 */
const adminGetAllShops = async (req, res) => {
  try {
    const shops = await prisma.shop.findMany({
      include: {
        user:     { select: { id: true, firstName: true, lastName: true, email: true, licenseType: true, licenseStatus: true } },
        products: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    res.json({ count: shops.length, shops });
  } catch (error) {
    console.error('[Marketing] adminGetAllShops:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
};

/**
 * PATCH /api/admin/marketing/shops/:shopId/toggle
 * Activer/désactiver une boutique (admin)
 */
const adminToggleShop = async (req, res) => {
  try {
    const { shopId } = req.params;
    const shop = await prisma.shop.findUnique({ where: { id: shopId } });
    if (!shop) return res.status(404).json({ error: 'Boutique introuvable' });

    const updated = await prisma.shop.update({
      where: { id: shopId },
      data:  { isActive: !shop.isActive },
    });

    res.json({ message: `Boutique ${updated.isActive ? 'activée' : 'désactivée'}`, shop: updated });
  } catch (error) {
    res.status(500).json({ error: 'Erreur serveur' });
  }
};

/**
 * DELETE /api/admin/marketing/products/:productId
 * Supprimer un article (admin)
 */
const adminDeleteProduct = async (req, res) => {
  try {
    const { productId } = req.params;
    const product = await prisma.product.findUnique({ where: { id: productId } });
    if (!product) return res.status(404).json({ error: 'Article introuvable' });

    if (product.imageFileId) await deleteImage(product.imageFileId);
    await prisma.product.delete({ where: { id: productId } });

    res.json({ message: 'Article supprimé' });
  } catch (error) {
    res.status(500).json({ error: 'Erreur serveur' });
  }
};

module.exports = {
  getMyShop,
  upsertShop,
  createProduct,
  updateProduct,
  deleteProduct,
  getPublicProducts,
  getPublicShop,
  adminGetAllShops,
  adminToggleShop,
  adminDeleteProduct,
};
