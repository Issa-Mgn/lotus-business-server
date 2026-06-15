const imagekit = require('../config/imagekit');

/**
 * Upload une image en base64 vers ImageKit
 * @param {string} base64Image - Image en base64
 * @param {string} fileName - Nom du fichier
 * @param {string} folder - Dossier dans ImageKit (ex: 'infos')
 * @returns {Promise<object>} - Résultat avec url, fileId, etc.
 */
const uploadImage = async (base64Image, fileName, folder = 'infos') => {
  try {
    // Supprimer le préfixe data:image si présent
    const base64Data = base64Image.replace(/^data:image\/\w+;base64,/, '');

    const result = await imagekit.upload({
      file: base64Data,
      fileName: fileName,
      folder: folder,
      useUniqueFileName: true,
      tags: ['lotus-business', folder],
    });

    return {
      url: result.url,
      fileId: result.fileId,
      name: result.name,
      filePath: result.filePath,
      thumbnailUrl: result.thumbnailUrl,
    };
  } catch (error) {
    console.error('Erreur upload ImageKit:', error);
    throw new Error(`Erreur lors de l'upload de l'image: ${error.message}`);
  }
};

/**
 * Supprime une image de ImageKit
 * @param {string} fileId - ID du fichier dans ImageKit
 * @returns {Promise<void>}
 */
const deleteImage = async (fileId) => {
  try {
    await imagekit.deleteFile(fileId);
  } catch (error) {
    console.error('Erreur suppression ImageKit:', error);
    throw new Error(`Erreur lors de la suppression de l'image: ${error.message}`);
  }
};

/**
 * Obtient une URL signée avec authentification
 * @param {string} url - URL de l'image
 * @param {number} expireSeconds - Durée de validité en secondes (défaut: 300)
 * @returns {string} - URL signée
 */
const getAuthenticatedUrl = (url, expireSeconds = 300) => {
  try {
    return imagekit.url({
      src: url,
      signed: true,
      expireSeconds: expireSeconds,
    });
  } catch (error) {
    console.error('Erreur génération URL signée:', error);
    return url; // Retourne l'URL originale en cas d'erreur
  }
};

/**
 * Génère des paramètres d'authentification pour upload côté client
 * @returns {object} - token, expire, signature
 */
const getAuthenticationParameters = () => {
  return imagekit.getAuthenticationParameters();
};

module.exports = {
  uploadImage,
  deleteImage,
  getAuthenticatedUrl,
  getAuthenticationParameters,
};
