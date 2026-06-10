// c:\Mes Travaux\Lotus Business\server\src\lib\generateLicenseKey.js

const { v4: uuidv4 } = require('uuid');

/**
 * Génère une clé de licence au format LOT-XXXX-xxxx-XXXX
 * Format : LOT-1234-abcd-5678 (chiffres + lettres pour plus de combinaisons)
 * Exemples : LOT-8248-izri-8239, LOT-3457-ksme-9021
 * @returns {string} Clé de licence formatée
 */
function generateLicenseKey() {
  const uuid = uuidv4().replace(/-/g, '');
  
  // Part 1 : 4 chiffres (0000-9999)
  const part1 = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
  
  // Part 2 : 4 lettres minuscules (aaaa-zzzz) - depuis l'UUID
  let part2 = uuid.substring(0, 4).toLowerCase();
  // Remplacer les chiffres par des lettres aléatoires
  part2 = part2.replace(/[0-9]/g, () => {
    return String.fromCharCode(97 + Math.floor(Math.random() * 26)); // a-z
  });
  
  // Part 3 : 4 chiffres (0000-9999)
  const part3 = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
  
  return `LOT-${part1}-${part2}-${part3}`;
}

module.exports = generateLicenseKey;
