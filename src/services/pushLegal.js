const { Expo } = require('expo-server-sdk');
const expo = new Expo();

/**
 * Envoie des notifications push aux utilisateurs lors d'une mise à jour légale
 * @param {Array} users - tableau d'utilisateurs { id, expoPushToken }
 * @param {Object} doc - document créé { id, type, version }
 */
async function sendPushNotifications(users, doc) {
  try {
    const messages = [];

    for (const u of users) {
      if (!u.expoPushToken) continue;
      if (!Expo.isExpoPushToken(u.expoPushToken)) continue;

      messages.push({
        to: u.expoPushToken,
        sound: 'default',
        title: doc.type === 'CGU' ? 'Mise à jour des CGU' : 'Mise à jour de la Politique de confidentialité',
        body: `Nouvelle version disponible (v${doc.version}).`,
        data: { type: 'LEGAL_UPDATE', documentId: doc.id, docType: doc.type }
      });
    }

    const chunks = expo.chunkPushNotifications(messages);

    for (const chunk of chunks) {
      try {
        const receipts = await expo.sendPushNotificationsAsync(chunk);
        // On peut logger les receipts pour suivi
        console.log('Push receipts chunk:', receipts);
      } catch (err) {
        console.error('Erreur en envoyant un chunk de push:', err);
      }
    }

    return { success: true };
  } catch (error) {
    console.error('sendPushNotifications error:', error);
    return { success: false, error: error.message };
  }
}

module.exports = { sendPushNotifications };
