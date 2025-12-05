import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import './Navbar.css';

const Navbar = () => {
  const { currentUser, userData, logout, isAdmin } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  if (!currentUser) return null;

  return (
    <nav className="navbar">
      <div className="navbar-brand">
        <Link to="/">
          📚 Plans de Cours
        </Link>
      </div>

      <div className="navbar-menu">
        {isAdmin ? (
          <>
            <Link to="/admin/forms" className="navbar-item">
              Gérer les formulaires
            </Link>
            <Link to="/admin/plans" className="navbar-item">
              Valider les plans
            </Link>
          </>
        ) : (
          <>
            <Link to="/teacher/plans" className="navbar-item">
              Mes plans
            </Link>
            <Link to="/teacher/create" className="navbar-item">
              Nouveau plan
            </Link>
          </>
        )}
      </div>

      <div className="navbar-end">
        <div className="user-info">
          {userData?.photoURL && (
            <img 
              src={userData.photoURL} 
              alt="Profile" 
              className="user-avatar"
            />
          )}
          <span className="user-name">{userData?.displayName}</span>
          <span className={`user-role ${isAdmin ? 'admin' : 'teacher'}`}>
            {isAdmin ? 'Admin' : 'Enseignant'}
          </span>
        </div>
        <button onClick={handleLogout} className="btn-logout">
          Déconnexion
        </button>
      </div>
    </nav>
  );
};

export default Navbar;