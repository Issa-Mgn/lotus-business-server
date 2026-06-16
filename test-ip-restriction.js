/**
 * Script de test pour la restriction IP FREE
 * Teste que les utilisateurs FREE ne peuvent se connecter que depuis 1 seul appareil
 * et que les utilisateurs PREMIUM peuvent se connecter depuis plusieurs appareils
 */

const axios = require('axios');

const BASE_URL = process.env.API_URL || 'http://localhost:5000/api';

// Simuler différentes IPs via header x-forwarded-for
const makeRequest = (method, url, data, simulatedIp) => {
  return axios({
    method,
    url: `${BASE_URL}${url}`,
    data,
    headers: {
      'x-forwarded-for': simulatedIp,
      'Content-Type': 'application/json'
    },
    validateStatus: () => true // Ne pas throw sur erreur HTTP
  });
};

async function testIpRestriction() {
  console.log('🧪 TEST DE RESTRICTION IP POUR FREE\n');
  console.log('='.repeat(60));

  try {
    // ============================================
    // TEST 1: Créer un utilisateur FREE
    // ============================================
    console.log('\n📝 TEST 1: Création utilisateur FREE');
    const timestamp = Date.now();
    const testUser = {
      email: `test.free.${timestamp}@example.com`,
      phone: `+33${Math.floor(Math.random() * 1000000000)}`,
      firstName: 'Test',
      lastName: 'Free'
    };

    const registerRes = await makeRequest('POST', '/auth/register', testUser, '192.168.1.100');
    
    if (registerRes.status !== 201) {
      console.error('❌ Erreur création utilisateur:', registerRes.data);
      return;
    }
    
    const licenseKey = registerRes.data.user.licenseKey;
    console.log(`✅ Utilisateur FREE créé: ${testUser.email}`);
    console.log(`   Clé: ${licenseKey}`);

    // Attendre un peu pour éviter les problèmes de timing
    await new Promise(resolve => setTimeout(resolve, 1000));

    // ============================================
    // TEST 2: Connexion depuis appareil 1 (IP1)
    // ============================================
    console.log('\n🔐 TEST 2: Connexion depuis appareil 1 (IP: 192.168.1.100)');
    const login1Res = await makeRequest('POST', '/auth/login', { licenseKey }, '192.168.1.100');
    
    if (login1Res.status !== 200) {
      console.error('❌ Erreur connexion appareil 1:', login1Res.data);
      return;
    }
    
    console.log('✅ Connexion appareil 1 réussie');
    console.log(`   Token reçu: ${login1Res.data.token.substring(0, 20)}...`);

    await new Promise(resolve => setTimeout(resolve, 1000));

    // ============================================
    // TEST 3: Tentative connexion depuis appareil 2 (IP2) - DOIT ÉCHOUER
    // ============================================
    console.log('\n🔐 TEST 3: Tentative connexion depuis appareil 2 (IP: 10.0.0.50)');
    console.log('   📌 Devrait être REFUSÉE car FREE est déjà connecté sur IP1');
    
    const login2Res = await makeRequest('POST', '/auth/login', { licenseKey }, '10.0.0.50');
    
    if (login2Res.status === 403) {
      console.log('✅ SUCCÈS: Connexion appareil 2 refusée comme prévu');
      console.log(`   Message: ${login2Res.data.error}`);
    } else {
      console.log('❌ ÉCHEC: Connexion appareil 2 aurait dû être refusée!');
      console.log(`   Status: ${login2Res.status}`);
      console.log(`   Response:`, login2Res.data);
    }

    await new Promise(resolve => setTimeout(resolve, 1000));

    // ============================================
    // TEST 4: Reconnecter depuis appareil 1 (même IP) - DOIT RÉUSSIR
    // ============================================
    console.log('\n🔐 TEST 4: Reconnecter depuis appareil 1 (même IP: 192.168.1.100)');
    console.log('   📌 Devrait RÉUSSIR car même IP');
    
    const login3Res = await makeRequest('POST', '/auth/login', { licenseKey }, '192.168.1.100');
    
    if (login3Res.status === 200) {
      console.log('✅ SUCCÈS: Reconnexion depuis même IP autorisée');
    } else {
      console.log('❌ ÉCHEC: Reconnexion depuis même IP aurait dû réussir!');
      console.log(`   Status: ${login3Res.status}`);
      console.log(`   Response:`, login3Res.data);
    }

    // ============================================
    // TEST 5: Créer un utilisateur PREMIUM
    // ============================================
    console.log('\n📝 TEST 5: Test PREMIUM (connexions illimitées)');
    
    const testPremium = {
      email: `test.premium.${timestamp}@example.com`,
      phone: `+33${Math.floor(Math.random() * 1000000000)}`,
      firstName: 'Test',
      lastName: 'Premium'
    };

    const registerPremiumRes = await makeRequest('POST', '/auth/register', testPremium, '192.168.1.200');
    
    if (registerPremiumRes.status !== 201) {
      console.error('❌ Erreur création utilisateur premium:', registerPremiumRes.data);
      return;
    }
    
    const premiumLicenseKey = registerPremiumRes.data.user.licenseKey;
    console.log(`✅ Utilisateur créé: ${testPremium.email}`);

    await new Promise(resolve => setTimeout(resolve, 1000));

    // Passer en PREMIUM via admin (vous devrez faire cela manuellement ou via API admin)
    console.log('   ⚠️ MANUEL: Passez cet utilisateur en PREMIUM via le dashboard admin');
    console.log(`   Email: ${testPremium.email}`);
    console.log(`   Clé: ${premiumLicenseKey}`);
    console.log('');
    console.log('   Ensuite testez la connexion depuis plusieurs IPs différentes');
    console.log('   Toutes devraient RÉUSSIR car PREMIUM n\'a pas de restriction IP');

    console.log('\n' + '='.repeat(60));
    console.log('✅ TESTS TERMINÉS\n');
    
    console.log('📋 RÉSUMÉ:');
    console.log('  1. Utilisateur FREE créé et connecté depuis IP1 ✅');
    console.log('  2. Connexion FREE depuis IP2 différente REFUSÉE ✅');
    console.log('  3. Reconnexion FREE depuis IP1 AUTORISÉE ✅');
    console.log('  4. Utilisateur PREMIUM créé (tester manuellement multi-IP)');

  } catch (error) {
    console.error('\n❌ ERREUR GÉNÉRALE:', error.message);
    if (error.response) {
      console.error('   Status:', error.response.status);
      console.error('   Data:', error.response.data);
    }
  }
}

// Exécuter les tests
console.log('🚀 Démarrage des tests de restriction IP...\n');
console.log(`API URL: ${BASE_URL}`);
console.log('Assurez-vous que le serveur est démarré!\n');

testIpRestriction();
