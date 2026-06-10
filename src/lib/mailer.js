// src/lib/mailer.js
const nodemailer = require('nodemailer');

// Créer un transporter singleton avec Gmail SMTP
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.MAIL_USER,
    pass: process.env.MAIL_APP_PASSWORD,
  },
  // Options anti-spam
  pool: true,
  maxConnections: 1,
  maxMessages: 100,
});

// Vérifier la connexion au démarrage (optionnel)
transporter.verify(function (error, success) {
  if (error) {
    console.error('❌ Erreur de connexion Gmail SMTP:', error.message);
  } else {
    console.log('✅ Serveur mail prêt à envoyer des emails');
  }
});

module.exports = transporter;
