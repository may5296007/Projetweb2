import { 
  signInWithPopup, 
  signOut as firebaseSignOut,
  onAuthStateChanged 
} from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { auth, googleProvider, db } from './firebase';

// Connexion avec Google
export const signInWithGoogle = async () => {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    const user = result.user;
    
    // Vérifier si l'utilisateur existe déjà dans Firestore
    const userRef = doc(db, 'users', user.uid);
    const userSnap = await getDoc(userRef);
    
    if (!userSnap.exists()) {
      // Créer le profil utilisateur (par défaut: enseignant)
      await setDoc(userRef, {
        uid: user.uid,
        email: user.email,
        displayName: user.displayName,
        photoURL: user.photoURL,
        role: 'teacher', // Par défaut enseignant, admin change manuellement
        department: '',
        createdAt: new Date().toISOString()
      });
    }
    
    return { success: true, user };
  } catch (error) {
    console.error('Erreur connexion Google:', error);
    return { success: false, error: error.message };
  }
};

// Déconnexion
export const signOut = async () => {
  try {
    await firebaseSignOut(auth);
    return { success: true };
  } catch (error) {
    console.error('Erreur déconnexion:', error);
    return { success: false, error: error.message };
  }
};

// Récupérer les données utilisateur depuis Firestore
export const getUserData = async (uid) => {
  try {
    const userRef = doc(db, 'users', uid);
    const userSnap = await getDoc(userRef);
    
    if (userSnap.exists()) {
      return { success: true, data: userSnap.data() };
    } else {
      return { success: false, error: 'Utilisateur non trouvé' };
    }
  } catch (error) {
    console.error('Erreur récupération utilisateur:', error);
    return { success: false, error: error.message };
  }
};

// Observer les changements d'état d'authentification
export const onAuthChange = (callback) => {
  return onAuthStateChanged(auth, callback);
};