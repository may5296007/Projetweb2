import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

// Composant de chargement (défini en premier pour être utilisé par les autres)
export const LoadingSpinner = () => (
  <div className="loading-container">
    <div className="spinner"></div>
    <p>Chargement...</p>
  </div>
);

// Route protégée - redirige vers login si non connecté
export const PrivateRoute = ({ children }) => {
  const { currentUser, loading } = useAuth();

  if (loading) {
    return <LoadingSpinner />;
  }

  if (!currentUser) {
    return <Navigate to="/login" />;
  }

  return children;
};

// Route Admin uniquement
export const AdminRoute = ({ children }) => {
  const { currentUser, isAdmin, loading } = useAuth();

  if (loading) {
    return <LoadingSpinner />;
  }

  if (!currentUser) {
    return <Navigate to="/login" />;
  }

  if (!isAdmin) {
    return <Navigate to="/teacher/plans" />;
  }

  return children;
};

// Route Enseignant uniquement  
export const TeacherRoute = ({ children }) => {
  const { currentUser, isTeacher, userData, loading } = useAuth();

  if (loading) {
    return <LoadingSpinner />;
  }

  if (!currentUser) {
    return <Navigate to="/login" />;
  }

  // Si l'utilisateur a un rôle teacher OU si c'est un nouvel utilisateur (role par défaut)
  if (!isTeacher && userData?.role === 'admin') {
    return <Navigate to="/admin/forms" />;
  }

  return children;
};

export default PrivateRoute;