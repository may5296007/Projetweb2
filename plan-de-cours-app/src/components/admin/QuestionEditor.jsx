import React, { useState } from 'react';
import './QuestionEditor.css';

const QuestionEditor = ({ question, onSave, onCancel }) => {
  const [data, setData] = useState({
    title: question?.title || '',
    type: question?.type || 'textarea',
    required: question?.required ?? true,
    placeholder: question?.placeholder || '',
    aiRule: question?.aiRule || '',
    minLength: question?.minLength || 0,
    maxLength: question?.maxLength || 0
  });

  const handleChange = (field, value) => {
    setData(prev => ({ ...prev, [field]: value }));
  };

  const handleSave = () => {
    if (!data.title.trim()) {
      alert('Le titre de la question est requis');
      return;
    }
    if (!data.aiRule.trim()) {
      alert('La règle de validation IA est requise');
      return;
    }
    onSave(data);
  };

  // Exemples de règles IA prédéfinies
  const aiRuleExamples = [
    {
      label: "Description de cours (100+ mots)",
      rule: "Vérifier que la description contient au moins 100 mots et mentionne les objectifs d'apprentissage, le contenu principal et l'approche pédagogique."
    },
    {
      label: "Objectifs d'apprentissage",
      rule: "Vérifier que les objectifs sont rédigés avec des verbes d'action mesurables (ex: analyser, concevoir, appliquer) et qu'il y a au moins 3 objectifs distincts."
    },
    {
      label: "Méthodes d'évaluation",
      rule: "Vérifier que les méthodes d'évaluation sont variées, que les pourcentages totalisent 100%, et que chaque évaluation a une description claire."
    },
    {
      label: "Calendrier du cours",
      rule: "Vérifier que le calendrier couvre toutes les semaines de la session et que chaque semaine a un thème et des activités définis."
    },
    {
      label: "Ressources pédagogiques",
      rule: "Vérifier que les ressources sont pertinentes au cours et incluent des références bibliographiques complètes avec auteur, titre et année."
    },
    {
      label: "Prérequis",
      rule: "Vérifier que les prérequis sont clairement énoncés avec les codes de cours ou compétences requises."
    },
    {
      label: "Politique de présence",
      rule: "Vérifier que la politique de présence est clairement définie avec les conséquences des absences et les procédures pour les absences justifiées."
    },
    {
      label: "Intégrité académique",
      rule: "Vérifier que la section mentionne les règlements sur le plagiat et les conséquences, ainsi que les ressources disponibles pour les étudiants."
    }
  ];

  return (
    <div className="question-editor">
      <div className="editor-header">
        <h1>{question ? '✏️ Modifier la question' : '➕ Nouvelle question'}</h1>
      </div>

      <div className="editor-content">
        <div className="form-group">
          <label>Titre de la question *</label>
          <input
            type="text"
            value={data.title}
            onChange={(e) => handleChange('title', e.target.value)}
            placeholder="Ex: Description du cours"
          />
        </div>

        <div className="form-row">
          <div className="form-group">
            <label>Type de réponse</label>
            <select
              value={data.type}
              onChange={(e) => handleChange('type', e.target.value)}
            >
              <option value="text">Texte court (une ligne)</option>
              <option value="textarea">Texte long (plusieurs lignes)</option>
              <option value="number">Nombre</option>
              <option value="date">Date</option>
            </select>
          </div>

          <div className="form-group">
            <label>Obligatoire</label>
            <select
              value={data.required ? 'yes' : 'no'}
              onChange={(e) => handleChange('required', e.target.value === 'yes')}
            >
              <option value="yes">Oui</option>
              <option value="no">Non</option>
            </select>
          </div>
        </div>

        <div className="form-group">
          <label>Texte d'aide (placeholder)</label>
          <input
            type="text"
            value={data.placeholder}
            onChange={(e) => handleChange('placeholder', e.target.value)}
            placeholder="Ex: Entrez une description détaillée..."
          />
        </div>

        {(data.type === 'text' || data.type === 'textarea') && (
          <div className="form-row">
            <div className="form-group">
              <label>Longueur minimum (caractères)</label>
              <input
                type="number"
                value={data.minLength}
                onChange={(e) => handleChange('minLength', parseInt(e.target.value) || 0)}
                min="0"
              />
            </div>
            <div className="form-group">
              <label>Longueur maximum (0 = illimité)</label>
              <input
                type="number"
                value={data.maxLength}
                onChange={(e) => handleChange('maxLength', parseInt(e.target.value) || 0)}
                min="0"
              />
            </div>
          </div>
        )}

        <div className="form-group ai-rule-section">
          <label>🤖 Règle de validation IA *</label>
          <textarea
            value={data.aiRule}
            onChange={(e) => handleChange('aiRule', e.target.value)}
            placeholder="Décrivez comment l'IA doit valider cette réponse..."
            rows={4}
          />
          
          <div className="ai-rule-help">
            <p><strong>Exemples de règles IA :</strong></p>
            <div className="rule-examples">
              {aiRuleExamples.map((example, index) => (
                <button
                  key={index}
                  type="button"
                  className="rule-example-btn"
                  onClick={() => handleChange('aiRule', example.rule)}
                >
                  {example.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="preview-section">
          <h3>👁️ Aperçu</h3>
          <div className="preview-box">
            <label className="preview-label">
              {data.title || 'Titre de la question'}
              {data.required && <span className="required">*</span>}
            </label>
            {data.type === 'textarea' ? (
              <textarea
                placeholder={data.placeholder}
                disabled
                rows={4}
              />
            ) : data.type === 'date' ? (
              <input type="date" disabled />
            ) : data.type === 'number' ? (
              <input type="number" placeholder={data.placeholder} disabled />
            ) : (
              <input type="text" placeholder={data.placeholder} disabled />
            )}
            {data.minLength > 0 && (
              <span className="hint">Minimum {data.minLength} caractères</span>
            )}
          </div>
        </div>
      </div>

      <div className="editor-actions">
        <button onClick={onCancel} className="btn-secondary">
          Annuler
        </button>
        <button onClick={handleSave} className="btn-primary">
          {question ? 'Mettre à jour' : 'Ajouter la question'}
        </button>
      </div>
    </div>
  );
};

export default QuestionEditor;