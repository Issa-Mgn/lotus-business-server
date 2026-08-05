const express = require('express');
const router  = express.Router();
const auth    = require('../middlewares/auth');
const isAdmin = require('../middlewares/isAdmin');
const {
  getMyShop,
  upsertShop,
  createProduct,
  updateProduct,
  deleteProduct,
  adminGetAllShops,
  adminToggleShop,
  adminDeleteProduct,
} = require('../controllers/marketingController');

// ── Routes utilisateur (Premium) ──────────────────────────────────────────
router.get('/shop',                    auth, getMyShop);
router.post('/shop',                   auth, upsertShop);
router.post('/products',               auth, createProduct);
router.patch('/products/:productId',   auth, updateProduct);
router.delete('/products/:productId',  auth, deleteProduct);

// ── Routes admin ──────────────────────────────────────────────────────────
router.get('/admin/shops',                          auth, isAdmin, adminGetAllShops);
router.patch('/admin/shops/:shopId/toggle',         auth, isAdmin, adminToggleShop);
router.delete('/admin/products/:productId',         auth, isAdmin, adminDeleteProduct);

module.exports = router;
