const prisma = require('../lib/prisma');

const BACKUP_BUCKET = 'user-backups';

// Lazy loading de Supabase (seulement si les credentials sont configurés)
let supabase = null;

const getSupabaseClient = () => {
  if (!supabase && process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_KEY) {
    const { createClient } = require('@supabase/supabase-js');
    supabase = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_SERVICE_KEY
    );
  }
  return supabase;
};

const checkSupabaseConfig = () => {
  if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_KEY) {
    throw new Error('Supabase non configuré. Ajoutez SUPABASE_URL et SUPABASE_SERVICE_KEY dans .env');
  }
};

/**
 * Upload d'un backup de base de données
 * - FREE: Sauvegardé mais pas accessible (isAccessible = false)
 * - PREMIUM: Sauvegardé et accessible (isAccessible = true)
 */
const uploadBackup = async (req, res) => {
  try {
    // Vérifier la config Supabase
    checkSupabaseConfig();
    const supabase = getSupabaseClient();

    const userId = req.userId;
    const { fileName, deviceId, deviceName, metadata } = req.body;
    const file = req.file; // Utilise multer pour gérer le fichier

    console.log('[uploadBackup] userId:', userId);
    console.log('[uploadBackup] fileName:', fileName);
    console.log('[uploadBackup] fileSize:', file?.size);

    if (!file) {
      return res.status(400).json({ error: 'Fichier .db requis' });
    }

    // Vérifier que c'est bien un fichier .db
    if (!fileName.endsWith('.db')) {
      return res.status(400).json({ error: 'Seuls les fichiers .db sont acceptés' });
    }

    // Récupérer le type de licence de l'utilisateur
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { licenseType: true, email: true, firstName: true, lastName: true }
    });

    if (!user) {
      return res.status(404).json({ error: 'Utilisateur introuvable' });
    }

    const isPremium = user.licenseType === 'PREMIUM';
    const isAccessible = isPremium; // Uniquement PREMIUM peut accéder

    // Upload vers Supabase Storage
    const timestamp = Date.now();
    const filePath = `${userId}/${timestamp}_${fileName}`;
    
    console.log('[uploadBackup] Upload vers Supabase Storage...');
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from(BACKUP_BUCKET)
      .upload(filePath, file.buffer, {
        contentType: 'application/x-sqlite3',
        upsert: false
      });

    if (uploadError) {
      console.error('[uploadBackup] Erreur Supabase upload:', uploadError);
      return res.status(500).json({ 
        error: 'Erreur lors de l\'upload du backup',
        details: uploadError.message 
      });
    }

    // Générer l'URL signée (valide 10 ans pour PREMIUM, null pour FREE)
    let fileUrl = null;
    if (isPremium) {
      const { data: urlData } = await supabase.storage
        .from(BACKUP_BUCKET)
        .createSignedUrl(filePath, 315360000); // 10 ans en secondes
      
      fileUrl = urlData?.signedUrl || null;
    }

    // Enregistrer dans la base de données avec le chemin complet
    const backup = await prisma.userBackup.create({
      data: {
        userId,
        fileName: filePath, // Stocker le chemin complet : userId/timestamp_filename.db
        fileSize: file.size,
        fileUrl: fileUrl,
        deviceId: deviceId || null,
        deviceName: deviceName || null,
        isAccessible: isAccessible,
        accessGrantedAt: isPremium ? new Date() : null,
        metadata: metadata ? JSON.parse(metadata) : null,
      }
    });

    console.log('[uploadBackup] Backup créé:', backup.id);

    // Extraire le nom de fichier lisible (sans userId/ et timestamp)
    const displayFileName = fileName;

    res.status(201).json({
      message: isPremium 
        ? 'Backup sauvegardé et accessible dans le cloud' 
        : 'Backup sauvegardé. Passez à PREMIUM pour y accéder.',
      backup: {
        id: backup.id,
        fileName: displayFileName, // Nom lisible
        fileSize: backup.fileSize,
        uploadedAt: backup.uploadedAt,
        isAccessible: backup.isAccessible,
        canDownload: isPremium,
      },
      isPremium,
      upgradeMessage: isPremium ? null : 'Passez à PREMIUM pour synchroniser et restaurer vos données à tout moment.'
    });

  } catch (error) {
    console.error('[uploadBackup] Erreur:', error);
    res.status(500).json({ 
      error: 'Erreur lors de la sauvegarde du backup',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

/**
 * Lister les backups de l'utilisateur connecté
 * - FREE: Voit la liste mais ne peut pas télécharger
 * - PREMIUM: Voit la liste et peut télécharger
 */
const getMyBackups = async (req, res) => {
  try {
    const userId = req.userId;

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { licenseType: true }
    });

    const isPremium = user?.licenseType === 'PREMIUM';

    const backups = await prisma.userBackup.findMany({
      where: { userId },
      orderBy: { uploadedAt: 'desc' },
      select: {
        id: true,
        fileName: true,
        fileSize: true,
        uploadedAt: true,
        deviceId: true,
        deviceName: true,
        isAccessible: true,
        accessGrantedAt: true,
      }
    });

    res.json({
      backups: backups.map(backup => {
        // Extraire le nom de fichier lisible (enlever userId/ et timestamp_)
        const displayFileName = backup.fileName.split('/').pop().replace(/^\d+_/, '');
        
        return {
          ...backup,
          fileName: displayFileName,
          canDownload: isPremium && backup.isAccessible,
          downloadUrl: (isPremium && backup.isAccessible) ? `/api/backups/${backup.id}/download` : null,
        };
      }),
      isPremium,
      totalBackups: backups.length,
      accessibleBackups: backups.filter(b => b.isAccessible).length,
      upgradeMessage: isPremium ? null : 'Passez à PREMIUM pour accéder à vos backups.'
    });

  } catch (error) {
    console.error('[getMyBackups] Erreur:', error);
    res.status(500).json({ error: 'Erreur lors de la récupération des backups' });
  }
};

/**
 * Télécharger un backup spécifique
 * - FREE: Refusé avec message d'upgrade
 * - PREMIUM: Téléchargement autorisé
 */
const downloadBackup = async (req, res) => {
  try {
    // Vérifier la config Supabase
    checkSupabaseConfig();
    const supabase = getSupabaseClient();

    const userId = req.userId;
    const { backupId } = req.params;

    console.log('[downloadBackup] userId:', userId, 'backupId:', backupId);

    // Vérifier le type de licence
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { licenseType: true }
    });

    const isPremium = user?.licenseType === 'PREMIUM';

    if (!isPremium) {
      return res.status(403).json({ 
        error: 'Accès refusé',
        message: 'Cette fonctionnalité est réservée aux utilisateurs PREMIUM.',
        upgradeRequired: true,
        upgradeUrl: '/upgrade-premium'
      });
    }

    // Récupérer le backup
    const backup = await prisma.userBackup.findFirst({
      where: {
        id: backupId,
        userId: userId, // Sécurité: seulement ses propres backups
      }
    });

    if (!backup) {
      return res.status(404).json({ error: 'Backup introuvable' });
    }

    if (!backup.isAccessible) {
      return res.status(403).json({ 
        error: 'Backup non accessible',
        message: 'Ce backup a été créé avant votre passage à PREMIUM.'
      });
    }

    // Générer une URL signée temporaire (valide 1 heure)
    const filePath = backup.fileName.startsWith(`${userId}/`) 
      ? backup.fileName 
      : `${userId}/${backup.fileName}`;
    
    console.log('[downloadBackup] Tentative de récupération du fichier:', filePath);
    
    const { data: urlData, error: urlError } = await supabase.storage
      .from(BACKUP_BUCKET)
      .createSignedUrl(filePath, 3600); // 1 heure

    if (urlError) {
      console.error('[downloadBackup] Erreur génération URL:', urlError);
      console.error('[downloadBackup] Chemin testé:', filePath);
      
      // Essayer de lister les fichiers pour déboguer
      const { data: files } = await supabase.storage
        .from(BACKUP_BUCKET)
        .list(userId);
      
      console.log('[downloadBackup] Fichiers disponibles:', files);
      
      return res.status(500).json({ 
        error: 'Erreur lors de la génération du lien de téléchargement',
        debug: process.env.NODE_ENV === 'development' ? {
          attemptedPath: filePath,
          errorMessage: urlError.message,
          availableFiles: files?.map(f => f.name)
        } : undefined
      });
    }

    console.log('[downloadBackup] URL générée avec succès');

    // Extraire le nom de fichier lisible
    const displayFileName = backup.fileName.split('/').pop().replace(/^\d+_/, '');

    res.json({
      message: 'Lien de téléchargement généré',
      downloadUrl: urlData.signedUrl,
      fileName: displayFileName,
      fileSize: backup.fileSize,
      expiresIn: 3600, // secondes
    });

  } catch (error) {
    console.error('[downloadBackup] Erreur:', error);
    res.status(500).json({ error: 'Erreur lors du téléchargement du backup' });
  }
};

/**
 * Supprimer un backup
 * Disponible pour FREE et PREMIUM
 */
const deleteBackup = async (req, res) => {
  try {
    // Vérifier la config Supabase
    checkSupabaseConfig();
    const supabase = getSupabaseClient();

    const userId = req.userId;
    const { backupId } = req.params;

    const backup = await prisma.userBackup.findFirst({
      where: {
        id: backupId,
        userId: userId,
      }
    });

    if (!backup) {
      return res.status(404).json({ error: 'Backup introuvable' });
    }

    // Supprimer de Supabase Storage
    const filePath = `${userId}/${backup.fileName}`;
    const { error: deleteError } = await supabase.storage
      .from(BACKUP_BUCKET)
      .remove([filePath]);

    if (deleteError) {
      console.warn('[deleteBackup] Erreur suppression Supabase:', deleteError);
      // On continue quand même pour supprimer de la DB
    }

    // Supprimer de la base de données
    await prisma.userBackup.delete({
      where: { id: backupId }
    });

    res.json({ message: 'Backup supprimé avec succès' });

  } catch (error) {
    console.error('[deleteBackup] Erreur:', error);
    res.status(500).json({ error: 'Erreur lors de la suppression du backup' });
  }
};

/**
 * [ADMIN] Accorder l'accès à un backup pour un utilisateur FREE (après paiement)
 */
const grantBackupAccess = async (req, res) => {
  try {
    // Vérifier la config Supabase
    checkSupabaseConfig();
    const supabase = getSupabaseClient();

    const { backupId, userId } = req.body;

    const backup = await prisma.userBackup.findFirst({
      where: {
        id: backupId,
        userId: userId,
      }
    });

    if (!backup) {
      return res.status(404).json({ error: 'Backup introuvable' });
    }

    // Générer une URL signée et marquer comme accessible
    const filePath = `${userId}/${backup.fileName}`;
    const { data: urlData } = await supabase.storage
      .from(BACKUP_BUCKET)
      .createSignedUrl(filePath, 315360000); // 10 ans

    const updatedBackup = await prisma.userBackup.update({
      where: { id: backupId },
      data: {
        isAccessible: true,
        accessGrantedAt: new Date(),
        fileUrl: urlData?.signedUrl || backup.fileUrl,
      }
    });

    res.json({
      message: 'Accès au backup accordé',
      backup: updatedBackup,
    });

  } catch (error) {
    console.error('[grantBackupAccess] Erreur:', error);
    res.status(500).json({ error: 'Erreur lors de l\'octroi d\'accès' });
  }
};

module.exports = {
  uploadBackup,
  getMyBackups,
  downloadBackup,
  deleteBackup,
  grantBackupAccess,
};
