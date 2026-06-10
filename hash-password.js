const bcrypt = require('bcrypt');

// Remplace par ton mot de passe
const password = process.argv[2] || 'changeme';

if (!process.argv[2]) {
  console.log('❌ Usage: node hash-password.js "ton_mot_de_passe"');
  process.exit(1);
}

bcrypt.hash(password, 10).then(hash => {
  console.log('\n✅ Hash généré avec succès !\n');
  console.log('📋 Copie ce hash et mets-le dans Supabase :\n');
  console.log(hash);
  console.log('\n');
  console.log('📝 SQL à exécuter dans Supabase SQL Editor :\n');
  console.log(`UPDATE admins SET password = '${hash}' WHERE email = 'miganissa334@gmail.com';`);
  console.log('\n');
});
