// c:\Mes Travaux\Lotus Business\server\test-supabase-connection.js
// Script de test de connexion à Supabase

require('dotenv').config();
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient({
  log: ['query', 'error', 'warn'],
});

async function testConnection() {
  console.log('🔍 Test de connexion à Supabase...\n');

  // Vérification des variables d'environnement
  console.log('📋 Vérification des variables d\'environnement...');
  
  if (!process.env.DATABASE_URL) {
    console.log('❌ DATABASE_URL non définie dans .env');
    console.log('💡 Ajoutez votre connection string Supabase dans .env\n');
    process.exit(1);
  }
  
  // Masquer le mot de passe pour l'affichage
  const maskedUrl = process.env.DATABASE_URL.replace(
    /:([^:@]+)@/,
    ':****@'
  );
  console.log(`✅ DATABASE_URL trouvée : ${maskedUrl}`);
  
  // Détecter le type de connexion
  if (process.env.DATABASE_URL.includes('pooler.supabase.com')) {
    const port = process.env.DATABASE_URL.includes(':6543') ? '6543 (Session)' : '5432 (Transaction)';
    console.log(`ℹ️  Type : Supabase Pooler - Port ${port}`);
  } else if (process.env.DATABASE_URL.includes('supabase.co')) {
    console.log('ℹ️  Type : Supabase Direct Connection');
  } else {
    console.log('⚠️  Type : Non-Supabase (potentiellement local)');
  }

  console.log('\n🔌 Tentative de connexion à la base de données...');

  try {
    // Test de connexion simple
    await prisma.$connect();
    console.log('✅ Connexion établie avec succès !\n');

    // Test de requête
    console.log('📊 Vérification des tables...');
    
    try {
      const userCount = await prisma.user.count();
      console.log(`✅ Table "users" accessible (${userCount} utilisateur(s))`);
    } catch (error) {
      console.log('⚠️  Table "users" non trouvée (migrations non exécutées)');
      console.log('💡 Exécutez : npm run prisma:migrate\n');
    }

    try {
      const licenseCount = await prisma.license.count();
      console.log(`✅ Table "licenses" accessible (${licenseCount} licence(s))`);
    } catch (error) {
      console.log('⚠️  Table "licenses" non trouvée (migrations non exécutées)');
      console.log('💡 Exécutez : npm run prisma:migrate\n');
    }

    console.log('\n🎉 Test de connexion réussi !');
    console.log('\n📝 Prochaines étapes :');
    console.log('   1. Si les tables n\'existent pas : npm run prisma:migrate');
    console.log('   2. (Optionnel) Créer des données de test : npm run prisma:seed');
    console.log('   3. Démarrer le serveur : npm run dev\n');

  } catch (error) {
    console.log('❌ Échec de la connexion\n');
    console.log('🔍 Détails de l\'erreur :');
    console.log(`   Code : ${error.code || 'N/A'}`);
    console.log(`   Message : ${error.message}\n`);

    console.log('💡 Solutions possibles :');
    
    if (error.message.includes('authentication') || error.message.includes('password')) {
      console.log('   • Vérifiez votre mot de passe dans DATABASE_URL');
      console.log('   • Le mot de passe doit être celui de votre base Supabase');
      console.log('   • Si besoin, réinitialisez-le dans : Supabase > Settings > Database\n');
    } else if (error.message.includes('timeout') || error.message.includes('ENOTFOUND')) {
      console.log('   • Vérifiez votre connexion internet');
      console.log('   • Vérifiez que le hostname Supabase est correct');
      console.log('   • Le projet Supabase est-il bien actif ?\n');
    } else if (error.message.includes('SSL') || error.message.includes('ssl')) {
      console.log('   • Ajoutez ?sslmode=require à la fin de DATABASE_URL');
      console.log('   • Exemple : ...postgres?sslmode=require\n');
    } else {
      console.log('   • Vérifiez le format de votre DATABASE_URL');
      console.log('   • Format attendu : postgresql://postgres.[REF]:[PASSWORD]@...supabase.com:6543/postgres');
      console.log('   • Consultez SUPABASE_SETUP.md pour plus d\'aide\n');
    }

    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

testConnection();
