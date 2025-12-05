import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

const firebaseConfig = {
  apiKey: "AIzaSyADEXrDW69F3NcE0UsjZovmzup000hRAGI",
  authDomain: "aiapp-a1d08.firebaseapp.com",
  projectId: "aiapp-a1d08",
  storageBucket: "aiapp-a1d08.firebasestorage.app",
  messagingSenderId: "204397861944",
  appId: "1:204397861944:web:8d1025b29e78e24e181acd"
};

// Initialiser Firebase
const app = initializeApp(firebaseConfig);

// Services Firebase
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
export const db = getFirestore(app);
export const storage = getStorage(app);

export default app;