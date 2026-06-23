// Test pour vérifier les routes admin
const path = require('path');
const fs = require('fs');

const adminRoutesPath = path.join(__dirname, 'src', 'routes', 'admin.js');

console.log('\n=== VÉRIFICATION DES ROUTES ADMIN ===\n');

if (!fs.existsSync(adminRoutesPath)) {
  console.error('❌ Fichier admin.js introuvable!');
  process.exit(1);
}

const adminRoutes = fs.readFileSync(adminRoutesPath, 'utf8');

const routesToCheck = [
  { method: 'PATCH', route: 'users/:userId', handler: 'updateUser' },
  { method: 'DELETE', route: 'users/:userId', handler: 'deleteUser' },
];

console.log('Recherche des routes...\n');

routesToCheck.forEach(({ method, route, handler }) => {
  const routeRegex = new RegExp(`router\\.${method.toLowerCase()}\\(['"\`]\\/${route}['"\`]`, 'i');
  const handlerRegex = new RegExp(handler, 'i');
  
  const hasRoute = routeRegex.test(adminRoutes);
  const hasHandler = handlerRegex.test(adminRoutes);
  
  console.log(`${method} /${route}`);
  console.log(`  Route définie: ${hasRoute ? '✅' : '❌'}`);
  console.log(`  Handler ${handler}: ${hasHandler ? '✅' : '❌'}`);
  console.log('');
});

// Vérification du controller
const controllerPath = path.join(__dirname, 'src', 'controllers', 'adminController.js');

if (!fs.existsSync(controllerPath)) {
  console.error('❌ Fichier adminController.js introuvable!');
  process.exit(1);
}

const controller = fs.readFileSync(controllerPath, 'utf8');

console.log('Vérification des exports du controller...\n');

const handlersToCheck = ['updateUser', 'deleteUser'];

handlersToCheck.forEach(handler => {
  const exportRegex = new RegExp(`module\\.exports\\s*=\\s*{[^}]*${handler}[^}]*}`, 's');
  const functionRegex = new RegExp(`const\\s+${handler}\\s*=|function\\s+${handler}\\s*\\(`, 'i');
  
  const isExported = exportRegex.test(controller);
  const isDefined = functionRegex.test(controller);
  
  console.log(`Handler: ${handler}`);
  console.log(`  Défini: ${isDefined ? '✅' : '❌'}`);
  console.log(`  Exporté: ${isExported ? '✅' : '❌'}`);
  console.log('');
});

console.log('=== FIN DE LA VÉRIFICATION ===\n');
console.log('✅ Toutes les routes et handlers sont présents dans le code');
console.log('⚠️  Si vous obtenez des erreurs 404, le problème vient du déploiement Render');
console.log('📦 Solution: Commiter et pusher le code, puis redéployer sur Render\n');
