import type { Student } from '../types';

interface ResolvedClassSubject {
    id: string;
    name: string;
    workedContent: string;
}

export const generateTextForExport = (className: string, students: Student[], classSubjects: ResolvedClassSubject[]): string => {
  let fullText = `INFORMES: ${className.toUpperCase()}\n\n`;
  
  students.forEach((student, index) => {
    if (index > 0) {
      fullText += '\n\n' + '-'.repeat(80) + '\n\n';
    }

    fullText += `${student.name.toUpperCase()}\n`;
    fullText += '='.repeat(student.name.length) + '\n\n';
    
    fullText += `ASPECTES PERSONALS I EVOLUTIUS\n`;
    fullText += '-'.repeat(30) + '\n';
    fullText += `${student.personalAspects.report || 'Sense comentaris.'}\n\n`;

    fullText += `VALORACIÓ DE LES ASSIGNATURES\n`;
    fullText += '-'.repeat(30) + '\n';

    classSubjects.forEach(subject => {
      const studentSubjectData = student.subjects.find(s => s.subjectId === subject.id);
      if (studentSubjectData) {
        fullText += `\n### ${subject.name.toUpperCase()} ###\n\n`;
        fullText += `NOTA: ${studentSubjectData.grade}\n\n`;
        const comment = studentSubjectData.comment.report || 'Sense comentaris.';
        fullText += `COMENTARI:\n${comment}\n`;
      }
    });

    fullText += `\nCOMENTARI GENERAL\n`;
    fullText += '-'.repeat(20) + '\n';
    fullText += `${student.generalComment.report || 'Sense comentaris.'}\n`;
  });

  return fullText;
};

export const generateHtmlForExport = (className: string, students: Student[], classSubjects: ResolvedClassSubject[]): string => {
  let fullHtml = `<h2>Informes: ${className}</h2>`;

  // Helper to sanitize text and convert newlines to <br> tags
  const formatText = (text: string): string => {
    return text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;')
      .replace(/\n/g, '<br>');
  };

  students.forEach((student, index) => {
    const style = index > 0 ? 'style="page-break-before: always;"' : '';
    fullHtml += `<div ${style}>`;
    
    // H1 for student name to appear in the document outline
    fullHtml += `<h1>${student.name}</h1>`;
    
    const personalAspects = student.personalAspects.report || 'Sense comentaris.';
    fullHtml += `<p><strong>Aspectes Personals i Evolutius</strong></p>`;
    fullHtml += `<p>${formatText(personalAspects)}</p>`;

    fullHtml += `<br /><p><strong>Valoració de les Assignatures</strong></p>`;
    classSubjects.forEach(subject => {
      const studentSubjectData = student.subjects.find(s => s.subjectId === subject.id);
      if (studentSubjectData) {
        fullHtml += `<br /><p><strong>${subject.name}</strong></p>`;
        fullHtml += `<p><strong>NOTA:</strong> ${studentSubjectData.grade}</p>`;
        const comment = studentSubjectData.comment.report || 'Sense comentaris.';
        fullHtml += `<p><strong>COMENTARI:</strong><br>${formatText(comment)}</p>`;
      }
    });

    const generalComment = student.generalComment.report || 'Sense comentaris.';
    fullHtml += `<br /><p><strong>Comentari General</strong></p>`;
    fullHtml += `<p>${formatText(generalComment)}</p>`;
    
    fullHtml += `</div>`;
  });

  return fullHtml;
};