// src/services/mailService.js
const { brevo, BrevoError } = require('../config/mailer');

function ensureSender() {
  const email = process.env.BREVO_SENDER_EMAIL;
  const name = process.env.BREVO_SENDER_NAME || 'Lotus Business';
  if (!email) throw new Error('BREVO_SENDER_EMAIL manquant');
  return { email, name };
}

/**
 * Envoi générique via Brevo Transactional API
 * @returns {{success: boolean, messageId?: string, error?: string}}
 */
async function sendCustomEmail(toEmail, toName, subject, htmlContent, textContent = '') {
  try {
    if (!process.env.BREVO_API_KEY) {
      throw new Error('BREVO_API_KEY manquant');
    }

    const sender = ensureSender();

    const sendSmtpEmail = {
      sender: { name: sender.name, email: sender.email },
      to: [{ email: toEmail, name: toName || '' }],
      subject: subject || 'Lotus Business',
      htmlContent: htmlContent || '',
      textContent: textContent || '',
    };

    if (!brevo) throw new Error('Brevo client non initialisé');

    const debug = process.env.DEBUG_MAIL === '1' || process.env.DEBUG_MAIL === 'true';
    if (debug) {
      try {
        console.log('[mailService][DEBUG] Preparing to send email:', JSON.stringify(sendSmtpEmail, null, 2));
      } catch (e) {
        console.log('[mailService][DEBUG] sendSmtpEmail', sendSmtpEmail);
      }
    }

    const result = await brevo.transactionalEmails.sendTransacEmail(sendSmtpEmail);

    if (debug) {
      console.log('[mailService][DEBUG] Brevo result:', result);
    }

    console.log('[mailService] Email envoyé', { toEmail, subject });

    // result may contain data or the raw response depending on SDK
    let messageId = null;
    if (result) {
      messageId = result.messageId || result.message_id || (result.data && (result.data.messageId || result.data.message_id)) || result.id || null;
    }
    return { success: true, messageId, data: result };
  } catch (error) {
    // Log details for Brevo errors
    try {
      if (error instanceof BrevoError) {
        console.error('[mailService] BrevoError:', {
          statusCode: error.statusCode,
          message: error.message,
          body: error.body,
        });
      } else if (error && error.rawResponse) {
        console.error('[mailService] rawResponse:', error.rawResponse);
      }
    } catch (e) {
      // ignore introspection errors
    }

    console.error('[mailService] Erreur envoi email:', error && error.message ? error.message : error);
    return { success: false, error: (error && error.message) ? error.message : String(error) };
  }
}

async function sendLicenseConfirmation(toEmail, toName, licenseKey, htmlContent, textContent = '') {
  const subject = 'Votre licence Lotus Business';
  return sendCustomEmail(toEmail, toName, subject, htmlContent, textContent);
}

async function sendLicenseRecovery(toEmail, toName, licenseKey, htmlContent, textContent = '') {
  const subject = 'Récupération de votre clé Lotus Business';
  return sendCustomEmail(toEmail, toName, subject, htmlContent, textContent);
}

module.exports = { sendCustomEmail, sendLicenseConfirmation, sendLicenseRecovery };
