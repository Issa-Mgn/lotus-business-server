// Script de test du nouveau système de licences
require('dotenv').config();
const prisma = require('./src/lib/prisma');

async function testNewLicenseSystem() {
  console.log('\n🧪 Test du nouveau système de licences\n');
  console.log('='.repeat(50));

  try {
    // 1. Test : Compter les utilisateurs par type
    console.log('\n📊 1. Statistiques actuelles');
    console.log('-'.repeat(50));
    
    const stats = await prisma.user.groupBy({
      by: ['licenseType'],
      _count: {
        id: true,
      },
    });

    stats.forEach(stat => {
      console.log(`   ${stat.licenseType}: ${stat._count.id} utilisateur(s)`);
    });

    // 2. Test : Vérifier les FREE sans expiration
    console.log('\n🆓 2. Vérification licences FREE');
    console.log('-'.repeat(50));
    
    const freeUsers = await prisma.user.findMany({
      where: { licenseType: 'FREE' },
      select: {
        email: true,
        expirationDate: true,
        maxSimultaneousLogins: true,
        licenseStatus: true,
      },
      take: 3,
    });

    if (freeUsers.length === 0) {
      console.log('   ℹ️  Aucun utilisateur FREE trouvé');
    } else {
      freeUsers.forEach(user => {
        const expiration = user.expirationDate ? new Date(user.expirationDate).toLocaleDateString('fr-FR') : '♾️ Illimité';
        console.log(`   • ${user.email}`);
        console.log(`     Expiration: ${expiration}`);
        console.log(`     Max connexions: ${user.maxSimultaneousLogins}`);
        console.log(`     Statut: ${user.licenseStatus}`);
      });
    }

    // 3. Test : Vérifier les PREMIUM avec expiration
    console.log('\n💎 3. Vérification licences PREMIUM');
    console.log('-'.repeat(50));
    
    const premiumUsers = await prisma.user.findMany({
      where: { licenseType: 'PREMIUM' },
      select: {
        email: true,
        expirationDate: true,
        maxSimultaneousLogins: true,
        licenseStatus: true,
        activationDate: true,
      },
      take: 3,
    });

    if (premiumUsers.length === 0) {
      console.log('   ℹ️  Aucun utilisateur PREMIUM trouvé');
    } else {
      premiumUsers.forEach(user => {
        const activation = new Date(user.activationDate).toLocaleDateString('fr-FR');
        const expiration = user.expirationDate ? new Date(user.expirationDate).toLocaleDateString('fr-FR') : 'Non défini';
        const daysLeft = user.expirationDate ? Math.ceil((new Date(user.expirationDate) - new Date()) / (1000 * 60 * 60 * 24)) : 0;
        
        console.log(`   • ${user.email}`);
        console.log(`     Activation: ${activation}`);
        console.log(`     Expiration: ${expiration}`);
        console.log(`     Jours restants: ${daysLeft}`);
        console.log(`     Max connexions: ${user.maxSimultaneousLogins}`);
        console.log(`     Statut: ${user.licenseStatus}`);
      });
    }

    // 4. Test : Vérifier les licences expirées
    console.log('\n⏰ 4. Licences PREMIUM expirées');
    console.log('-'.repeat(50));
    
    const expiredPremium = await prisma.user.count({
      where: {
        licenseType: 'PREMIUM',
        expirationDate: {
          lt: new Date(),
          not: null,
        },
      },
    });

    console.log(`   ${expiredPremium} licence(s) PREMIUM expirée(s)`);

    // 5. Test : Vérifier la cohérence
    console.log('\n✅ 5. Vérification de cohérence');
    console.log('-'.repeat(50));
    
    const inconsistencies = [];

    // FREE avec expiration
    const freeWithExpiration = await prisma.user.count({
      where: {
        licenseType: 'FREE',
        expirationDate: { not: null },
      },
    });
    if (freeWithExpiration > 0) {
      inconsistencies.push(`❌ ${freeWithExpiration} utilisateur(s) FREE avec expiration`);
    }

    // PREMIUM sans expiration
    const premiumWithoutExpiration = await prisma.user.count({
      where: {
        licenseType: 'PREMIUM',
        expirationDate: null,
      },
    });
    if (premiumWithoutExpiration > 0) {
      inconsistencies.push(`❌ ${premiumWithoutExpiration} utilisateur(s) PREMIUM sans expiration`);
    }

    // FREE avec maxSimultaneousLogins != 1
    const freeWrongLogins = await prisma.user.count({
      where: {
        licenseType: 'FREE',
        maxSimultaneousLogins: { not: 1 },
      },
    });
    if (freeWrongLogins > 0) {
      inconsistencies.push(`❌ ${freeWrongLogins} utilisateur(s) FREE avec mauvais maxSimultaneousLogins`);
    }

    if (inconsistencies.length === 0) {
      console.log('   ✅ Aucune incohérence détectée');
    } else {
      console.log('   ⚠️  Incohérences trouvées :');
      inconsistencies.forEach(inc => console.log(`      ${inc}`));
      console.log('\n   💡 Exécutez MIGRATION_FREE_UNLIMITED.sql pour corriger');
    }

    console.log('\n' + '='.repeat(50));
    console.log('✅ Test terminé avec succès\n');

  } catch (error) {
    console.error('\n❌ Erreur lors du test:', error.message);
    console.error('\n💡 Vérifiez que :');
    console.log('   1. La base de données est accessible');
    console.log('   2. La migration a été exécutée');
    console.log('   3. Le client Prisma est à jour (npm run prisma:generate)\n');
  } finally {
    await prisma.$disconnect();
  }
}

testNewLicenseSystem().catch(console.error);
