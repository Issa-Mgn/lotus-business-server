const prisma = require('../lib/prisma');
const { uploadImage, deleteImage } = require('../utils/imageUpload');

/**
 * Obtenir toutes les infos publiées
 */
const getAllInfos = async (req, res) => {
  try {
    const infos = await prisma.info.findMany({
      where: { published: true },
      orderBy: { publishedAt: 'desc' },
      include: {
        reactions: {
          select: {
            id: true,
            reactionType: true,
            createdAt: true,
          },
        },
      },
    });

    // Ajouter les statistiques de réactions pour chaque info
    const infosWithStats = infos.map(info => {
      const reactionStats = {};
      let totalReactions = 0;

      info.reactions.forEach(reaction => {
        reactionStats[reaction.reactionType] = (reactionStats[reaction.reactionType] || 0) + 1;
        totalReactions++;
      });

      return {
        ...info,
        reactionStats,
        totalReactions,
        reactions: undefined, // Ne pas envoyer tous les détails des réactions
      };
    });

    res.json({ infos: infosWithStats });
  } catch (error) {
    console.error('Erreur récupération infos:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
};

/**
 * Créer une nouvelle info avec images multiples
 */
const createInfo = async (req, res) => {
  try {
    const { title, content, images, published } = req.body;

    if (!title || !content) {
      return res.status(400).json({ error: 'Titre et contenu requis' });
    }

    let mainImageData = null;
    const uploadedImages = [];

    // Support pour image unique (legacy) ou tableau d'images
    const imagesArray = Array.isArray(images) ? images : (images ? [images] : []);

    // Upload de la première image comme image principale (legacy)
    if (imagesArray.length > 0 && !req.body.imageBase64) {
      try {
        const fileName = `info-${Date.now()}-0.jpg`;
        mainImageData = await uploadImage(imagesArray[0], fileName, 'infos');
      } catch (uploadError) {
        console.error('Erreur upload image principale:', uploadError.message);
        return res.status(400).json({ 
          error: uploadError.message || 'Erreur lors de l\'upload de l\'image principale' 
        });
      }
    } else if (req.body.imageBase64) {
      // Support legacy pour imageBase64
      try {
        const fileName = `info-${Date.now()}.jpg`;
        mainImageData = await uploadImage(req.body.imageBase64, fileName, 'infos');
      } catch (uploadError) {
        console.error('Erreur upload image:', uploadError.message);
        return res.status(400).json({ 
          error: uploadError.message || 'Erreur lors de l\'upload de l\'image' 
        });
      }
    }

    // Upload des images supplémentaires
    if (imagesArray.length > 1) {
      for (let i = 1; i < imagesArray.length; i++) {
        try {
          const fileName = `info-${Date.now()}-${i}.jpg`;
          const imageData = await uploadImage(imagesArray[i], fileName, 'infos');
          uploadedImages.push({
            url: imageData.url,
            fileId: imageData.fileId,
            filePath: imageData.filePath,
            thumbnailUrl: imageData.thumbnailUrl,
          });
        } catch (uploadError) {
          console.error(`Erreur upload image ${i}:`, uploadError.message);
          // Continue avec les autres images même si une échoue
        }
      }
    }

    const info = await prisma.info.create({
      data: {
        title,
        content,
        imageUrl: mainImageData?.url || null,
        imageFileId: mainImageData?.fileId || null,
        imageFilePath: mainImageData?.filePath || null,
        thumbnailUrl: mainImageData?.thumbnailUrl || null,
        images: uploadedImages.length > 0 ? uploadedImages : null,
        published: published !== undefined ? published : true,
        publishedAt: new Date(),
      },
    });

    // 📱 Créer une notification pour tous les utilisateurs si l'info est publiée
    if (info.published) {
      try {
        // Récupérer tous les utilisateurs actifs
        const users = await prisma.user.findMany({
          where: { licenseStatus: 'ACTIVE' },
          select: { id: true },
        });

        // Créer une notification pour chaque utilisateur
        if (users.length > 0) {
          const notifications = users.map(user => ({
            userId: user.id,
            type: 'NEW_INFO',
            title: 'Nouvelle information',
            message: `Nouvelle publication : ${info.title}`,
            data: { infoId: info.id },
          }));

          await prisma.notification.createMany({
            data: notifications,
          });

          console.log(`📱 Notification envoyée à ${users.length} utilisateurs pour l'info: ${info.title}`);
        }
      } catch (notificationError) {
        console.error('Erreur création notifications:', notificationError);
        // On continue même si les notifications échouent
      }
    }

    res.status(201).json({ 
      message: 'Info publiée avec succès',
      info 
    });
  } catch (error) {
    console.error('Erreur création info:', error.message);
    res.status(500).json({ 
      error: 'Erreur serveur', 
      details: error.message 
    });
  }
};

/**
 * Mettre à jour une info
 */
const updateInfo = async (req, res) => {
  try {
    const { infoId } = req.params;
    const { title, content, imageBase64, published } = req.body;

    // Vérifier que l'info existe
    const existingInfo = await prisma.info.findUnique({
      where: { id: infoId },
    });

    if (!existingInfo) {
      return res.status(404).json({ error: 'Info non trouvée' });
    }

    let imageData = null;

    // Si nouvelle image fournie, upload et suppression de l'ancienne
    if (imageBase64) {
      try {
        // Upload nouvelle image
        const fileName = `info-${Date.now()}.jpg`;
        imageData = await uploadImage(imageBase64, fileName, 'infos');

        // Supprimer ancienne image si elle existe
        if (existingInfo.imageFileId) {
          try {
            await deleteImage(existingInfo.imageFileId);
          } catch (deleteError) {
            console.error('Erreur suppression ancienne image:', deleteError);
            // Continue même si la suppression échoue
          }
        }
      } catch (uploadError) {
        console.error('Erreur upload image:', uploadError);
        return res.status(400).json({ error: uploadError.message });
      }
    }

    const updateData = {
      title: title !== undefined ? title : existingInfo.title,
      content: content !== undefined ? content : existingInfo.content,
      published: published !== undefined ? published : existingInfo.published,
    };

    // Ajouter les données image si une nouvelle image a été uploadée
    if (imageData) {
      updateData.imageUrl = imageData.url;
      updateData.imageFileId = imageData.fileId;
      updateData.imageFilePath = imageData.filePath;
      updateData.thumbnailUrl = imageData.thumbnailUrl;
    }

    const updatedInfo = await prisma.info.update({
      where: { id: infoId },
      data: updateData,
    });

    res.json({ info: updatedInfo });
  } catch (error) {
    console.error('Erreur mise à jour info:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
};

/**
 * Supprimer une info
 */
const deleteInfo = async (req, res) => {
  try {
    const { infoId } = req.params;

    const info = await prisma.info.findUnique({
      where: { id: infoId },
    });

    if (!info) {
      return res.status(404).json({ error: 'Info non trouvée' });
    }

    // Supprimer l'image de ImageKit si elle existe
    if (info.imageFileId) {
      try {
        await deleteImage(info.imageFileId);
      } catch (deleteError) {
        console.error('Erreur suppression image ImageKit:', deleteError);
        // Continue même si la suppression échoue
      }
    }

    await prisma.info.delete({
      where: { id: infoId },
    });

    res.json({ message: 'Info supprimée avec succès' });
  } catch (error) {
    console.error('Erreur suppression info:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
};

/**
 * Obtenir les paramètres d'authentification ImageKit pour upload client
 */
const getImageKitAuth = async (req, res) => {
  try {
    const { getAuthenticationParameters } = require('../utils/imageUpload');
    const authParams = getAuthenticationParameters();
    
    res.json({
      ...authParams,
      publicKey: process.env.IMAGEKIT_PUBLIC_KEY,
      urlEndpoint: process.env.IMAGEKIT_URL_ENDPOINT,
    });
  } catch (error) {
    console.error('Erreur génération auth ImageKit:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
};

module.exports = {
  getAllInfos,
  createInfo,
  updateInfo,
  deleteInfo,
  getImageKitAuth,
};
