// src/lib/mailer.js
const nodemailer = require('nodemailer');

/**
 * Transporter Nodemailer avec Gmail SMTP
 * Instance singleton réutilisable
 */
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.MAIL_USER,
    pass: process.env.MAIL_APP_PASSWORD,
  },
});

module.exports = transporter;
