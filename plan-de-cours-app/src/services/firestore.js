import { 
  collection, 
  doc, 
  addDoc, 
  getDoc, 
  getDocs, 
  updateDoc, 
  deleteDoc, 
  query, 
  where, 
  orderBy,
  serverTimestamp 
} from 'firebase/firestore';
import { db } from './firebase';

// ============================================
// GESTION DES FORMULAIRES (Admin)
// ============================================

// Créer un nouveau formulaire
export const createForm = async (formData) => {
  try {
    const docRef = await addDoc(collection(db, 'forms'), {
      ...formData,
      questions: [],
      isActive: false,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });
    return { success: true, id: docRef.id };
  } catch (error) {
    console.error('Erreur création formulaire:', error);
    return { success: false, error: error.message };
  }
};

// Récupérer tous les formulaires
export const getForms = async () => {
  try {
    const q = query(collection(db, 'forms'), orderBy('createdAt', 'desc'));
    const snapshot = await getDocs(q);
    const forms = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    return { success: true, data: forms };
  } catch (error) {
    console.error('Erreur récupération formulaires:', error);
    return { success: false, error: error.message };
  }
};

// Récupérer un formulaire par ID
export const getFormById = async (formId) => {
  try {
    const docRef = doc(db, 'forms', formId);
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      return { success: true, data: { id: docSnap.id, ...docSnap.data() } };
    } else {
      return { success: false, error: 'Formulaire non trouvé' };
    }
  } catch (error) {
    console.error('Erreur récupération formulaire:', error);
    return { success: false, error: error.message };
  }
};

// Récupérer le formulaire actif
export const getActiveForm = async () => {
  try {
    const q = query(collection(db, 'forms'), where('isActive', '==', true));
    const snapshot = await getDocs(q);
    
    if (snapshot.empty) {
      return { success: false, error: 'Aucun formulaire actif' };
    }
    
    const doc = snapshot.docs[0];
    return { success: true, data: { id: doc.id, ...doc.data() } };
  } catch (error) {
    console.error('Erreur récupération formulaire actif:', error);
    return { success: false, error: error.message };
  }
};

// Mettre à jour un formulaire
export const updateForm = async (formId, updates) => {
  try {
    const docRef = doc(db, 'forms', formId);
    await updateDoc(docRef, {
      ...updates,
      updatedAt: serverTimestamp()
    });
    return { success: true };
  } catch (error) {
    console.error('Erreur mise à jour formulaire:', error);
    return { success: false, error: error.message };
  }
};

// Activer un formulaire (désactive les autres)
export const activateForm = async (formId) => {
  try {
    // D'abord désactiver tous les formulaires
    const formsSnapshot = await getDocs(collection(db, 'forms'));
    const batch = [];
    
    formsSnapshot.docs.forEach(doc => {
      batch.push(updateDoc(doc.ref, { isActive: false }));
    });
    
    await Promise.all(batch);
    
    // Activer le formulaire sélectionné
    const docRef = doc(db, 'forms', formId);
    await updateDoc(docRef, { 
      isActive: true,
      updatedAt: serverTimestamp()
    });
    
    return { success: true };
  } catch (error) {
    console.error('Erreur activation formulaire:', error);
    return { success: false, error: error.message };
  }
};

// Supprimer un formulaire
export const deleteForm = async (formId) => {
  try {
    await deleteDoc(doc(db, 'forms', formId));
    return { success: true };
  } catch (error) {
    console.error('Erreur suppression formulaire:', error);
    return { success: false, error: error.message };
  }
};

// ============================================
// GESTION DES PLANS DE COURS (Enseignant)
// ============================================

// Créer un nouveau plan de cours
export const createPlan = async (planData) => {
  try {
    const docRef = await addDoc(collection(db, 'plans'), {
      ...planData,
      status: 'draft', // draft, submitted, approved, revision
      responses: [],
      validations: [],
      pdfUrl: null,
      adminComments: null,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });
    return { success: true, id: docRef.id };
  } catch (error) {
    console.error('Erreur création plan:', error);
    return { success: false, error: error.message };
  }
};

// Récupérer les plans d'un enseignant
export const getTeacherPlans = async (teacherId) => {
  try {
    const q = query(
      collection(db, 'plans'), 
      where('teacherId', '==', teacherId),
      orderBy('createdAt', 'desc')
    );
    const snapshot = await getDocs(q);
    const plans = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    return { success: true, data: plans };
  } catch (error) {
    console.error('Erreur récupération plans enseignant:', error);
    return { success: false, error: error.message };
  }
};

// Récupérer tous les plans (Admin)
export const getAllPlans = async (filters = {}) => {
  try {
    let q = collection(db, 'plans');
    const constraints = [];

    if (filters.teacherId) {
      constraints.push(where('teacherId', '==', filters.teacherId));
    }
    if (filters.status) {
      constraints.push(where('status', '==', filters.status));
    }
    if (filters.session) {
      constraints.push(where('session', '==', filters.session));
    }

    constraints.push(orderBy('createdAt', 'desc'));
    
    q = query(q, ...constraints);
    const snapshot = await getDocs(q);
    const plans = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    return { success: true, data: plans };
  } catch (error) {
    console.error('Erreur récupération tous les plans:', error);
    return { success: false, error: error.message };
  }
};

// Récupérer un plan par ID
export const getPlanById = async (planId) => {
  try {
    const docRef = doc(db, 'plans', planId);
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      return { success: true, data: { id: docSnap.id, ...docSnap.data() } };
    } else {
      return { success: false, error: 'Plan non trouvé' };
    }
  } catch (error) {
    console.error('Erreur récupération plan:', error);
    return { success: false, error: error.message };
  }
};

// Mettre à jour un plan
export const updatePlan = async (planId, updates) => {
  try {
    const docRef = doc(db, 'plans', planId);
    await updateDoc(docRef, {
      ...updates,
      updatedAt: serverTimestamp()
    });
    return { success: true };
  } catch (error) {
    console.error('Erreur mise à jour plan:', error);
    return { success: false, error: error.message };
  }
};

// Soumettre un plan
export const submitPlan = async (planId) => {
  try {
    const docRef = doc(db, 'plans', planId);
    await updateDoc(docRef, {
      status: 'submitted',
      submittedAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });
    return { success: true };
  } catch (error) {
    console.error('Erreur soumission plan:', error);
    return { success: false, error: error.message };
  }
};

// Approuver ou demander révision (Admin)
export const reviewPlan = async (planId, status, comments = '') => {
  try {
    const docRef = doc(db, 'plans', planId);
    await updateDoc(docRef, {
      status: status, // 'approved' ou 'revision'
      adminComments: comments,
      reviewedAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });
    return { success: true };
  } catch (error) {
    console.error('Erreur révision plan:', error);
    return { success: false, error: error.message };
  }
};

// Supprimer un plan
export const deletePlan = async (planId) => {
  try {
    await deleteDoc(doc(db, 'plans', planId));
    return { success: true };
  } catch (error) {
    console.error('Erreur suppression plan:', error);
    return { success: false, error: error.message };
  }
};

// ============================================
// GESTION DES UTILISATEURS
// ============================================

// Récupérer tous les enseignants (pour filtres admin)
export const getTeachers = async () => {
  try {
    const q = query(collection(db, 'users'), where('role', '==', 'teacher'));
    const snapshot = await getDocs(q);
    const teachers = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    return { success: true, data: teachers };
  } catch (error) {
    console.error('Erreur récupération enseignants:', error);
    return { success: false, error: error.message };
  }
};

// Mettre à jour le rôle d'un utilisateur
export const updateUserRole = async (userId, role) => {
  try {
    const docRef = doc(db, 'users', userId);
    await updateDoc(docRef, { role });
    return { success: true };
  } catch (error) {
    console.error('Erreur mise à jour rôle:', error);
    return { success: false, error: error.message };
  }
};