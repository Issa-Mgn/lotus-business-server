// c:\Mes Travaux\Lotus Business\server\src\lib\prisma.js

const { PrismaClient } = require('@prisma/client');

// Instance unique de Prisma Client
const prisma = new PrismaClient({
  log: ['query', 'error', 'warn'],
});

// Gestion de la déconnexion propre
process.on('beforeExit', async () => {
  await prisma.$disconnect();
});

module.exports = prisma;
