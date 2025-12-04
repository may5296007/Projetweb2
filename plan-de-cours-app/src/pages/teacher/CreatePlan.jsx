import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { 
  getActiveForm, 
  createPlan, 
  getPlanById, 
  updatePlan, 
  submitPlan 
} from '../../services/firestore';
import { validateWithAI } from '../../services/openai';
import { generatePDF, uploadPDF } from '../../utils/pdfGenerator';
import AIValidationResult from '../../components/teacher/AIValidationResult';
import './CreatePlan.css';

const CreatePlan = () => {
  const { planId } = useParams(); // Pour édition
  const navigate = useNavigate();
  const { userData } = useAuth();
  
  const [form, setForm] = useState(null);
  const [plan, setPlan] = useState(null);
  const [responses, setResponses] = useState({});
  const [validations, setValidations] = useState({});
  const [validating, setValidating] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  
  // Infos du cours
  const [courseInfo, setCourseInfo] = useState({
    courseCode: '',
    courseName: '',
    session: ''
  });

  useEffect(() => {
    loadData();
  }, [planId]);

  const loadData = async () => {
    setLoading(true);
    
    // Charger le formulaire actif
    const formResult = await getActiveForm();
    if (!formResult.success) {
      setMessage({ type: 'error', text: 'Aucun formulaire actif disponible' });
      setLoading(false);
      return;
    }
    setForm(formResult.data);
    
    // Si édition, charger le plan existant
    if (planId) {
      const planResult = await getPlanById(planId);
      if (planResult.success) {
        setPlan(planResult.data);
        setCourseInfo({
          courseCode: planResult.data.courseCode || '',
          courseName: planResult.data.courseName || '',
          session: planResult.data.session || formResult.data.session || ''
        });
        
        // Charger les réponses existantes
        const existingResponses = {};
        const existingValidations = {};
        planResult.data.responses?.forEach(r => {
          existingResponses[r.questionId] = r.answer;
        });
        planResult.data.validations?.forEach(v => {
          existingValidations[v.questionId] = v;
        });
        setResponses(existingResponses);
        setValidations(existingValidations);
      }
    } else {
      setCourseInfo(prev => ({
        ...prev,
        session: formResult.data.session || ''
      }));
    }
    
    setLoading(false);
  };

  const handleResponseChange = (questionId, value) => {
    setResponses(prev => ({ ...prev, [questionId]: value }));
    // Effacer la validation quand la réponse change
    if (validations[questionId]) {
      setValidations(prev => {
        const newVal = { ...prev };
        delete newVal[questionId];
        return newVal;
      });
    }
  };

  const handleValidateQuestion = async (question) => {
    const answer = responses[question.id];
    if (!answer?.trim()) {
      setMessage({ type: 'error', text: 'Veuillez d\'abord répondre à cette question' });
      return;
    }

    setValidating(prev => ({ ...prev, [question.id]: true }));
    
    try {
      const result = await validateWithAI(question, answer);
      
      setValidations(prev => ({
        ...prev,
        [question.id]: {
          questionId: question.id,
          ...result
        }
      }));
    } catch (error) {
      setMessage({ type: 'error', text: 'Erreur lors de la validation IA' });
    }
    
    setValidating(prev => ({ ...prev, [question.id]: false }));
  };

  const handleSave = async (showMessage = true) => {
    if (!courseInfo.courseCode.trim()) {
      setMessage({ type: 'error', text: 'Le code du cours est requis' });
      return null;
    }

    setSaving(true);
    
    const planData = {
      courseCode: courseInfo.courseCode,
      courseName: courseInfo.courseName,
      session: courseInfo.session,
      formId: form.id,
      teacherId: userData.uid,
      teacherName: userData.displayName,
      teacherEmail: userData.email,
      responses: form.questions.map(q => ({
        questionId: q.id,
        questionTitle: q.title,
        answer: responses[q.id] || ''
      })),
      validations: Object.values(validations)
    };

    let result;
    if (plan?.id) {
      result = await updatePlan(plan.id, planData);
      if (result.success && showMessage) {
        setMessage({ type: 'success', text: 'Plan sauvegardé !' });
      }
    } else {
      result = await createPlan(planData);
      if (result.success) {
        setPlan({ id: result.id, ...planData });
        if (showMessage) {
          setMessage({ type: 'success', text: 'Plan créé !' });
        }
      }
    }

    setSaving(false);
    return result?.success ? (plan?.id || result.id) : null;
  };

  const handleSubmit = async () => {
    // Vérifier que toutes les questions obligatoires sont répondues
    const unanswered = form.questions.filter(q => 
      q.required && !responses[q.id]?.trim()
    );
    
    if (unanswered.length > 0) {
      setMessage({ 
        type: 'error', 
        text: `Veuillez répondre à toutes les questions obligatoires (${unanswered.length} manquante(s))` 
      });
      return;
    }

    // Vérifier les validations
    const allValidated = form.questions.every(q => validations[q.id]);
    if (!allValidated) {
      const confirm = window.confirm(
        'Certaines questions n\'ont pas été validées par l\'IA. Voulez-vous continuer ?'
      );
      if (!confirm) return;
    }

    setSubmitting(true);
    
    // Sauvegarder d'abord
    const savedPlanId = await handleSave(false);
    if (!savedPlanId) {
      setSubmitting(false);
      return;
    }

    try {
      // Générer le PDF
      setMessage({ type: 'info', text: 'Génération du PDF en cours...' });
      
      const pdfBlob = await generatePDF({
        courseInfo,
        form,
        responses,
        validations,
        teacherName: userData.displayName
      });
      
      // Upload du PDF
      const pdfUrl = await uploadPDF(pdfBlob, userData.displayName, courseInfo.courseCode);
      
      // Mettre à jour le plan avec l'URL du PDF
      await updatePlan(savedPlanId, { pdfUrl });
      
      // Soumettre le plan
      await submitPlan(savedPlanId);
      
      setMessage({ type: 'success', text: 'Plan soumis avec succès !' });
      setTimeout(() => navigate('/teacher/plans'), 1500);
      
    } catch (error) {
      console.error('Erreur soumission:', error);
      setMessage({ type: 'error', text: 'Erreur lors de la soumission' });
    }
    
    setSubmitting(false);
  };

  const getCompletionStats = () => {
    if (!form?.questions) return { answered: 0, validated: 0, total: 0 };
    
    const answered = form.questions.filter(q => responses[q.id]?.trim()).length;
    const validated = Object.keys(validations).length;
    const total = form.questions.length;
    
    return { answered, validated, total };
  };

  if (loading) {
    return (
      <div className="create-plan">
        <div className="loading">Chargement...</div>
      </div>
    );
  }

  if (!form) {
    return (
      <div className="create-plan">
        <div className="error-state">
          <h2>❌ Aucun formulaire disponible</h2>
          <p>Contactez votre coordonnateur pour activer un formulaire.</p>
          <button onClick={() => navigate('/teacher/plans')} className="btn-secondary">
            Retour
          </button>
        </div>
      </div>
    );
  }

  const stats = getCompletionStats();

  return (
    <div className="create-plan">
      <div className="plan-header">
        <div>
          <h1>{plan ? '✏️ Modifier le plan' : '📝 Nouveau plan de cours'}</h1>
          <p>{form.title}</p>
        </div>
        
        <div className="header-actions">
          <button onClick={() => navigate('/teacher/plans')} className="btn-secondary">
            ← Retour
          </button>
          <button 
            onClick={() => handleSave(true)} 
            disabled={saving}
            className="btn-save"
          >
            {saving ? 'Sauvegarde...' : '💾 Sauvegarder'}
          </button>
        </div>
      </div>

      {message.text && (
        <div className={`message ${message.type}`}>
          {message.text}
          <button onClick={() => setMessage({ type: '', text: '' })}>×</button>
        </div>
      )}

      {/* Barre de progression */}
      <div className="progress-bar">
        <div className="progress-info">
          <span>📝 {stats.answered}/{stats.total} réponses</span>
          <span>🤖 {stats.validated}/{stats.total} validées</span>
        </div>
        <div className="progress-track">
          <div 
            className="progress-fill"
            style={{ width: `${(stats.answered / stats.total) * 100}%` }}
          />
        </div>
      </div>

      {/* Informations du cours */}
      <section className="course-info-section">
        <h2>📚 Informations du cours</h2>
        <div className="form-row">
          <div className="form-group">
            <label>Code du cours *</label>
            <input
              type="text"
              value={courseInfo.courseCode}
              onChange={(e) => setCourseInfo(prev => ({ ...prev, courseCode: e.target.value }))}
              placeholder="Ex: 420-5D2-MA"
            />
          </div>
          <div className="form-group">
            <label>Nom du cours</label>
            <input
              type="text"
              value={courseInfo.courseName}
              onChange={(e) => setCourseInfo(prev => ({ ...prev, courseName: e.target.value }))}
              placeholder="Ex: Développement Web"
            />
          </div>
          <div className="form-group">
            <label>Session</label>
            <select
              value={courseInfo.session}
              onChange={(e) => setCourseInfo(prev => ({ ...prev, session: e.target.value }))}
            >
              <option value="">Sélectionner...</option>
              <option value="Automne 2024">Automne 2024</option>
              <option value="Hiver 2025">Hiver 2025</option>
              <option value="Été 2025">Été 2025</option>
            </select>
          </div>
        </div>
      </section>

      {/* Questions du formulaire */}
      <section className="questions-section">
        <h2>📋 Questions ({form.questions.length})</h2>
        
        {form.questions.map((question, index) => (
          <div key={question.id} className="question-card">
            <div className="question-header">
              <span className="question-number">{index + 1}</span>
              <h3>
                {question.title}
                {question.required && <span className="required">*</span>}
              </h3>
            </div>

            <div className="question-input">
              {question.type === 'textarea' ? (
                <textarea
                  value={responses[question.id] || ''}
                  onChange={(e) => handleResponseChange(question.id, e.target.value)}
                  placeholder={question.placeholder || 'Votre réponse...'}
                  rows={6}
                />
              ) : question.type === 'date' ? (
                <input
                  type="date"
                  value={responses[question.id] || ''}
                  onChange={(e) => handleResponseChange(question.id, e.target.value)}
                />
              ) : question.type === 'number' ? (
                <input
                  type="number"
                  value={responses[question.id] || ''}
                  onChange={(e) => handleResponseChange(question.id, e.target.value)}
                  placeholder={question.placeholder}
                />
              ) : (
                <input
                  type="text"
                  value={responses[question.id] || ''}
                  onChange={(e) => handleResponseChange(question.id, e.target.value)}
                  placeholder={question.placeholder || 'Votre réponse...'}
                />
              )}

              {question.minLength > 0 && (
                <span className="char-count">
                  {(responses[question.id] || '').length} / {question.minLength} caractères min.
                </span>
              )}
            </div>

            <div className="question-footer">
              <div className="ai-rule-hint">
                <small>🤖 Règle IA: {question.aiRule}</small>
              </div>
              
              <button
                onClick={() => handleValidateQuestion(question)}
                disabled={validating[question.id] || !responses[question.id]?.trim()}
                className="btn-validate"
              >
                {validating[question.id] ? (
                  'Validation...'
                ) : validations[question.id] ? (
                  '🔄 Revalider'
                ) : (
                  '🤖 Valider avec IA'
                )}
              </button>
            </div>

            {validations[question.id] && (
              <AIValidationResult validation={validations[question.id]} />
            )}
          </div>
        ))}
      </section>

      {/* Actions finales */}
      <div className="submit-section">
        <div className="submit-info">
          <p>
            <strong>Avant de soumettre :</strong> Assurez-vous que toutes les questions 
            obligatoires sont répondues et validées par l'IA.
          </p>
        </div>
        
        <div className="submit-actions">
          <button 
            onClick={() => handleSave(true)} 
            disabled={saving}
            className="btn-save-large"
          >
            💾 Sauvegarder le brouillon
          </button>
          
          <button 
            onClick={handleSubmit}
            disabled={submitting || stats.answered < stats.total}
            className="btn-submit"
          >
            {submitting ? 'Soumission en cours...' : '📤 Soumettre le plan'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default CreatePlan;