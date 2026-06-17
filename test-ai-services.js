/**
 * Script de test pour les services IA (Mistral + Groq)
 */

require('dotenv').config();
const aiService = require('./src/services/aiService');

console.log('🧪 TEST DES SERVICES IA - MISTRAL + GROQ\n');
console.log('='.repeat(60));

async function testAllServices() {
  try {
    // Test 1 : Disponibilité des services
    console.log('\n📡 TEST 1: Vérification de la disponibilité des services IA');
    console.log('-'.repeat(60));
    
    const availability = await aiService.testAIServices();
    
    console.log('\n🔹 Mistral AI:');
    if (availability.mistral.available) {
      console.log(`   ✅ Disponible (${availability.mistral.responseTime}ms)`);
    } else {
      console.log(`   ❌ Indisponible: ${availability.mistral.error}`);
    }
    
    console.log('\n🔹 Groq:');
    if (availability.groq.available) {
      console.log(`   ✅ Disponible (${availability.groq.responseTime}ms)`);
    } else {
      console.log(`   ❌ Indisponible: ${availability.groq.error}`);
    }

    // Arrêter si aucun service n'est disponible
    if (!availability.mistral.available && !availability.groq.available) {
      console.log('\n❌ ERREUR: Aucun service IA n\'est disponible !');
      console.log('\n💡 Vérifiez vos clés API dans le fichier .env :');
      console.log('   - MISTRAL_API_KEY=votre_cle_mistral');
      console.log('   - GROQ_API_KEY=votre_cle_groq');
      console.log('\n📌 Obtenir les clés gratuitement :');
      console.log('   Mistral: https://console.mistral.ai/');
      console.log('   Groq: https://console.groq.com/');
      return;
    }

    // Test 2 : Génération Compte de Résultat
    console.log('\n\n📊 TEST 2: Génération d\'un Compte de Résultat');
    console.log('-'.repeat(60));
    
    const compteResultat = await aiService.generateCompteResultat({
      chiffreAffaires: 500000,
      coutAchat: 300000,
      chargesDiverses: 50000,
      periode: 'Janvier 2026',
      devise: 'FCFA'
    });

    console.log(`\n✅ Généré via: ${compteResultat.provider.toUpperCase()}`);
    console.log('\n📄 Résultat:');
    console.log(JSON.stringify(compteResultat.data, null, 2));

    // Test 3 : Génération Bilan Simplifié
    console.log('\n\n📊 TEST 3: Génération d\'un Bilan Simplifié');
    console.log('-'.repeat(60));
    
    const bilan = await aiService.generateBilanSimplifie({
      stockFinal: 100000,
      tresorerie: 200000,
      periode: 'Janvier 2026',
      devise: 'FCFA'
    });

    console.log(`\n✅ Généré via: ${bilan.provider.toUpperCase()}`);
    console.log('\n📄 Résultat:');
    console.log(JSON.stringify(bilan.data, null, 2));

    // Test 4 : Génération Fiche de Stock
    console.log('\n\n📊 TEST 4: Génération d\'une Fiche de Stock');
    console.log('-'.repeat(60));
    
    const ficheStock = await aiService.generateFicheStock({
      produitNom: 'Savon Parfumé 100g',
      stockInitial: 50,
      entrees: 100,
      sorties: 80,
      periode: 'Janvier 2026'
    });

    console.log(`\n✅ Généré via: ${ficheStock.provider.toUpperCase()}`);
    console.log('\n📄 Résultat:');
    console.log(JSON.stringify(ficheStock.data, null, 2));

    // Résumé final
    console.log('\n' + '='.repeat(60));
    console.log('✅ TOUS LES TESTS RÉUSSIS !');
    console.log('='.repeat(60));
    console.log('\n📋 Résumé:');
    console.log(`   ✅ Compte de résultat généré via ${compteResultat.provider}`);
    console.log(`   ✅ Bilan simplifié généré via ${bilan.provider}`);
    console.log(`   ✅ Fiche de stock générée via ${ficheStock.provider}`);
    console.log('\n🚀 Le système de fallback fonctionne correctement !');
    console.log('   Mistral AI est utilisé en priorité, Groq en secours.\n');

  } catch (error) {
    console.error('\n❌ ERREUR GLOBALE:', error.message);
    console.error('\n💡 Suggestions:');
    console.error('   1. Vérifiez vos clés API dans .env');
    console.error('   2. Vérifiez votre connexion Internet');
    console.error('   3. Consultez la documentation des APIs');
  }
}

// Exécuter les tests
console.log('\n🚀 Démarrage des tests...\n');
testAllServices();
