const kkiapaySDK = require('kkiapay');

/**
 * Service KKiaPay - Intégration via SDK officiel
 * Documentation: https://docs.kkiapay.me/
 * SDK: https://github.com/kkiapay/nodejs-sdk
 */

let _client = null;

/**
 * Retourne le client KKiaPay (lazy init)
 */
function getClient() {
  if (_client) return _client;

  const publicKey  = process.env.KKIAPAY_PUBLIC_KEY;
  const privateKey = process.env.KKIAPAY_PRIVATE_KEY;
  const secret     = process.env.KKIAPAY_SECRET;
  const sandbox    = process.env.KKIAPAY_SANDBOX === 'true';

  if (!publicKey || !privateKey || !secret) {
    throw new Error('KKiaPay non configuré. Vérifiez KKIAPAY_PUBLIC_KEY, KKIAPAY_PRIVATE_KEY et KKIAPAY_SECRET dans .env');
  }

  // Le SDK accepte les clés positionnelles: (publickey, privatekey, secretkey, sandbox)
  _client = kkiapaySDK(privateKey, publicKey, secret, sandbox);

  console.log(`[KKiaPay] Client initialisé (sandbox=${sandbox})`);
  return _client;
}

/**
 * Vérifie qu'une transaction est réellement SUCCESS côté KKiaPay
 * @param {string} transactionId
 */
async function verifyTransaction(transactionId) {
  try {
    const client = getClient();
    const result = await client.verify(transactionId);

    console.log('[KKiaPay] Résultat vérification:', JSON.stringify(result));

    // Le SDK renvoie un objet avec status, amount, etc.
    const isPaid = result.status === 'SUCCESS';

    return {
      success: true,
      isPaid,
      status: result.status,
      transaction: result,
    };
  } catch (error) {
    console.error('[KKiaPay] Erreur vérification:', error.message || error);
    return {
      success: false,
      isPaid: false,
      error: error.message || String(error),
    };
  }
}

/**
 * Calcule le montant selon le type d'abonnement
 */
function getSubscriptionAmount(subscriptionType) {
  return subscriptionType === 'ANNUAL' ? 10000 : 999;
}

/**
 * Calcule la nouvelle date d'expiration
 */
function calculateExpirationDate(currentDate, subscriptionType) {
  const newDate = new Date(currentDate);
  if (subscriptionType === 'ANNUAL') {
    newDate.setFullYear(newDate.getFullYear() + 1);
  } else {
    newDate.setMonth(newDate.getMonth() + 1);
  }
  return newDate;
}

/**
 * Vérifie la signature d'un webhook KKiaPay
 * Le SDK KKiaPay envoie un payload signé avec le secret
 */
function verifyWebhookSignature(signature, payload) {
  try {
    const crypto = require('crypto');
    const secret = process.env.KKIAPAY_SECRET;
    if (!secret) return false;

    const hash = crypto
      .createHmac('sha256', secret)
      .update(typeof payload === 'string' ? payload : JSON.stringify(payload))
      .digest('hex');

    return hash === signature;
  } catch (error) {
    console.error('[KKiaPay] Erreur vérification signature:', error);
    return false;
  }
}

module.exports = {
  verifyTransaction,
  getSubscriptionAmount,
  calculateExpirationDate,
  verifyWebhookSignature,
  isConfigured: () => {
    return !!(
      process.env.KKIAPAY_PUBLIC_KEY &&
      process.env.KKIAPAY_PRIVATE_KEY &&
      process.env.KKIAPAY_SECRET
    );
  },
};
