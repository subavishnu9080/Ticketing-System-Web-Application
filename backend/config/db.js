const admin = require('firebase-admin');
const { getFirestore } = require('firebase-admin/firestore');
const path = require('path');
const fs = require('fs');

let dbConfigured = true;
let configErrorMessage = '';

const connectDB = async () => {
  try {
    const serviceAccountPath = process.env.FIREBASE_SERVICE_ACCOUNT;
    const projectId = process.env.FIREBASE_PROJECT_ID || 'ticketing-system-541fe';
    const isEmulator = !!process.env.FIRESTORE_EMULATOR_HOST;

    if (!serviceAccountPath && !isEmulator) {
      dbConfigured = false;
      configErrorMessage = 'FIREBASE_SERVICE_ACCOUNT environment variable is empty in .env';
      console.warn('Firebase initialization warning: No credentials configured.');
      console.log('Server is running in unconfigured database mode.');
      return;
    }

    let resolvedPath = '';
    if (serviceAccountPath) {
      resolvedPath = path.isAbsolute(serviceAccountPath)
        ? serviceAccountPath
        : path.resolve(process.cwd(), serviceAccountPath);

      if (!fs.existsSync(resolvedPath)) {
        dbConfigured = false;
        configErrorMessage = `Service account JSON file not found at: ${resolvedPath}`;
        console.warn(`Firebase connection warning: Key file not found at ${resolvedPath}`);
        console.log('Server is running in unconfigured database mode.');
        return;
      }
    }

    const apps = admin.getApps();
    if (!apps.length) {
      if (resolvedPath) {
        console.log(`Connecting to Firebase using service account key at: ${resolvedPath}...`);
        const serviceAccount = require(resolvedPath);
        admin.initializeApp({
          credential: admin.cert(serviceAccount)
        });
      } else {
        console.log(`Connecting to Firebase Emulator / local fallback with Project ID: ${projectId}...`);
        admin.initializeApp({
          projectId: projectId
        });
      }
    }
    
    console.log('Firebase Firestore Connected successfully.');
  } catch (error) {
    dbConfigured = false;
    configErrorMessage = error.message;
    console.error(`Firebase connection error: ${error.message}`);
    console.log('Server is running in unconfigured database mode.');
  }
};

const disconnectDB = async () => {
  try {
    const apps = admin.getApps();
    if (apps.length) {
      await admin.app().delete();
      console.log('Firebase disconnected successfully.');
    }
  } catch (error) {
    console.error('Error disconnecting Firebase:', error);
  }
};

// Express middleware to intercept requests when database is unconfigured
const checkDbConfigured = (req, res, next) => {
  if (req.path === '/' || req.path === '/health') {
    return next(); // Allow root checks
  }
  
  if (!dbConfigured) {
    return res.status(500).json({
      message: `Firebase Firestore credentials not configured. Please download your service account key JSON from the Firebase console, place it in the backend folder, and set FIREBASE_SERVICE_ACCOUNT=./your-file-name.json in your .env file. (Reason: ${configErrorMessage})`
    });
  }
  next();
};

module.exports = { admin, connectDB, disconnectDB, checkDbConfigured, isDbConfigured: () => dbConfigured };
