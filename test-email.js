// Script de test d'envoi d'email
require('dotenv').config();
const { welcomeTemplate, welcomeTemplateText } = require('./src/templates/welcome');

async function testEmail() {
  console.log('\n📧 Test d\'envoi d\'email...\n');

  // Vérifier les variables d'environnement pour Brevo
  if (!process.env.BREVO_API_KEY || !process.env.BREVO_SENDER_EMAIL) {
    console.error('❌ Erreur : BREVO_API_KEY ou BREVO_SENDER_EMAIL manquant dans .env');
    console.log('\nConfigurer votre .env avec :');
    console.log('BREVO_API_KEY="xkeysib-..."');
    console.log('BREVO_SENDER_EMAIL="noreply@votredomaine.com"');
    console.log('BREVO_SENDER_NAME="Lotus Business"');
    return;
  }

  // Email de test (envoi au sender défini)
  const testEmail = process.env.BREVO_SENDER_EMAIL;
  const testFirstName = 'Test';
  const testLicenseKey = 'LOT-1234-test-5678';
  const testEndDate = new Date();
  testEndDate.setMonth(testEndDate.getMonth() + 1);

  console.log('Destinataire :', testEmail);
  console.log('Clé de test :', testLicenseKey);
  console.log('\n⏳ Envoi en cours...\n');

  // Utiliser le service Brevo
  try {
    const { sendLicenseConfirmation } = require('./src/services/mailService');
    const result = await sendLicenseConfirmation(
      testEmail,
      testFirstName,
      testLicenseKey,
      welcomeTemplate(testFirstName, testLicenseKey, testEndDate),
      welcomeTemplateText(testFirstName, testLicenseKey, testEndDate)
    );

    if (result.success) {
      console.log('✅ Email envoyé avec succès !');
      console.log('Message ID :', result.messageId);
      console.log('\n📬 Vérifiez votre boîte email :', testEmail);
    } else {
      console.error('❌ Échec de l\'envoi');
      console.error('Erreur :', result.error);
    }
  } catch (err) {
    console.error('❌ Erreur:', err.message);
  }

  console.log('\n');
}

testEmail().catch(console.error);
