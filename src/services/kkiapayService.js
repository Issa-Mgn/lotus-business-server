const axios = require('axios');

/**
 * Service KKiaPay - Intégration pour paiements mobiles
 * Documentation: https://docs.kkiapay.me/
 */

class KKiapayService {
  constructor() {
    this.publicKey = process.env.KKIAPAY_PUBLIC_KEY;
    this.privateKey = process.env.KKIAPAY_PRIVATE_KEY;
    this.secret = process.env.KKIAPAY_SECRET;
    this.sandbox = process.env.KKIAPAY_SANDBOX === 'true';
    
    this.baseUrl = this.sandbox 
      ? 'https://api-preprod.kkiapay.me' 
      : 'https://api.kkiapay.me';
  }

  /**
   * Vérifie que les clés API sont configurées
   */
  isConfigured() {
    return !!(this.publicKey && this.privateKey && this.secret);
  }

  /**
   * Récupère les headers d'authentification
   */
  getHeaders() {
    return {
      'Content-Type': 'application/json',
      'x-api-key': this.privateKey,
    };
  }

  /**
   * Initialise un paiement
   * @param {Object} params - Paramètres du paiement
   * @param {number} params.amount - Montant en FCFA
   * @param {string} params.reason - Raison du paiement
   * @param {string} params.firstName - Prénom du payeur
   * @param {string} params.lastName - Nom du payeur
   * @param {string} params.phone - Numéro de téléphone
   * @param {string} params.email - Email du payeur
   * @param {Object} params.metadata - Données additionnelles
   * @returns {Promise<Object>} - Résultat de l'initialisation
   */
  async initializePayment(params) {
    try {
      if (!this.isConfigured()) {
        throw new Error('KKiaPay non configuré. Vérifiez vos clés API dans .env');
      }

      const { amount, reason, firstName, lastName, phone, email, metadata } = params;

      const payload = {
        amount,
        reason: reason || 'Lotus Business - Upgrade Premium',
        firstName: firstName || '',
        lastName: lastName || '',
        phone,
        email: email || '',
        sandbox: this.sandbox,
        ...metadata,
      };

      console.log('[KKiaPay] Initialisation paiement:', {
        amount,
        reason,
        phone,
        sandbox: this.sandbox,
      });

      const response = await axios.post(
        `${this.baseUrl}/api/v1/request`,
        payload,
        { headers: this.getHeaders() }
      );

      console.log('[KKiaPay] Paiement initialisé:', response.data);

      return {
        success: true,
        data: response.data,
        transactionId: response.data.transactionId,
        paymentUrl: response.data.paymentUrl,
      };
    } catch (error) {
      console.error('[KKiaPay] Erreur initialisation paiement:', error.response?.data || error.message);
      return {
        success: false,
        error: error.response?.data?.message || error.message,
        details: error.response?.data,
      };
    }
  }

  /**
   * Vérifie le statut d'un paiement
   * @param {string} transactionId - ID de la transaction KKiaPay
   * @returns {Promise<Object>} - Statut du paiement
   */
  async verifyPayment(transactionId) {
    try {
      if (!this.isConfigured()) {
        throw new Error('KKiaPay non configuré');
      }

      console.log('[KKiaPay] Vérification paiement:', transactionId);

      const response = await axios.get(
        `${this.baseUrl}/api/v1/transactions/${transactionId}/status`,
        { headers: this.getHeaders() }
      );

      const transaction = response.data;
      console.log('[KKiaPay] Statut paiement:', {
        transactionId,
        status: transaction.status,
        amount: transaction.amount,
      });

      return {
        success: true,
        transaction,
        isPaid: transaction.status === 'SUCCESS' || transaction.status === 'SUCCESSFUL',
        status: transaction.status,
      };
    } catch (error) {
      console.error('[KKiaPay] Erreur vérification paiement:', error.response?.data || error.message);
      return {
        success: false,
        error: error.response?.data?.message || error.message,
        details: error.response?.data,
      };
    }
  }

  /**
   * Vérifie la signature d'un webhook
   * @param {string} signature - Signature reçue dans le header
   * @param {Object} payload - Corps de la requête
   * @returns {boolean} - True si la signature est valide
   */
  verifyWebhookSignature(signature, payload) {
    try {
      const crypto = require('crypto');
      const hash = crypto
        .createHmac('sha256', this.secret)
        .update(JSON.stringify(payload))
        .digest('hex');

      return hash === signature;
    } catch (error) {
      console.error('[KKiaPay] Erreur vérification signature:', error);
      return false;
    }
  }

  /**
   * Traite un webhook KKiaPay
   * @param {Object} payload - Données du webhook
   * @param {string} signature - Signature du webhook
   * @returns {Promise<Object>} - Résultat du traitement
   */
  async handleWebhook(payload, signature) {
    try {
      console.log('[KKiaPay] Webhook reçu:', {
        transactionId: payload.transactionId,
        status: payload.status,
        amount: payload.amount,
      });

      // Vérifier la signature
      if (!this.verifyWebhookSignature(signature, payload)) {
        console.error('[KKiaPay] Signature webhook invalide');
        return {
          success: false,
          error: 'Signature invalide',
        };
      }

      // Vérifier le statut du paiement
      if (payload.status === 'SUCCESS' || payload.status === 'SUCCESSFUL') {
        return {
          success: true,
          isPaid: true,
          transaction: payload,
        };
      }

      return {
        success: true,
        isPaid: false,
        transaction: payload,
      };
    } catch (error) {
      console.error('[KKiaPay] Erreur traitement webhook:', error);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Calcule le montant selon le type d'abonnement
   * @param {string} subscriptionType - MONTHLY ou ANNUAL
   * @returns {number} - Montant en FCFA
   */
  getSubscriptionAmount(subscriptionType) {
    return subscriptionType === 'ANNUAL' ? 10000 : 999;
  }

  /**
   * Calcule la nouvelle date d'expiration
   * @param {Date} currentDate - Date actuelle
   * @param {string} subscriptionType - MONTHLY ou ANNUAL
   * @returns {Date} - Nouvelle date d'expiration
   */
  calculateExpirationDate(currentDate, subscriptionType) {
    const newDate = new Date(currentDate);
    
    if (subscriptionType === 'ANNUAL') {
      newDate.setFullYear(newDate.getFullYear() + 1);
    } else {
      newDate.setMonth(newDate.getMonth() + 1);
    }
    
    return newDate;
  }
}

module.exports = new KKiapayService();
