// c:\Mes Travaux\Lotus Business\server\src\lib\generateLicenseKey.js
const crypto = require('crypto');

/**
 * Génère une clé de licence au format LOT-1234-ABCD-5678
 * Format : LOT-4chiffres-4lettres(MAJUSCULES)-4chiffres
 * Exemples : LOT-8248-IZRI-8239, LOT-3457-KSME-9021
 * Utilise crypto.randomBytes() pour une génération cryptographiquement sûre
 * @returns {string} Clé de licence formatée
 */
function generateLicenseKey() {
  // Part 1 : 4 chiffres (0000-9999) - cryptographiquement sûr
  const part1 = crypto.randomInt(0, 10000).toString().padStart(4, '0');
  
  // Part 2 : 4 lettres MAJUSCULES (AAAA-ZZZZ) - cryptographiquement sûr
  let part2 = '';
  for (let i = 0; i < 4; i++) {
    const randomIndex = crypto.randomInt(0, 26);
    part2 += String.fromCharCode(65 + randomIndex); // A-Z
  }
  
  // Part 3 : 4 chiffres (0000-9999) - cryptographiquement sûr
  const part3 = crypto.randomInt(0, 10000).toString().padStart(4, '0');
  
  return `LOT-${part1}-${part2}-${part3}`;
}

module.exports = generateLicenseKey;
