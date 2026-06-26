// c:\Mes Travaux\Lotus Business\server\src\lib\generateLicenseKey.js

/**
 * Génère une clé de licence au format LOT-1234-ABCD-5678
 * Format : LOT-4chiffres-4lettres(MAJUSCULES)-4chiffres
 * Exemples : LOT-8248-IZRI-8239, LOT-3457-KSME-9021
 * @returns {string} Clé de licence formatée
 */
function generateLicenseKey() {
  // Part 1 : 4 chiffres (0000-9999)
  const part1 = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
  
  // Part 2 : 4 lettres MAJUSCULES (AAAA-ZZZZ)
  let part2 = '';
  for (let i = 0; i < 4; i++) {
    part2 += String.fromCharCode(65 + Math.floor(Math.random() * 26)); // A-Z
  }
  
  // Part 3 : 4 chiffres (0000-9999)
  const part3 = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
  
  return `LOT-${part1}-${part2}-${part3}`;
}

module.exports = generateLicenseKey;
