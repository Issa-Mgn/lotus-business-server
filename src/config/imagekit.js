const ImageKit = require('imagekit');

// Vérifier que les variables d'environnement sont chargées
console.log('🔧 ImageKit Configuration:', {
  hasPublicKey: !!process.env.IMAGEKIT_PUBLIC_KEY,
  hasPrivateKey: !!process.env.IMAGEKIT_PRIVATE_KEY,
  hasUrlEndpoint: !!process.env.IMAGEKIT_URL_ENDPOINT,
  urlEndpoint: process.env.IMAGEKIT_URL_ENDPOINT,
});

if (!process.env.IMAGEKIT_PUBLIC_KEY || !process.env.IMAGEKIT_PRIVATE_KEY || !process.env.IMAGEKIT_URL_ENDPOINT) {
  console.error('❌ ImageKit credentials missing in environment variables!');
}

const imagekit = new ImageKit({
  publicKey: process.env.IMAGEKIT_PUBLIC_KEY,
  privateKey: process.env.IMAGEKIT_PRIVATE_KEY,
  urlEndpoint: process.env.IMAGEKIT_URL_ENDPOINT,
});

console.log('✅ ImageKit client initialized');

module.exports = imagekit;
