const express = require('express');
const multer = require('multer');
const {
  uploadBackup,
  getMyBackups,
  downloadBackup,
  deleteBackup,
  grantBackupAccess,
} = require('../controllers/backupController');

const auth = require('../middlewares/auth');
const isAdmin = require('../middlewares/isAdmin');

const router = express.Router();

// Configuration de multer pour gérer l'upload de fichiers en mémoire
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 50 * 1024 * 1024, // 50 MB max
  },
  fileFilter: (req, file, cb) => {
    // Accepter uniquement les fichiers .db
    if (file.originalname.endsWith('.db') || file.mimetype === 'application/x-sqlite3') {
      cb(null, true);
    } else {
      cb(new Error('Seuls les fichiers .db sont acceptés'));
    }
  }
});

// Routes protégées (nécessite authentification utilisateur)
router.use(auth);

// Upload un backup (FREE et PREMIUM peuvent uploader)
router.post('/upload', upload.single('backup'), uploadBackup);

// Récupérer mes backups
router.get('/my-backups', getMyBackups);

// Télécharger un backup spécifique (PREMIUM uniquement)
router.get('/:backupId/download', downloadBackup);

// Supprimer un backup
router.delete('/:backupId', deleteBackup);

// [ADMIN] Accorder l'accès à un backup (après paiement d'un FREE)
router.post('/grant-access', isAdmin, grantBackupAccess);

module.exports = router;
