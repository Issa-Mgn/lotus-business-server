const prisma = require('../lib/prisma');

/**
 * Enregistrer un nouvel appareil pour l'utilisateur
 * Appelé lors de la première connexion ou lors de l'ajout d'un nouvel appareil
 */
const registerDevice = async (req, res) => {
  try {
    const userId = req.userId;
    const { deviceId, deviceName, deviceType, platform } = req.body;

    if (!deviceId) {
      return res.status(400).json({ error: 'deviceId requis' });
    }

    // Vérifier si l'appareil existe déjà
    const existingDevice = await prisma.device.findUnique({
      where: {
        userId_deviceId: {
          userId,
          deviceId
        }
      }
    });

    if (existingDevice) {
      // Mettre à jour la date de dernière utilisation
      const updatedDevice = await prisma.device.update({
        where: {
          userId_deviceId: {
            userId,
            deviceId
          }
        },
        data: {
          lastUsedAt: new Date(),
          deviceName: deviceName || existingDevice.deviceName,
          deviceType: deviceType || existingDevice.deviceType,
          platform: platform || existingDevice.platform,
        }
      });

      return res.json({
        message: 'Appareil mis à jour',
        device: updatedDevice
      });
    }

    // Créer un nouvel appareil
    const device = await prisma.device.create({
      data: {
        userId,
        deviceId,
        deviceName,
        deviceType,
        platform,
        isAuthorized: true,
      }
    });

    res.status(201).json({
      message: 'Appareil enregistré avec succès',
      device
    });
  } catch (error) {
    console.error('Erreur enregistrement device:', error);
    res.status(500).json({ error: 'Erreur enregistrement device' });
  }
};

/**
 * Récupérer tous les appareils de l'utilisateur connecté
 */
const getUserDevices = async (req, res) => {
  try {
    const userId = req.userId;

    const devices = await prisma.device.findMany({
      where: { userId },
      orderBy: { lastUsedAt: 'desc' }
    });

    res.json({
      count: devices.length,
      devices
    });
  } catch (error) {
    console.error('Erreur récupération devices:', error);
    res.status(500).json({ error: 'Erreur récupération devices' });
  }
};

/**
 * Supprimer un appareil (pour l'utilisateur)
 */
const deleteDevice = async (req, res) => {
  try {
    const userId = req.userId;
    const { deviceId } = req.params;

    const device = await prisma.device.findUnique({
      where: {
        userId_deviceId: {
          userId,
          deviceId
        }
      }
    });

    if (!device) {
      return res.status(404).json({ error: 'Appareil introuvable' });
    }

    await prisma.device.delete({
      where: {
        userId_deviceId: {
          userId,
          deviceId
        }
      }
    });

    res.json({ message: 'Appareil supprimé avec succès' });
  } catch (error) {
    console.error('Erreur suppression device:', error);
    res.status(500).json({ error: 'Erreur suppression device' });
  }
};

/**
 * Récupérer tous les appareils d'un utilisateur (admin uniquement)
 */
const getAllUserDevices = async (req, res) => {
  try {
    const { userId } = req.params;

    const devices = await prisma.device.findMany({
      where: { userId },
      orderBy: { lastUsedAt: 'desc' }
    });

    res.json({
      count: devices.length,
      devices
    });
  } catch (error) {
    console.error('Erreur récupération devices admin:', error);
    res.status(500).json({ error: 'Erreur récupération devices' });
  }
};

/**
 * Réinitialiser/autoriser un appareil (admin uniquement)
 * Permet de débloquer un utilisateur FREE qui a changé de téléphone
 */
const resetDevice = async (req, res) => {
  try {
    const { userId, deviceId } = req.body;

    if (!userId || !deviceId) {
      return res.status(400).json({ error: 'userId et deviceId requis' });
    }

    // Vérifier que l'appareil existe
    const device = await prisma.device.findUnique({
      where: {
        userId_deviceId: {
          userId,
          deviceId
        }
      }
    });

    if (!device) {
      return res.status(404).json({ error: 'Appareil introuvable' });
    }

    // Réinitialiser l'appareil (marquer comme autorisé et mettre à jour la date)
    const updatedDevice = await prisma.device.update({
      where: {
        userId_deviceId: {
          userId,
          deviceId
        }
      },
      data: {
        isAuthorized: true,
        lastUsedAt: new Date()
      }
    });

    // Déconnecter l'utilisateur de tous les appareils
    await prisma.user.update({
      where: { id: userId },
      data: {
        isOnline: false,
        activeSessionId: null
      }
    });

    res.json({
      message: 'Appareil réinitialisé avec succès. L\'utilisateur peut maintenant se connecter.',
      device: updatedDevice
    });
  } catch (error) {
    console.error('Erreur reset device:', error);
    res.status(500).json({ error: 'Erreur reset device' });
  }
};

/**
 * Supprimer un appareil (admin uniquement)
 */
const adminDeleteDevice = async (req, res) => {
  try {
    const { userId, deviceId } = req.params;

    const device = await prisma.device.findUnique({
      where: {
        userId_deviceId: {
          userId,
          deviceId
        }
      }
    });

    if (!device) {
      return res.status(404).json({ error: 'Appareil introuvable' });
    }

    await prisma.device.delete({
      where: {
        userId_deviceId: {
          userId,
          deviceId
        }
      }
    });

    res.json({ message: 'Appareil supprimé avec succès' });
  } catch (error) {
    console.error('Erreur suppression device admin:', error);
    res.status(500).json({ error: 'Erreur suppression device' });
  }
};

module.exports = {
  registerDevice,
  getUserDevices,
  deleteDevice,
  getAllUserDevices,
  resetDevice,
  adminDeleteDevice
};