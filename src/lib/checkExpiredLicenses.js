// c:\Mes Travaux\Lotus Business\server\src\lib\checkExpiredLicenses.js

const prisma = require('./prisma');

/**
 * Vérifie et met à jour automatiquement les licences PREMIUM expirées
 * Note: Les licences FREE n'expirent jamais
 */
async function checkExpiredLicenses() {
  try {
    const now = new Date();
    
    // Trouver toutes les licences PREMIUM actives mais expirées
    const expiredUsers = await prisma.user.updateMany({
      where: {
        licenseType: 'PREMIUM', // Seulement PREMIUM expire
        licenseStatus: 'ACTIVE',
        expirationDate: {
          lt: now,
          not: null // Exclure les null (FREE)
        }
      },
      data: {
        licenseStatus: 'EXPIRED',
        isOnline: false,
        activeSessionId: null
      }
    });

    if (expiredUsers.count > 0) {
      console.log(`⏰ ${expiredUsers.count} abonnement(s) PREMIUM expiré(s) mise(s) à jour`);
    }

    return expiredUsers.count;
  } catch (error) {
    console.error('Erreur vérification licences expirées:', error);
    return 0;
  }
}

module.exports = { checkExpiredLicenses };