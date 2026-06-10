// c:\Mes Travaux\Lotus Business\server\check-setup.js
// Script de vérification de l'installation

const fs = require('fs');
const path = require('path');

console.log('🔍 Vérification de l\'installation Lotus Business...\n');

const checks = [];

// Vérification des fichiers critiques
const criticalFiles = [
  'package.json',
  'prisma/schema.prisma',
  'src/app.js',
  'src/lib/prisma.js',
  'src/lib/generateLicenseKey.js',
  'src/middlewares/auth.js',
  'src/middlewares/isAdmin.js',
  'src/middlewares/checkLicense.js',
  'src/controllers/authController.js',
  'src/controllers/adminController.js',
  'src/routes/auth.js',
  'src/routes/admin.js',
];

console.log('📁 Vérification des fichiers critiques...');
criticalFiles.forEach(file => {
  const exists = fs.existsSync(path.join(__dirname, file));
  const status = exists ? '✅' : '❌';
  console.log(`   ${status} ${file}`);
  checks.push({ name: file, passed: exists });
});

// Vérification du .env
console.log('\n🔐 Vérification du fichier .env...');
const envExists = fs.existsSync(path.join(__dirname, '.env'));
if (envExists) {
  console.log('   ✅ Fichier .env trouvé');
  
  // Vérification des variables
  require('dotenv').config();
  const requiredVars = ['DATABASE_URL', 'JWT_SECRET', 'PORT'];
  
  requiredVars.forEach(varName => {
    const exists = !!process.env[varName];
    const status = exists ? '✅' : '❌';
    console.log(`   ${status} ${varName} ${exists ? '(défini)' : '(manquant)'}`);
    checks.push({ name: `ENV_${varName}`, passed: exists });
  });
} else {
  console.log('   ❌ Fichier .env introuvable');
  console.log('   💡 Créez-le avec : cp .env.example .env');
  checks.push({ name: '.env', passed: false });
}

// Vérification de node_modules
console.log('\n📦 Vérification des dépendances...');
const nodeModulesExists = fs.existsSync(path.join(__dirname, 'node_modules'));
if (nodeModulesExists) {
  console.log('   ✅ node_modules trouvé');
  
  const dependencies = [
    'express',
    'bcrypt',
    'jsonwebtoken',
    'uuid',
    'dotenv',
    '@prisma/client',
    'cors',
  ];
  
  dependencies.forEach(dep => {
    const exists = fs.existsSync(path.join(__dirname, 'node_modules', dep));
    const status = exists ? '✅' : '❌';
    console.log(`   ${status} ${dep}`);
    checks.push({ name: `DEP_${dep}`, passed: exists });
  });
} else {
  console.log('   ❌ node_modules introuvable');
  console.log('   💡 Installez les dépendances avec : npm install');
  checks.push({ name: 'node_modules', passed: false });
}

// Vérification du client Prisma
console.log('\n🗄️  Vérification du client Prisma...');
const prismaClientExists = fs.existsSync(path.join(__dirname, 'node_modules', '.prisma', 'client'));
if (prismaClientExists) {
  console.log('   ✅ Client Prisma généré');
} else {
  console.log('   ⚠️  Client Prisma non généré');
  console.log('   💡 Générez-le avec : npm run prisma:generate');
}
checks.push({ name: 'prisma_client', passed: prismaClientExists });

// Résumé
console.log('\n' + '='.repeat(50));
const passed = checks.filter(c => c.passed).length;
const total = checks.length;
const percentage = Math.round((passed / total) * 100);

if (percentage === 100) {
  console.log('🎉 Installation complète ! Tout est prêt.');
  console.log('\n📝 Prochaines étapes :');
  console.log('   1. Vérifiez votre .env avec vos credentials Supabase');
  console.log('   2. Exécutez : npm run prisma:generate');
  console.log('   3. Exécutez : npm run prisma:migrate');
  console.log('   4. (Optionnel) Exécutez : npm run prisma:seed');
  console.log('   5. Démarrez le serveur : npm run dev');
} else {
  console.log(`⚠️  Installation à ${percentage}% (${passed}/${total} vérifications passées)`);
  console.log('\n❌ Éléments manquants :');
  checks.filter(c => !c.passed).forEach(c => {
    console.log(`   - ${c.name}`);
  });
  console.log('\n💡 Consultez SETUP.md pour les instructions complètes');
}
console.log('='.repeat(50) + '\n');
