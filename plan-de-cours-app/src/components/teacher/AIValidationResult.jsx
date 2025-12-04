import React from 'react';
import './AIValidationResult.css';

const AIValidationResult = ({ validation }) => {
  if (!validation) return null;

  const getStatusInfo = (status) => {
    const statuses = {
      'Conforme': { icon: '✅', class: 'valid', label: 'Conforme' },
      'À améliorer': { icon: '⚠️', class: 'warning', label: 'À améliorer' },
      'Non conforme': { icon: '❌', class: 'invalid', label: 'Non conforme' }
    };
    return statuses[status] || { icon: '❓', class: '', label: status };
  };

  const statusInfo = getStatusInfo(validation.status);

  return (
    <div className={`ai-validation-result ${statusInfo.class}`}>
      <div className="validation-header">
        <span className="status-icon">{statusInfo.icon}</span>
        <span className="status-label">{statusInfo.label}</span>
      </div>

      <div className="validation-content">
        {validation.positives && validation.positives.length > 0 && (
          <div className="validation-section positive">
            <h4>✅ Points positifs</h4>
            <ul>
              {validation.positives.map((point, index) => (
                <li key={index}>{point}</li>
              ))}
            </ul>
          </div>
        )}

        {validation.improvements && validation.improvements.length > 0 && (
          <div className="validation-section improve">
            <h4>💡 Points à améliorer</h4>
            <ul>
              {validation.improvements.map((point, index) => (
                <li key={index}>{point}</li>
              ))}
            </ul>
          </div>
        )}

        {validation.suggestion && (
          <div className="validation-section suggestion">
            <h4>📝 Suggestion</h4>
            <p>{validation.suggestion}</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default AIValidationResult;