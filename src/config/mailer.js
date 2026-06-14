// src/config/mailer.js
const { BrevoClient, BrevoError } = require('@getbrevo/brevo');

const BREVO_API_KEY = process.env.BREVO_API_KEY || '';

if (!BREVO_API_KEY) {
  console.warn('[mailer] Attention: BREVO_API_KEY non défini. Les envois d\'emails échoueront sans cette clé.');
}

// Initialiser le client Brevo (v6+)
let brevo = null;
try {
  brevo = new BrevoClient({ apiKey: BREVO_API_KEY });
} catch (err) {
  console.error('[mailer] Erreur initialisation BrevoClient:', err && err.message ? err.message : err);
}

module.exports = { brevo, BrevoError };
