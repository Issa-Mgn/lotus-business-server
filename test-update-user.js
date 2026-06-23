require('dotenv').config();
const axios = require('axios');

const API_URL = 'http://localhost:5000/api';

async function testUpdateUser() {
  console.log('\n🧪 TEST: Mise à jour utilisateur\n');
  console.log('='.repeat(60));

  // Étape 1: Login admin
  console.log('\n1️⃣  Connexion admin...');
  let adminToken;
  try {
    const loginResponse = await axios.post(`${API_URL}/admin/login`, {
      email: 'admin@lotus.com',
      password: 'admin123',
    });
    adminToken = loginResponse.data.token;
    console.log('  ✅ Connexion réussie');
  } catch (error) {
    console.error('  ❌ Erreur:', error.response?.data || error.message);
    return;
  }

  // Étape 2: Récupérer les users
  console.log('\n2️⃣  Récupération des utilisateurs...');
  let users = [];
  try {
    const usersResponse = await axios.get(`${API_URL}/admin/users`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    users = usersResponse.data.users || [];
    console.log(`  ✅ ${users.length} utilisateurs récupérés`);
  } catch (error) {
    console.error('  ❌ Erreur:', error.response?.data || error.message);
    return;
  }

  if (users.length === 0) {
    console.log('\n  ⚠️  Aucun utilisateur disponible pour le test');
    return;
  }

  const testUser = users[0];
  console.log(`\n  📝 Utilisateur de test: ${testUser.firstName} ${testUser.lastName} (${testUser.email})`);

  // Étape 3: Tester la route PATCH /admin/users/:userId
  console.log('\n3️⃣  Test modification utilisateur...');
  try {
    const updateResponse = await axios.patch(
      `${API_URL}/admin/users/${testUser.id}`,
      {
        firstName: testUser.firstName + ' (Modifié)',
        licenseType: testUser.licenseType,
        maxSimultaneousLogins: testUser.maxSimultaneousLogins,
      },
      {
        headers: { Authorization: `Bearer ${adminToken}` },
      }
    );
    
    console.log('  ✅ Modification réussie:');
    console.log('     Nouveau prénom:', updateResponse.data.user.firstName);
  } catch (error) {
    console.error('  ❌ Erreur:', error.response?.data || error.message);
    if (error.response) {
      console.error('  Status:', error.response.status);
      console.error('  URL:', error.config.url);
    }
    return;
  }

  // Étape 4: Restaurer le prénom original
  console.log('\n4️⃣  Restauration du prénom original...');
  try {
    await axios.patch(
      `${API_URL}/admin/users/${testUser.id}`,
      {
        firstName: testUser.firstName,
      },
      {
        headers: { Authorization: `Bearer ${adminToken}` },
      }
    );
    console.log('  ✅ Prénom restauré');
  } catch (error) {
    console.error('  ❌ Erreur restauration:', error.response?.data || error.message);
  }

  console.log('\n' + '='.repeat(60));
  console.log('✅ Test terminé!\n');
}

// Exécuter le test
testUpdateUser().catch((error) => {
  console.error('\n❌ Erreur fatale:', error);
  process.exit(1);
});
