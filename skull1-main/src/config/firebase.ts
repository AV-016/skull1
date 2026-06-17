import { initializeApp, cert, getApps, App } from 'firebase-admin/app';
import { env } from './env';

let firebaseAdminApp: App | null = null;

export function getFirebaseAdmin(): App {
  if (!firebaseAdminApp) {
    const apps = getApps();
    if (apps.length > 0) {
      firebaseAdminApp = apps[0];
    } else {
      if (env.FIREBASE_PROJECT_ID && env.FIREBASE_CLIENT_EMAIL && env.FIREBASE_PRIVATE_KEY) {
        firebaseAdminApp = initializeApp({
          credential: cert({
            projectId: env.FIREBASE_PROJECT_ID,
            clientEmail: env.FIREBASE_CLIENT_EMAIL,
            privateKey: env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
          }),
        });
      } else if (env.FIREBASE_PROJECT_ID) {
        firebaseAdminApp = initializeApp({
          projectId: env.FIREBASE_PROJECT_ID,
        });
      } else {
        try {
          firebaseAdminApp = initializeApp();
        } catch (e) {
          throw new Error('Firebase configuration (FIREBASE_PROJECT_ID) is missing on the server.');
        }
      }
    }
  }
  return firebaseAdminApp;
}
