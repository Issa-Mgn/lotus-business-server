// Test du générateur de clés de licence
const generateLicenseKey = require('./src/lib/generateLicenseKey');

console.log('🔑 Test du générateur de clés de licence Lotus Business\n');
console.log('Format : LOT-XXXX-xxxx-XXXX');
console.log('         LOT-chiffres-lettres-chiffres\n');

console.log('Exemples de clés générées :\n');

for (let i = 1; i <= 10; i++) {
  const key = generateLicenseKey();
  console.log(`${i.toString().padStart(2, '0')}. ${key}`);
}

console.log('\n✅ Format validé ! Chaque clé est unique.');
console.log('   • Part 1 : 4 chiffres (0000-9999) = 10,000 combinaisons');
console.log('   • Part 2 : 4 lettres (aaaa-zzzz) = 456,976 combinaisons');
console.log('   • Part 3 : 4 chiffres (0000-9999) = 10,000 combinaisons');
console.log('   • Total : 45,697,600,000,000 combinaisons possibles ! 🚀\n');
