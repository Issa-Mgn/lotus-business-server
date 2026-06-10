// c:\Mes Travaux\Lotus Business\server\src\lib\checkExpiredLicenses.js

const prisma = require('./prisma');

/**
 * Vérifie et met à jour automatiquement les licences expirées
 */
async function checkExpiredLicenses() {
  try {
    const now = new Date();
    
    // Trouver toutes les licences actives mais expirées
    const expiredUsers = await prisma.user.updateMany({
      where: {
        licenseStatus: 'ACTIVE',
        expirationDate: {
          lt: now
        }
      },
      data: {
        licenseStatus: 'EXPIRED',
        isOnline: false,
        activeSessionId: null
      }
    });

    if (expiredUsers.count > 0) {
      console.log(`⏰ ${expiredUsers.count} licence(s) expirée(s) mise(s) à jour`);
    }

    return expiredUsers.count;
  } catch (error) {
    console.error('Erreur vérification licences expirées:', error);
    return 0;
  }
}

module.exports = { checkExpiredLicenses };