// Script de test pour ImageKit
require('dotenv').config();
const { uploadImage, deleteImage } = require('./src/utils/imageUpload');

async function testImageKit() {
  console.log('\n🖼️  Test de connexion ImageKit...\n');

  // Vérifier les variables d'environnement
  if (!process.env.IMAGEKIT_PUBLIC_KEY || !process.env.IMAGEKIT_PRIVATE_KEY || !process.env.IMAGEKIT_URL_ENDPOINT) {
    console.error('❌ Erreur : Variables ImageKit manquantes dans .env');
    console.log('\nVérifiez que vous avez :');
    console.log('IMAGEKIT_PUBLIC_KEY="..."');
    console.log('IMAGEKIT_PRIVATE_KEY="..."');
    console.log('IMAGEKIT_URL_ENDPOINT="..."');
    return;
  }

  console.log('✅ Variables d\'environnement ImageKit trouvées');
  console.log('   Public Key:', process.env.IMAGEKIT_PUBLIC_KEY.substring(0, 20) + '...');
  console.log('   URL Endpoint:', process.env.IMAGEKIT_URL_ENDPOINT);
  console.log('');

  // Image de test en base64 (petit carré rouge 10x10px)
  const testImageBase64 = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAoAAAAKCAYAAACNMs+9AAAAFUlEQVR42mP8z8BQz0AEYBxVSF+FABJADveWkH6oAAAAAElFTkSuQmCC';

  try {
    console.log('⏳ Upload d\'une image de test...');
    
    const result = await uploadImage(
      testImageBase64,
      `test-${Date.now()}.png`,
      'test'
    );

    console.log('\n✅ Upload réussi !');
    console.log('   File ID:', result.fileId);
    console.log('   URL:', result.url);
    console.log('   File Path:', result.filePath);
    console.log('');

    // Suppression de l'image de test
    console.log('⏳ Suppression de l\'image de test...');
    await deleteImage(result.fileId);
    console.log('✅ Image supprimée avec succès !');
    console.log('');
    console.log('🎉 ImageKit fonctionne parfaitement !');
    
  } catch (error) {
    console.error('\n❌ Erreur lors du test ImageKit:');
    console.error('   Message:', error.message);
    console.error('');
    console.log('💡 Vérifiez :');
    console.log('1. Que vos clés ImageKit sont correctes');
    console.log('2. Que votre compte ImageKit est actif');
    console.log('3. Que vous avez accès à l\'API ImageKit');
  }

  console.log('');
}

testImageKit().catch(console.error);
