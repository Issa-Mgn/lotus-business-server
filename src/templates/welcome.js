// src/templates/welcome.js

/**
 * Template HTML pour l'email de bienvenue
 * @param {string} firstName - Prénom de l'utilisateur
 * @param {string} licenseKey - Clé de licence
 * @param {Date|string} endDate - Date d'expiration de la licence
 * @returns {string} HTML de l'email
 */
function welcomeTemplate(firstName, licenseKey, endDate) {
  const formattedDate = new Date(endDate).toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  return `
<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Bienvenue sur Lotus Business</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f3f4f6;">
  
  <!-- Container principal -->
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f3f4f6; padding: 40px 20px;">
    <tr>
      <td align="center">
        
        <!-- Email content -->
        <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);">
          
          <!-- Header avec logo -->
          <tr>
            <td style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 50px 40px; text-align: center; position: relative;">
              <!-- Logo / Image de profil -->
              <div style="margin-bottom: 20px;">
                <img src="https://lotus-txn2.vercel.app/logo.png" alt="Lotus Business" style="width: 80px; height: 80px; border-radius: 50%; border: 4px solid #ffffff; box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);">
              </div>
              <h1 style="margin: 0; font-size: 36px; font-weight: 700; color: #ffffff; letter-spacing: -0.5px; text-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);">
                Lotus Business
              </h1>
              <p style="margin: 12px 0 0 0; font-size: 17px; color: #e0e7ff; font-weight: 500;">
                Plateforme de Gestion Commerciale
              </p>
            </td>
          </tr>
          
          <!-- Body -->
          <tr>
            <td style="padding: 50px 40px;">
              
              <!-- Badge de bienvenue -->
              <div style="text-align: center; margin-bottom: 30px;">
                <span style="display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: #ffffff; padding: 8px 24px; border-radius: 50px; font-size: 14px; font-weight: 600; text-transform: uppercase; letter-spacing: 1px;">
                  🎉 Compte Créé
                </span>
              </div>
              
              <!-- Greeting -->
              <h2 style="margin: 0 0 20px 0; font-size: 28px; color: #1f2937; font-weight: 700; text-align: center;">
                Bienvenue ${firstName} !
              </h2>
              
              <p style="margin: 0 0 30px 0; font-size: 17px; line-height: 1.7; color: #4b5563; text-align: center;">
                Nous sommes ravis de vous compter parmi nous. Votre compte a été créé avec succès et votre licence est maintenant <strong style="color: #10b981;">active</strong>.
              </p>
              
              <!-- License key box -->
              <table width="100%" cellpadding="0" cellspacing="0" style="margin: 40px 0;">
                <tr>
                  <td style="background: linear-gradient(135deg, #f9fafb 0%, #f3f4f6 100%); border: 3px solid #667eea; border-radius: 16px; padding: 40px 30px; text-align: center; box-shadow: 0 4px 12px rgba(102, 126, 234, 0.15);">
                    <p style="margin: 0 0 12px 0; font-size: 13px; color: #6b7280; text-transform: uppercase; letter-spacing: 2px; font-weight: 700;">
                      🔑 Votre clé de licence
                    </p>
                    <div style="margin: 20px 0; padding: 20px; background: #ffffff; border-radius: 12px; box-shadow: inset 0 2px 4px rgba(0, 0, 0, 0.06);">
                      <div style="font-size: 32px; font-weight: 800; color: #667eea; letter-spacing: 3px; font-family: 'Courier New', Consolas, monospace; word-break: break-all;">
                        ${licenseKey}
                      </div>
                    </div>
                    <p style="margin: 12px 0 0 0; font-size: 14px; color: #9ca3af; font-weight: 500;">
                      💎 Conservez précieusement cette clé unique
                    </p>
                  </td>
                </tr>
              </table>
              
              <!-- License info cards -->
              <table width="100%" cellpadding="0" cellspacing="0" style="margin: 40px 0;">
                <tr>
                  <td>
                    <table width="100%" cellpadding="0" cellspacing="0">
                      <tr>
                        <!-- Card 1 -->
                        <td width="32%" style="vertical-align: top;">
                          <div style="background: #f9fafb; border: 2px solid #e5e7eb; border-radius: 12px; padding: 20px; text-align: center;">
                            <div style="font-size: 32px; margin-bottom: 8px;">🎁</div>
                            <div style="font-size: 13px; color: #6b7280; margin-bottom: 4px; font-weight: 600;">Type</div>
                            <div style="font-size: 16px; color: #1f2937; font-weight: 700;">FREE</div>
                          </div>
                        </td>
                        <td width="2%"></td>
                        <!-- Card 2 -->
                        <td width="32%" style="vertical-align: top;">
                          <div style="background: #f0fdf4; border: 2px solid #86efac; border-radius: 12px; padding: 20px; text-align: center;">
                            <div style="font-size: 32px; margin-bottom: 8px;">✓</div>
                            <div style="font-size: 13px; color: #16a34a; margin-bottom: 4px; font-weight: 600;">Statut</div>
                            <div style="font-size: 16px; color: #15803d; font-weight: 700;">Active</div>
                          </div>
                        </td>
                        <td width="2%"></td>
                        <!-- Card 3 -->
                        <td width="32%" style="vertical-align: top;">
                          <div style="background: #fef3c7; border: 2px solid #fcd34d; border-radius: 12px; padding: 20px; text-align: center;">
                            <div style="font-size: 32px; margin-bottom: 8px;">📅</div>
                            <div style="font-size: 13px; color: #b45309; margin-bottom: 4px; font-weight: 600;">Validité</div>
                            <div style="font-size: 16px; color: #92400e; font-weight: 700;">1 mois</div>
                          </div>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
              
              <!-- Expiration info -->
              <div style="background: #eff6ff; border-left: 4px solid #3b82f6; border-radius: 8px; padding: 20px 24px; margin: 30px 0;">
                <p style="margin: 0; font-size: 15px; color: #1e40af;">
                  <strong style="font-size: 16px;">📆 Date d'expiration :</strong><br>
                  <span style="font-size: 17px; font-weight: 700; color: #1e3a8a;">${formattedDate}</span>
                </p>
              </div>
              
              <!-- Important notice -->
              <div style="background: #fef3c7; border-left: 4px solid #f59e0b; border-radius: 8px; padding: 24px; margin: 30px 0;">
                <p style="margin: 0 0 12px 0; font-size: 16px; color: #92400e; font-weight: 700;">
                  ⚠️ Informations importantes
                </p>
                <ul style="margin: 0; padding: 0 0 0 20px; font-size: 15px; color: #78350f; line-height: 1.8;">
                  <li style="margin-bottom: 8px;">Cette clé est <strong>unique</strong> et personnelle</li>
                  <li style="margin-bottom: 8px;">Utilisez-la pour accéder à votre espace</li>
                  <li style="margin-bottom: 8px;">Ne la partagez avec personne</li>
                  <li>En cas de perte, utilisez "Clé oubliée"</li>
                </ul>
              </div>
              
              <!-- CTA Button -->
              <table width="100%" cellpadding="0" cellspacing="0" style="margin: 40px 0;">
                <tr>
                  <td align="center">
                    <a href="#" style="display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: #ffffff; text-decoration: none; padding: 18px 50px; border-radius: 12px; font-size: 17px; font-weight: 700; box-shadow: 0 10px 25px -5px rgba(102, 126, 234, 0.4); transition: all 0.3s;">
                      🚀 Accéder à mon espace
                    </a>
                  </td>
                </tr>
              </table>
              
              <!-- Divider -->
              <div style="height: 1px; background: linear-gradient(to right, transparent, #e5e7eb, transparent); margin: 40px 0;"></div>
              
              <!-- Support section -->
              <div style="text-align: center; margin: 30px 0;">
                <p style="margin: 0 0 16px 0; font-size: 15px; color: #6b7280;">
                  <strong style="color: #1f2937;">Besoin d'aide ?</strong>
                </p>
                <p style="margin: 0; font-size: 14px; color: #9ca3af;">
                  Notre équipe est là pour vous accompagner
                </p>
              </div>
              
              <!-- Closing -->
              <p style="margin: 30px 0 0 0; font-size: 16px; line-height: 1.7; color: #4b5563; text-align: center;">
                Nous vous souhaitons une excellente expérience avec <strong style="color: #667eea;">Lotus Business</strong>.
              </p>
              
              <p style="margin: 24px 0 0 0; font-size: 15px; color: #6b7280; text-align: center;">
                Cordialement,<br>
                <strong style="color: #1f2937;">L'équipe Lotus Business</strong>
              </p>
              
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="background-color: #f9fafb; padding: 30px 40px; text-align: center; border-top: 1px solid #e5e7eb;">
              <p style="margin: 0 0 12px 0; font-size: 13px; color: #6b7280; line-height: 1.6;">
                Cet email a été envoyé automatiquement, merci de ne pas y répondre.<br>
                Si vous n'êtes pas à l'origine de cette inscription, veuillez ignorer ce message.
              </p>
              <p style="margin: 16px 0 0 0; font-size: 13px; color: #9ca3af;">
                © ${new Date().getFullYear()} <strong style="color: #667eea;">Lotus Business</strong> - Tous droits réservés
              </p>
            </td>
          </tr>
          
        </table>
        
      </td>
    </tr>
  </table>
  
</body>
</html>
  `;
}

/**
 * Version texte plain de l'email de bienvenue (pour les clients mail sans HTML)
 * @param {string} firstName - Prénom de l'utilisateur
 * @param {string} licenseKey - Clé de licence
 * @param {Date|string} endDate - Date d'expiration de la licence
 * @returns {string} Texte plain
 */
function welcomeTemplateText(firstName, licenseKey, endDate) {
  const formattedDate = new Date(endDate).toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  return `
LOTUS BUSINESS

Bienvenue ${firstName} !

Nous sommes ravis de vous compter parmi nous. Votre compte a été créé avec succès et votre licence est maintenant active.

VOTRE CLÉ DE LICENCE
${licenseKey}

Conservez précieusement cette clé.

DÉTAILS DE VOTRE LICENCE
- Type : FREE (1 mois)
- Statut : Active
- Expire le : ${formattedDate}

IMPORTANT
- Cette clé est unique et liée à votre compte
- Utilisez-la pour vous connecter à votre espace
- Ne la partagez avec personne
- Si vous la perdez, utilisez "Clé oubliée" pour la récupérer

Nous vous souhaitons une excellente expérience avec Lotus Business.

Cordialement,
L'équipe Lotus Business

---
Cet email a été envoyé automatiquement, merci de ne pas y répondre.
© ${new Date().getFullYear()} Lotus Business - Tous droits réservés
  `.trim();
}

module.exports = { welcomeTemplate, welcomeTemplateText };
