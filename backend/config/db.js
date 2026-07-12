const admin = require('firebase-admin');
const path = require('path');

const connectDB = async () => {
  try {
    const apps = admin.apps || [];
    if (!apps.length) {
      const serviceAccountPath = process.env.FIREBASE_SERVICE_ACCOUNT;
      const projectId = process.env.FIREBASE_PROJECT_ID || 'ticketing-system-541fe';

      if (serviceAccountPath) {
        const resolvedPath = path.isAbsolute(serviceAccountPath)
          ? serviceAccountPath
          : path.resolve(process.cwd(), serviceAccountPath);

        console.log(`Connecting to Firebase using service account key at: ${resolvedPath}...`);
        const serviceAccount = require(resolvedPath);
        admin.initializeApp({
          credential: admin.credential.cert(serviceAccount)
        });
      } else {
        console.log(`No FIREBASE_SERVICE_ACCOUNT path found in env. Initializing with Project ID fallback: ${projectId}...`);
        admin.initializeApp({
          projectId: projectId
        });
      }
    }
    
    console.log('Firebase Firestore Connected successfully.');
  } catch (error) {
    console.error(`Firebase connection error: ${error.message}`);
    process.exit(1);
  }
};

const disconnectDB = async () => {
  try {
    const apps = admin.apps || [];
    if (apps.length) {
      await admin.app().delete();
      console.log('Firebase disconnected successfully.');
    }
  } catch (error) {
    console.error('Error disconnecting Firebase:', error);
  }
};

module.exports = { admin, connectDB, disconnectDB };
