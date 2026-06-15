// src/templates/welcome.js

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
<body style="margin: 0; padding: 0; background-color: #ffffff; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif;">

  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #ffffff; padding: 48px 16px;">
    <tr>
      <td align="center">
        <table width="100%" cellpadding="0" cellspacing="0" style="max-width: 580px;">

          <!-- Header -->
          <tr>
            <td style="padding-bottom: 32px; text-align: center;">
              <img src="https://ik.imagekit.io/81ielaf3a/logo.jpeg" alt="Lotus Business" style="width: 48px; height: 48px; border-radius: 12px;">
              <p style="margin: 10px 0 0 0; font-size: 13px; font-weight: 600; color: #111111; letter-spacing: 2px; text-transform: uppercase;">Lotus Business</p>
            </td>
          </tr>

          <!-- Divider -->
          <tr>
            <td style="padding-bottom: 32px;">
              <div style="height: 1px; background-color: #111111;"></div>
            </td>
          </tr>

          <!-- Titre -->
          <tr>
            <td style="padding-bottom: 12px;">
              <p style="margin: 0; font-size: 11px; font-weight: 600; color: #16a34a; letter-spacing: 1.5px; text-transform: uppercase;">Activation réussie</p>
            </td>
          </tr>
          <tr>
            <td style="padding-bottom: 24px;">
              <h1 style="margin: 0; font-size: 26px; font-weight: 700; color: #111111; line-height: 1.3;">
                Bienvenue, ${firstName}.
              </h1>
            </td>
          </tr>

          <!-- Intro -->
          <tr>
            <td style="padding-bottom: 32px;">
              <p style="margin: 0; font-size: 15px; line-height: 1.7; color: #111111;">
                Votre compte Lotus Business est actif. Conservez la clé ci-dessous — elle vous sera demandée à chaque connexion.
              </p>
            </td>
          </tr>

          <!-- Bloc clé de licence -->
          <tr>
            <td style="padding-bottom: 28px;">
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="background-color: #ffffff; border: 2px solid #111111; border-radius: 8px; padding: 22px 24px;">
                    <p style="margin: 0 0 10px 0; font-size: 11px; font-weight: 600; color: #111111; letter-spacing: 1.5px; text-transform: uppercase;">
                      Clé de licence
                    </p>
                    <p style="margin: 0; font-family: 'Courier New', Consolas, monospace; font-size: 17px; font-weight: 700; color: #111111; letter-spacing: 2px; word-break: break-all;">
                      ${licenseKey}
                    </p>
                    <p style="margin: 12px 0 0 0; font-size: 12px; color: #111111;">
                      Sélectionnez la clé pour la copier
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Détails licence -->
          <tr>
            <td style="padding-bottom: 28px;">
              <table width="100%" cellpadding="0" cellspacing="0" style="border: 1px solid #111111; border-radius: 8px; overflow: hidden;">
                <tr>
                  <td style="padding: 14px 20px; border-bottom: 1px solid #111111;">
                    <span style="font-size: 13px; color: #111111;">Plan</span>
                  </td>
                  <td style="padding: 14px 20px; text-align: right; border-bottom: 1px solid #111111;">
                    <span style="font-size: 13px; font-weight: 600; color: #111111;">FREE</span>
                  </td>
                </tr>
                <tr>
                  <td style="padding: 14px 20px; border-bottom: 1px solid #111111;">
                    <span style="font-size: 13px; color: #111111;">Statut</span>
                  </td>
                  <td style="padding: 14px 20px; text-align: right; border-bottom: 1px solid #111111;">
                    <span style="font-size: 13px; font-weight: 600; color: #16a34a;">Active</span>
                  </td>
                </tr>
                <tr>
                  <td style="padding: 14px 20px;">
                    <span style="font-size: 13px; color: #111111;">Expire le</span>
                  </td>
                  <td style="padding: 14px 20px; text-align: right;">
                    <span style="font-size: 13px; font-weight: 600; color: #111111;">${formattedDate}</span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Alerte -->
          <tr>
            <td style="padding-bottom: 36px;">
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="background-color: #ffffff; border: 1px solid #ef4444; border-radius: 8px; padding: 16px 20px;">
                    <p style="margin: 0; font-size: 13px; line-height: 1.6; color: #ef4444;">
                      <strong>Important —</strong> Cette clé est unique et confidentielle. En cas de perte, utilisez la fonction <em>Clé oubliée</em> depuis l'application.
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>


          <!-- Divider footer -->
          <tr>
            <td style="padding-bottom: 28px;">
              <div style="height: 1px; background-color: #111111;"></div>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="text-align: center;">
              <p style="margin: 0 0 4px 0; font-size: 12px; color: #111111;">
                Cet email est généré automatiquement — merci de ne pas y répondre.
              </p>
              <p style="margin: 0; font-size: 11px; color: #111111;">
                © ${new Date().getFullYear()} Lotus Business
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

function welcomeTemplateText(firstName, licenseKey, endDate) {
  const formattedDate = new Date(endDate).toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  return `
LOTUS BUSINESS
──────────────────────────

Bienvenue, ${firstName}.

Votre compte est actif. Conservez cette clé — elle vous sera demandée à chaque connexion.

CLÉ DE LICENCE
${licenseKey}

DÉTAILS
Plan     : FREE
Statut   : Active
Expire   : ${formattedDate}

Important : Cette clé est unique et confidentielle.
En cas de perte, utilisez "Clé oubliée" depuis l'application.

──────────────────────────
© ${new Date().getFullYear()} Lotus Business
Email automatique — ne pas répondre.
  `.trim();
}

module.exports = {
  welcomeTemplate,
  welcomeTemplateText,
};