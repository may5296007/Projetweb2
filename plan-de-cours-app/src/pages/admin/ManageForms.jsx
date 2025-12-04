import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { 
  getForms, 
  createForm, 
  updateForm, 
  deleteForm, 
  activateForm 
} from '../../services/firestore';
import FormBuilder from '../../components/admin/FormBuilder';
import './ManageForms.css';

const ManageForms = () => {
  const { userData } = useAuth();
  const [forms, setForms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showBuilder, setShowBuilder] = useState(false);
  const [editingForm, setEditingForm] = useState(null);
  const [message, setMessage] = useState({ type: '', text: '' });

  useEffect(() => {
    loadForms();
  }, []);

  const loadForms = async () => {
    setLoading(true);
    const result = await getForms();
    if (result.success) {
      setForms(result.data);
    } else {
      setMessage({ type: 'error', text: result.error });
    }
    setLoading(false);
  };

  const handleCreateForm = async () => {
    const result = await createForm({
      title: 'Nouveau formulaire',
      description: '',
      department: userData?.department || '',
      session: '',
      createdBy: userData?.uid
    });

    if (result.success) {
      setMessage({ type: 'success', text: 'Formulaire créé !' });
      loadForms();
      // Ouvrir l'éditeur pour le nouveau formulaire
      const newForm = await getForms();
      if (newForm.success) {
        const created = newForm.data.find(f => f.id === result.id);
        if (created) {
          setEditingForm(created);
          setShowBuilder(true);
        }
      }
    } else {
      setMessage({ type: 'error', text: result.error });
    }
  };

  const handleEditForm = (form) => {
    setEditingForm(form);
    setShowBuilder(true);
  };

  const handleSaveForm = async (formData) => {
    const result = await updateForm(editingForm.id, formData);
    if (result.success) {
      setMessage({ type: 'success', text: 'Formulaire sauvegardé !' });
      setShowBuilder(false);
      setEditingForm(null);
      loadForms();
    } else {
      setMessage({ type: 'error', text: result.error });
    }
  };

  const handleDeleteForm = async (formId) => {
    if (!window.confirm('Supprimer ce formulaire ?')) return;
    
    const result = await deleteForm(formId);
    if (result.success) {
      setMessage({ type: 'success', text: 'Formulaire supprimé !' });
      loadForms();
    } else {
      setMessage({ type: 'error', text: result.error });
    }
  };

  const handleActivateForm = async (formId) => {
    const result = await activateForm(formId);
    if (result.success) {
      setMessage({ type: 'success', text: 'Formulaire activé !' });
      loadForms();
    } else {
      setMessage({ type: 'error', text: result.error });
    }
  };

  const getQuestionCount = (form) => {
    return form.questions?.length || 0;
  };

  if (showBuilder && editingForm) {
    return (
      <FormBuilder 
        form={editingForm}
        onSave={handleSaveForm}
        onCancel={() => {
          setShowBuilder(false);
          setEditingForm(null);
        }}
      />
    );
  }

  return (
    <div className="manage-forms">
      <div className="page-header">
        <h1>📋 Gestion des Formulaires</h1>
        <button onClick={handleCreateForm} className="btn-primary">
          + Nouveau formulaire
        </button>
      </div>

      {message.text && (
        <div className={`message ${message.type}`}>
          {message.text}
          <button onClick={() => setMessage({ type: '', text: '' })}>×</button>
        </div>
      )}

      {loading ? (
        <div className="loading">Chargement...</div>
      ) : forms.length === 0 ? (
        <div className="empty-state">
          <p>Aucun formulaire créé.</p>
          <button onClick={handleCreateForm} className="btn-primary">
            Créer mon premier formulaire
          </button>
        </div>
      ) : (
        <div className="forms-grid">
          {forms.map(form => (
            <div key={form.id} className={`form-card ${form.isActive ? 'active' : ''}`}>
              <div className="form-card-header">
                <h3>{form.title}</h3>
                {form.isActive && <span className="badge active">Actif</span>}
              </div>
              
              <p className="form-description">
                {form.description || 'Aucune description'}
              </p>
              
              <div className="form-meta">
                <span className={`question-count ${getQuestionCount(form) < 10 ? 'warning' : 'ok'}`}>
                  {getQuestionCount(form)} questions
                  {getQuestionCount(form) < 10 && ' (min. 10 requis)'}
                </span>
                <span className="session">{form.session || 'Session non définie'}</span>
              </div>

              <div className="form-actions">
                <button 
                  onClick={() => handleEditForm(form)}
                  className="btn-secondary"
                >
                  ✏️ Modifier
                </button>
                
                {!form.isActive && getQuestionCount(form) >= 10 && (
                  <button 
                    onClick={() => handleActivateForm(form.id)}
                    className="btn-success"
                  >
                    ✓ Activer
                  </button>
                )}
                
                {!form.isActive && (
                  <button 
                    onClick={() => handleDeleteForm(form.id)}
                    className="btn-danger"
                  >
                    🗑️
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ManageForms;