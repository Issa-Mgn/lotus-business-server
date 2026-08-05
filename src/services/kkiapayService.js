const axios = require('axios');

/**
 * Service KKiaPay - Appels REST directs
 * Le SDK kkiapay (npm) est un SDK browser, inutilisable en Node.js.
 * On utilise directement l'API REST de KKiaPay.
 *
 * Doc: https://docs.kkiapay.me
 * Endpoint: https://api.kkiapay.me
 */

const BASE_URL = 'https://api.kkiapay.me';

function getHeaders() {
  return {
    'x-private-key': process.env.KKIAPAY_PRIVATE_KEY,
    'Content-Type': 'application/json',
  };
}

function isConfigured() {
  return !!(
    process.env.KKIAPAY_PUBLIC_KEY &&
    process.env.KKIAPAY_PRIVATE_KEY &&
    process.env.KKIAPAY_SECRET
  );
}

/**
 * Vérifie le statut d'une transaction via l'API KKiaPay
 * @param {string} transactionId
 */
async function verifyTransaction(transactionId) {
  try {
    if (!isConfigured()) {
      throw new Error('KKiaPay non configuré. Vérifiez KKIAPAY_PRIVATE_KEY dans .env');
    }

    console.log('[KKiaPay] Vérification transaction:', transactionId);

    const response = await axios.get(
      `${BASE_URL}/api/v1/transactions/${transactionId}/status`,
      { headers: getHeaders() }
    );

    const data = response.data;
    console.log('[KKiaPay] Réponse:', JSON.stringify(data));

    const isPaid = data.status === 'SUCCESS';

    return {
      success: true,
      isPaid,
      status: data.status,
      amount: data.amount,
      transaction: data,
    };
  } catch (error) {
    const status  = error.response?.status;
    const message = error.response?.data?.message || error.message;

    console.error(`[KKiaPay] Erreur vérification (HTTP ${status}):`, message);

    return {
      success: false,
      isPaid: false,
      error: message,
      httpStatus: status,
    };
  }
}

/**
 * Vérifie la signature d'un webhook KKiaPay (HMAC-SHA256)
 */
function verifyWebhookSignature(signature, payload) {
  try {
    const crypto = require('crypto');
    const secret = process.env.KKIAPAY_SECRET;
    if (!secret || !signature) return false;

    const body = typeof payload === 'string' ? payload : JSON.stringify(payload);
    const hash = crypto.createHmac('sha256', secret).update(body).digest('hex');

    return hash === signature;
  } catch (err) {
    console.error('[KKiaPay] Erreur signature:', err.message);
    return false;
  }
}

function getSubscriptionAmount(subscriptionType) {
  return subscriptionType === 'ANNUAL' ? 10000 : 999;
}

function calculateExpirationDate(currentDate, subscriptionType) {
  const d = new Date(currentDate);
  if (subscriptionType === 'ANNUAL') {
    d.setFullYear(d.getFullYear() + 1);
  } else {
    d.setMonth(d.getMonth() + 1);
  }
  return d;
}

module.exports = {
  verifyTransaction,
  verifyWebhookSignature,
  getSubscriptionAmount,
  calculateExpirationDate,
  isConfigured,
};
