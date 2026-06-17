/**
 * Script de test pour vérifier les tables infos et notifications
 */

require('dotenv').config();
const prisma = require('./src/lib/prisma');

console.log('🧪 TEST DES TABLES INFOS ET NOTIFICATIONS\n');
console.log('='.repeat(60));

async function testTables() {
  try {
    // Test 1 : Vérifier la connexion
    console.log('\n📡 TEST 1: Connexion à Supabase');
    console.log('-'.repeat(60));
    
    await prisma.$connect();
    console.log('✅ Connexion Supabase réussie');

    // Test 2 : Vérifier la table infos
    console.log('\n📋 TEST 2: Table infos');
    console.log('-'.repeat(60));
    
    try {
      const infosCount = await prisma.info.count();
      console.log(`✅ Table 'infos' accessible`);
      console.log(`   ${infosCount} info(s) trouvée(s)`);
      
      // Lister les infos existantes
      if (infosCount > 0) {
        const infos = await prisma.info.findMany({
          take: 3,
          orderBy: { createdAt: 'desc' },
          select: {
            title: true,
            published: true,
            imageUrl: true,
            createdAt: true,
          },
        });
        
        console.log('\n   Dernières infos :');
        infos.forEach((info, index) => {
          console.log(`   ${index + 1}. ${info.title}`);
          console.log(`      Publiée: ${info.published ? 'Oui' : 'Non'}`);
          console.log(`      Image: ${info.imageUrl ? 'Oui' : 'Non'}`);
          console.log(`      Date: ${new Date(info.createdAt).toLocaleString('fr-FR')}`);
        });
      }
    } catch (error) {
      console.log('❌ Erreur table infos:', error.message);
      console.log('   💡 Exécutez le script MIGRATION_INFOS_NOTIFICATIONS.sql sur Supabase');
    }

    // Test 3 : Vérifier la table notifications
    console.log('\n🔔 TEST 3: Table notifications');
    console.log('-'.repeat(60));
    
    try {
      const notifsCount = await prisma.notification.count();
      console.log(`✅ Table 'notifications' accessible`);
      console.log(`   ${notifsCount} notification(s) trouvée(s)`);
      
      // Compter par type
      const types = ['LICENSE_EXPIRED', 'LICENSE_EXPIRING_SOON', 'NEW_USER', 'USER_SUSPENDED', 'USER_UPGRADED'];
      
      if (notifsCount > 0) {
        console.log('\n   Par type :');
        for (const type of types) {
          const count = await prisma.notification.count({
            where: { type },
          });
          if (count > 0) {
            console.log(`   - ${type}: ${count}`);
          }
        }
        
        // Lister les notifications récentes
        const notifications = await prisma.notification.findMany({
          take: 3,
          orderBy: { createdAt: 'desc' },
          select: {
            type: true,
            title: true,
            isRead: true,
            userId: true,
            createdAt: true,
          },
        });
        
        console.log('\n   Dernières notifications :');
        notifications.forEach((notif, index) => {
          console.log(`   ${index + 1}. [${notif.type}] ${notif.title}`);
          console.log(`      Lue: ${notif.isRead ? 'Oui' : 'Non'}`);
          console.log(`      Ciblée: ${notif.userId ? 'Oui (user spécifique)' : 'Non (globale)'}`);
          console.log(`      Date: ${new Date(notif.createdAt).toLocaleString('fr-FR')}`);
        });
      }
    } catch (error) {
      console.log('❌ Erreur table notifications:', error.message);
      console.log('   💡 Exécutez le script MIGRATION_INFOS_NOTIFICATIONS.sql sur Supabase');
    }

    // Test 4 : Test d'insertion (info)
    console.log('\n📝 TEST 4: Création d\'une info de test');
    console.log('-'.repeat(60));
    
    try {
      const testInfo = await prisma.info.create({
        data: {
          title: 'Info de test',
          content: 'Ceci est une info créée automatiquement pour tester la table.',
          published: false,
        },
      });
      
      console.log('✅ Info de test créée avec succès');
      console.log(`   ID: ${testInfo.id}`);
      console.log(`   Titre: ${testInfo.title}`);
      
      // Supprimer l'info de test
      await prisma.info.delete({
        where: { id: testInfo.id },
      });
      console.log('✅ Info de test supprimée');
    } catch (error) {
      console.log('❌ Erreur création info:', error.message);
    }

    // Test 5 : Test d'insertion (notification)
    console.log('\n🔔 TEST 5: Création d\'une notification de test');
    console.log('-'.repeat(60));
    
    try {
      const testNotif = await prisma.notification.create({
        data: {
          type: 'NEW_USER',
          title: 'Notification de test',
          message: 'Ceci est une notification créée automatiquement pour tester la table.',
        },
      });
      
      console.log('✅ Notification de test créée avec succès');
      console.log(`   ID: ${testNotif.id}`);
      console.log(`   Type: ${testNotif.type}`);
      console.log(`   Titre: ${testNotif.title}`);
      
      // Supprimer la notification de test
      await prisma.notification.delete({
        where: { id: testNotif.id },
      });
      console.log('✅ Notification de test supprimée');
    } catch (error) {
      console.log('❌ Erreur création notification:', error.message);
    }

    // Résumé
    console.log('\n' + '='.repeat(60));
    console.log('✅ TESTS TERMINÉS');
    console.log('='.repeat(60));
    
    const finalInfosCount = await prisma.info.count();
    const finalNotifsCount = await prisma.notification.count();
    
    console.log('\n📊 Résumé :');
    console.log(`   Infos: ${finalInfosCount}`);
    console.log(`   Notifications: ${finalNotifsCount}`);
    console.log('\n🎉 Les tables infos et notifications sont opérationnelles !\n');

  } catch (error) {
    console.error('\n❌ ERREUR GLOBALE:', error.message);
    console.error('\n💡 Solutions:');
    console.error('   1. Vérifiez que Supabase est accessible');
    console.error('   2. Exécutez MIGRATION_INFOS_NOTIFICATIONS.sql sur Supabase');
    console.error('   3. Exécutez: npm run prisma:generate');
    console.error('   4. Relancez ce test\n');
  } finally {
    await prisma.$disconnect();
  }
}

// Exécuter les tests
testTables();
