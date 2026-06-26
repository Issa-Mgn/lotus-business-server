const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Début du seeding...');

  // Seed Admin
  const admin = await prisma.admin.upsert({
    where: { email: 'litxx.org@gmail.com' },
    update: {},
    create: {
      email: 'litxx.org@gmail.com',
      phone: '+22900000000',
      password: '$2b$10$QnwxDej2lhUQwSCfOdIpZOCZZdMmGaubLxqSMTdptV58vK5PYzThK', // admin123
    },
  });

  console.log('✅ Admin créé :', admin.email);

  // Seed User test
  const user1 = await prisma.user.upsert({
    where: { email: 'user1@test.com' },
    update: {},
    create: {
      email: 'user1@test.com',
      phone: '+22900000001',
      firstName: 'Jean',
      lastName: 'Dupont',
      licenseKey: 'LOT-TEST-user-0001',
      licenseType: 'FREE',
      licenseStatus: 'ACTIVE',
    },
  });

  console.log('✅ User test créé :', user1.email);

  // Seed License correspondante
  await prisma.license.upsert({
    where: { key: 'LOT-TEST-user-0001' },
    update: {},
    create: {
      email: 'user1@test.com',
      key: 'LOT-TEST-user-0001',
    },
  });

  console.log('\n🎉 Seeding terminé !');
}

main()
  .catch((e) => {
    console.error('❌ Erreur:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });