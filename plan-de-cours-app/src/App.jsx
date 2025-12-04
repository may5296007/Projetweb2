import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';

// Components
import Navbar from './components/common/Navbar';
import { PrivateRoute, AdminRoute, TeacherRoute, LoadingSpinner } from './components/common/PrivateRoute';

// Pages
import Login from './pages/Login';
import ManageForms from './pages/admin/ManageForms';
import ReviewPlans from './pages/admin/ReviewPlans';
import TeacherDashboard from './pages/teacher/TeacherDashboard';
import CreatePlan from './pages/teacher/CreatePlan';

import './App.css';

// Composant pour rediriger selon le rôle
const RoleBasedRedirect = () => {
  const { isAdmin, isTeacher, loading } = useAuth();

  if (loading) return <LoadingSpinner />;

  if (isAdmin) {
    return <Navigate to="/admin/forms" replace />;
  }
  
  if (isTeacher) {
    return <Navigate to="/teacher/plans" replace />;
  }

  return <Navigate to="/login" replace />;
};

// Layout avec Navbar
const AppLayout = ({ children }) => {
  return (
    <>
      <Navbar />
      <main className="main-content">
        {children}
      </main>
    </>
  );
};

function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="app">
          <Routes>
            {/* Page de connexion */}
            <Route path="/login" element={<Login />} />

            {/* Redirection par défaut selon le rôle */}
            <Route path="/" element={
              <PrivateRoute>
                <RoleBasedRedirect />
              </PrivateRoute>
            } />

            {/* Routes Admin */}
            <Route path="/admin/forms" element={
              <AdminRoute>
                <AppLayout>
                  <ManageForms />
                </AppLayout>
              </AdminRoute>
            } />

            <Route path="/admin/plans" element={
              <AdminRoute>
                <AppLayout>
                  <ReviewPlans />
                </AppLayout>
              </AdminRoute>
            } />

            {/* Routes Enseignant */}
            <Route path="/teacher/plans" element={
              <TeacherRoute>
                <AppLayout>
                  <TeacherDashboard />
                </AppLayout>
              </TeacherRoute>
            } />

            <Route path="/teacher/create" element={
              <TeacherRoute>
                <AppLayout>
                  <CreatePlan />
                </AppLayout>
              </TeacherRoute>
            } />

            <Route path="/teacher/edit/:planId" element={
              <TeacherRoute>
                <AppLayout>
                  <CreatePlan />
                </AppLayout>
              </TeacherRoute>
            } />

            <Route path="/teacher/view/:planId" element={
              <TeacherRoute>
                <AppLayout>
                  <CreatePlan />
                </AppLayout>
              </TeacherRoute>
            } />

            {/* 404 - Rediriger vers accueil */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;