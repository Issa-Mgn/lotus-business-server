// Script pour générer un hash bcrypt pour créer un admin
const bcrypt = require('bcrypt');

async function generateAdminHash() {
  const password = process.argv[2] || 'admin123';
  
  console.log('\n🔐 Génération du hash bcrypt...\n');
  console.log('Mot de passe :', password);
  
  const hash = await bcrypt.hash(password, 10);
  
  console.log('Hash bcrypt :', hash);
  console.log('\n📋 Requête SQL à exécuter dans Supabase :\n');
  console.log(`INSERT INTO "admins" ("id", "email", "phone", "password", "createdAt")`);
  console.log(`VALUES (`);
  console.log(`  gen_random_uuid()::text,`);
  console.log(`  'admin@lotusbusiness.com',`);
  console.log(`  '+221770000000',`);
  console.log(`  '${hash}',`);
  console.log(`  CURRENT_TIMESTAMP`);
  console.log(`);`);
  console.log('\n✅ Copie cette requête dans le SQL Editor de Supabase\n');
}

generateAdminHash().catch(console.error);
