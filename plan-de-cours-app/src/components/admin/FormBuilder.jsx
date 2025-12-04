import React, { useState } from 'react';
import QuestionEditor from './QuestionEditor';
import './FormBuilder.css';

const FormBuilder = ({ form, onSave, onCancel }) => {
  const [formData, setFormData] = useState({
    title: form.title || '',
    description: form.description || '',
    session: form.session || '',
    department: form.department || '',
    questions: form.questions || []
  });
  const [editingQuestion, setEditingQuestion] = useState(null);
  const [showQuestionEditor, setShowQuestionEditor] = useState(false);

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleAddQuestion = () => {
    setEditingQuestion(null);
    setShowQuestionEditor(true);
  };

  const handleEditQuestion = (index) => {
    setEditingQuestion({ ...formData.questions[index], index });
    setShowQuestionEditor(true);
  };

  const handleSaveQuestion = (questionData) => {
    const newQuestions = [...formData.questions];
    
    if (editingQuestion?.index !== undefined) {
      // Modification
      newQuestions[editingQuestion.index] = questionData;
    } else {
      // Nouvelle question
      newQuestions.push({
        ...questionData,
        id: Date.now().toString()
      });
    }
    
    setFormData(prev => ({ ...prev, questions: newQuestions }));
    setShowQuestionEditor(false);
    setEditingQuestion(null);
  };

  const handleDeleteQuestion = (index) => {
    if (!window.confirm('Supprimer cette question ?')) return;
    
    const newQuestions = formData.questions.filter((_, i) => i !== index);
    setFormData(prev => ({ ...prev, questions: newQuestions }));
  };

  const handleMoveQuestion = (index, direction) => {
    const newQuestions = [...formData.questions];
    const newIndex = index + direction;
    
    if (newIndex < 0 || newIndex >= newQuestions.length) return;
    
    [newQuestions[index], newQuestions[newIndex]] = 
      [newQuestions[newIndex], newQuestions[index]];
    
    setFormData(prev => ({ ...prev, questions: newQuestions }));
  };

  const handleSave = () => {
    if (!formData.title.trim()) {
      alert('Le titre est requis');
      return;
    }
    onSave(formData);
  };

  if (showQuestionEditor) {
    return (
      <QuestionEditor
        question={editingQuestion}
        onSave={handleSaveQuestion}
        onCancel={() => {
          setShowQuestionEditor(false);
          setEditingQuestion(null);
        }}
      />
    );
  }

  return (
    <div className="form-builder">
      <div className="builder-header">
        <h1>✏️ Éditeur de Formulaire</h1>
        <div className="builder-actions">
          <button onClick={onCancel} className="btn-secondary">
            Annuler
          </button>
          <button onClick={handleSave} className="btn-primary">
            💾 Sauvegarder
          </button>
        </div>
      </div>

      <div className="builder-content">
        {/* Informations générales */}
        <section className="builder-section">
          <h2>Informations générales</h2>
          
          <div className="form-group">
            <label>Titre du formulaire *</label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => handleChange('title', e.target.value)}
              placeholder="Ex: Plan de cours - Session Automne 2024"
            />
          </div>

          <div className="form-group">
            <label>Description</label>
            <textarea
              value={formData.description}
              onChange={(e) => handleChange('description', e.target.value)}
              placeholder="Description du formulaire..."
              rows={3}
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Session</label>
              <select
                value={formData.session}
                onChange={(e) => handleChange('session', e.target.value)}
              >
                <option value="">Sélectionner...</option>
                <option value="Automne 2024">Automne 2024</option>
                <option value="Hiver 2025">Hiver 2025</option>
                <option value="Été 2025">Été 2025</option>
              </select>
            </div>

            <div className="form-group">
              <label>Département</label>
              <input
                type="text"
                value={formData.department}
                onChange={(e) => handleChange('department', e.target.value)}
                placeholder="Ex: Informatique"
              />
            </div>
          </div>
        </section>

        {/* Questions */}
        <section className="builder-section">
          <div className="section-header">
            <h2>Questions ({formData.questions.length}/10 minimum)</h2>
            <button onClick={handleAddQuestion} className="btn-add">
              + Ajouter une question
            </button>
          </div>

          {formData.questions.length === 0 ? (
            <div className="empty-questions">
              <p>Aucune question ajoutée.</p>
              <p>Un minimum de 10 questions est requis pour activer le formulaire.</p>
            </div>
          ) : (
            <div className="questions-list">
              {formData.questions.map((question, index) => (
                <div key={question.id || index} className="question-item">
                  <div className="question-number">{index + 1}</div>
                  
                  <div className="question-content">
                    <h4>{question.title}</h4>
                    <p className="question-type">
                      Type: {question.type === 'text' ? 'Texte court' : 
                             question.type === 'textarea' ? 'Texte long' : 
                             question.type}
                    </p>
                    <div className="ai-rule">
                      <strong>🤖 Règle IA:</strong> {question.aiRule || 'Non définie'}
                    </div>
                  </div>

                  <div className="question-actions">
                    <button 
                      onClick={() => handleMoveQuestion(index, -1)}
                      disabled={index === 0}
                      className="btn-icon"
                      title="Monter"
                    >
                      ↑
                    </button>
                    <button 
                      onClick={() => handleMoveQuestion(index, 1)}
                      disabled={index === formData.questions.length - 1}
                      className="btn-icon"
                      title="Descendre"
                    >
                      ↓
                    </button>
                    <button 
                      onClick={() => handleEditQuestion(index)}
                      className="btn-icon"
                      title="Modifier"
                    >
                      ✏️
                    </button>
                    <button 
                      onClick={() => handleDeleteQuestion(index)}
                      className="btn-icon danger"
                      title="Supprimer"
                    >
                      🗑️
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {formData.questions.length < 10 && (
            <div className="warning-message">
              ⚠️ Vous devez ajouter au moins {10 - formData.questions.length} question(s) 
              supplémentaire(s) pour pouvoir activer ce formulaire.
            </div>
          )}
        </section>
      </div>
    </div>
  );
};

export default FormBuilder;