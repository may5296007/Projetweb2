import jsPDF from 'jspdf';
import 'jspdf-autotable';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { storage } from '../services/firebase';

/**
 * Génère un PDF à partir des données du plan de cours
 */
export const generatePDF = async ({ courseInfo, form, responses, validations, teacherName }) => {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.width;
  let yPos = 20;

  // Configuration des couleurs
  const primaryColor = [102, 126, 234];
  const textColor = [51, 51, 51];
  const lightGray = [248, 249, 250];

  // ========== EN-TÊTE ==========
  doc.setFillColor(...primaryColor);
  doc.rect(0, 0, pageWidth, 40, 'F');
  
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(22);
  doc.setFont('helvetica', 'bold');
  doc.text('Plan de Cours', pageWidth / 2, 20, { align: 'center' });
  
  doc.setFontSize(12);
  doc.setFont('helvetica', 'normal');
  doc.text(`${courseInfo.courseCode} - ${courseInfo.courseName || 'Sans titre'}`, pageWidth / 2, 32, { align: 'center' });

  yPos = 55;

  // ========== INFORMATIONS DU COURS ==========
  doc.setTextColor(...textColor);
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('Informations générales', 15, yPos);
  
  yPos += 8;
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  
  const infoData = [
    ['Enseignant', teacherName || 'N/A'],
    ['Code du cours', courseInfo.courseCode || 'N/A'],
    ['Nom du cours', courseInfo.courseName || 'N/A'],
    ['Session', courseInfo.session || 'N/A'],
    ['Date de génération', new Date().toLocaleDateString('fr-CA', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })]
  ];

  doc.autoTable({
    startY: yPos,
    head: [],
    body: infoData,
    theme: 'plain',
    styles: {
      fontSize: 10,
      cellPadding: 3
    },
    columnStyles: {
      0: { fontStyle: 'bold', cellWidth: 45 },
      1: { cellWidth: 'auto' }
    },
    margin: { left: 15, right: 15 }
  });

  yPos = doc.lastAutoTable.finalY + 15;

  // ========== QUESTIONS ET RÉPONSES ==========
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('Contenu du plan de cours', 15, yPos);
  yPos += 10;

  form.questions.forEach((question, index) => {
    // Vérifier si on a besoin d'une nouvelle page
    if (yPos > 250) {
      doc.addPage();
      yPos = 20;
    }

    const answer = responses[question.id] || 'Non répondu';
    const validation = validations[question.id];

    // Numéro et titre de la question
    doc.setFillColor(...lightGray);
    doc.rect(15, yPos - 5, pageWidth - 30, 10, 'F');
    
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...primaryColor);
    doc.text(`${index + 1}. ${question.title}`, 18, yPos + 2);
    
    yPos += 12;

    // Réponse
    doc.setTextColor(...textColor);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    
    // Découper le texte pour qu'il tienne dans la page
    const splitAnswer = doc.splitTextToSize(answer, pageWidth - 40);
    
    splitAnswer.forEach(line => {
      if (yPos > 270) {
        doc.addPage();
        yPos = 20;
      }
      doc.text(line, 20, yPos);
      yPos += 5;
    });

    yPos += 3;

    // Statut de validation IA
    if (validation) {
      const statusColors = {
        'Conforme': [40, 167, 69],
        'À améliorer': [255, 193, 7],
        'Non conforme': [220, 53, 69]
      };
      
      const statusColor = statusColors[validation.status] || [128, 128, 128];
      
      doc.setFontSize(9);
      doc.setFont('helvetica', 'italic');
      doc.setTextColor(...statusColor);
      doc.text(`Validation IA: ${validation.status}`, 20, yPos);
      yPos += 8;
    }

    yPos += 5;
  });

  // ========== PIED DE PAGE ==========
  const pageCount = doc.internal.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(150, 150, 150);
    doc.text(
      `Page ${i} / ${pageCount}`,
      pageWidth / 2,
      doc.internal.pageSize.height - 10,
      { align: 'center' }
    );
    doc.text(
      'Document généré automatiquement - Plateforme de Plans de Cours',
      pageWidth / 2,
      doc.internal.pageSize.height - 5,
      { align: 'center' }
    );
  }

  // Retourner le blob PDF
  return doc.output('blob');
};

/**
 * Upload le PDF vers Firebase Storage
 * @param {Blob} pdfBlob - Le fichier PDF
 * @param {string} teacherName - Nom de l'enseignant
 * @param {string} courseCode - Code du cours
 * @returns {string} URL de téléchargement
 */
export const uploadPDF = async (pdfBlob, teacherName, courseCode) => {
  // Formater le nom de fichier selon les spécifications
  // Format: [Nom_Enseignant]_[Code_Cours]_[Timestamp].pdf
  const timestamp = Date.now();
  const safeName = teacherName.replace(/\s+/g, '_').replace(/[^a-zA-Z0-9_-]/g, '');
  const safeCode = courseCode.replace(/\s+/g, '_').replace(/[^a-zA-Z0-9_-]/g, '');
  const fileName = `${safeName}_${safeCode}_${timestamp}.pdf`;

  // Créer la référence dans Storage
  const storageRef = ref(storage, `plans/${fileName}`);

  // Upload le fichier
  await uploadBytes(storageRef, pdfBlob, {
    contentType: 'application/pdf'
  });

  // Récupérer l'URL de téléchargement
  const downloadURL = await getDownloadURL(storageRef);
  
  return downloadURL;
};

export default { generatePDF, uploadPDF };