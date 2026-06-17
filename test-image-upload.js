require('dotenv').config();
const axios = require('axios');
const fs = require('fs');
const path = require('path');

const API_URL = 'http://localhost:5000/api';

// Créer une petite image de test en base64 (1x1 pixel transparent PNG)
const SMALL_TEST_IMAGE = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';

// Image de test plus réaliste (logo Lotus Business - une image simple)
const TEST_IMAGE_BASE64 = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAGQAAABkCAYAAABw4pVUAAAACXBIWXMAAAsTAAALEwEAmpwYAAAAAXNSR0IArs4c6QAAAARnQU1BAACxjwv8YQUAAAJCSURBVHgB7Z0xTsMwFIbfS8cOXIA7cAOOwAk4ATfgBt2YOrUDGxWCA3ACbsANmMCJSFGVQlQpjuPE9v+kTlVb5eXL89+XxMYAAAAAAAAAAAAAAAAAAAAAgP+KNQyeZ/Y4t8dlnM75nPM5X3M+53yOXcf5nPM553PO55zPOZ9zPud8zvmc8znncz7nfM75nPM553PO55zPOZ9zPud8zvmc8znncz7nfM75nPM553PO55zPOZ9zPud8zvmc8znncz7nfM75nPM553PO55zPOZ9zPud8zvmc8znncz7nfM75nPM553PO55zPOZ9zPud8zvmc8znncz7nfM75nPM553PO55zPOZ9zPud8zvmc8znncz7nfM75nPM553PO55zPOZ9zPud8zvmc8znncz7nfM75nPM553PO55zPOZ9zPud8zvmc8znncz7nfM75nPM553PO55zPOZ9zPud8zvmc8znncz7nfM75nPM553PO55zPOZ9zPud8zvmc8znncz7nfM75nPM553PO55zPOZ9zPud8zvmc8znncz7nfM75nPM553PO55zPOZ9zPud8zvmc8znncz7nfM75nPM553PO55zPOZ9zPud8zvmc8znncz7nfM75nPM553PO55zPOZ9zPud8zvmc8znncz7nfM75nPM553PO55zPOZ9zPud8zvmc8znncz7nfM75nPM553PO55zPOZ9zPud8zvmc8znncz7nfM75nPM553PO55zPOZ9zPud8zvmc8znncz7nfM75nPM553PO55zPOZ9zPud8zvmc8znncz7nfM75nPM553PO55zPAQAAAAAAAAAAAAAAAAAAAP5HfgBrtlXU6JiHNAAAAABJRU5ErkJggg==';

async function testImageUpload() {
  console.log('\n🧪 TEST: Upload d\'image via API\n');
  console.log('=' .repeat(60));

  // Étape 1: Vérifier les variables d'environnement
  console.log('\n1️⃣  Vérification des credentials ImageKit...');
  console.log('  IMAGEKIT_PUBLIC_KEY:', process.env.IMAGEKIT_PUBLIC_KEY ? '✅ Défini' : '❌ Manquant');
  console.log('  IMAGEKIT_PRIVATE_KEY:', process.env.IMAGEKIT_PRIVATE_KEY ? '✅ Défini' : '❌ Manquant');
  console.log('  IMAGEKIT_URL_ENDPOINT:', process.env.IMAGEKIT_URL_ENDPOINT || '❌ Manquant');

  // Étape 2: Se connecter en tant qu'admin
  console.log('\n2️⃣  Connexion admin...');
  let adminToken;
  try {
    const loginResponse = await axios.post(`${API_URL}/admin/login`, {
      email: 'admin@lotus.com',
      password: 'admin123',
    });
    adminToken = loginResponse.data.token;
    console.log('  ✅ Connexion réussie');
  } catch (error) {
    console.error('  ❌ Erreur de connexion:', error.response?.data || error.message);
    return;
  }

  // Étape 3: Tester upload SANS image
  console.log('\n3️⃣  Test: Créer info SANS image...');
  try {
    const responseWithoutImage = await axios.post(
      `${API_URL}/admin/infos`,
      {
        title: 'Test sans image',
        content: 'Ceci est un test sans image',
        published: true,
      },
      {
        headers: { Authorization: `Bearer ${adminToken}` },
      }
    );
    console.log('  ✅ Info créée sans image:', responseWithoutImage.data.info.id);
  } catch (error) {
    console.error('  ❌ Erreur:', error.response?.data || error.message);
  }

  // Étape 4: Tester upload AVEC petite image
  console.log('\n4️⃣  Test: Créer info AVEC petite image (1x1 pixel)...');
  try {
    const responseSmallImage = await axios.post(
      `${API_URL}/admin/infos`,
      {
        title: 'Test avec petite image',
        content: 'Ceci est un test avec une petite image',
        imageBase64: SMALL_TEST_IMAGE,
        published: true,
      },
      {
        headers: { Authorization: `Bearer ${adminToken}` },
      }
    );
    console.log('  ✅ Info créée avec petite image:');
    console.log('     ID:', responseSmallImage.data.info.id);
    console.log('     Image URL:', responseSmallImage.data.info.imageUrl);
  } catch (error) {
    console.error('  ❌ Erreur:', error.response?.data || error.message);
    if (error.response) {
      console.error('  Status:', error.response.status);
      console.error('  Data:', JSON.stringify(error.response.data, null, 2));
    }
  }

  // Étape 5: Tester upload AVEC image réaliste
  console.log('\n5️⃣  Test: Créer info AVEC image réaliste...');
  try {
    const responseRealImage = await axios.post(
      `${API_URL}/admin/infos`,
      {
        title: 'Test avec image réaliste',
        content: 'Ceci est un test avec une image plus réaliste',
        imageBase64: TEST_IMAGE_BASE64,
        published: true,
      },
      {
        headers: { Authorization: `Bearer ${adminToken}` },
      }
    );
    console.log('  ✅ Info créée avec image réaliste:');
    console.log('     ID:', responseRealImage.data.info.id);
    console.log('     Image URL:', responseRealImage.data.info.imageUrl);
    console.log('     File ID:', responseRealImage.data.info.imageFileId);
  } catch (error) {
    console.error('  ❌ Erreur:', error.response?.data || error.message);
    if (error.response) {
      console.error('  Status:', error.response.status);
      console.error('  Data:', JSON.stringify(error.response.data, null, 2));
    }
  }

  console.log('\n' + '='.repeat(60));
  console.log('✅ Tests terminés!\n');
}

// Exécuter les tests
testImageUpload().catch((error) => {
  console.error('\n❌ Erreur fatale:', error);
  process.exit(1);
});
