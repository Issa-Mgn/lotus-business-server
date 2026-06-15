// src/lib/sendMail.js
const transporter = require('./mailer');

/**
 * Fonction d'envoi d'email avec Nodemailer
 * @param {string} to - Email du destinataire
 * @param {string} subject - Sujet de l'email
 * @param {string} html - Contenu HTML de l'email
 * @param {string} text - Contenu texte plain (optionnel)
 * @returns {Promise<{success: boolean, messageId?: string, error?: string}>}
 */
async function sendMail(to, subject, html, text = '') {
  try {
    if (!process.env.MAIL_USER || !process.env.MAIL_APP_PASSWORD) {
      throw new Error('MAIL_USER ou MAIL_APP_PASSWORD manquant dans .env');
    }

    const mailOptions = {
      from: `"Lotus Business" <${process.env.MAIL_USER}>`,
      to,
      subject,
      html,
      text,
      // En-têtes anti-spam
      headers: {
        'X-Priority': '3',
        'X-MSMail-Priority': 'Normal',
        'Importance': 'Normal',
      },
    };

    const info = await transporter.sendMail(mailOptions);
    
    console.log('[sendMail] ✅ Email envoyé avec succès:', {
      to,
      subject,
      messageId: info.messageId,
    });

    return {
      success: true,
      messageId: info.messageId,
    };
  } catch (error) {
    console.error('[sendMail] ❌ Erreur lors de l\'envoi de l\'email:', {
      to,
      subject,
      error: error.message,
    });

    return {
      success: false,
      error: error.message,
    };
  }
}

module.exports = sendMail;
