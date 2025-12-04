import React, { useState, useEffect } from 'react';
import { getAllPlans, getTeachers, reviewPlan, getPlanById } from '../../services/firestore';
import './ReviewPlans.css';

const ReviewPlans = () => {
  const [plans, setPlans] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [filters, setFilters] = useState({
    teacherId: '',
    status: '',
    session: ''
  });
  const [reviewComment, setReviewComment] = useState('');
  const [message, setMessage] = useState({ type: '', text: '' });

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    loadPlans();
  }, [filters]);

  const loadData = async () => {
    const teachersResult = await getTeachers();
    if (teachersResult.success) {
      setTeachers(teachersResult.data);
    }
    await loadPlans();
  };

  const loadPlans = async () => {
    setLoading(true);
    const result = await getAllPlans(filters);
    if (result.success) {
      setPlans(result.data);
    } else {
      setMessage({ type: 'error', text: result.error });
    }
    setLoading(false);
  };

  const handleFilterChange = (field, value) => {
    setFilters(prev => ({ ...prev, [field]: value }));
  };

  const handleViewPlan = async (planId) => {
    const result = await getPlanById(planId);
    if (result.success) {
      setSelectedPlan(result.data);
      setReviewComment(result.data.adminComments || '');
    }
  };

  const handleReview = async (status) => {
    if (status === 'revision' && !reviewComment.trim()) {
      setMessage({ type: 'error', text: 'Veuillez ajouter un commentaire pour la demande de révision' });
      return;
    }

    const result = await reviewPlan(selectedPlan.id, status, reviewComment);
    if (result.success) {
      setMessage({ 
        type: 'success', 
        text: status === 'approved' ? 'Plan approuvé !' : 'Demande de révision envoyée !'
      });
      setSelectedPlan(null);
      loadPlans();
    } else {
      setMessage({ type: 'error', text: result.error });
    }
  };

  const getStatusBadge = (status) => {
    const badges = {
      draft: { label: 'Brouillon', class: 'draft' },
      submitted: { label: 'Soumis', class: 'submitted' },
      approved: { label: 'Approuvé', class: 'approved' },
      revision: { label: 'À réviser', class: 'revision' }
    };
    return badges[status] || { label: status, class: '' };
  };

  const getValidationStatus = (status) => {
    const statuses = {
      'Conforme': { icon: '✅', class: 'valid' },
      'À améliorer': { icon: '⚠️', class: 'warning' },
      'Non conforme': { icon: '❌', class: 'invalid' }
    };
    return statuses[status] || { icon: '❓', class: '' };
  };

  const formatDate = (timestamp) => {
    if (!timestamp) return 'N/A';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleDateString('fr-CA', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  // Modal de détail du plan
  if (selectedPlan) {
    return (
      <div className="review-plans">
        <div className="plan-detail">
          <div className="detail-header">
            <button onClick={() => setSelectedPlan(null)} className="btn-back">
              ← Retour à la liste
            </button>
            <h1>📋 Révision du plan</h1>
          </div>

          {message.text && (
            <div className={`message ${message.type}`}>
              {message.text}
              <button onClick={() => setMessage({ type: '', text: '' })}>×</button>
            </div>
          )}

          <div className="plan-info">
            <div className="info-grid">
              <div className="info-item">
                <label>Enseignant</label>
                <span>{selectedPlan.teacherName}</span>
              </div>
              <div className="info-item">
                <label>Code du cours</label>
                <span>{selectedPlan.courseCode}</span>
              </div>
              <div className="info-item">
                <label>Session</label>
                <span>{selectedPlan.session}</span>
              </div>
              <div className="info-item">
                <label>Statut</label>
                <span className={`badge ${getStatusBadge(selectedPlan.status).class}`}>
                  {getStatusBadge(selectedPlan.status).label}
                </span>
              </div>
              <div className="info-item">
                <label>Soumis le</label>
                <span>{formatDate(selectedPlan.submittedAt)}</span>
              </div>
              {selectedPlan.pdfUrl && (
                <div className="info-item">
                  <label>Document PDF</label>
                  <a href={selectedPlan.pdfUrl} target="_blank" rel="noopener noreferrer" className="pdf-link">
                    📄 Télécharger le PDF
                  </a>
                </div>
              )}
            </div>
          </div>

          <div className="responses-section">
            <h2>Réponses et validations IA</h2>
            {selectedPlan.responses?.map((response, index) => {
              const validation = selectedPlan.validations?.find(v => v.questionId === response.questionId);
              const validationInfo = validation ? getValidationStatus(validation.status) : null;
              
              return (
                <div key={index} className="response-card">
                  <div className="response-header">
                    <h3>{response.questionTitle}</h3>
                    {validationInfo && (
                      <span className={`validation-badge ${validationInfo.class}`}>
                        {validationInfo.icon} {validation.status}
                      </span>
                    )}
                  </div>
                  
                  <div className="response-content">
                    <p>{response.answer}</p>
                  </div>

                  {validation && (
                    <div className="validation-details">
                      {validation.positives?.length > 0 && (
                        <div className="validation-section positive">
                          <h4>✅ Points positifs</h4>
                          <ul>
                            {validation.positives.map((point, i) => (
                              <li key={i}>{point}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                      
                      {validation.improvements?.length > 0 && (
                        <div className="validation-section improve">
                          <h4>💡 Points à améliorer</h4>
                          <ul>
                            {validation.improvements.map((point, i) => (
                              <li key={i}>{point}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                      
                      {validation.suggestion && (
                        <div className="validation-section suggestion">
                          <h4>📝 Suggestion de correction</h4>
                          <p>{validation.suggestion}</p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {selectedPlan.status === 'submitted' && (
            <div className="review-section">
              <h2>Votre décision</h2>
              
              <div className="form-group">
                <label>Commentaires (obligatoire pour révision)</label>
                <textarea
                  value={reviewComment}
                  onChange={(e) => setReviewComment(e.target.value)}
                  placeholder="Ajoutez vos commentaires ici..."
                  rows={4}
                />
              </div>

              <div className="review-actions">
                <button 
                  onClick={() => handleReview('revision')}
                  className="btn-revision"
                >
                  📝 Demander des corrections
                </button>
                <button 
                  onClick={() => handleReview('approved')}
                  className="btn-approve"
                >
                  ✅ Approuver le plan
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="review-plans">
      <div className="page-header">
        <h1>📋 Validation des Plans de Cours</h1>
      </div>

      {message.text && (
        <div className={`message ${message.type}`}>
          {message.text}
          <button onClick={() => setMessage({ type: '', text: '' })}>×</button>
        </div>
      )}

      <div className="filters">
        <div className="filter-group">
          <label>Enseignant</label>
          <select
            value={filters.teacherId}
            onChange={(e) => handleFilterChange('teacherId', e.target.value)}
          >
            <option value="">Tous</option>
            {teachers.map(teacher => (
              <option key={teacher.id} value={teacher.id}>
                {teacher.displayName}
              </option>
            ))}
          </select>
        </div>

        <div className="filter-group">
          <label>Statut</label>
          <select
            value={filters.status}
            onChange={(e) => handleFilterChange('status', e.target.value)}
          >
            <option value="">Tous</option>
            <option value="submitted">Soumis</option>
            <option value="approved">Approuvé</option>
            <option value="revision">À réviser</option>
            <option value="draft">Brouillon</option>
          </select>
        </div>

        <div className="filter-group">
          <label>Session</label>
          <select
            value={filters.session}
            onChange={(e) => handleFilterChange('session', e.target.value)}
          >
            <option value="">Toutes</option>
            <option value="Automne 2024">Automne 2024</option>
            <option value="Hiver 2025">Hiver 2025</option>
            <option value="Été 2025">Été 2025</option>
          </select>
        </div>
      </div>

      {loading ? (
        <div className="loading">Chargement...</div>
      ) : plans.length === 0 ? (
        <div className="empty-state">
          <p>Aucun plan de cours trouvé.</p>
        </div>
      ) : (
        <div className="plans-table-container">
          <table className="plans-table">
            <thead>
              <tr>
                <th>Enseignant</th>
                <th>Code cours</th>
                <th>Session</th>
                <th>Statut</th>
                <th>Soumis le</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {plans.map(plan => (
                <tr key={plan.id}>
                  <td>{plan.teacherName}</td>
                  <td>{plan.courseCode}</td>
                  <td>{plan.session}</td>
                  <td>
                    <span className={`badge ${getStatusBadge(plan.status).class}`}>
                      {getStatusBadge(plan.status).label}
                    </span>
                  </td>
                  <td>{formatDate(plan.submittedAt)}</td>
                  <td>
                    <button 
                      onClick={() => handleViewPlan(plan.id)}
                      className="btn-view"
                    >
                      👁️ Voir
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default ReviewPlans;