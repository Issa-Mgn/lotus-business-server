const fetch = global.fetch || require('node-fetch');
const path = require('path');

/**
 * Envoie un email de notification aux utilisateurs lors d'une mise à jour légale
 * @param {Array} users - tableau d'utilisateurs { id, email, firstName, lastName }
 * @param {Object} doc - document créé { id, type, version, content }
 */
async function sendLegalUpdateEmails(users, doc) {
  try {
    if (!process.env.BREVO_API_KEY) {
      throw new Error('BREVO_API_KEY manquant');
    }

    const sender = {
      name: 'Lotus Business',
      email: process.env.SENDER_EMAIL || 'no-reply@lotusbusiness.example'
    };

    const subject = doc.type === 'CGU'
      ? `Mise à jour des Conditions d'utilisation (v${doc.version})`
      : `Mise à jour de la Politique de confidentialité (v${doc.version})`;

    const baseUrl = process.env.BASE_URL || 'https://app.lotusbusiness.example';
    const docUrl = doc.type === 'CGU' ? `${baseUrl}/terms-of-service` : `${baseUrl}/privacy-policy`;

    for (const user of users) {
      try {
        const htmlContent = `
          <html>
            <body style="font-family:Arial,Helvetica,sans-serif;line-height:1.6;color:#222">
              <h2>Bonjour ${user.firstName || user.email},</h2>
              <p>Nous avons publié une nouvelle version de nos ${doc.type === 'CGU' ? 'Conditions d\'utilisation' : 'Politiques de confidentialité'} (version ${doc.version}).</p>
              <p>Vous pouvez consulter le document complet ici : <a href="${docUrl}">${docUrl}</a></p>
              <hr/>
              <p>Résumé :</p>
              <div>${doc.content.substring(0, 800)}${doc.content.length > 800 ? '...' : ''}</div>
              <p>Si vous acceptez ces nouvelles conditions, connectez-vous à l'application et confirmez votre acceptation.</p>
              <p>Cordialement,<br/>L'équipe Lotus Business</p>
            </body>
          </html>
        `;

        const payload = {
          sender,
          to: [{ email: user.email, name: `${user.firstName || ''} ${user.lastName || ''}`.trim() }],
          subject,
          htmlContent
        };

        const res = await fetch('https://api.brevo.com/v3/smtp/email', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'api-key': process.env.BREVO_API_KEY
          },
          body: JSON.stringify(payload)
        });

        if (!res.ok) {
          const text = await res.text();
          console.error('Brevo error for', user.email, res.status, text);
        }
      } catch (err) {
        console.error('Erreur en envoyant l\'email à', user.email, err.message || err);
      }
    }

    return { success: true };
  } catch (error) {
    console.error('sendLegalUpdateEmails error:', error);
    return { success: false, error: error.message };
  }
}

module.exports = { sendLegalUpdateEmails };
