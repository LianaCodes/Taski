const admin = require('firebase-admin');
const serviceAccount = require('./serviceAccountKey.json'); // This links the file you just downloaded

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
}

module.exports = admin;