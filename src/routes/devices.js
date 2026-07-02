const express = require('express');
const deviceController = require('../controllers/deviceController');
const auth = require('../middlewares/auth');
const { validate } = require('../validators/authValidators');

const router = express.Router();

// Toutes les routes nécessitent une authentification
router.use(auth);

// Enregistrer un appareil (appelé lors du login)
router.post('/register', deviceController.registerDevice);

// Récupérer mes appareils
router.get('/my-devices', deviceController.getUserDevices);

// Supprimer un de mes appareils
router.delete('/my-devices/:deviceId', deviceController.deleteDevice);

// Routes admin uniquement
router.use(require('../middlewares/isAdmin'));

// Récupérer tous les appareils d'un utilisateur (admin)
router.get('/user/:userId', deviceController.getAllUserDevices);

// Réinitialiser un appareil (admin) - pour débloquer un utilisateur FREE
router.post('/reset', deviceController.resetDevice);

// Supprimer un appareil (admin)
router.delete('/user/:userId/:deviceId', deviceController.adminDeleteDevice);

module.exports = router;