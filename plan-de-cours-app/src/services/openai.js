// Service OpenAI pour la validation IA des réponses
// ⚠️ IMPORTANT: La clé API devrait être gérée côté serveur en production
// Ceci est une implémentation simplifiée pour le projet scolaire

const OPENAI_API_KEY = process.env.REACT_APP_OPENAI_API_KEY;

/**
 * Valide une réponse avec l'API OpenAI
 * @param {Object} question - La question avec sa règle de validation
 * @param {string} answer - La réponse de l'enseignant
 * @returns {Object} Résultat de la validation
 */
export const validateWithAI = async (question, answer) => {
  if (!OPENAI_API_KEY) {
    console.warn('Clé OpenAI non configurée, utilisation du mode simulation');
    return simulateValidation(question, answer);
  }

  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${OPENAI_API_KEY}`
      },
      body: JSON.stringify({
        model: 'gpt-3.5-turbo',
        messages: [
          {
            role: 'system',
            content: `Tu es un expert en validation de plans de cours. Tu dois analyser la réponse d'un enseignant selon une règle de validation précise.

Tu dois toujours répondre en JSON avec exactement ce format:
{
  "status": "Conforme" | "À améliorer" | "Non conforme",
  "positives": ["point positif 1", "point positif 2"],
  "improvements": ["point à améliorer 1", "point à améliorer 2"],
  "suggestion": "suggestion de correction si nécessaire ou null"
}

Critères de statut:
- "Conforme": La réponse respecte tous les critères de la règle
- "À améliorer": La réponse respecte partiellement les critères
- "Non conforme": La réponse ne respecte pas les critères essentiels

Sois constructif et bienveillant dans tes commentaires.`
          },
          {
            role: 'user',
            content: `Question: ${question.title}

Règle de validation: ${question.aiRule}

Réponse de l'enseignant:
${answer}

Analyse cette réponse et fournis ton évaluation en JSON.`
          }
        ],
        temperature: 0.7,
        max_tokens: 800
      })
    });

    if (!response.ok) {
      throw new Error(`Erreur API: ${response.status}`);
    }

    const data = await response.json();
    const content = data.choices[0]?.message?.content;

    // Parser la réponse JSON
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }

    throw new Error('Format de réponse invalide');

  } catch (error) {
    console.error('Erreur validation IA:', error);
    // En cas d'erreur, utiliser la simulation
    return simulateValidation(question, answer);
  }
};

/**
 * Simulation de validation (fallback sans API)
 * Utile pour les tests ou si la clé API n'est pas disponible
 */
const simulateValidation = (question, answer) => {
  const wordCount = answer.trim().split(/\s+/).length;
  const charCount = answer.length;
  
  // Analyse basique
  let status = 'Conforme';
  const positives = [];
  const improvements = [];
  let suggestion = null;

  // Vérifier la longueur minimum si spécifiée
  if (question.minLength && charCount < question.minLength) {
    status = 'À améliorer';
    improvements.push(`La réponse devrait contenir au moins ${question.minLength} caractères (actuellement ${charCount})`);
  }

  // Analyse basée sur la règle IA
  const rule = question.aiRule.toLowerCase();
  
  // Vérifier le nombre de mots si mentionné dans la règle
  const wordMatch = rule.match(/(\d+)\s*mots/);
  if (wordMatch) {
    const minWords = parseInt(wordMatch[1]);
    if (wordCount >= minWords) {
      positives.push(`La réponse contient ${wordCount} mots (minimum requis: ${minWords})`);
    } else {
      status = 'À améliorer';
      improvements.push(`La réponse devrait contenir au moins ${minWords} mots (actuellement ${wordCount})`);
    }
  }

  // Vérifier les mots-clés courants dans les règles
  if (rule.includes('objectif')) {
    if (answer.toLowerCase().includes('objectif') || answer.toLowerCase().includes('but')) {
      positives.push('Les objectifs sont mentionnés');
    } else {
      improvements.push('Les objectifs d\'apprentissage devraient être explicitement mentionnés');
    }
  }

  if (rule.includes('pédagogique') || rule.includes('approche')) {
    if (answer.toLowerCase().includes('pédagog') || answer.toLowerCase().includes('méthode')) {
      positives.push('L\'approche pédagogique est abordée');
    } else {
      improvements.push('L\'approche pédagogique devrait être décrite');
    }
  }

  if (rule.includes('évaluation')) {
    if (answer.toLowerCase().includes('évaluation') || answer.toLowerCase().includes('%')) {
      positives.push('Les méthodes d\'évaluation sont présentes');
    } else {
      improvements.push('Les méthodes d\'évaluation devraient être détaillées');
    }
  }

  // Ajouter des points positifs par défaut si la réponse est suffisamment longue
  if (wordCount >= 50 && positives.length === 0) {
    positives.push('La réponse est suffisamment détaillée');
  }
  if (charCount >= 200) {
    positives.push('La réponse fournit une bonne quantité d\'informations');
  }

  // Déterminer le statut final
  if (improvements.length >= 3) {
    status = 'Non conforme';
    suggestion = 'Veuillez réviser votre réponse en tenant compte des points d\'amélioration mentionnés.';
  } else if (improvements.length > 0) {
    status = 'À améliorer';
    suggestion = 'Quelques ajustements permettraient d\'améliorer votre réponse.';
  } else if (positives.length > 0) {
    status = 'Conforme';
  }

  // S'assurer qu'il y a au moins un élément dans chaque liste
  if (positives.length === 0) {
    positives.push('La réponse a été fournie');
  }
  if (improvements.length === 0 && status !== 'Conforme') {
    improvements.push('Des détails supplémentaires pourraient enrichir la réponse');
  }

  return {
    status,
    positives,
    improvements: improvements.length > 0 ? improvements : null,
    suggestion
  };
};

export default validateWithAI;