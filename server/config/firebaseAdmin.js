import admin from 'firebase-admin';

let firebaseAdminApp = null;

export const initFirebaseAdmin = () => {
  const apps = admin?.apps || admin?.default?.apps;
  if (apps && apps.length > 0) {
    return (admin.app ? admin.app() : admin.default.app());
  }

  const credString = process.env.FIREBASE_CREDENTIAL;
  if (!credString) {
    console.warn('⚠️ FIREBASE_CREDENTIAL not provided in .env');
    return null;
  }

  try {
    const serviceAccount = JSON.parse(credString);
    firebaseAdminApp = admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
      projectId: process.env.FIREBASE_PROJECT_ID || serviceAccount.project_id,
      storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
    });
    console.log(`✓ Firebase Admin initialized for project: ${serviceAccount.project_id}`);
    return firebaseAdminApp;
  } catch (error) {
    console.error(`✗ Error initializing Firebase Admin: ${error.message}`);
    return null;
  }
};

export const getFirebaseAdmin = () => admin;
