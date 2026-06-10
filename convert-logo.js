// Script pour convertir le logo en base64
const fs = require('fs');
const path = require('path');

const logoPath = path.join(__dirname, 'src', 'img', 'logo.jpeg');

try {
  const logoBuffer = fs.readFileSync(logoPath);
  const logoBase64 = logoBuffer.toString('base64');
  
  console.log('\n✅ Logo converti en base64 !\n');
  console.log('Copie cette ligne dans ton template welcome.js :\n');
  console.log(`const LOGO_BASE64 = "data:image/jpeg;base64,${logoBase64}";\n`);
  console.log('Puis remplace la ligne de l\'image par :');
  console.log('<img src="${LOGO_BASE64}" alt="Lotus Business" style="..." />\n');
  
} catch (error) {
  console.error('❌ Erreur :', error.message);
  console.log('\nVérifie que le fichier existe : src/img/logo.jpeg');
}
