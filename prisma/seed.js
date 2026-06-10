// c:\Mes Travaux\Lotus Business\server\prisma\seed.js

const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');
const generateLicenseKey = require('../src/lib/generateLicenseKey');

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Début du seeding...');

  // Hashage du mot de passe admin
  const hashedPassword = await bcrypt.hash('admin123', 10);

  // Calcul de la date de fin pour la licence ANNUAL (1 an)
  const startDate = new Date();
  const endDate = new Date();
  endDate.setFullYear(endDate.getFullYear() + 1);

  // Création de l'utilisateur admin avec licence ANNUAL
  const admin = await prisma.user.upsert({
    where: { email: 'admin@lotusbusiness.com' },
    update: {},
    create: {
      email: 'admin@lotusbusiness.com',
      firstName: 'Admin',
      lastName: 'Lotus',
      password: hashedPassword,
      role: 'ADMIN',
      license: {
        create: {
          key: generateLicenseKey(),
          type: 'ANNUAL',
          status: 'ACTIVE',
          startDate,
          endDate,
        },
      },
    },
    include: {
      license: true,
    },
  });

  console.log('✅ Admin créé avec succès :');
  console.log(`   Email: ${admin.email}`);
  console.log(`   Password: admin123`);
  console.log(`   Licence: ${admin.license.key}`);
  console.log(`   Type: ${admin.license.type}`);
  console.log(`   Expiration: ${admin.license.endDate.toLocaleDateString()}`);

  // Création d'utilisateurs de test
  const hashedPasswordUser = await bcrypt.hash('user123', 10);
  
  const endDateFree = new Date();
  endDateFree.setMonth(endDateFree.getMonth() + 1);

  const user1 = await prisma.user.upsert({
    where: { email: 'user1@lotusbusiness.com' },
    update: {},
    create: {
      email: 'user1@lotusbusiness.com',
      firstName: 'Jean',
      lastName: 'Dupont',
      password: hashedPasswordUser,
      role: 'USER',
      license: {
        create: {
          key: generateLicenseKey(),
          type: 'FREE',
          status: 'ACTIVE',
          startDate: new Date(),
          endDate: endDateFree,
        },
      },
    },
    include: {
      license: true,
    },
  });

  console.log('\n✅ Utilisateur test créé :');
  console.log(`   Email: ${user1.email}`);
  console.log(`   Password: user123`);
  console.log(`   Licence: ${user1.license.key}`);

  console.log('\n🎉 Seeding terminé avec succès !');
}

main()
  .catch((e) => {
    console.error('❌ Erreur lors du seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
