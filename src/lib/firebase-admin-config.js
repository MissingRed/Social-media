import { initializeApp, getApps, cert } from "firebase-admin/app";

const { privateKey } = JSON.parse(
  process.env.NEXT_PUBLIC_FIREBASE_ADMIN_PRIVATE_KEY
);

const firebaseAdminConfig = {
  credential: cert({
    projectId: process.env.NEXT_PUBLIC_FIREBASE_ADMIN_PROJECT_ID,
    clientEmail: process.env.NEXT_PUBLIC_FIREBASE_ADMIN_CLIENT_EMAIL,
    privateKey: privateKey,
  }),
};

export function customInitApp() {
  if (getApps().length <= 0) {
    initializeApp(firebaseAdminConfig);
  }
}
