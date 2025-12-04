import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { getTeacherPlans, getActiveForm, deletePlan } from '../../services/firestore';
import './TeacherDashboard.css';

const TeacherDashboard = () => {
  const { userData } = useAuth();
  const [plans, setPlans] = useState([]);
  const [activeForm, setActiveForm] = useState(null);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState({ type: '', text: '' });

  useEffect(() => {
    loadData();
  }, [userData]);

  const loadData = async () => {
    if (!userData?.uid) return;
    
    setLoading(true);
    
    // Charger les plans de l'enseignant
    const plansResult = await getTeacherPlans(userData.uid);
    if (plansResult.success) {
      setPlans(plansResult.data);
    }
    
    // Vérifier s'il y a un formulaire actif
    const formResult = await getActiveForm();
    if (formResult.success) {
      setActiveForm(formResult.data);
    }
    
    setLoading(false);
  };

  const handleDeletePlan = async (planId) => {
    if (!window.confirm('Supprimer ce plan de cours ?')) return;
    
    const result = await deletePlan(planId);
    if (result.success) {
      setMessage({ type: 'success', text: 'Plan supprimé !' });
      loadData();
    } else {
      setMessage({ type: 'error', text: result.error });
    }
  };

  const getStatusInfo = (status) => {
    const statuses = {
      draft: { label: 'Brouillon', class: 'draft', icon: '📝' },
      submitted: { label: 'Soumis', class: 'submitted', icon: '📤' },
      approved: { label: 'Approuvé', class: 'approved', icon: '✅' },
      revision: { label: 'À réviser', class: 'revision', icon: '🔄' }
    };
    return statuses[status] || { label: status, class: '', icon: '❓' };
  };

  const formatDate = (timestamp) => {
    if (!timestamp) return 'N/A';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleDateString('fr-CA', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getValidationSummary = (validations) => {
    if (!validations || validations.length === 0) return null;
    
    const counts = validations.reduce((acc, v) => {
      acc[v.status] = (acc[v.status] || 0) + 1;
      return acc;
    }, {});
    
    return {
      conforme: counts['Conforme'] || 0,
      ameliorer: counts['À améliorer'] || 0,
      nonConforme: counts['Non conforme'] || 0,
      total: validations.length
    };
  };

  if (loading) {
    return (
      <div className="teacher-dashboard">
        <div className="loading">Chargement...</div>
      </div>
    );
  }

  return (
    <div className="teacher-dashboard">
      <div className="page-header">
        <div>
          <h1>👋 Bonjour, {userData?.displayName}</h1>
          <p>Gérez vos plans de cours</p>
        </div>
        
        {activeForm ? (
          <Link to="/teacher/create" className="btn-primary">
            + Nouveau plan de cours
          </Link>
        ) : (
          <button className="btn-disabled" disabled title="Aucun formulaire actif">
            + Nouveau plan de cours
          </button>
        )}
      </div>

      {message.text && (
        <div className={`message ${message.type}`}>
          {message.text}
          <button onClick={() => setMessage({ type: '', text: '' })}>×</button>
        </div>
      )}

      {!activeForm && (
        <div className="alert-info">
          ℹ️ Aucun formulaire actif pour le moment. Contactez votre coordonnateur.
        </div>
      )}

      {/* Statistiques rapides */}
      <div className="stats-grid">
        <div className="stat-card">
          <span className="stat-icon">📋</span>
          <div className="stat-content">
            <span className="stat-value">{plans.length}</span>
            <span className="stat-label">Total plans</span>
          </div>
        </div>
        <div className="stat-card">
          <span className="stat-icon">📝</span>
          <div className="stat-content">
            <span className="stat-value">
              {plans.filter(p => p.status === 'draft').length}
            </span>
            <span className="stat-label">Brouillons</span>
          </div>
        </div>
        <div className="stat-card">
          <span className="stat-icon">📤</span>
          <div className="stat-content">
            <span className="stat-value">
              {plans.filter(p => p.status === 'submitted').length}
            </span>
            <span className="stat-label">En attente</span>
          </div>
        </div>
        <div className="stat-card approved">
          <span className="stat-icon">✅</span>
          <div className="stat-content">
            <span className="stat-value">
              {plans.filter(p => p.status === 'approved').length}
            </span>
            <span className="stat-label">Approuvés</span>
          </div>
        </div>
      </div>

      {/* Liste des plans */}
      <div className="plans-section">
        <h2>Mes plans de cours</h2>
        
        {plans.length === 0 ? (
          <div className="empty-state">
            <p>Vous n'avez pas encore créé de plan de cours.</p>
            {activeForm && (
              <Link to="/teacher/create" className="btn-primary">
                Créer mon premier plan
              </Link>
            )}
          </div>
        ) : (
          <div className="plans-grid">
            {plans.map(plan => {
              const statusInfo = getStatusInfo(plan.status);
              const validationSummary = getValidationSummary(plan.validations);
              
              return (
                <div key={plan.id} className={`plan-card ${plan.status}`}>
                  <div className="plan-header">
                    <span className="course-code">{plan.courseCode}</span>
                    <span className={`status-badge ${statusInfo.class}`}>
                      {statusInfo.icon} {statusInfo.label}
                    </span>
                  </div>
                  
                  <h3>{plan.courseName || 'Plan de cours'}</h3>
                  
                  <div className="plan-meta">
                    <span>📅 {plan.session}</span>
                    <span>🕐 {formatDate(plan.updatedAt)}</span>
                  </div>

                  {validationSummary && (
                    <div className="validation-summary">
                      <span className="valid">✅ {validationSummary.conforme}</span>
                      <span className="warning">⚠️ {validationSummary.ameliorer}</span>
                      <span className="invalid">❌ {validationSummary.nonConforme}</span>
                    </div>
                  )}

                  {plan.status === 'revision' && plan.adminComments && (
                    <div className="admin-feedback">
                      <strong>💬 Commentaires:</strong>
                      <p>{plan.adminComments}</p>
                    </div>
                  )}

                  <div className="plan-actions">
                    {(plan.status === 'draft' || plan.status === 'revision') && (
                      <Link to={`/teacher/edit/${plan.id}`} className="btn-edit">
                        ✏️ Modifier
                      </Link>
                    )}
                    
                    <Link to={`/teacher/view/${plan.id}`} className="btn-view">
                      👁️ Voir
                    </Link>
                    
                    {plan.pdfUrl && (
                      <a href={plan.pdfUrl} target="_blank" rel="noopener noreferrer" className="btn-pdf">
                        📄 PDF
                      </a>
                    )}
                    
                    {plan.status === 'draft' && (
                      <button 
                        onClick={() => handleDeletePlan(plan.id)}
                        className="btn-delete"
                      >
                        🗑️
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default TeacherDashboard;