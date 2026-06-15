// c:\Mes Travaux\Lotus Business\server\src\routes\activity.js

const express = require('express');
const { getAllLogs, getLogsStats } = require('../controllers/activityController');
const auth = require('../middlewares/auth');
const isAdmin = require('../middlewares/isAdmin');

const router = express.Router();

// Toutes les routes sont protégées
router.use(auth);
router.use(isAdmin);

router.get('/', getAllLogs);
router.get('/stats', getLogsStats);

module.exports = router;
