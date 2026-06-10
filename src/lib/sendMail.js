// src/lib/sendMail.js
const transporter = require('./mailer');

/**
 * Envoie un email avec Nodemailer
 * @param {string} to - Email du destinataire
 * @param {string} subject - Sujet de l'email
 * @param {string} html - Contenu HTML de l'email
 * @param {string} text - Version texte alternative (optionnel)
 * @returns {Promise<{success: boolean, error?: any}>}
 */
async function sendMail(to, subject, html, text = '') {
  try {
    if (!process.env.MAIL_USER || !process.env.MAIL_APP_PASSWORD) {
      throw new Error('MAIL_USER ou MAIL_APP_PASSWORD manquant');
    }

    const mailOptions = {
      from: `"Lotus Business" <${process.env.MAIL_USER}>`,
      to,
      subject,
      html,
      text: text || 'Merci de consulter cet email en HTML.',
      // Headers anti-spam
      headers: {
        'X-Priority': '1',
        'X-MSMail-Priority': 'High',
        'Importance': 'high',
      },
      // Message ID personnalisé
      messageId: `<${Date.now()}.${to.split('@')[0]}@lotusbusiness.com>`,
    };

    const info = await transporter.sendMail(mailOptions);
    
    console.log('✅ Email envoyé avec succès:', {
      to,
      subject,
      messageId: info.messageId,
    });

    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('❌ Erreur lors de l\'envoi de l\'email:', {
      to,
      subject,
      error: error.message,
    });

    return { success: false, error: error.message };
  }
}

module.exports = { sendMail };
