import React, { createContext, useContext, useState, useEffect } from 'react';
import { onAuthChange, getUserData, signInWithGoogle, signOut } from '../services/auth';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth doit être utilisé dans AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthChange(async (user) => {
      setCurrentUser(user);
      
      if (user) {
        // Récupérer les données supplémentaires depuis Firestore
        const result = await getUserData(user.uid);
        if (result.success) {
          setUserData(result.data);
        }
      } else {
        setUserData(null);
      }
      
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const login = async () => {
    const result = await signInWithGoogle();
    if (result.success) {
      const userData = await getUserData(result.user.uid);
      if (userData.success) {
        setUserData(userData.data);
      }
    }
    return result;
  };

  const logout = async () => {
    const result = await signOut();
    if (result.success) {
      setUserData(null);
    }
    return result;
  };

  // Vérifier si l'utilisateur est admin
  const isAdmin = userData?.role === 'admin';
  
  // Vérifier si l'utilisateur est enseignant
  const isTeacher = userData?.role === 'teacher';

  const value = {
    currentUser,
    userData,
    loading,
    login,
    logout,
    isAdmin,
    isTeacher
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};