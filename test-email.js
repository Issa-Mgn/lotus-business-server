// Script de test d'envoi d'email
require('dotenv').config();
const { sendMail } = require('./src/lib/sendMail');
const { welcomeTemplate, welcomeTemplateText } = require('./src/templates/welcome');

async function testEmail() {
  console.log('\n📧 Test d\'envoi d\'email...\n');

  // Vérifier les variables d'environnement
  if (!process.env.MAIL_USER || !process.env.MAIL_APP_PASSWORD) {
    console.error('❌ Erreur : MAIL_USER ou MAIL_APP_PASSWORD manquant dans .env');
    console.log('\nConfigurer votre .env avec :');
    console.log('MAIL_USER="votre_email@gmail.com"');
    console.log('MAIL_APP_PASSWORD="xxxx xxxx xxxx xxxx"');
    console.log('\nVoir GMAIL_SETUP.md pour les instructions.');
    return;
  }

  // Email de test
  const testEmail = process.env.MAIL_USER; // Envoie à soi-même
  const testFirstName = 'Test';
  const testLicenseKey = 'LOT-1234-test-5678';
  const testEndDate = new Date();
  testEndDate.setMonth(testEndDate.getMonth() + 1);

  console.log('Destinataire :', testEmail);
  console.log('Clé de test :', testLicenseKey);
  console.log('\n⏳ Envoi en cours...\n');

  const result = await sendMail(
    testEmail,
    'Test - Bienvenue sur Lotus Business 🎉',
    welcomeTemplate(testFirstName, testLicenseKey, testEndDate),
    welcomeTemplateText(testFirstName, testLicenseKey, testEndDate)
  );

  if (result.success) {
    console.log('✅ Email envoyé avec succès !');
    console.log('Message ID :', result.messageId);
    console.log('\n📬 Vérifiez votre boîte email :', testEmail);
    console.log('\n💡 Si l\'email n\'arrive pas :');
    console.log('   1. Vérifiez le dossier spam');
    console.log('   2. Attendez quelques minutes');
    console.log('   3. Vérifiez que MAIL_APP_PASSWORD est correct');
  } else {
    console.error('❌ Échec de l\'envoi');
    console.error('Erreur :', result.error);
    console.log('\n💡 Vérifiez :');
    console.log('   1. Que la 2FA est activée sur Gmail');
    console.log('   2. Que MAIL_APP_PASSWORD est un mot de passe d\'application');
    console.log('   3. Voir GMAIL_SETUP.md pour les instructions');
  }

  console.log('\n');
}

testEmail().catch(console.error);
